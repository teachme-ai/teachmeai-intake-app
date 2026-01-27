import { gemini20Flash } from '@genkit-ai/googleai';
import { getDeepResearchPrompt } from '../prompts/deepResearch.system';
import { DeepResearchInputSchema, DeepResearchOutputSchema } from '../types';
import { ai } from '../genkit';

export const deepResearchFlow = ai.defineFlow(
    {
        name: 'deepResearchFlow',
        inputSchema: DeepResearchInputSchema,
        outputSchema: DeepResearchOutputSchema,
    },
    async (input) => {
        const prompt = getDeepResearchPrompt(input);

        const { output } = await ai.generate({
            model: gemini20Flash,
            prompt: prompt,
            output: { schema: DeepResearchOutputSchema },
        });

        if (!output) {
            throw new Error("Deep Research Agent failed to generate output");
        }

        return output;
    }
);
