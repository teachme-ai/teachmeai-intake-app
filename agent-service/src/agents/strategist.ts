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
    deepResearchResult: DeepResearchOutputSchema.optional(),
    digital_skills: z.number().optional(),
    tech_savviness: z.number().optional(),
    time_per_week_mins: z.number().optional(),
    seniority: z.string().optional(),
    application_context: z.string().optional()
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
- Digital Mastery: ${input.digital_skills || 3}/5
- Technical Depth: ${input.tech_savviness || 3}/5
- Time Available: ${input.time_per_week_mins === -1 ? 'Flexible/Unspecified' : `${input.time_per_week_mins} mins/week`}
- Seniority: ${input.seniority || 'Not specified'}
- Application Context: ${input.application_context || 'Not specified'}

RESEARCH INSIGHTS:
${input.deepResearchResult ? JSON.stringify(input.deepResearchResult, null, 2) : 'No research available'}

RULES for IMPACT Framework:
1. identify: A 2-3 sentence strategic insight identifying the specific AI opportunity most relevant to their role and goal.
2. motivate: A 2-3 sentence compelling reason why this matters for their career/impact.
3. plan: SCALE THIS TO TIME AVAILABLE.
   - If < 120 mins/week: Plan must be ultra-efficient, focus on "one-click" tools and low-barrier activities.
   - If 120-300 mins/week: Plan can include structured learning and setup of custom workflows.
   - If > 300 mins/week: Suggest deep dives, fine-tuning, or architectural changes.
4. priorities: 3-5 strategic priorities as an array of strings.
5. recommendedWorkflows: 2-3 specific AI workflows they should implement.

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
