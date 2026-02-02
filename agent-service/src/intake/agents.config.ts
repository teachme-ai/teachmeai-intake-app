import { IntakeData, IntakeState } from './schema';
import { isFieldFilled } from './state';
import { GUIDE_SYSTEM_PROMPT } from '../prompts/guide.system';

// We import these dynamically or define usage in composer, 
// but for config we just need identifiers.

export type AgentId = 'guide' | 'profiler' | 'strategist' | 'learner_dimensions' | 'tactician';

export interface AgentConfig {
    id: AgentId;
    name: string;
    ownedFields: Array<keyof IntakeData>;
    introMessage?: string;
    shouldExit: (state: IntakeState) => boolean;
}

/**
 * 5 Learner Dimensions (for learner_dimensions agent):
 * 1. SRL (Self-Regulated Learning): goal setting, adaptability, reflection
 * 2. Motivation: intrinsic/outcome, vision clarity
 * 3. Preferences: VARK, learner type
 * 4. Readiness: tech confidence, resilience, skill stage
 * 5. Constraints: time barrier, constraints, frustrations
 */

export const AGENT_FLOW: AgentId[] = ['guide', 'strategist', 'learner_dimensions', 'tactician'];

export const AGENTS: Record<AgentId, AgentConfig> = {
    guide: {
        id: 'guide',
        name: 'TeachMeAI Guide',
        ownedFields: ['name', 'email'],
        introMessage: "Hi, I'm the intake guide. Let's get you set up.",
        shouldExit: (state) => {
            return isFieldFilled(state, 'email');
        }
    },

    // Moved before learner_dimensions to deepen role/goal first
    strategist: {
        id: 'strategist',
        name: 'Career Strategist',
        ownedFields: [
            'industry_vertical', 'industry', 'role_category', 'seniority',
            'goal_calibrated', 'benefits', 'application_context'
        ],
        introMessage: "I'm the Strategist. Let's align this with your career goals.",
        shouldExit: (state) => {
            // Exit after collecting 2-3 strategic fields
            const hasRole = isFieldFilled(state, 'role_category');
            const hasGoal = isFieldFilled(state, 'goal_calibrated');
            return hasRole && hasGoal;
        }
    },

    // New: Consolidated learner dimensions agent
    learner_dimensions: {
        id: 'learner_dimensions',
        name: 'Learning Profile Analyst',
        ownedFields: [
            // Dimension 1: SRL (Self-Regulated Learning)
            'srl_goal_setting', 'srl_adaptability', 'srl_reflection',
            // Dimension 2: Motivation
            'motivation_type', 'vision_clarity', 'success_clarity_1yr',
            // Dimension 3: Learning Preferences
            'learner_type', 'vark_primary', 'vark_ranked',
            // Dimension 4: Readiness / Confidence
            'skill_stage', 'tech_confidence', 'resilience',
            // Dimension 5: Time Barrier (partial, rest handled by tactician)
            'time_barrier'
        ],
        introMessage: "I'm the Learning Profile Analyst. I'll help understand your learning style.",
        shouldExit: (state) => {
            // Exit after collecting 3-4 learner dimension fields
            const hasSkill = isFieldFilled(state, 'skill_stage');
            const hasLearner = isFieldFilled(state, 'learner_type') || isFieldFilled(state, 'vark_primary');
            const hasSRL = isFieldFilled(state, 'srl_goal_setting') || isFieldFilled(state, 'srl_adaptability');
            return hasSkill && hasLearner && hasSRL;
        }
    },

    // Legacy profiler - redirects to learner_dimensions
    profiler: {
        id: 'profiler',
        name: 'Profiler (Legacy)',
        ownedFields: ['skill_stage', 'time_barrier', 'learner_type', 'vark_primary'],
        introMessage: "Nice to meet you. I'm the Profiler.",
        shouldExit: (state) => {
            const hasSkill = isFieldFilled(state, 'skill_stage');
            const hasLearner = isFieldFilled(state, 'learner_type') || isFieldFilled(state, 'vark_primary');
            return hasSkill && hasLearner;
        }
    },

    tactician: {
        id: 'tactician',
        name: 'Tactician (Agile Coach)',
        ownedFields: ['time_per_week_mins', 'constraints', 'current_tools', 'frustrations'],
        introMessage: "Finally, I'm the Tactician. Let's make this actionable.",
        shouldExit: (state) => {
            // Exit after collecting time commitment
            return isFieldFilled(state, 'time_per_week_mins');
        }
    }
};

/**
 * 5 Learner Dimensions Schema
 * Used for reporting and structured output
 */
export const LEARNER_DIMENSIONS = {
    srl: {
        name: 'Self-Regulated Learning',
        fields: ['srl_goal_setting', 'srl_adaptability', 'srl_reflection'] as const,
        description: 'Ability to set goals, adapt strategies, and reflect on learning'
    },
    motivation: {
        name: 'Motivation Profile',
        fields: ['motivation_type', 'vision_clarity', 'success_clarity_1yr'] as const,
        description: 'What drives learning - intrinsic curiosity vs outcome focus'
    },
    preferences: {
        name: 'Learning Preferences',
        fields: ['learner_type', 'vark_primary', 'vark_ranked'] as const,
        description: 'How the learner prefers to consume and process information'
    },
    readiness: {
        name: 'Readiness & Confidence',
        fields: ['skill_stage', 'tech_confidence', 'resilience'] as const,
        description: 'Current skill level and confidence in learning new tech'
    },
    constraints: {
        name: 'Environment & Constraints',
        fields: ['time_barrier', 'constraints', 'frustrations', 'current_tools'] as const,
        description: 'External factors limiting learning capacity'
    }
} as const;

