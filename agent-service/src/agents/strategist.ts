import { gemini20Flash } from '@genkit-ai/googleai';
import { getStrategistPrompt } from '../prompts/strategist.system';
import { LearnerProfileSchema, StrategySchema } from '../types';
import { z } from 'zod';
import { ai } from '../genkit';

export const StrategistInputSchema = z.object({
    profile: LearnerProfileSchema,
    professionalRoles: z.array(z.string()),
    careerVision: z.string().optional(),
    primaryGoal: z.string().optional(),
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
            primaryGoal: input.primaryGoal
        });

        const { output } = await ai.generate({
            model: gemini20Flash,
            prompt: prompt,
            output: { schema: StrategySchema },
        });

        if (!output) {
            throw new Error("Strategist Agent failed to generate output");
        }

        return output;
    }
);
