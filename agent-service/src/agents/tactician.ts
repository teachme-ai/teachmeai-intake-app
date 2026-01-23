import { gemini15Pro } from '@genkit-ai/googleai';
import { StrategySchema, TacticsSchema } from '../types';
import { z } from 'zod';
import { ai } from '../index';

const TacticianInput = z.object({
    strategy: StrategySchema,
    constraints: z.object({
        timeBarrier: z.number(),
        skillStage: z.number()
    })
});

export const tacticianFlow = ai.defineFlow(
    {
        name: 'tacticianFlow',
        inputSchema: TacticianInput,
        outputSchema: TacticsSchema,
    },
    async (input) => {
        const prompt = `
    You are an Agile Coach and Mentor (The Tactician).
    Your goal is to turn a high-level strategy into an executable plan (IMPACT Phases: Act, Check, Transform).
    
    Strategy: ${JSON.stringify(input.strategy, null, 2)}
    
    Constraints:
    - Time Barrier Level: ${input.constraints.timeBarrier}/5
    - Skill Stage: ${input.constraints.skillStage}/5
    
    Create a concrete execution plan. If time barrier is high, suggest micro-learning. 
    If skill stage is low, suggest structured, rule-based practice.
    `;

        const { output } = await ai.generate({
            model: gemini15Pro,
            prompt: prompt,
            output: { schema: TacticsSchema },
        });

        if (!output) {
            throw new Error("Tactician Agent failed to generate output");
        }

        return output;
    }
);
