import { IntakeResponseSchema, DeepResearchOutputSchema, PsychographicProfileSchema } from '../types';
import { deepResearchFlow } from './deep-research';
import { profilingAgentFlow } from './profiler';
import { strategistFlow } from './strategist';
import { tacticianFlow } from './tactician';
import { z } from 'zod';
import { ai } from '../genkit';
import { runWithRetry, delay } from '../utils/retry';

export const IMPACTAnalysisSchema = z.object({
    Identify: z.string(),
    Motivate: z.string(),
    Plan: z.string(),
    Act: z.string(),
    Check: z.string(),
    Transform: z.string(),
    nextSteps: z.array(z.string()),
    learnerProfile: PsychographicProfileSchema,
    recommendations: z.array(z.string()),
    research: DeepResearchOutputSchema
});

export const supervisorFlow = ai.defineFlow(
    {
        name: 'supervisorFlow',
        inputSchema: IntakeResponseSchema,
        outputSchema: IMPACTAnalysisSchema,
    },
    async (intake) => {
        // Phase 1: Profiling
        console.log("🕵️ [Supervisor] Phase 1: Profiling...");
        const profile = await runWithRetry(() => profilingAgentFlow(intake));

        await delay(1000); // Stagger

        // Phase 2: Deep Research
        console.log("🔍 [Supervisor] Phase 2: Deep Research...");
        const research = await runWithRetry(() => deepResearchFlow({
            role: intake.currentRoles[0] || "Professional",
            goal: intake.primaryGoal || "Upskilling",
            // Industry is effectively optional (defaults to General if missing)
            industry: intake.industry_vertical || "General",
            skillStage: intake.skillStage,
            learnerType: intake.learnerType,
            digital_skills: intake.digital_skills,
            tech_savviness: intake.tech_savviness,
            seniority: intake.seniority,
            application_context: intake.application_context,
            current_tools: intake.current_tools
        }));

        await delay(1000); // Stagger

        // Phase 3: Strategy
        console.log("🎯 [Supervisor] Phase 3: Strategy...");
        const strategy = await runWithRetry(() => strategistFlow({
            profile,
            professionalRoles: intake.currentRoles,
            careerVision: "Implicit based on intake",
            primaryGoal: intake.primaryGoal,
            deepResearchResult: research,
            digital_skills: intake.digital_skills,
            tech_savviness: intake.tech_savviness,
            time_per_week_mins: intake.time_per_week_mins,
            seniority: intake.seniority,
            application_context: intake.application_context
        }));

        await delay(1000); // Stagger

        // Phase 4: Tactics
        console.log("🛠️ [Supervisor] Phase 4: Tactics...");
        const tactics = await runWithRetry(() => tacticianFlow({
            strategy,
            name: intake.name,
            constraints: {
                timeBarrier: intake.timeBarrier,
                skillStage: intake.skillStage,
                digital_skills: intake.digital_skills,
                tech_savviness: intake.tech_savviness
            },
            learnerType: intake.learnerType,
            constraintsList: intake.constraints,
            currentTools: intake.current_tools,
            timePerWeekMins: intake.time_per_week_mins
        }));

        // Phase 5: Assembly
        return {
            Identify: strategy.identify,
            Motivate: strategy.motivate,
            Plan: strategy.plan,
            Act: tactics.act,
            Check: tactics.check,
            Transform: tactics.transform,
            nextSteps: tactics.nextSteps,
            learnerProfile: profile,
            recommendations: tactics.recommendations,
            research: research
        };
    }
);
