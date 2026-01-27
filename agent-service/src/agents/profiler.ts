import { gemini20Flash } from '@genkit-ai/googleai';
import { getProfilerPrompt } from '../prompts/profiler.system';
import { IntakeResponseSchema, LearnerProfileSchema } from '../types';
import { ai } from '../genkit';

export const profilerFlow = ai.defineFlow(
    {
        name: 'profilerFlow',
        inputSchema: IntakeResponseSchema,
        outputSchema: LearnerProfileSchema,
    },
    async (input) => {
        const prompt = getProfilerPrompt(input);

        const { output } = await ai.generate({
            model: gemini20Flash,
            prompt: prompt,
            output: { schema: LearnerProfileSchema },
        });

        if (!output) {
            throw new Error("Profiler Agent failed to generate output");
        }

        return output;
    }
);
