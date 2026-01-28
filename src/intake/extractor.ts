import { IntakeState, IntakeData } from './schema';
import { ai, DEFAULT_MODEL } from '../lib/genkit';
import { z } from 'zod';
import { logger } from '../utils/logger';

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
    application_context: z.string().optional()
});

export async function extractFields(
    userMessage: string,
    currentFields: IntakeState['fields'],
    targetField?: keyof IntakeData
): Promise<ExtractResult> {
    const log = logger.child({ component: 'extractor', targetField });
    log.debug({ event: 'extract.start', userMessageLen: userMessage.length });

    // 1. Cheap deterministic parsing
    const quickExtract: Partial<IntakeData> = {};
    const hrMatch = userMessage.match(/(\d+)\s*(h|hr|hrs|hour|hours)/i);
    if (hrMatch) {
        quickExtract.time_per_week_mins = parseInt(hrMatch[1]) * 60;
    }

    const systemPrompt = `
    You are an expert Data Extractor for an Intake Interview.
    EXTRACT specific fields from the USER MESSAGE into JSON.
    
    CONTEXT:
    Role: ${currentFields.role_raw?.value}
    Goal: ${currentFields.goal_raw?.value}
    Target: ${String(targetField || 'any')}
    
    Instructions:
    - Return JSON matching the schema.
    - For SCALES (skill_stage, srl_*, vision_clarity, etc.):
      - Output NUMBER 1-5.
      - Map "Beginner/Low" -> 1. "Expert/High" -> 5.
    - For INDUSTRY VERTICAL: Match one of: BFSI, Manufacturing, Sales & Marketing, IT Consultancy, Healthcare, EdTech, Other.
    - For TIME: Convert to minutes (Number).
    - If user implies a field (e.g. "I manage products" -> role_category: "Product"), extract it.
    - If output is ambiguous, return null.
    `;

    try {
        const { output } = await ai.generate({
            model: DEFAULT_MODEL,
            system: systemPrompt,
            prompt: userMessage,
            output: { schema: ExtractionSchema },
            config: { temperature: 0 }
        });

        let data = output ? JSON.parse(JSON.stringify(output)) : {};
        if (Object.keys(data).length === 0) data = {};

        const merged = { ...quickExtract, ...data };

        // --- FALLBACK LOGIC (TRUST USER) ---
        if (targetField) {
            const gotTarget = merged[targetField] !== undefined && merged[targetField] !== null;

            if (!gotTarget) {
                // FALLBACK POLICY:
                // Only force-assign RAW TEXT for specific text fields.
                // Do NOT force-assign Enums, Scales, or Numbers (let Guardrails handle repetition/MCQ).

                const safeTextFields = ['role_raw', 'goal_raw', 'goal_calibrated', 'industry', 'seniority', 'frustrations', 'benefits', 'application_context'];

                const cleanMsg = userMessage.trim();
                const isJunk = cleanMsg.length < 2 || /^(no|nah|idk|pass)/i.test(cleanMsg);

                if (safeTextFields.includes(targetField as string) && !isJunk) {
                    merged[targetField] = cleanMsg;
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
