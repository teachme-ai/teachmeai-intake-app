import { IntakeResponseSchema } from '../types';
import { profilerFlow } from './profiler';
import { strategistFlow } from './strategist';
import { tacticianFlow } from './tactician';
import { z } from 'zod';
import { ai } from '../genkit';

export const IMPACTAnalysisSchema = z.object({
    Identify: z.string(),
    Motivate: z.string(),
    Plan: z.string(),
    Act: z.string(),
    Check: z.string(),
    Transform: z.string(),
    nextSteps: z.array(z.string()),
    learnerProfile: z.string(),
    recommendations: z.array(z.string()),
});

export const supervisorFlow = ai.defineFlow(
    {
        name: 'supervisorFlow',
        inputSchema: IntakeResponseSchema,
        outputSchema: IMPACTAnalysisSchema,
    },
    async (intake) => {
        // Phase 1: Profiling
        const profile = await profilerFlow(intake);

        // Phase 2: Strategy
        const strategy = await strategistFlow({
            profile,
            professionalRoles: intake.currentRoles,
            careerVision: "Implicit based on intake"
        });

        // Phase 3: Tactics
        const tactics = await tacticianFlow({
            strategy,
            constraints: {
                timeBarrier: intake.timeBarrier,
                skillStage: intake.skillStage
            }
        });

        // Phase 4: Assembly
        return {
            Identify: strategy.identify,
            Motivate: strategy.motivate,
            Plan: strategy.plan,
            Act: tactics.act,
            Check: tactics.check,
            Transform: tactics.transform,
            nextSteps: tactics.nextSteps,
            learnerProfile: JSON.stringify(profile.psychologicalProfile),
            recommendations: tactics.recommendations
        };
    }
);
