import { LearnerDossierSchema, DeepResearchOutputSchema, PsychographicProfileSchema, LearnerDossier } from '../types';
import { deepResearchFlow } from './deep-research';
import { strategistFlow } from './strategist';
import { tacticianFlow } from './tactician';
import { z } from 'zod';
import { ai } from '../genkit';
import { withLLMResilience } from '../utils/llm-resilience';
import { logger } from '../utils/logger';

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
    studyRules: z.array(z.object({
        rule: z.string(),
        label: z.string()
    })),
    research: DeepResearchOutputSchema,
    validationNotes: z.array(z.string()).optional(),
    personalizedSummary: z.string().optional(),
});

export const supervisorFlow = ai.defineFlow(
    {
        name: 'supervisorFlow',
        inputSchema: LearnerDossierSchema,
        outputSchema: IMPACTAnalysisSchema,
    },
    async (dossier: LearnerDossier) => {
        const log = logger.child({ sessionId: dossier.sessionId });

        // Phase 1: Profile — ALREADY DERIVED (rule-based, no LLM)
        const profile = dossier.psychographicProfile!;
        console.log(`  ├─ ✅ Phase 1/6: Profile derived (rule-based, 0ms)`);
        log.info({ event: 'supervisor.phase1', msg: 'Profile (rule-based) already derived' });

        // Phase 2: Deep Research
        console.log(`  ├─ ⭐ Phase 2/6: Deep Research starting...`);
        log.info({ event: 'supervisor.phase2', msg: 'Starting Deep Research...' });
        const research = await withLLMResilience(() => deepResearchFlow({
            role: dossier.identity.roleCategory || dossier.identity.roleRaw || "Professional",
            goal: dossier.identity.primaryGoal || "Upskilling",
            industry: dossier.identity.industryVertical || dossier.identity.industry || "General",
            skillStage: dossier.readiness.skillStage,
            learnerType: dossier.preferences.learnerType,
            digital_skills: dossier.readiness.digitalSkills,
            tech_savviness: dossier.readiness.techSavviness,
            seniority: dossier.identity.seniority,
            application_context: dossier.context.applicationContext,
            current_tools: dossier.constraints.currentTools,
            profile: profile,
            varkPrimary: dossier.preferences.varkPrimary,
            motivationType: dossier.motivation.type
        }), { component: 'DeepResearch', sessionId: dossier.sessionId });
        console.log(`  ├─ ✅ Phase 2/6: Deep Research complete`);

        // Phase 3: Strategy
        console.log(`  ├─ ⭐ Phase 3/6: Strategist starting...`);
        log.info({ event: 'supervisor.phase3', msg: 'Starting Strategy...' });
        const strategy = await withLLMResilience(() => strategistFlow({
            profile,
            professionalRoles: [dossier.identity.roleCategory || dossier.identity.roleRaw || 'Professional'],
            careerVision: "Implicit based on intake",
            primaryGoal: dossier.identity.primaryGoal,
            deepResearchResult: research,
            digital_skills: dossier.readiness.digitalSkills,
            tech_savviness: dossier.readiness.techSavviness,
            time_per_week_mins: dossier.constraints.timePerWeekMins,
            seniority: dossier.identity.seniority,
            application_context: dossier.context.applicationContext,
            current_tools: dossier.constraints.currentTools,
            srl_level: dossier.srl.goalSetting,
            motivation_type: dossier.motivation.type,
            frustrations: dossier.constraints.frustrations,
            benefits: dossier.context.benefits,
        }), { component: 'Strategist', sessionId: dossier.sessionId });
        console.log(`  ├─ ✅ Phase 3/6: Strategist complete`);

        // Phase 4: Tactics
        console.log(`  ├─ ⭐ Phase 4/6: Tactician starting...`);
        log.info({ event: 'supervisor.phase4', msg: 'Starting Tactics...' });
        const tactics = await withLLMResilience(() => tacticianFlow({
            strategy,
            name: dossier.identity.name,
            constraints: {
                timeBarrier: dossier.constraints.timeBarrier || 3,
                skillStage: dossier.readiness.skillStage || 3,
                digital_skills: dossier.readiness.digitalSkills,
                tech_savviness: dossier.readiness.techSavviness
            },
            learnerType: dossier.preferences.learnerType,
            constraintsList: dossier.constraints.blockers,
            currentTools: dossier.constraints.currentTools,
            timePerWeekMins: dossier.constraints.timePerWeekMins,
            frustrations: dossier.constraints.frustrations,
            varkPrimary: dossier.preferences.varkPrimary,
            motivationType: dossier.motivation.type,
        }), { component: 'Tactician', sessionId: dossier.sessionId });
        console.log(`  ├─ ✅ Phase 4/6: Tactician complete`);

        // Phase 5 & 6: Validation & Personalization (Parallel)
        console.log(`  ├─ ⭐ Phase 5+6/6: Validator & Personalizer starting (parallel)...`);
        log.info({ event: 'supervisor.phase5_6', msg: 'Starting Validation & Personalization in parallel...' });
        
        type ValidationResult = { isValid: boolean; validationNotes: string[]; corrections: any[] };
        type PersonalizationResult = { personalizedSummary: string };

        const [validationResult, personalizationResult]: [ValidationResult | null, PersonalizationResult | null] = await Promise.all([
            // Validation task
            (async () => {
                try {
                    const { validatorFlow } = await import('./validator');
                    const result = await withLLMResilience(() => validatorFlow(
                        {
                            act: tactics.act,
                            check: tactics.check,
                            transform: tactics.transform,
                            recommendations: tactics.recommendations,
                            studyRules: tactics.studyRules,
                            digitalSkills: dossier.readiness.digitalSkills,
                            techSavviness: dossier.readiness.techSavviness,
                            timePerWeekMins: dossier.constraints.timePerWeekMins,
                            skillStage: dossier.readiness.skillStage,
                            learnerType: dossier.preferences.learnerType,
                            currentTools: dossier.constraints.currentTools,
                            blockers: dossier.constraints.blockers,
                        }
                    ), { component: 'Validator', sessionId: dossier.sessionId });
                    return result as ValidationResult;
                } catch (e) {
                    log.warn({ event: 'supervisor.validator.skip', error: String(e) });
                    return null;
                }
            })(),
            // Personalization task
            (async () => {
                try {
                    const { personalizerFlow } = await import('./personalizer');
                    const result = await withLLMResilience(() => personalizerFlow(
                        {
                            Identify: strategy.identify,
                            Motivate: strategy.motivate,
                            Plan: strategy.plan,
                            Act: tactics.act,
                            Check: tactics.check,
                            Transform: tactics.transform,
                            name: dossier.identity.name,
                            roleCategory: dossier.identity.roleCategory,
                            frustrations: dossier.constraints.frustrations,
                            benefits: dossier.context.benefits,
                            decisionStyle: profile.decisionStyle,
                            learnerType: dossier.preferences.learnerType,
                            currentTools: dossier.constraints.currentTools,
                        }
                    ), { component: 'Personalizer', sessionId: dossier.sessionId });
                    return result as PersonalizationResult;
                } catch (e) {
                    log.warn({ event: 'supervisor.personalizer.skip', error: String(e) });
                    return null;
                }
            })()
        ]);

        const validationNotes = validationResult?.validationNotes || [];
        const personalizedSummary = personalizationResult?.personalizedSummary || '';

        if (validationResult && !validationResult.isValid) {
            log.warn({ event: 'supervisor.validation_issues', corrections: validationResult.corrections });
        }

        // Phase 7: Assembly
        console.log(`  └─ ✅ Phase 7/7: Assembly complete — returning IMPACT analysis`);
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
            studyRules: tactics.studyRules || [],
            research,
            validationNotes,
            personalizedSummary,
        };
    }
);
