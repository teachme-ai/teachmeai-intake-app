import { IntakeState, IntakeData, IntakeField, IntakeSchemaV1 } from './schema';

export const INITIAL_REQUIRED_FIELDS: Array<keyof IntakeData> = [
    'time_per_week_mins',
    // 'role_raw' and 'goal_raw' are required but prefilled.
    // We check their validty/specificity instead of just presence.
];

export const MAX_TURNS = 15;

/**
 * Initializes a new Intake Session State from prefilled data (JWT)
 */
export function initializeState(
    sessionId: string,
    prefill: { name?: string, email?: string, role?: string, goal?: string }
): IntakeState {
    const fields: IntakeState['fields'] = {};
    const now = new Date().toISOString();

    // 1. Process Prefills
    if (prefill.name) {
        fields.name = { value: prefill.name, status: 'confirmed', confidence: 'high', evidence: 'prefill', updatedAt: now };
    }
    if (prefill.email) {
        fields.email = { value: prefill.email, status: 'confirmed', confidence: 'high', evidence: 'prefill', updatedAt: now };
    }
    if (prefill.role) {
        // Role from quiz is confirmed (not candidate) - strategist will deepen, not re-ask
        fields.role_raw = { value: prefill.role, status: 'confirmed', confidence: 'high', evidence: 'prefill.quiz', updatedAt: now };
    }
    if (prefill.goal) {
        // Goal from quiz is confirmed - strategist calibrates without re-asking
        fields.goal_raw = { value: prefill.goal, status: 'confirmed', confidence: 'high', evidence: 'prefill.quiz', updatedAt: now };
    }

    // 2. Identify Missing Fields
    // We start with the core required ones. 
    // The Engine will dynamically add multipliers to this list as conversation progresses.
    const missingFields = [...INITIAL_REQUIRED_FIELDS];

    // 3. Construct Start State
    return {
        sessionId,
        fields,
        turnCount: 0,
        isComplete: false,
        nextAction: 'clarify', // First action is usually to clarify/calibrate the prefilled role/goal
        missingFields,
        completionPercent: 0,
        activeAgent: 'guide',
        metadata: {
            startTime: now,
            lastUpdated: now,
            source: 'jwt_handoff',
            mode: 'interview'
        }
    };
}

/**
 * Heuristic to calculate completion percentage
 */
export function calculateCompletion(state: IntakeState): number {
    const weights: Record<string, { fields: Array<keyof IntakeData>, weight: number }> = {
        guide: { fields: ['name', 'email', 'current_tools'], weight: 0.20 },
        strategist: { fields: ['role_raw', 'role_category', 'goal_raw', 'goal_calibrated'], weight: 0.25 },
        profiler: { fields: ['skill_stage', 'learner_type', 'motivation_type', 'srl_goal_setting', 'digital_skills', 'tech_savviness'], weight: 0.35 },
        tactician: { fields: ['time_per_week_mins', 'constraints', 'frustrations'], weight: 0.20 }
    };

    let totalWeight = 0;
    for (const [, group] of Object.entries(weights)) {
        const filled = group.fields.filter(f => isFieldFilled(state, f)).length;
        const ratio = filled / group.fields.length;
        totalWeight += ratio * group.weight;
    }

    return Math.min(Math.round(totalWeight * 100), 99); // Cap at 99 — only 100% when isComplete
}

/**
 * Determines if we have enough info to trigger the report
 */
export function isIntakeComplete(state: IntakeState): boolean {
    const hasRole = isFieldFilled(state, 'role_raw') || isFieldFilled(state, 'role_category');
    const hasGoal = isFieldFilled(state, 'goal_raw') || isFieldFilled(state, 'goal_calibrated');
    const hasSkill = isFieldFilled(state, 'skill_stage');
    const hasLearner = isFieldFilled(state, 'learner_type') || isFieldFilled(state, 'vark_primary');
    const hasTime = isFieldFilled(state, 'time_per_week_mins') || isFieldFilled(state, 'time_barrier');
    const hasConstraint = isFieldFilled(state, 'constraints') || isFieldFilled(state, 'frustrations');

    // Total turns safeguard
    const hasMinTurns = state.turnCount >= 4;

    // Graceful exit if they've chatted for 8+ turns and have at least role, goal, and skill
    const gracefulExit = state.turnCount >= 8 && hasRole && hasGoal && hasSkill;

    return (hasRole && hasGoal && hasSkill && hasLearner && hasTime && hasConstraint && hasMinTurns) || gracefulExit;
}

export function isFieldFilled(state: IntakeState, field: keyof IntakeData): boolean {
    const f = state.fields[field];
    return f !== undefined && f.value !== undefined && f.value !== null && f.value !== '';
}
