import { IntakeState, IntakeData } from './schema';
import { ai, INTAKE_MODEL } from '../genkit';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { withLLMResilience } from '../utils/llm-resilience';
import { withConcurrencyLimit } from '../utils/concurrency';

export type ExtractResult =
    | { ok: true; data: Partial<IntakeData> }
    | { ok: false; error: { message: string; code?: string } };

const ExtractionSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    role_category: z.string().optional(),
    industry_vertical: z.enum(['BFSI', 'Manufacturing', 'Sales & Marketing', 'IT Consultancy', 'Other', 'Healthcare', 'EdTech']).optional(),
    industry: z.string().optional(),
    seniority: z.string().optional(),
    goal_calibrated: z.string().optional(),

    // Scale Fields
    skill_stage: z.number().optional(),
    time_barrier: z.number().optional(),
    srl_goal_setting: z.number().optional(),
    srl_adaptability: z.number().optional(),
    srl_reflection: z.number().optional(),
    tech_confidence: z.number().optional(),
    resilience: z.number().optional(),
    vision_clarity: z.number().optional(),
    success_clarity_1yr: z.number().optional(),

    // Enums
    learner_type: z.enum(['theorist', 'activist', 'reflector', 'pragmatist']).optional(),
    motivation_type: z.enum(['intrinsic', 'outcome', 'hybrid']).optional(),
    vark_primary: z.enum(['visual', 'audio', 'read_write', 'kinesthetic']).optional(),

    // Arrays
    vark_ranked: z.array(z.string()).optional(),
    constraints: z.array(z.string()).optional(),
    current_tools: z.array(z.string()).optional(),

    // Text
    time_per_week_mins: z.number().optional(),
    frustrations: z.string().optional(),
    benefits: z.string().optional(),
    application_context: z.string().optional(),
    digital_skills: z.number().optional(),
    tech_savviness: z.number().optional()
});

// Load the Dotprompt
const extractorPrompt = ai.prompt('extractor');

export async function extractFields(
    userMessage: string,
    currentFields: IntakeState['fields'],
    targetField?: keyof IntakeData,
    lastAssistantMessage?: string
): Promise<ExtractResult> {
    const log = logger.child({ component: 'extractor', targetField });
    log.debug({ event: 'extract.start', userMessageLen: userMessage.length });

    // 1. Cheap deterministic parsing (always runs, no LLM cost)
    const quickExtract: Partial<IntakeData> = {};

    // Better Time Regex:
    // Matches: "2 hours", "2 hrs", "2h", "10" (when target is time)
    // We prioritize explicit units. If raw number & target=time, we assume hours.

    // Check for explicit units first
    const hrMatch = userMessage.match(/(\d+)\s*(h|hr|hrs|hour|hours)/i);
    const minMatch = userMessage.match(/(\d+)\s*(m|min|mins|minute|minutes)/i);

    if (hrMatch) {
        quickExtract.time_per_week_mins = parseInt(hrMatch[1]) * 60;
    } else if (minMatch) {
        quickExtract.time_per_week_mins = parseInt(minMatch[1]);
    } else if (targetField === 'time_per_week_mins') {
        // Fallback: If targeted, assume raw number is hours (unless > 20, then maybe mins? No, keep simple)
        const rawNum = userMessage.match(/(\d+)/);
        if (rawNum) {
            // Assume hours for now as per common inputs
            quickExtract.time_per_week_mins = parseInt(rawNum[1]) * 60;
        }
    }

    try {
        // 2. LLM extraction with resilience and concurrency control
        const { output: llmOutput } = await withConcurrencyLimit(
            () => withLLMResilience(
                () => extractorPrompt({
                    userMessage,
                    currentRole: currentFields.role_raw?.value,
                    currentGoal: currentFields.goal_raw?.value,
                    targetField: String(targetField || 'any'),
                    lastAssistantMessage
                }),
                {
                    component: 'extractor',
                    maxRetries: 3,
                    // Fallback: return quick extract only if LLM fails
                    fallback: async () => {
                        log.warn({ event: 'extract.llm_fallback' });
                        return { output: {} };
                    }
                }
            )
        );

        let data: Partial<IntakeData> = llmOutput ? JSON.parse(JSON.stringify(llmOutput)) : {};
        if (Object.keys(data).length === 0) data = {};

        // Merge strategies: Quick extract overrides LLM for time if present (deterministic is safer)
        const merged = { ...data, ...quickExtract };

        // --- FALLBACK LOGIC (TRUST USER) ---
        if (targetField) {
            const gotTarget = merged[targetField] !== undefined && merged[targetField] !== null;

            if (!gotTarget) {
                // FALLBACK POLICY:
                // Only force-assign RAW TEXT for specific text fields.
                // Do NOT force-assign Enums, Scales, or Numbers (let Guardrails handle repetition/MCQ).

                const safeTextFields = ['role_raw', 'goal_raw', 'goal_calibrated', 'industry', 'seniority', 'frustrations', 'benefits', 'application_context', 'role_category', 'industry_vertical', 'digital_skills', 'tech_savviness'];

                const cleanMsg = userMessage.trim();
                const isJunk = cleanMsg.length < 1 || /^(no|nah|idk|pass)/i.test(cleanMsg);

                if (safeTextFields.includes(targetField as string) && !isJunk) {
                    (merged as any)[targetField] = cleanMsg;
                    log.info({ event: 'extract.fallback_text', field: targetField });
                } else {
                    // For Scales/Enums, if we missed it, we leave it undefined.
                    // The Engine will see it is still missing.
                    // If it repeats, the Guardrail will trigger.
                }
            }
        }

        return { ok: true, data: merged };

    } catch (e: any) {
        log.error({ event: 'extract.fail', error: String(e) });
        if (Object.keys(quickExtract).length > 0) return { ok: true, data: quickExtract };
        return { ok: false, error: { message: e?.message || String(e) } };
    }
}
