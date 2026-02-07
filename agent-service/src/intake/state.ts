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
    const coreFields: Array<keyof IntakeData> = ['name', 'email', 'role_raw', 'goal_raw', 'time_per_week_mins'];
    const confirmedCount = coreFields.filter(k => state.fields[k]?.status === 'confirmed').length;
    return Math.min(Math.round((confirmedCount / coreFields.length) * 100), 99);
}

/**
 * Determines if we have enough info to trigger the report
 */
export function isIntakeComplete(state: IntakeState): boolean {
    const hasRole = isFieldFilled(state, 'role_raw') || isFieldFilled(state, 'role_category');
    const hasGoal = isFieldFilled(state, 'goal_raw') || isFieldFilled(state, 'goal_calibrated');
    const hasSkill = isFieldFilled(state, 'skill_stage');
    const hasTime = isFieldFilled(state, 'time_per_week_mins');
    const hasConstraint = isFieldFilled(state, 'constraints') || isFieldFilled(state, 'frustrations');

    // Total turns safeguard
    const hasMinTurns = state.turnCount >= 4;

    return hasRole && hasGoal && hasSkill && hasTime && hasConstraint && hasMinTurns;
}

export function isFieldFilled(state: IntakeState, field: keyof IntakeData): boolean {
    const f = state.fields[field];
    return f !== undefined && f.value !== undefined && f.value !== null && f.value !== '';
}
