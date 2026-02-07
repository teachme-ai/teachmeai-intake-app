import { gemini20Flash } from '@genkit-ai/googleai';
import { getStrategistPrompt } from '../prompts/strategist.system';
import { PsychographicProfileSchema, StrategySchema, DeepResearchOutputSchema } from '../types';
import { z } from 'zod';
import { DEFAULT_MODEL, ai } from '../genkit';

export const StrategistInputSchema = z.object({
    profile: PsychographicProfileSchema,
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
        // Use direct prompt for IMPACT analysis generation
        const analysisPrompt = `
You are a Strategic AI Adoption Advisor.

Given the learner profile and research insights, generate a strategic IMPACT framework analysis.

LEARNER PROFILE:
- Role: ${input.professionalRoles.join(', ')}
- Goal: ${input.primaryGoal}
- Decision Style: ${input.profile.decisionStyle}
- Uncertainty Handling: ${input.profile.uncertaintyHandling}
- Change Preference: ${input.profile.changePreference}/10
- Social Entanglement: ${input.profile.socialEntanglement}
- Cognitive Load: ${input.profile.cognitiveLoadTolerance}

RESEARCH INSIGHTS:
${input.deepResearchResult ? JSON.stringify(input.deepResearchResult, null, 2) : 'No research available'}

Generate:
1. IDENTIFY: A 2-3 sentence strategic insight identifying the specific AI opportunity most relevant to their role and goal
2. MOTIVATE: A 2-3 sentence compelling reason why this matters for their career/impact
3. PLAN: A 2-3 sentence high-level roadmap of what they need to learn/build
4. priorities: 3-5 strategic priorities as an array of strings
5. recommendedWorkflows: 2-3 specific AI workflows they should implement

Be specific, actionable, and personalized to their context.
`;

        const { output } = await ai.generate({
            model: DEFAULT_MODEL,
            prompt: analysisPrompt,
            output: { schema: StrategySchema },
        });


        if (!output) {
            throw new Error("Strategist Agent failed to generate output");
        }

        return output;
    }
);
