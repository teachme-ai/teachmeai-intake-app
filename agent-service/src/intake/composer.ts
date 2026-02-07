import { IntakeState, IntakeData } from './schema';
import { ai, INTAKE_MODEL } from '../genkit';
import { z } from 'zod';
import { AGENTS } from './agents.config';
import { logger } from '../utils/logger';
import { withLLMResilience } from '../utils/llm-resilience';
import { withConcurrencyLimit } from '../utils/concurrency';

const QuestionResponseSchema = z.object({
    message: z.string().describe("The next question to ask. Friendly & concise."),
    targetField: z.string().optional().describe("The field you are asking about.")
});

// Load the Dotprompt
const composerPrompt = ai.prompt('composer');

export async function composeMoreQuestions(
    state: IntakeState
): Promise<string> {
    const log = logger.child({ component: 'composer', activeAgent: state.activeAgent });
    log.debug({ event: 'compose.start', nextAction: state.nextAction, nextField: state.nextField });

    const activeAgentId = state.activeAgent || 'guide';

    // We deterministically decide WHAT to ask based on 'nextField' or 'nextAction'
    // But we let the LLM phrase it naturally.
    let goal = "";

    // Track what we are asking about
    state.lastQuestionField = state.nextField;
    if (state.nextAction === 'clarify') {
        if (!state.fields.role_category?.value) state.lastQuestionField = 'role_category';
        else if (!state.fields.goal_calibrated?.value) state.lastQuestionField = 'goal_calibrated';
    }

    if (state.nextAction === 'clarify') {
        if (state.lastQuestionField === 'role_category') goal = "Ask the user to clarify their specific job function or category (Product, Eng, Sales, etc).";
        else if (state.lastQuestionField === 'goal_calibrated') goal = "Ask the user to be more specific about what they want to achieve with AI.";
        else {
            const fieldName = state.lastQuestionField ? state.lastQuestionField.replace(/_/g, ' ') : 'their last response';
            goal = `The user's previous answer regarding '${fieldName}' was unclear. Ask them to provide more specific details about ${fieldName}.`;
        }
    } else if (state.nextAction === 'ask_next') {
        const field = state.nextField || 'anything';
        goal = `Ask the user about '${field}'. Keep it simple and direct.`;
    } else if (state.nextAction === 'done') {
        return "Thanks! I have everything I need. Generating your report now...";
    }

    // --- QUESTION MODE ---
    const field = state.nextField;
    const mode = getQuestionMode(field);
    const repeatCount = field ? (state.repeatCountByField?.[field] || 0) : 0;

    try {
        // Use Dotprompt with resilience and concurrency control
        const { output } = await withConcurrencyLimit(
            () => withLLMResilience(
                () => composerPrompt({
                    activeAgent: activeAgentId,
                    nextField: String(field || 'general'),
                    goal,
                    mode,
                    currentData: state.fields,
                    repeatCount
                }),
                {
                    component: 'composer',
                    maxRetries: 3,
                    // Fallback: use deterministic templates if LLM fails
                    fallback: async () => {
                        log.warn({ event: 'compose.llm_fallback' });
                        return { output: { message: getDeterministicQuestion(field, mode) } };
                    }
                }
            )
        );

        return output?.message || "Could you tell me a bit more?";
    } catch (e) {
        log.error({ event: 'compose.error', error: String(e) });
        return getDeterministicQuestion(field, mode);
    }
}

/**
 * Deterministic fallback questions (no LLM needed)
 */
function getDeterministicQuestion(field?: keyof IntakeData, mode?: string): string {
    const templates: Record<string, string> = {
        // Identity
        name: "What is your name?",
        email: "What is your email address?",
        role_raw: "What is your current role?",
        role_category: "What's your job function? (e.g., Product, Engineering, Sales, Marketing, Operations)",
        industry_vertical: "Which industry are you in? (BFSI, Manufacturing, IT, Healthcare, EdTech, Sales & Marketing, Other)",
        industry: "What industry do you work in?",
        seniority: "What is your seniority level?",

        // Goal
        goal_raw: "What is your main goal for learning AI?",
        goal_calibrated: "What specific outcome would you like to achieve with AI in the next 3-6 months?",

        // Learner Dimensions - SRL
        srl_goal_setting: "How often do you set specific learning goals? (1=Never, 5=Daily)",
        srl_adaptability: "How comfortable are you adapting to new tools/methods? (1=Not at all, 5=Very)",
        srl_reflection: "How often do you reflect on your learning progress? (1=Rarely, 5=Regularly)",

        // Learner Dimensions - Motivation
        motivation_type: "What drives you most? (Intrinsic curiosity, Career outcome, or a mix?)",
        vision_clarity: "On a scale of 1-5, how clear is your vision of where you want to be in 2 years?",
        success_clarity_1yr: "How clear is your definition of success for the next year? (1-5)",

        // Learner Dimensions - Preferences
        learner_type: "Which best describes your learning style? (Theorist, Activist, Reflector, Pragmatist)",
        vark_primary: "How do you prefer to consume info? (Visual, Audio, R/W, Kinesthetic)",
        vark_ranked: "Rank your preferred learning modes.",

        // Readiness
        skill_stage: "On a scale of 1-5, where would you rate your current AI skills? (1=Beginner, 5=Expert)",
        tech_confidence: "On a scale of 1-5, how confident are you with technology in general?",
        resilience: "On a scale of 1-5, how would you rate your ability to bounce back from setbacks?",

        // Logistics
        time_per_week_mins: "How many hours per week can you dedicate to learning AI? (e.g., 2 hours)",
        time_barrier: "On a scale of 1-5, how much does time constraint affect your learning? (1=Not at all, 5=Major barrier)",
        constraints: "Do you have any specific constraints or blockers?",
        current_tools: "What tools are you currently using?",
        frustrations: "What are your biggest frustrations with learning currently?",
        benefits: "What specific benefits do you hope to gain?",
        application_context: "How do you plan to apply this learning immediately?"
    };

    if (field && templates[field]) {
        return templates[field];
    }

    const readableField = field ? field.replace(/_/g, ' ') : 'that';
    return `Could you provide more details about ${readableField}?`;
}

function getQuestionMode(field?: keyof IntakeData): 'mcq' | 'scale' | 'numeric' | 'list' | 'free_text' {
    if (!field) return 'free_text';

    if (['role_category', 'industry_vertical', 'learner_type', 'motivation_type', 'vark_primary'].includes(field)) return 'mcq';

    if (['skill_stage', 'time_barrier', 'srl_goal_setting', 'srl_adaptability', 'srl_reflection',
        'tech_confidence', 'resilience', 'vision_clarity', 'success_clarity_1yr'].includes(field)) return 'scale';

    if (['time_per_week_mins'].includes(field)) return 'numeric';

    if (['constraints', 'current_tools', 'vark_ranked'].includes(field)) return 'list';

    return 'free_text';
}
