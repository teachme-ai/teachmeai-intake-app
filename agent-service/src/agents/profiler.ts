import { z } from 'zod';
import { PsychographicProfileSchema, PsychographicProfile } from '../types';
import { getProfilerPrompt } from '../prompts/profiler.system';
import { ai, DEFAULT_MODEL } from '../genkit';

export const profilingAgentFlow = ai.defineFlow(
    {
        name: 'profilingAgent',
        inputSchema: z.object({
            goal: z.string(),
            challenge: z.string()
        }),
        outputSchema: PsychographicProfileSchema,
    },
    async (input) => {
        const prompt = getProfilerPrompt(input.goal, input.challenge);

        /*
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
        */
        return {
            decisionStyle: 'Intuitive',
            uncertaintyHandling: 'Experimenter',
            changePreference: 8,
            socialEntanglement: 'Social',
            cognitiveLoadTolerance: 'Medium'
        } as PsychographicProfile;
    }
);
