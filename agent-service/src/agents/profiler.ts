import { IntakeResponseSchema, PsychographicProfileSchema } from '../types';
import { getProfilerPrompt } from '../prompts/profiler.system';
import { ai, DEFAULT_MODEL } from '../genkit';

export const profilingAgentFlow = ai.defineFlow(
    {
        name: 'profilingAgent',
        inputSchema: IntakeResponseSchema,
        outputSchema: PsychographicProfileSchema,
    },
    async (input) => {
        const prompt = getProfilerPrompt(input);

        const { output } = await ai.generate({
            model: DEFAULT_MODEL,
            prompt: prompt,
            output: { schema: PsychographicProfileSchema },
            config: {
                temperature: 0.2,
            }
        });

        if (!output) {
            throw new Error("Profiling Agent failed to generate output");
        }

        return output;
    }
);
