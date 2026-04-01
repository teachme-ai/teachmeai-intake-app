import { IntakeResponseSchema, PsychographicProfileSchema } from '../types';
import { getProfilerPrompt } from '../prompts/profiler.system';
import { ai, DEFAULT_MODEL } from '../genkit';
import { costTracker } from '../utils/costTracker';

export const profilingAgentFlow = ai.defineFlow(
    {
        name: 'profilingAgent',
        inputSchema: IntakeResponseSchema,
        outputSchema: PsychographicProfileSchema,
    },
    async (input) => {
        const prompt = getProfilerPrompt(input);

        const response = await ai.generate({
            model: DEFAULT_MODEL,
            prompt: prompt,
            output: { schema: PsychographicProfileSchema },
            config: {
                temperature: 0.2,
            }
        });

        const { output, usage } = response;
        if (usage) {
            costTracker.addCall('Profiler', 'gemini-2.5-flash', {
                promptTokens: usage.inputTokens || 0,
                completionTokens: usage.outputTokens || 0,
                totalTokens: usage.totalTokens || 0
            });
        }

        if (!output) {
            throw new Error("Profiling Agent failed to generate output");
        }

        return output;
    }
);
