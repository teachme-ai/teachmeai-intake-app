
import { IntakeState, IntakeData, IntakeField, IntakeSchemaV1 } from './schema';
import { z } from 'zod';

export type GuardOutcome = {
    handled: boolean;
    value?: any;
    action: 'accept_raw' | 'force_skip' | 'default_value' | 'switch_to_mcq' | 'continue' | 'discard';
};

/**
 * Coerces and validates a value before setting it in state.
 * Returns true if the value was set (confirmed or candidate), false if discarded.
 */
export function coerceAndSetField(
    state: IntakeState,
    field: keyof IntakeData,
    rawValue: any,
    evidence: string
): boolean {
    let finalValue = rawValue;
    let status: 'confirmed' | 'candidate' = 'candidate';

    // 1. SCALES (1-5)
    // Fields: skill_stage, time_barrier, srl_*, vision_clarity, etc.
    const scaleFields = [
        'skill_stage', 'time_barrier',
        'srl_goal_setting', 'srl_adaptability', 'srl_reflection', 'tech_confidence', 'resilience',
        'vision_clarity', 'success_clarity_1yr'
    ];

    if (scaleFields.includes(field)) {
        if (typeof rawValue === 'string') {
            // Map words to numbers
            const lower = rawValue.toLowerCase();
            if (lower.includes('expert') || lower.includes('advanced') || lower.includes('high') || lower.includes('pro')) finalValue = 5;
            else if (lower.includes('beginner') || lower.includes('new') || lower.includes('low') || lower.includes('novice')) finalValue = 1;
            else if (lower.includes('intermediate') || lower.includes('avg') || lower.includes('medium')) finalValue = 3;
            else {
                // Try parse
                const num = parseInt(rawValue);
                if (!isNaN(num)) finalValue = num;
            }
        }

        // Clamp
        if (typeof finalValue === 'number') {
            finalValue = Math.max(1, Math.min(5, finalValue));
            status = 'confirmed'; // Numeric scales are strict, if we got a number, its confirmed
        } else {
            // Invalid for scale
            console.debug(`[Guard] Discarding invalid scale value for ${field}: ${rawValue}`);
            return false;
        }
    }

    // 2. ENUMS
    // Fields: role_category, industry_vertical, learner_type, motivation_type
    if (field === 'role_category' || field === 'industry_vertical' || field === 'learner_type' || field === 'motivation_type') {
        // Simple Zod check or Keyword check can go here if needed.
        // For now we trust the extractor but could add strict validation if desired.
        status = 'confirmed';
    }

    // 3. TIME (Mins)
    if (field === 'time_per_week_mins') {
        if (typeof rawValue === 'string') {
            // Basic parsing (e.g. "2 hours" -> 120)
            const lower = rawValue.toLowerCase();
            let mins = 0;
            if (lower.includes('hour') || lower.includes('hr')) {
                const parts = lower.match(/(\d+)/);
                if (parts) mins = parseInt(parts[0]) * 60;
            } else if (lower.includes('min')) {
                const parts = lower.match(/(\d+)/);
                if (parts) mins = parseInt(parts[0]);
            }

            if (mins > 0) finalValue = mins;
            else {
                // Try straight number
                const num = parseInt(rawValue);
                if (!isNaN(num)) finalValue = num;
            }
        }

        if (typeof finalValue === 'number') {
            status = 'confirmed';
        } else {
            return false;
        }
    }

    // 4. ARRAYS
    if (field === 'constraints' || field === 'current_tools' || field === 'vark_ranked') {
        if (typeof rawValue === 'string') {
            finalValue = rawValue.split(/,|and/).map(s => s.trim()).filter(s => s.length > 0);
        }
        if (!Array.isArray(finalValue)) return false;
        status = 'confirmed';
    }

    // 5. FREE TEXT (Default)
    // role_raw, goal_raw, frustrations, benefits
    // Keep as candidate unless it's a prefill or very clear

    // SAVE TO STATE
    state.fields[field] = {
        value: finalValue,
        status: status,
        confidence: status === 'confirmed' ? 'high' : 'medium',
        evidence,
        updatedAt: new Date().toISOString()
    };

    return true;
}

/**
 * Decides what to do when a user fails to answer a field correctly multiple times.
 * UPDATED: Accept answer on first repeat, don't ask again
 */
export function applyRepetitionFallback(
    state: IntakeState,
    field: keyof IntakeData,
    userMessage: string,
    count: number
): GuardOutcome {
    // 1st Repeat (count=1): Accept whatever they said
    if (count === 1) {
        console.log(`[Guard] First repeat for ${field}, accepting raw answer: "${userMessage}"`);
        return { handled: true, value: userMessage.trim(), action: 'accept_raw' };
    }

    // 2nd Repeat (count=2): Should never happen, but force skip
    if (count >= 2) {
        console.log(`[Guard] Second repeat for ${field}, force skipping`);
        return { handled: true, value: userMessage.trim() || 'Not provided', action: 'accept_raw' };
    }

    return { handled: false, action: 'continue' };
}
