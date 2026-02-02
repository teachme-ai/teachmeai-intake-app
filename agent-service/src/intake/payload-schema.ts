import { z } from 'zod';
import { logger } from '../utils/logger';

/**
 * Payload schema for /quizGuide endpoint
 * Non-breaking validation - logs issues but doesn't reject
 */
export const QuizGuidePayloadSchema = z.object({
    state: z.object({
        sessionId: z.string(),
        fields: z.record(z.any()),
        turnCount: z.number(),
        isComplete: z.boolean(),
        activeAgent: z.string()
    }),
    userMessage: z.string()
});

export const SupervisorPayloadSchema = z.object({
    data: z.object({
        name: z.string().optional(),
        email: z.string().optional(),
        currentRoles: z.array(z.string()).optional(),
        primaryGoal: z.string().optional(),
        learningStyle: z.string().optional(),
        industry: z.string().optional()
    }),
    sessionId: z.string().optional()
});

export type QuizGuidePayload = z.infer<typeof QuizGuidePayloadSchema>;
export type SupervisorPayload = z.infer<typeof SupervisorPayloadSchema>;

/**
 * Validate payload and log issues (non-breaking)
 */
export function validateQuizGuidePayload(body: unknown): { valid: boolean; data?: QuizGuidePayload; issues?: z.ZodIssue[] } {
    const result = QuizGuidePayloadSchema.safeParse(body);
    if (!result.success) {
        logger.warn({
            event: 'quizGuide.payload_invalid',
            issues: result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
        });
        return { valid: false, issues: result.error.issues };
    }
    return { valid: true, data: result.data };
}

export function validateSupervisorPayload(body: unknown): { valid: boolean; data?: SupervisorPayload; issues?: z.ZodIssue[] } {
    const result = SupervisorPayloadSchema.safeParse(body);
    if (!result.success) {
        logger.warn({
            event: 'supervisorFlow.payload_invalid',
            issues: result.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
        });
        return { valid: false, issues: result.error.issues };
    }
    return { valid: true, data: result.data };
}
