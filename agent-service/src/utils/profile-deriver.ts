/**
 * Rule-Based Psychographic Profile Deriver
 * Replaces the LLM profiler with deterministic mapping.
 *
 * Output type matches `PsychographicProfileSchema` from types.ts exactly.
 *
 * Mapping rationale (educational psychology):
 * - Decision Style: SRL goal-setting + learner type patterns
 * - Uncertainty: resilience + adaptability
 * - Change Preference: adaptability scaled to 1-10 with type adjustment
 * - Social Entanglement: learner type + motivation tendencies
 * - Cognitive Load: skill stage + tech confidence
 */
import { LearnerDossier, PsychographicProfile } from '../types';

export function deriveProfile(dossier: LearnerDossier): PsychographicProfile {
    const goalSetting = dossier.srl.goalSetting ?? 3;
    const learnerType = dossier.preferences.learnerType;
    const resilience = dossier.readiness.resilience ?? 3;
    const adaptability = dossier.srl.adaptability ?? 3;
    const skillStage = dossier.readiness.skillStage ?? 3;
    const techConfidence = dossier.readiness.techConfidence ?? 3;
    const motivation = dossier.motivation.type;

    // Decision Style
    let decisionStyle: 'Intuitive' | 'Analytical' | 'Hybrid' = 'Hybrid';
    if (goalSetting >= 4 && (learnerType === 'theorist' || learnerType === 'reflector')) {
        decisionStyle = 'Analytical';
    } else if (goalSetting <= 2 && (learnerType === 'activist' || learnerType === 'pragmatist')) {
        decisionStyle = 'Intuitive';
    }

    // Uncertainty Handling
    let uncertaintyHandling: 'Paralyzed' | 'Checklist-Driven' | 'Experimenter' = 'Checklist-Driven';
    if (resilience <= 2 && adaptability <= 2) {
        uncertaintyHandling = 'Paralyzed';
    } else if (adaptability >= 4 && (learnerType === 'activist' || learnerType === 'pragmatist')) {
        uncertaintyHandling = 'Experimenter';
    }

    // Change Preference (1-10 scale)
    let changePreference = Math.round((adaptability / 5) * 10);
    if (learnerType === 'activist') changePreference = Math.min(10, changePreference + 1);
    if (learnerType === 'theorist') changePreference = Math.max(1, changePreference - 1);

    // Social Entanglement
    let socialEntanglement: 'Solitary' | 'Social' = 'Solitary';
    if (learnerType === 'activist' || motivation === 'intrinsic') {
        socialEntanglement = 'Social';
    }

    // Cognitive Load Tolerance
    let cognitiveLoadTolerance: 'Low' | 'Medium' | 'High' = 'Medium';
    if (skillStage <= 2 && techConfidence <= 2) {
        cognitiveLoadTolerance = 'Low';
    } else if (skillStage >= 4 && techConfidence >= 4) {
        cognitiveLoadTolerance = 'High';
    }

    const analysisReasoning = [
        `Decision: ${decisionStyle} (goal-setting=${goalSetting}, type=${learnerType || 'unknown'}).`,
        `Uncertainty: ${uncertaintyHandling} (resilience=${resilience}, adaptability=${adaptability}).`,
        `Change: ${changePreference}/10 (adaptability scaled + type adjustment).`,
        `Social: ${socialEntanglement} (type=${learnerType}, motivation=${motivation || 'unknown'}).`,
        `CogLoad: ${cognitiveLoadTolerance} (skill=${skillStage}, tech=${techConfidence}).`,
    ].join(' ');

    return {
        decisionStyle,
        uncertaintyHandling,
        changePreference,
        socialEntanglement,
        cognitiveLoadTolerance,
        analysisReasoning,
    };
}
