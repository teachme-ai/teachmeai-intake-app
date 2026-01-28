import { IntakeData, IntakeState } from './schema';
import { isFieldFilled } from './state';
import { GUIDE_SYSTEM_PROMPT } from '../prompts/guide.system';

// We import these dynamically or define usage in composer, 
// but for config we just need identifiers.

export type AgentId = 'guide' | 'profiler' | 'strategist' | 'tactician';

export interface AgentConfig {
    id: AgentId;
    name: string;
    ownedFields: Array<keyof IntakeData>;
    introMessage?: string;
    shouldExit: (state: IntakeState) => boolean;
}

export const AGENT_FLOW: AgentId[] = ['guide', 'profiler', 'strategist', 'tactician'];

export const AGENTS: Record<AgentId, AgentConfig> = {
    guide: {
        id: 'guide',
        name: 'TeachMeAI Guide',
        ownedFields: ['name', 'email'], // V2: Removed role/goal to prevent loop
        introMessage: "Hi, I'm the intake guide. Let's get you set up.",
        shouldExit: (state) => {
            // Exit if name and email are present (or if we have a valid JWT handoff)
            // We relax this to just 'email' if name is missing but we want to move on.
            return isFieldFilled(state, 'email');
        }
    },
    profiler: {
        id: 'profiler',
        name: 'Profiler (Psychologist)',
        // V2 Ownership: Deep profiling
        ownedFields: [
            'skill_stage', 'time_barrier',
            'learner_type', 'vark_primary', 'vark_ranked',
            'srl_goal_setting', 'srl_adaptability', 'tech_confidence'
        ],
        introMessage: "Nice to meet you. I'm the Profiler. I want to understand your learning style.",
        shouldExit: (state) => {
            // Required: Skill, Time Barrier, Learner Type
            const hasSkill = isFieldFilled(state, 'skill_stage');
            const hasLearner = isFieldFilled(state, 'learner_type') || isFieldFilled(state, 'vark_primary');
            return hasSkill && hasLearner;
        }
    },
    strategist: {
        id: 'strategist',
        name: 'Career Strategist',
        // V2 Ownership: Professional Alignment + Motivation
        ownedFields: [
            'industry_vertical', 'industry', 'role_category', 'seniority',
            'goal_calibrated', 'motivation_type', 'vision_clarity', 'benefits', 'application_context'
        ],
        introMessage: "Thanks. I'm the Strategist. Let's align this with your career goals.",
        shouldExit: (state) => {
            // Required: Vertical, Role category, Goal
            return isFieldFilled(state, 'industry_vertical') &&
                isFieldFilled(state, 'role_category') &&
                isFieldFilled(state, 'goal_calibrated');
        }
    },
    tactician: {
        id: 'tactician',
        name: 'Tactician (Agile Coach)',
        // V2 Ownership: Execution Logistics + Pain Points
        ownedFields: ['time_per_week_mins', 'constraints', 'current_tools', 'frustrations'],
        introMessage: "Finally, I'm the Tactician. Let's make this actionable.",
        shouldExit: (state) => {
            // Exit if we have time commitment (or user skipped it with -1)
            const time = state.fields.time_per_week_mins;
            const hasTime = time?.value !== undefined;
            // Note: Value can be -1 (skip), which is still "defined"
            return hasTime;
        }
    }
};
