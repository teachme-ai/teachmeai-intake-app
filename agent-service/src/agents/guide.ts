import { ai } from '../genkit';
import { z } from 'zod';

import { initializeState } from '../intake/state';
import { IntakeState, IntakeData } from '../intake/schema';
import { processUserTurn } from '../intake/interviewEngine';
import { logger } from '../utils/logger';

const ChatTurnRequestSchema = z.object({
    state: z.any(), // We trust the state passed back
    userMessage: z.string()
});

const ChatTurnResponseSchema = z.object({
    message: z.string(),
    state: z.any(),
    isComplete: z.boolean()
});

export const quizGuideFlow = ai.defineFlow(
    {
        name: 'quizGuideFlow',
        inputSchema: ChatTurnRequestSchema,
        outputSchema: ChatTurnResponseSchema,
    },

    async (input) => {
        const log = logger.child({ flow: 'quizGuideFlow' });
        log.info({ event: 'flow.start', userMessage: input.userMessage });

        // V2 logic: The client provides the full state.
        // We just call the engine.
        const result = await processUserTurn(input.state as IntakeState, input.userMessage);

        log.info({ event: 'flow.end', isComplete: result.isComplete });

        return result;
    }
);

// Export initializeState for external use
export { initializeState };
