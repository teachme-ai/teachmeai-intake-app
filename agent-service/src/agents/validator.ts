import { ai, DEFAULT_MODEL } from '../genkit';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { costTracker } from '../utils/costTracker';

const ValidatorInputSchema = z.object({
    act: z.string(),
    check: z.string(),
    transform: z.string(),
    recommendations: z.array(z.string()),
    studyRules: z.array(z.object({ rule: z.string(), label: z.string() })).optional(),
    digitalSkills: z.number().optional(),
    techSavviness: z.number().optional(),
    timePerWeekMins: z.number().optional(),
    skillStage: z.number().optional(),
    learnerType: z.string().optional(),
    currentTools: z.array(z.string()).optional(),
    blockers: z.array(z.string()).optional(),
});

const ValidatorOutputSchema = z.object({
    isValid: z.boolean(),
    validationNotes: z.array(z.string()),
    corrections: z.array(z.object({
        field: z.string(),
        issue: z.string(),
        suggestion: z.string(),
    })),
});

export const validatorFlow = ai.defineFlow(
    {
        name: 'validatorFlow',
        inputSchema: ValidatorInputSchema,
        outputSchema: ValidatorOutputSchema,
    },
    async (input) => {
        const log = logger.child({ component: 'Validator' });
        log.info({ event: 'validator.start', msg: 'Validating plan constraints...' });
        const prompt = `
You are a Quality Assurance Validator for a personalized AI learning plan.
Your job: Cross-reference the generated plan against the user's actual constraints. Flag mismatches.

GENERATED PLAN:
- Act: ${input.act}
- Check: ${input.check}
- Transform: ${input.transform}
- Recommendations: ${JSON.stringify(input.recommendations)}
- Study Rules: ${JSON.stringify(input.studyRules || [])}

USER CONSTRAINTS:
- Digital Skills: ${input.digitalSkills ?? 'unknown'}/5
- Tech Savviness: ${input.techSavviness ?? 'unknown'}/5
- Time Available: ${input.timePerWeekMins ?? 'unknown'} mins/week
- Skill Stage: ${input.skillStage ?? 'unknown'}/5
- Learner Type: ${input.learnerType || 'unknown'}
- Current Tools: ${(input.currentTools || []).join(', ') || 'unknown'}
- Blockers: ${(input.blockers || []).join(', ') || 'none'}

VALIDATION RULES:
1. If digitalSkills <= 2, plan MUST NOT suggest APIs, scripts, or CLI tools.
2. If timePerWeekMins < 120, weekly plan total MUST NOT exceed that time.
3. Recommendations should be compatible with currentTools when possible.
4. Study rules should match the learnerType pattern.
5. If blockers include "time", plan should be ultra-minimal.

OUTPUT (JSON only):
{
  "isValid": boolean,
  "validationNotes": ["note1", "note2"],
  "corrections": [{ "field": "...", "issue": "...", "suggestion": "..." }]
}
`;
        const response = await ai.generate({
            model: DEFAULT_MODEL,
            prompt,
            output: { schema: ValidatorOutputSchema },
        });

        const { output, usage } = response;
        if (usage) {
            costTracker.addCall('Validator', 'gemini-2.5-flash', {
                promptTokens: usage.inputTokens || 0,
                completionTokens: usage.outputTokens || 0,
                totalTokens: usage.totalTokens || 0
            });
        }

        if (!output) {
            throw new Error("Validator Agent failed to generate output");
        }
        return output;
    }
);
