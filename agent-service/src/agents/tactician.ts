import { gemini20Flash } from '@genkit-ai/googleai';
import { getTacticianPrompt } from '../prompts/tactician.system';
import { StrategySchema, TacticsSchema } from '../types';
import { z } from 'zod';
import { DEFAULT_MODEL, ai } from '../genkit';

const TacticianInput = z.object({
    strategy: StrategySchema,
    name: z.string().optional(),
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
        const prompt = getTacticianPrompt({
            strategy: input.strategy,
            name: input.name,
            constraints: input.constraints
        });

        const { output } = await ai.generate({
            model: DEFAULT_MODEL,
            prompt: prompt,
            output: { schema: TacticsSchema },
        });


        if (!output) {
            throw new Error("Tactician Agent failed to generate output");
        }

        return output;
    }
);
