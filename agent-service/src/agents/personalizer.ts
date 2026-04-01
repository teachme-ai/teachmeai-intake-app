import { ai, REPORT_MODEL } from '../genkit';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { costTracker } from '../utils/costTracker';

const PersonalizerInputSchema = z.object({
    Identify: z.string(),
    Motivate: z.string(),
    Plan: z.string(),
    Act: z.string(),
    Check: z.string(),
    Transform: z.string(),
    name: z.string().optional(),
    roleCategory: z.string().optional(),
    frustrations: z.string().optional(),
    benefits: z.string().optional(),
    decisionStyle: z.string().optional(),
    learnerType: z.string().optional(),
    currentTools: z.array(z.string()).optional(),
    conversationTranscript: z.array(z.object({
        turn: z.number(),
        user: z.string(),
        agent: z.string(),
        field: z.string()
    })).optional()
});

const PersonalizerOutputSchema = z.object({
    personalizedSummary: z.string(),
});

export const personalizerFlow = ai.defineFlow(
    {
        name: 'personalizerFlow',
        inputSchema: PersonalizerInputSchema,
        outputSchema: PersonalizerOutputSchema,
    },
    async (input) => {
        const log = logger.child({ component: 'Personalizer' });
        log.info({ event: 'personalizer.start', msg: 'Generating personalized summary...' });
        const prompt = `
You are a Personal Communication Specialist for TeachMeAI.
Write a warm, compelling 3-4 paragraph executive summary of this learning plan.

IMPACT PLAN:
- Identify: ${input.Identify}
- Motivate: ${input.Motivate}
- Plan: ${input.Plan}
- Act: ${input.Act}
- Check: ${input.Check}
- Transform: ${input.Transform}

PERSONAL CONTEXT:
- Name: ${input.name || 'Learner'}
- Role: ${input.roleCategory || 'Professional'}
- Frustrations: ${input.frustrations || 'None specified'}
- Desired Benefits: ${input.benefits || 'None specified'}
- Decision Style: ${input.decisionStyle || 'Hybrid'}
- Learner Type: ${input.learnerType || 'Pragmatist'}

RULES:
1. Address them by name (first name if possible).
2. Write in the 2nd person narrative ("You will...", "Your plan...").
3. DIRECTLY connect the "Act" and "Transform" phases to resolving their Frustrations.
4. TONE MAPPING based on Decision Style \`${input.decisionStyle || 'Hybrid'}\`:
   - Analytical: Data-driven language, clear structure, logical progression.
   - Intuitive: Narrative language, vivid scenarios, emotional relief.
   - Hybrid: Balanced approach.
5. NO markdown headings (###). Use paragraphs or bullet points only.
6. Make it feel highly tailored, empathetic, and premium.

## User's Own Words (Interview Transcript)
Here is the verbatim transcript of the user's interview. Directly reference and quote their answers to make them feel deeply heard and understood.
${input.conversationTranscript && input.conversationTranscript.length > 0 
    ? input.conversationTranscript.map(t => "Q: " + t.agent + "\\nA: " + t.user).join("\\n\\n") 
    : 'No transcript available.'}
`;
        const response = await ai.generate({
            model: REPORT_MODEL,
            prompt,
            output: { schema: PersonalizerOutputSchema },
        });

        const { output, usage } = response;
        if (usage) {
            costTracker.addCall('Personalizer', 'gemini-2.5-pro', {
                promptTokens: usage.inputTokens || 0,
                completionTokens: usage.outputTokens || 0,
                totalTokens: usage.totalTokens || 0
            });
        }

        if (!output) {
            throw new Error("Personalizer Agent failed to generate output");
        }
        return output;
    }
);
