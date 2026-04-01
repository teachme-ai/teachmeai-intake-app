import { DEFAULT_MODEL, ai } from '../genkit';
import { DeepResearchInputSchema, DeepResearchOutputSchema } from '../types';
import { getDeepResearchPrompt } from '../prompts/deepResearch.system';
import { costTracker } from '../utils/costTracker';


export const deepResearchFlow = ai.defineFlow(
    {
        name: 'deepResearchFlow',
        inputSchema: DeepResearchInputSchema,
        outputSchema: DeepResearchOutputSchema,
    },
    async (input) => {
        const prompt = getDeepResearchPrompt(input);

        const response = await ai.generate({
            model: DEFAULT_MODEL,
            prompt: prompt,
            output: { schema: DeepResearchOutputSchema },
        });

        const { output, usage } = response;
        if (usage) {
            costTracker.addCall('DeepResearch', 'gemini-2.5-flash', {
                promptTokens: usage.inputTokens || 0,
                completionTokens: usage.outputTokens || 0,
                totalTokens: usage.totalTokens || 0
            });
        }

        if (!output) {
            throw new Error("Deep Research Agent failed to generate output");
        }

        return output;
    }
);
