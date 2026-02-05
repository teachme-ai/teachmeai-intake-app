import { gemini20Flash } from '@genkit-ai/googleai';
import { getStrategistPrompt } from '../prompts/strategist.system';
import { LearnerProfileSchema, StrategySchema, DeepResearchOutputSchema } from '../types';
import { z } from 'zod';
import { DEFAULT_MODEL, ai } from '../genkit';

export const StrategistInputSchema = z.object({
    profile: LearnerProfileSchema,
    professionalRoles: z.array(z.string()),
    careerVision: z.string().optional(),
    primaryGoal: z.string().optional(),
    deepResearchResult: DeepResearchOutputSchema.optional(),
    // NEW: Enhanced context fields for Phase 2
    application_context: z.string().optional(),
    seniority: z.string().optional(),
    time_per_week_mins: z.number().optional(),
    benefits: z.string().optional(),
    frustrations: z.string().optional(),
});

export const strategistFlow = ai.defineFlow(
    {
        name: 'strategistFlow',
        inputSchema: StrategistInputSchema,
        outputSchema: StrategySchema,
    },
    async (input) => {
        // Build dynamic context strings
        const weeklyHours = input.time_per_week_mins
            ? `${Math.floor(input.time_per_week_mins / 60)} hours/week (${input.time_per_week_mins} mins)`
            : 'Not specified';

        const seniorityContext = input.seniority
            ? `${input.seniority} level`
            : 'Not specified';

        const contextInfo = input.application_context
            ? `\n- Application Context: ${input.application_context}`
            : '';

        const benefitsInfo = input.benefits
            ? `\n- Desired Benefits: ${input.benefits}`
            : '';

        const frustrationsInfo = input.frustrations
            ? `\n- Current Frustrations: ${input.frustrations}`
            : '';

        // Use direct prompt for IMPACT analysis generation
        const analysisPrompt = `
You are a Strategic AI Adoption Advisor.

Given the learner profile and research insights, generate a strategic IMPACT framework analysis.

LEARNER PROFILE:
- Role: ${input.professionalRoles.join(', ')}
- Seniority: ${seniorityContext}
- Goal: ${input.primaryGoal}
- Available Time: ${weeklyHours}
- SRL Level: ${input.profile.psychologicalProfile.srlLevel}
- Motivation: ${input.profile.psychologicalProfile.motivationType}
- Primary Learning Style: ${input.profile.learningPreferences.primaryStyle}${contextInfo}${benefitsInfo}${frustrationsInfo}

RESEARCH INSIGHTS:
${input.deepResearchResult ? JSON.stringify(input.deepResearchResult, null, 2) : 'No research available'}

Generate:
1. IDENTIFY: A 2-3 sentence strategic insight identifying the specific AI opportunity most relevant to their role, seniority, and context${input.frustrations ? ', addressing their frustrations' : ''}
2. MOTIVATE: A 2-3 sentence compelling reason why this matters for their career/impact${input.benefits ? ', highlighting their desired benefits' : ''}
3. PLAN: A 2-3 sentence high-level roadmap calibrated to their available time (${weeklyHours})${input.application_context ? ` for ${input.application_context}` : ''}
4. priorities: 3-5 strategic priorities
5. recommendedWorkflows: 2-3 specific AI workflows they should implement

${input.time_per_week_mins ? `IMPORTANT: All recommendations must be realistic for ${weeklyHours} of study time.` : ''}
${input.frustrations ? `IMPORTANT: Address these pain points: ${input.frustrations}` : ''}

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
