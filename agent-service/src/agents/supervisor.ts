import { IntakeResponseSchema, DeepResearchOutputSchema } from '../types';
import { deepResearchFlow } from './deep-research';
import { profilerFlow } from './profiler';
import { strategistFlow } from './strategist';
import { tacticianFlow } from './tactician';
import { z } from 'zod';
import { ai } from '../genkit';
import { runWithRetry, delay } from '../utils/retry';
import { logger } from '../utils/logger';

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
    research: DeepResearchOutputSchema
});

// Helper: Infer seniority from role text
function inferSeniority(role: string): string {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('junior') || roleLower.includes('entry')) return 'Junior';
    if (roleLower.includes('senior') || roleLower.includes('lead') || roleLower.includes('principal')) return 'Senior';
    if (roleLower.includes('head') || roleLower.includes('director') || roleLower.includes('vp') || roleLower.includes('chief')) return 'Leadership';
    return 'Mid-level';
}

export const supervisorFlow = ai.defineFlow(
    {
        name: 'supervisorFlow',
        inputSchema: IntakeResponseSchema,
        outputSchema: IMPACTAnalysisSchema,
    },
    async (intake) => {
        const startTime = Date.now();
        const supervisorLogger = logger.child({ flow: 'supervisor' });

        supervisorLogger.info({
            event: 'supervisor.start',
            intake_summary: {
                has_name: !!intake.name,
                has_roles: intake.currentRoles?.length > 0,
                has_goal: !!intake.primaryGoal,
            }
        });

        // Phase 1: Profiling
        supervisorLogger.info({ event: 'supervisor.phase_start', phase: 'profiling', phaseNumber: 1 });
        const profile = await runWithRetry(() => profilerFlow(intake));
        supervisorLogger.info({ event: 'supervisor.phase_complete', phase: 'profiling' });

        await delay(1000); // Stagger

        // Phase 2: Deep Research with enhanced context
        // Build industry with fallback chain
        const industry = intake.industry || intake.industry_vertical || "General";
        const seniority = intake.seniority || inferSeniority(intake.currentRoles[0] || "");

        // Track context usage metrics
        const contextMetrics = {
            industry_provided: !!intake.industry,
            industry_fallback: !intake.industry && !!intake.industry_vertical,
            industry_generic: !intake.industry && !intake.industry_vertical,
            seniority_provided: !!intake.seniority,
            seniority_inferred: !intake.seniority,
            skill_stage_provided: !!intake.skill_stage,
            context_provided: !!intake.application_context,
            tools_count: intake.current_tools?.length || 0,
        };

        supervisorLogger.info({
            event: 'supervisor.phase_start',
            phase: 'deep_research',
            phaseNumber: 2,
            context_usage: contextMetrics,
            inputs: {
                role: intake.currentRoles[0] || "Professional",
                goal: intake.primaryGoal || "Upskilling",
                industry: industry,
                seniority: seniority,
                has_context: !!intake.application_context,
                skill_stage: intake.skill_stage || null
            }
        });

        try {
            const research = await runWithRetry(() => deepResearchFlow({
                role: intake.currentRoles[0] || "Professional",
                goal: intake.primaryGoal || "Upskilling",
                industry: industry,
                seniority: seniority,
                application_context: intake.application_context,
                skill_stage: intake.skill_stage,
                current_tools: intake.current_tools,
            }));

            supervisorLogger.info({
                event: 'supervisor.phase_complete',
                phase: 'deep_research',
                output_summary: {
                    opportunities: research.aiOpportunityMap.length,
                    priorities: research.topPriorities.length,
                    has_capstone: !!research.recommendedCapstone
                }
            });

            await delay(1000); // Stagger

            // Phase 3: Strategy with enhanced context
            const strategyContextMetrics = {
                has_time_data: !!intake.time_per_week_mins,
                has_benefits: !!intake.concreteBenefits,  // Note: camelCase in schema
                has_frustrations: !!intake.currentFrustrations,  // Note: camelCase in schema
                has_app_context: !!intake.application_context,
                seniority_available: !!seniority,
            };

            supervisorLogger.info({
                event: 'supervisor.phase_start',
                phase: 'strategy',
                phaseNumber: 3,
                has_research: !!research,
                context_usage: strategyContextMetrics
            });

            const strategy = await runWithRetry(() => strategistFlow({
                profile,
                professionalRoles: intake.currentRoles,
                careerVision: "Implicit based on intake",
                primaryGoal: intake.primaryGoal,
                deepResearchResult: research,
                // NEW: Enhanced context fields
                application_context: intake.application_context,
                seniority: seniority,
                time_per_week_mins: intake.time_per_week_mins,
                benefits: intake.concreteBenefits,  // Map from IntakeResponseSchema
                frustrations: intake.currentFrustrations,  // Map from IntakeResponseSchema
            }));

            supervisorLogger.info({
                event: 'supervisor.phase_complete',
                phase: 'strategy',
                priorities_count: strategy.priorities?.length || 0,
                workflows_count: strategy.recommendedWorkflows?.length || 0
            });

            await delay(1000); // Stagger

            // Phase 4: Tactics with enhanced context
            const tacticianContextMetrics = {
                has_constraints_list: !!(intake.constraints?.length),
                has_current_tools: !!(intake.current_tools?.length),
                has_learner_type: !!intake.learnerType,
                has_time_allocation: !!intake.time_per_week_mins,
            };

            supervisorLogger.info({
                event: 'supervisor.phase_start',
                phase: 'tactics',
                phaseNumber: 4,
                context_usage: tacticianContextMetrics
            });

            const tactics = await runWithRetry(() => tacticianFlow({
                strategy,
                name: intake.name,
                constraints: {
                    timeBarrier: intake.timeBarrier,
                    skillStage: intake.skillStage,
                    // NEW: Enhanced constraints
                    constraintsList: intake.constraints,
                    currentTools: intake.current_tools,
                },
                // NEW: Enhanced context fields
                learnerType: intake.learnerType,
                timePerWeekMins: intake.time_per_week_mins,
            }));

            supervisorLogger.info({
                event: 'supervisor.phase_complete',
                phase: 'tactics',
                action_items: tactics.act?.length || 0,
                checkpoints: tactics.check?.length || 0
            });

            // Phase 5: Assembly
            const result = {
                Identify: strategy.identify,
                Motivate: strategy.motivate,
                Plan: strategy.plan,
                Act: tactics.act,
                Check: tactics.check,
                Transform: tactics.transform,
                nextSteps: tactics.nextSteps,
                learnerProfile: JSON.stringify(profile.psychologicalProfile),
                recommendations: tactics.recommendations,
                research: research
            };

            supervisorLogger.info({
                event: 'supervisor.complete',
                total_time_ms: Date.now() - startTime,
                phases_completed: 4
            });

            return result;
        } catch (error: any) {
            supervisorLogger.error({
                event: 'supervisor.phase_failed',
                phase: 'deep_research',
                error_message: error?.message || 'Unknown error',
                context_used: contextMetrics
            });
            throw error;
        }
    }
);
