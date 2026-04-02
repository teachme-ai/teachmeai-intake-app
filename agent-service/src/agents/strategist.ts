import { gemini20Flash } from '@genkit-ai/googleai';
import { getStrategistPrompt } from '../prompts/strategist.system';
import { PsychographicProfileSchema, StrategySchema, DeepResearchOutputSchema } from '../types';
import { DEFAULT_MODEL, REPORT_MODEL, ai } from '../genkit';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { costTracker } from '../utils/costTracker';

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
    application_context: z.string().optional(),
    current_tools: z.array(z.string()).optional(),
    srl_level: z.number().optional(),
    motivation_type: z.enum(['intrinsic', 'outcome', 'hybrid']).optional(),
    frustrations: z.string().optional(),
    benefits: z.string().optional(),
    conversationTranscript: z.array(z.object({
        turn: z.number(),
        user: z.string(),
        agent: z.string(),
        field: z.string()
    })).optional()
});

export const strategistFlow = ai.defineFlow(
    {
        name: 'strategistFlow',
        inputSchema: StrategistInputSchema,
        outputSchema: StrategySchema,
    },
    async (input) => {
        const log = logger.child({ component: 'Strategist' });
        log.info({ event: 'strategist.start', msg: 'Generating strategic IMPACT analysis...' });
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
- Current Tech Stack: ${(input as any).current_tools?.join(', ') || 'Not specified'}
- SRL Goal Setting: ${input.srl_level ?? 'Not assessed'}/5
- Motivation Type: ${input.motivation_type || 'Not assessed'}
- Key Frustrations: ${input.frustrations || 'None stated'}
- Desired Benefits: ${input.benefits || 'Not stated'}

RESEARCH INSIGHTS:
${input.deepResearchResult ? JSON.stringify(input.deepResearchResult, null, 2) : 'No research available'}

RULES for IMPACT Framework:
1. identify: A 2-3 sentence strategic insight identifying the specific AI opportunity most relevant to their role and goal. USE MARKDOWN BULLETS OR BOLDING for key insights to ensure high readability. Avoid dense blocks.
2. motivate: A 2-3 sentence compelling reason why this matters for their career/impact. Use bolding for emphasis on key benefits.
3. plan: SCALE THIS TO TIME AVAILABLE. Use structured steps (Step 1, Step 2, etc.).
   - If < 120 mins/week: Plan must be ultra-efficient, focus on "one-click" tools and low-barrier activities.
   - If 120-300 mins/week: Plan can include structured learning and setup of custom workflows.
   - If > 300 mins/week: Suggest deep dives, fine-tuning, or architectural changes.
4. priorities: 3-5 strategic priorities as an array of strings.
5. recommendedWorkflows: 2-3 specific AI workflows they should implement.

Be specific, actionable, and personalized to their context. Ensure all text is formatted for a premium dashboard UI.

## User's Own Words (Interview Transcript)
Here is the verbatim transcript of the user's interview. Use their exact phrasing (e.g., specific frustrations, specific goals) to make your strategy highly relatable and empathetic:
${input.conversationTranscript && input.conversationTranscript.length > 0 
    ? input.conversationTranscript.map(t => "Q: " + t.agent + "\\nA: " + t.user).join("\\n\\n") 
    : 'No transcript available.'}
`;

        const response = await ai.generate({
            model: REPORT_MODEL,
            prompt: analysisPrompt,
            output: { schema: StrategySchema },
        });

        const { output, usage } = response;
        if (usage) {
            costTracker.addCall('Strategist', 'gemini-2.5-pro', {
                promptTokens: usage.inputTokens || 0,
                completionTokens: usage.outputTokens || 0,
                totalTokens: usage.totalTokens || 0
            });
        }

        if (!output) {
            throw new Error("Strategist Agent failed to generate output");
        }

        return output;
    }
);
