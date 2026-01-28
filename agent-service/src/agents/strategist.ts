import { gemini20Flash } from '@genkit-ai/googleai';
import { getStrategistPrompt } from '../prompts/strategist.system';
import { LearnerProfileSchema, StrategySchema, DeepResearchOutputSchema } from '../types';
import { z } from 'zod';
import { DEFAULT_MODEL, ai } from '../genkit';

export const StrategistInputSchema = z.object({
    profile: LearnerProfileSchema,
    professionalRoles: z.array(z.string()),
    careerVision: z.string().optional(),
    primaryGoal: z.string().optional(),
    deepResearchResult: DeepResearchOutputSchema.optional()
});

export const strategistFlow = ai.defineFlow(
    {
        name: 'strategistFlow',
        inputSchema: StrategistInputSchema,
        outputSchema: StrategySchema,
    },
    async (input) => {
        const prompt = getStrategistPrompt({
            profile: input.profile,
            professionalRoles: input.professionalRoles,
            primaryGoal: input.primaryGoal,
            deepResearchResult: input.deepResearchResult
        });

        const { output } = await ai.generate({
            model: DEFAULT_MODEL,
            prompt: prompt,
            output: { schema: StrategySchema },
        });


        if (!output) {
            throw new Error("Strategist Agent failed to generate output");
        }

        return output;
    }
);
