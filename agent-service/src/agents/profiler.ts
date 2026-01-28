import { DEFAULT_MODEL, ai } from '../genkit';
import { IntakeResponseSchema, LearnerProfileSchema } from '../types';
import { getProfilerPrompt } from '../prompts/profiler.system';


export const profilerFlow = ai.defineFlow(
    {
        name: 'profilerFlow',
        inputSchema: IntakeResponseSchema,
        outputSchema: LearnerProfileSchema,
    },
    async (input) => {
        const prompt = getProfilerPrompt(input);

        const { output } = await ai.generate({
            model: DEFAULT_MODEL,
            prompt: prompt,
            output: { schema: LearnerProfileSchema },
        });


        if (!output) {
            throw new Error("Profiler Agent failed to generate output");
        }

        return output;
    }
);
