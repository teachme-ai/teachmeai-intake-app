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
            // Exit Criteria First
            'role_category', 'goal_calibrated',
            // Context (Optional)
            'industry_vertical', 'industry', 'seniority', 'benefits', 'application_context'
        ],
        introMessage: "I'm the Strategist. Let's align this with your career goals.",
        shouldExit: (state) => {
            // MUST have role_category (which indicates we deep-dived beyond raw role)
            const hasRoleCategory = isFieldFilled(state, 'role_category');
            const hasGoal = isFieldFilled(state, 'goal_calibrated') || isFieldFilled(state, 'goal_raw');

            // Force at least 2 user turns for Strategist (Turn 1 is user msg, Turn 2 is confirmation/deepening)
            const minTurnsMet = (state.activeAgent === 'strategist' && state.turnCount >= 2);

            return hasRoleCategory && hasGoal && minTurnsMet;
        }
    },

    // New: Consolidated learner dimensions agent
    learner_dimensions: {
        id: 'learner_dimensions',
        name: 'Learning Profile Analyst',
        ownedFields: [
            // Critical Exit Fields First (Fast Pass)
            'skill_stage', 'learner_type', 'motivation_type', 'srl_goal_setting',

            // Secondary Context (Optional / Deepening)
            'srl_adaptability', 'srl_reflection',
            'vision_clarity', 'success_clarity_1yr',
            'vark_primary', 'vark_ranked',
            'tech_confidence', 'resilience',
            'time_barrier'
        ],
        introMessage: "I'm the Learning Profile Analyst. I'll help understand your learning style.",
        shouldExit: (state) => {
            // Require 4 key fields: skill, learning style, SRL, motivation
            const hasSkill = isFieldFilled(state, 'skill_stage');
            const hasLearner = isFieldFilled(state, 'learner_type');
            const hasSRL = isFieldFilled(state, 'srl_goal_setting');
            const hasMotivation = isFieldFilled(state, 'motivation_type');

            // Force at least 1-2 turns session-wide by the time we hit here
            const minTurnsMet = (state.turnCount >= 4);

            return hasSkill && hasLearner && hasSRL && hasMotivation && minTurnsMet;
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
            const hasLearner = isFieldFilled(state, 'learner_type');
            return hasSkill && hasLearner;
        }
    },

    tactician: {
        id: 'tactician',
        name: 'Tactician (Agile Coach)',
        ownedFields: ['time_per_week_mins', 'constraints', 'current_tools', 'frustrations'],
        introMessage: "Finally, I'm the Tactician. Let's make this actionable.",
        shouldExit: (state) => {
            // Require 2 fields: time and constraints
            const hasTime = isFieldFilled(state, 'time_per_week_mins');
            const hasConstraint = isFieldFilled(state, 'constraints') || isFieldFilled(state, 'frustrations');

            return hasTime && hasConstraint;
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

