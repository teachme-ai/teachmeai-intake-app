import { DEFAULT_MODEL, ai } from '../genkit';
import { DeepResearchInputSchema, DeepResearchOutputSchema } from '../types';
import { getDeepResearchPrompt } from '../prompts/deepResearch.system';


export const deepResearchFlow = ai.defineFlow(
    {
        name: 'deepResearchFlow',
        inputSchema: DeepResearchInputSchema,
        outputSchema: DeepResearchOutputSchema,
    },
    async (input) => {
        const prompt = getDeepResearchPrompt(input);

        const { output } = await ai.generate({
            model: DEFAULT_MODEL,
            prompt: prompt,
            output: { schema: DeepResearchOutputSchema },
        });


        if (!output) {
            throw new Error("Deep Research Agent failed to generate output");
        }

        return output;
    }
);
