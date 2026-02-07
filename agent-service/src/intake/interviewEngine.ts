import { calculateCompletion, isIntakeComplete, isFieldFilled } from './state';
import { IntakeState, IntakeData } from './schema';
import { extractFields } from './extractor';
import { composeMoreQuestions } from './composer';
import { persistIntakeState } from './persist';
import { AGENTS, AGENT_FLOW } from './agents.config';
import { logger } from '../utils/logger';
import { coerceAndSetField, applyRepetitionFallback } from './guardrails';

export type IntakeAction = 'ask_next' | 'clarify' | 'confirm' | 'run_analysis' | 'done';
export type QuestionMode = 'mcq' | 'scale' | 'numeric' | 'list' | 'free_text';

export interface ActionHint {
    targetField?: string;
    mode?: QuestionMode;
    options?: string[];  // For MCQ
}

export interface TurnResult {
    message: string;
    state: IntakeState;
    isComplete: boolean;
    action?: ActionHint;
    progress: number;
}

export async function processUserTurn(
    state: IntakeState,
    userMessage: string
): Promise<TurnResult> {
    const turnStart = Date.now();
    const sessionId = state.sessionId;

    // Add requestId for tracing (mock uuid for now or passed from ctrl)
    const requestId = `req_${Date.now()}`;

    // SAFEGUARD: Ensure fields object exists
    if (!state.fields) {
        state.fields = {};
    }
    if (typeof state.turnCount !== 'number') {
        state.turnCount = 0;
    }

    const log = logger.child({ sessionId, requestId, activeAgent: state.activeAgent });

    log.info({
        event: 'turn.start',
        turn: state.turnCount,
        activeAgent: state.activeAgent,
        lastQuestionField: state.lastQuestionField,
        userMessageSummary: userMessage.substring(0, 50),
        filledFieldsCount: Object.keys(state.fields).filter(k => isFieldFilled(state, k as keyof IntakeData)).length
    });

    // Initialize agent if missing
    if (!state.activeAgent) {
        state.activeAgent = 'guide';
    }

    // --- RUNTIME ASSERTION for missing prefill ---
    if (state.turnCount === 0) {
        const missingCritical = [];
        if (!state.fields.role_raw?.value) missingCritical.push('role_raw');
        if (!state.fields.goal_raw?.value) missingCritical.push('goal_raw');
        if (missingCritical.length > 0) {
            log.warn({ event: 'prefill.missing_critical', missing: missingCritical });
        }
    }

    // --- PHASE 1: EXTRACTION (RUN ONCE) ---
    // Update fields based on user message
    const extraction = await extractFields(
        userMessage,
        state.fields,
        state.lastQuestionField,
        state.lastAssistantMessage
    );
    if (extraction.ok) {
        const extracted = extraction.data || {};
        const keys = Object.keys(extracted);

        if (keys.length > 0) {
            log.info({ event: 'extract.success', keys, values: extracted });

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
        log.error({ event: 'extract.fail', error: extraction.error });
    }

    state.turnCount++; // Increment user turns once per message
    state.lastUserMessage = userMessage;


    // --- PHASE 2: DECISION LOOP (INTERNAL MAX 2) ---
    // We loop to handle "Agent Switch" or "Guardrail Fallback" without requiring new user input
    // This loop does NOT re-run extraction.

    let loopCount = 0;
    const MAX_INTERNAL_LOOPS = 5;

    while (loopCount < MAX_INTERNAL_LOOPS) {
        loopCount++;
        log.debug({ event: 'engine.internal_iter', loop: loopCount, agent: state.activeAgent });

        let currentAgentId = state.activeAgent;
        let currentAgentConfig = AGENTS[currentAgentId];

        // A. CHECK EXIT CRITERIA
        const exitCheck = currentAgentConfig.shouldExit(state);

        // Detailed Exit Decision Logging
        const filledOwnFields = currentAgentConfig.ownedFields.filter(f => isFieldFilled(state, f));
        const missingOwnFields = currentAgentConfig.ownedFields.filter(f => !isFieldFilled(state, f));

        log.info({
            event: 'agent.exit_check',
            agent: currentAgentId,
            shouldExit: exitCheck,
            filledCount: filledOwnFields.length,
            missingCount: missingOwnFields.length,
            missing: missingOwnFields
        });

        if (exitCheck) {
            const currentIndex = AGENT_FLOW.indexOf(currentAgentId);

            if (currentIndex < AGENT_FLOW.length - 1) {
                // Advance Agent
                const nextAgentId = AGENT_FLOW[currentIndex + 1];

                log.info({
                    event: 'agent.handoff',
                    from: currentAgentId,
                    to: nextAgentId,
                    reason: 'exit_criteria_met',
                    turnCount: state.turnCount
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
                // All agents done - DOUBLE CHECK with global logic
                if (isIntakeComplete(state)) {
                    log.info({ event: 'agent.all_done', session: state.sessionId });
                    state.nextAction = 'done';
                } else {
                    // Safety: if global check fails, find ANY missing field required by state.ts
                    log.warn({ event: 'agent.all_done_but_incomplete', session: state.sessionId });

                    // Fields required by isIntakeComplete in state.ts
                    const globalRequired: Array<keyof IntakeData> = [
                        'skill_stage', 'time_per_week_mins', 'digital_skills', 'tech_savviness'
                    ];
                    const nextGlobal = globalRequired.find(f => !isFieldFilled(state, f));

                    if (nextGlobal) {
                        state.nextAction = 'ask_next';
                        state.nextField = nextGlobal;
                        log.info({ event: 'agent.fallback_to_global', field: nextGlobal });
                    } else {
                        state.nextAction = 'done'; // Fallback to done if we truly can't find anything
                    }
                }
                break;
            }
        }

        // B. FIND NEXT FIELD
        // Agent is not done, what's next?
        state.nextAction = 'ask_next';

        // Find first missing owned field
        const ownedMissing = missingOwnFields;
        log.info({
            event: 'agent.decision',
            agent: currentAgentId,
            nextAction: state.nextAction,
            missingFields: ownedMissing
        });

        if (ownedMissing.length > 0) {
            // CRITICAL FIX: Don't re-ask the field we just filled in this turn
            const justFilled = state.lastQuestionField && isFieldFilled(state, state.lastQuestionField);
            if (justFilled && ownedMissing[0] === state.lastQuestionField && ownedMissing.length > 1) {
                // Skip to next missing field
                state.nextField = ownedMissing[1];
                log.info({ event: 'skip_just_filled', field: state.lastQuestionField, nextField: state.nextField });
            } else {
                state.nextField = ownedMissing[0];
            }
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
            const count = (state.repeatCountByField[state.nextField] || 0);

            if (count >= 1) {
                // Already asked once, accept the answer now
                const outcome = applyRepetitionFallback(state, state.nextField, userMessage, count);

                log.warn({
                    event: 'guard.repeat_triggered',
                    field: state.nextField,
                    count,
                    outcome: outcome.action
                });

                if (outcome.handled && outcome.value !== undefined) {
                    // Force set value (Accept Raw)
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
            }

            // Increment for next time
            state.repeatCountByField[state.nextField] = count + 1;
        } else {
            // New question, reset count for this field
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
        activeAgent: state.activeAgent,
        isComplete: state.isComplete,
        totalFieldsFilled: Object.keys(state.fields).filter(k => isFieldFilled(state, k as keyof IntakeData)).length
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

    // Build action hint for UI
    const action: ActionHint | undefined = state.nextField ? {
        targetField: state.nextField as string,
        mode: getQuestionModeForField(state.nextField),
        options: undefined // MCQ options can be added later
    } : undefined;

    return {
        message: assistantMessage,
        state,
        isComplete: state.isComplete,
        action,
        progress: state.completionPercent || 0
    };
}

function getQuestionModeForField(field: keyof IntakeData): QuestionMode {
    if (['role_category', 'industry_vertical', 'learner_type', 'motivation_type', 'vark_primary'].includes(field)) return 'mcq';
    if (['skill_stage', 'time_barrier', 'srl_goal_setting', 'srl_adaptability', 'srl_reflection',
        'tech_confidence', 'resilience', 'vision_clarity', 'success_clarity_1yr'].includes(field)) return 'scale';
    if (['time_per_week_mins'].includes(field)) return 'numeric';
    if (['constraints', 'current_tools', 'vark_ranked'].includes(field)) return 'list';
    return 'free_text';
}
