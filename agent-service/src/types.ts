import { z } from 'zod';

export const IntakeResponseSchema = z.object({
    currentRoles: z.array(z.string()),
    goalSettingConfidence: z.number(),
    newApproachesFrequency: z.number(),
    reflectionFrequency: z.number(),
    aiToolsConfidence: z.number(),
    resilienceLevel: z.number(),
    clearCareerVision: z.number(),
    successDescription: z.number(),
    learningForChallenge: z.number(),
    outcomeDrivenLearning: z.number(),
    timeBarrier: z.number(),
    currentFrustrations: z.string(),
    learnerType: z.enum(['theorist', 'activist', 'reflector', 'pragmatist']),
    varkPreferences: z.object({
        visual: z.number(),
        audio: z.number(),
        readingWriting: z.number(),
        kinesthetic: z.number(),
    }),
    skillStage: z.number(),
    concreteBenefits: z.string(),
    shortTermApplication: z.string(),
});

export const LearnerProfileSchema = z.object({
    psychologicalProfile: z.object({
        srlLevel: z.enum(['Low', 'Moderate', 'High']),
        motivationType: z.enum(['Intrinsic', 'Extrinsic', 'Mixed']),
        psyCap: z.string().describe("Short summary of hope/resilience/efficacy/optimism"),
    }),
    learningPreferences: z.object({
        primaryStyle: z.string(),
        secondaryStyle: z.string().optional(),
        adaptationStrategy: z.string().describe("How they should adapt their learning based on profile"),
    }),
    focusAreas: z.array(z.string()).describe("Top 3 areas to focus on based on intake"),
});

export const StrategySchema = z.object({
    identify: z.string().describe("Impact Phase 1: Identify"),
    motivate: z.string().describe("Impact Phase 2: Motivate"),
    plan: z.string().describe("Impact Phase 3: Plan"),
    priorities: z.array(z.string()).describe("Strategic priorities"),
    recommendedWorkflows: z.array(z.object({
        name: z.string(),
        description: z.string(),
        tools: z.array(z.string())
    })),
});

export const TacticsSchema = z.object({
    act: z.string().describe("Impact Phase 4: Act"),
    check: z.string().describe("Impact Phase 5: Check"),
    transform: z.string().describe("Impact Phase 6: Transform"),
    weeklyPlan: z.array(z.object({
        day: z.string(),
        activity: z.string(),
        duration: z.string()
    })),
    nextSteps: z.array(z.string()),
    recommendations: z.array(z.string())
});

export type IntakeResponse = z.infer<typeof IntakeResponseSchema>;
export type LearnerProfile = z.infer<typeof LearnerProfileSchema>;
export type Strategy = z.infer<typeof StrategySchema>;
export type Tactics = z.infer<typeof TacticsSchema>;
