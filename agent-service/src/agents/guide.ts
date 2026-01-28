import { ai } from '../genkit';
import { QuizSessionSchema, QuizResponseSchema } from '../types';
import { initializeState } from '../intake/state';
import { IntakeState, IntakeData } from '../intake/schema';
import { processUserTurn } from '../intake/interviewEngine';
import { logger } from '../utils/logger';

export const quizGuideFlow = ai.defineFlow(
    {
        name: 'quizGuideFlow',
        inputSchema: QuizSessionSchema,
        outputSchema: QuizResponseSchema,
    },

    async (input) => {
        const log = logger.child({ flow: 'quizGuideFlow' });
        log.info({ event: 'flow.start', inputMessageCount: input.messages?.length });

        // 1. HYDRATE STATE (Stateless Adaptor)
        // We reconstruct the IntakeState from the inputs provided by the client.

        // Generate a pseudo-session ID for logging correlation
        const email = input.extractedData?.email || 'anon';
        const sessionId = `sess_${email.replace(/[^a-z0-9]/gi, '_')}`;

        // Use the 'prefill' logic for core fields
        let state = initializeState(sessionId, {
            name: input.extractedData?.name,
            email: input.extractedData?.email,
            role: input.extractedData?.role,
            goal: input.extractedData?.learningGoal
        });

        // Manually hydrate KEY fields for Phase 1 agents
        // We iterate over input.extractedData and map known fields to state
        if (input.extractedData) {
            // Hydrate Active Agent if present
            if ((input.extractedData as any)._activeAgent) {
                state.activeAgent = (input.extractedData as any)._activeAgent;
            }

            // Hydrate Last Question Field
            if ((input.extractedData as any)._lastQuestionField) {
                state.lastQuestionField = (input.extractedData as any)._lastQuestionField;
            }

            Object.entries(input.extractedData).forEach(([key, val]) => {
                if (key === '_activeAgent' || key === '_lastQuestionField') return; // Skip metadata

                if (val && !state.fields[key as keyof IntakeData]) {
                    // If not already set by initializeState (core fields), set it now
                    // We assume frontend passes back raw values
                    state.fields[key as keyof IntakeData] = {
                        value: val,
                        status: 'confirmed', // Assume historical data is confirmed
                        confidence: 'high',
                        evidence: 'history',
                        updatedAt: new Date().toISOString()
                    };
                }
            });
        }

        // Estimate turn count
        state.turnCount = Math.floor((input.messages?.length || 0) / 2);

        // Get last user message
        const lastMsg = input.messages && input.messages.length > 0
            ? input.messages[input.messages.length - 1].content
            : "";

        // 2. PROCESS TURN
        const result = await processUserTurn(state, lastMsg);

        // 3. MAP RESULT
        // We map IntakeState back to QuizResponse. 
        // We MUST include ALL fields so the client can send them back next turn.

        const responseData: any = {};

        // Persist Agent State
        responseData._activeAgent = result.state.activeAgent;
        responseData._lastQuestionField = result.state.lastQuestionField; // Persist for next turn

        Object.entries(result.state.fields).forEach(([k, field]) => {
            if (field && field.value !== undefined) {
                responseData[k] = field.value;
            }
        });

        // Ensure legacy mapping for frontend compatibility if needed
        responseData.learningGoal = result.state.fields.goal_calibrated?.value || result.state.fields.goal_raw?.value;
        responseData.role = result.state.fields.role_raw?.value;

        log.info({ event: 'flow.end', isComplete: result.isComplete });

        return {
            message: result.message,
            extractedData: responseData,
            isComplete: result.isComplete
        };
    }
);
