import { calculateCompletion, isIntakeComplete, isFieldFilled } from './state';
import { IntakeState, IntakeData } from './schema';
import { extractFields } from './extractor';
import { composeMoreQuestions } from './composer';
import { persistIntakeState } from './persist';
import { AGENTS, AGENT_FLOW } from './agents.config';
import { logger } from '../utils/logger';
import { coerceAndSetField, applyRepetitionFallback } from './guardrails';

export type IntakeAction = 'ask_next' | 'clarify' | 'confirm' | 'run_analysis' | 'done';

export interface TurnResult {
    message: string;
    state: IntakeState;
    isComplete: boolean;
}

export async function processUserTurn(
    state: IntakeState,
    userMessage: string
): Promise<TurnResult> {
    const turnStart = Date.now();
    const sessionId = state.sessionId;

    // Add requestId for tracing (mock uuid for now or passed from ctrl)
    const requestId = `req_${Date.now()}`;
    const log = logger.child({ sessionId, requestId, activeAgent: state.activeAgent });

    log.info({
        event: 'turn.start',
        turn: state.turnCount,
        lastQuestionField: state.lastQuestionField,
        userMessageSummary: userMessage.substring(0, 50)
    });

    // Initialize agent if missing
    if (!state.activeAgent) {
        state.activeAgent = 'guide';
    }

    // --- PHASE 1: EXTRACTION (RUN ONCE) ---
    // Update fields based on user message
    const extractRes = await extractFields(userMessage, state.fields, state.lastQuestionField);

    if (extractRes.ok) {
        const extracted = extractRes.data || {};
        const keys = Object.keys(extracted);

        if (keys.length > 0) {
            log.info({ event: 'extract.success', keys });

            // COERCE AND SET FIELDS
            Object.entries(extracted).forEach(([k, val]) => {
                const key = k as keyof IntakeData;
                const isTarget = key === state.lastQuestionField;
                const evidence = isTarget ? 'response_to_question' : 'spontaneous';

                const setSuccess = coerceAndSetField(state, key, val, evidence);

                if (setSuccess) {
                    log.debug({ event: 'state.merge', field: key, value: val, status: state.fields[key]?.status });
                } else {
                    log.warn({ event: 'state.merge.discarded', field: key, value: val, reason: 'validation_failed' });
                }
            });

        } else {
            if (state.lastQuestionField) {
                log.warn({ event: 'extract.empty_target', target: state.lastQuestionField });
            }
        }
    } else {
        log.error({ event: 'extract.fail', error: extractRes.error });
    }

    state.turnCount++; // Increment user turns once per message
    state.lastUserMessage = userMessage;


    // --- PHASE 2: DECISION LOOP (INTERNAL MAX 2) ---
    // We loop to handle "Agent Switch" or "Guardrail Fallback" without requiring new user input
    // This loop does NOT re-run extraction.

    let loopCount = 0;
    const MAX_INTERNAL_LOOPS = 2;

    while (loopCount < MAX_INTERNAL_LOOPS) {
        loopCount++;
        log.debug({ event: 'engine.internal_iter', loop: loopCount, agent: state.activeAgent });

        let currentAgentId = state.activeAgent;
        let currentAgentConfig = AGENTS[currentAgentId];

        // A. CHECK EXIT CRITERIA
        if (currentAgentConfig.shouldExit(state)) {
            const currentIndex = AGENT_FLOW.indexOf(currentAgentId);

            if (currentIndex < AGENT_FLOW.length - 1) {
                // Advance Agent
                const nextAgentId = AGENT_FLOW[currentIndex + 1];

                log.info({
                    event: 'agent.handoff',
                    from: currentAgentId,
                    to: nextAgentId,
                    reason: 'exit_criteria_met'
                });

                const nextAgentConfig = AGENTS[nextAgentId];
                state.activeAgent = nextAgentId;
                state.handoffPending = {
                    from: currentAgentId,
                    to: nextAgentId,
                    message: nextAgentConfig.introMessage || "Moving on..."
                };

                // Loop again so new agent can make its first move immediately
                continue;
            } else {
                // All agents done
                state.nextAction = 'done';
                break;
            }
        }

        // B. FIND NEXT FIELD
        // Agent is not done, what's next?
        state.nextAction = 'ask_next';

        // Find first missing owned field
        const ownedMissing = currentAgentConfig.ownedFields.filter(f => !isFieldFilled(state, f));
        log.debug({ event: 'agent.scope', agent: currentAgentId, missing: ownedMissing });

        if (ownedMissing.length > 0) {
            state.nextField = ownedMissing[0];
        }
        else {
            // Blocked State: Agent didn't exit, but has no owned fields left.
            // This happens if requiredToExit includes fields NOT in ownedFields (config mismatch)
            // Or if validation failed but field is technically "filled" with invalid data? 
            // (isFieldFilled checks for non-undefined).

            log.warn({ event: 'agent.blocked_by', agent: currentAgentId, reason: 'no_owned_missing_but_exit_false' });

            // Force Advance to prevent infinite loop
            const currentIndex = AGENT_FLOW.indexOf(currentAgentId);
            if (currentIndex < AGENT_FLOW.length - 1) {
                state.activeAgent = AGENT_FLOW[currentIndex + 1];
                continue;
            } else {
                state.nextAction = 'done';
                break;
            }
        }

        // C. REPETITION GUARD
        // Only run if we are about to ask the SAME question as last time
        if (state.nextField === state.lastQuestionField) {
            state.repeatCountByField = state.repeatCountByField || {};
            const count = (state.repeatCountByField[state.nextField] || 0) + 1;
            state.repeatCountByField[state.nextField] = count;

            if (count >= 2) {
                const outcome = applyRepetitionFallback(state, state.nextField, userMessage, count);

                log.warn({
                    event: 'guard.repeat_triggered',
                    field: state.nextField,
                    count,
                    outcome: outcome.action
                });

                if (outcome.handled && outcome.value !== undefined) {
                    // Force set value (Skip or Accept Raw)
                    // Use coerce logic? No, guardrail output is explicit.
                    state.fields[state.nextField] = {
                        value: outcome.value,
                        status: 'confirmed',
                        confidence: 'low',
                        evidence: 'guard_override',
                        updatedAt: new Date().toISOString()
                    };

                    // Loop again to find NEXT field
                    continue;
                }
                // If handled=false (e.g. switch_to_mcq), we break loop and call Composer with new instructions.
            }
        } else {
            // New question, reset count for this field (optional but clean)
            state.repeatCountByField = state.repeatCountByField || {};
            state.repeatCountByField[state.nextField] = 0;
        }

        break; // Ready to compose
    }

    // --- PHASE 3: COMPOSE ---
    // Update lastQuestionField for the *next* turn before we generate the question
    if (state.nextAction === 'ask_next' && state.nextField) {
        state.lastQuestionField = state.nextField;
    }

    log.info({
        event: 'turn.decision',
        nextAction: state.nextAction,
        nextField: state.nextField,
        activeAgent: state.activeAgent
    });

    let assistantMessage = "";
    if (state.nextAction === 'done') {
        state.isComplete = true;
        assistantMessage = "Perfect! I have everything I need. Generating your report now...";
    } else {
        assistantMessage = await composeMoreQuestions(state);
        if (state.handoffPending) {
            assistantMessage = `${state.handoffPending.message}\n\n${assistantMessage}`;
            state.handoffPending = undefined;
        }
    }

    state.lastAssistantMessage = assistantMessage;
    state.completionPercent = calculateCompletion(state);

    // PERSIST
    try {
        await persistIntakeState(state);
    } catch (e) {
        log.error({ event: 'persist.fail', error: e });
    }

    return {
        message: assistantMessage,
        state,
        isComplete: state.isComplete
    };
}
