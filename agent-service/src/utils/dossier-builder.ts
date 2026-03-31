/**
 * Builds a rich LearnerDossier from the IntakeState.
 * Preserves ALL 30+ fields in their dimensional structure,
 * replacing the lossy flat mapping previously in index.ts.
 */
import { IntakeState, IntakeData } from '../intake/schema';
import { LearnerDossier } from '../types';
import { deriveProfile } from './profile-deriver';

function val(state: IntakeState, field: keyof IntakeData): any {
    return state.fields[field]?.value;
}

function numVal(state: IntakeState, field: keyof IntakeData, fallback?: number): number | undefined {
    const v = val(state, field);
    if (v === undefined || v === null) return fallback;
    const parsed = Number(v);
    return isNaN(parsed) ? fallback : parsed;
}

function arrVal(state: IntakeState, field: keyof IntakeData): string[] {
    const v = val(state, field);
    if (Array.isArray(v)) return v;
    if (typeof v === 'string' && v.length > 0) return [v];
    return [];
}

export function buildLearnerDossier(state: IntakeState): LearnerDossier {
    const dossier: LearnerDossier = {
        identity: {
            name: val(state, 'name'),
            email: val(state, 'email'),
            roleRaw: val(state, 'role_raw'),
            roleCategory: val(state, 'role_category'),
            industryVertical: val(state, 'industry_vertical'),
            industry: val(state, 'industry'),
            seniority: val(state, 'seniority'),
            goalRaw: val(state, 'goal_raw'),
            goalCalibrated: val(state, 'goal_calibrated'),
            primaryGoal: val(state, 'goal_calibrated') || val(state, 'goal_raw'),
        },
        srl: {
            goalSetting: numVal(state, 'srl_goal_setting'),
            adaptability: numVal(state, 'srl_adaptability'),
            reflection: numVal(state, 'srl_reflection'),
        },
        motivation: {
            type: (() => {
                const v = String(val(state, 'motivation_type') || '').toLowerCase();
                const valid = ['intrinsic', 'outcome', 'hybrid'];
                return valid.includes(v) ? (v as any) : undefined;
            })(),
            visionClarity: numVal(state, 'vision_clarity'),
            successClarity1yr: numVal(state, 'success_clarity_1yr'),
        },
        preferences: {
            learnerType: (() => {
                const v = String(val(state, 'learner_type') || '').toLowerCase();
                const valid = ['theorist', 'activist', 'reflector', 'pragmatist'];
                return valid.includes(v) ? (v as any) : undefined;
            })(),
            varkPrimary: (() => {
                const v = String(val(state, 'vark_primary') || '').toLowerCase().replace('reading writing', 'read_write').replace('read/write', 'read_write');
                const valid = ['visual', 'audio', 'read_write', 'kinesthetic'];
                return valid.includes(v) ? (v as any) : undefined;
            })(),
            varkRanked: arrVal(state, 'vark_ranked'),
        },
        readiness: {
            skillStage: numVal(state, 'skill_stage'),
            techConfidence: numVal(state, 'tech_confidence'),
            resilience: numVal(state, 'resilience'),
            digitalSkills: numVal(state, 'digital_skills'),
            techSavviness: numVal(state, 'tech_savviness'),
        },
        constraints: {
            timeBarrier: numVal(state, 'time_barrier'),
            timePerWeekMins: numVal(state, 'time_per_week_mins'),
            blockers: arrVal(state, 'constraints'),
            frustrations: val(state, 'frustrations'),
            currentTools: arrVal(state, 'current_tools'),
        },
        context: {
            applicationContext: val(state, 'application_context'),
            benefits: val(state, 'benefits'),
            shortTermApplication: val(state, 'application_context'),
        },
        sessionId: state.sessionId,
        turnCount: state.turnCount,
        interviewCompletedAt: new Date().toISOString(),
    };

    // Derive psychographic profile (rule-based, NO LLM call)
    dossier.psychographicProfile = deriveProfile(dossier);

    return dossier;
}

/**
 * Builds a LearnerDossier from a raw IntakeResponse (Old Bridge API format).
 */
export function buildLearnerDossierFromIntakeResponse(data: any): LearnerDossier {
    const dossier: LearnerDossier = {
        identity: {
            name: data.name || '',
            email: data.email || '',
            roleRaw: (data.currentRoles || [])[0] || '',
            roleCategory: data.roleCategory || '',
            primaryGoal: data.primaryGoal || '',
            goalRaw: data.primaryGoal || '',
        },
        srl: {
            goalSetting: data.goalSettingConfidence || 3,
            reflection: data.reflectionFrequency || 3,
        },
        motivation: {
            type: data.outcomeDrivenLearning > 3 ? 'outcome' : 'intrinsic',
        },
        preferences: {
            learnerType: data.learnerType || 'reflector',
            varkPrimary: data.varkPreferences ? Object.keys(data.varkPreferences).reduce((a, b) => data.varkPreferences[a] > data.varkPreferences[b] ? a : b) as any : 'visual',
        },
        readiness: {
            skillStage: data.skillStage || 3,
            resilience: data.resilienceLevel || 3,
        },
        constraints: {
            timePerWeekMins: data.timePerWeekMins || 60,
            frustrations: data.currentFrustrations || '',
        },
        context: {
            benefits: data.concreteBenefits || '',
            shortTermApplication: data.shortTermApplication || '',
        },
        sessionId: data.sessionId || `legacy-${Date.now()}`,
        turnCount: 99,
        interviewCompletedAt: new Date().toISOString(),
    };

    dossier.psychographicProfile = deriveProfile(dossier);
    return dossier;
}
