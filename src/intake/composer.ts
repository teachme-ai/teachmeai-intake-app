import { IntakeState, IntakeData } from './schema';
import { ai, DEFAULT_MODEL } from '../lib/genkit';
import { z } from 'zod';
import { GUIDE_SYSTEM_PROMPT } from '../prompts/guide.system';
import { getProfilerPrompt } from '../prompts/profiler.system';
import { getStrategistPrompt } from '../prompts/strategist.system';
import { getTacticianPrompt } from '../prompts/tactician.system';
import { AGENTS } from './agents.config';

import { logger } from '../utils/logger';

const QuestionResponseSchema = z.object({
    message: z.string().describe("The next question to ask. Friendly & concise."),
    targetField: z.string().optional().describe("The field you are asking about.")
});

export async function composeMoreQuestions(
    state: IntakeState
): Promise<string> {
    const log = logger.child({ component: 'composer', activeAgent: state.activeAgent });
    log.debug({ event: 'compose.start', nextAction: state.nextAction, nextField: state.nextField });

    const activeAgentId = state.activeAgent || 'guide'; // Default to guide

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
        else goal = "Ask the user to clarify their last response.";
    } else if (state.nextAction === 'ask_next') {
        const field = state.nextField || 'anything';
        goal = `Ask the user about '${field}'. Keep it simple and direct.`;
    } else if (state.nextAction === 'done') {
        return "Thanks! I have everything I need. Generating your report now...";
    }

    // --- AGENT PROMPT SELECTION ---
    let systemPrompt = "";
    if (activeAgentId === 'guide') {
        systemPrompt = GUIDE_SYSTEM_PROMPT
            .replace('{{CURRENT_DATA}}', JSON.stringify(state.fields, null, 2));
    }
    else if (activeAgentId === 'profiler') {
        const inputData = { fields: state.fields, lastMessage: state.lastUserMessage };
        systemPrompt = getProfilerPrompt(inputData);
    }
    else if (activeAgentId === 'strategist') {
        systemPrompt = getStrategistPrompt({
            profile: { psychologicalProfile: { motivationType: 'growth' }, learningGlobal: {} },
            professionalRoles: [state.fields.role_raw?.value || 'Professional'],
            primaryGoal: state.fields.goal_raw?.value,
        });
    }
    else if (activeAgentId === 'tactician') {
        systemPrompt = getTacticianPrompt({
            strategy: { focus: "Immediate Implementation" },
            name: state.fields.name?.value,
            constraints: { timeBarrier: state.fields.time_barrier?.value || 3, skillStage: state.fields.skill_stage?.value || 3 }
        });
    }
    else {
        systemPrompt = `You are a helpful intake assistant. Goal: ${goal}`;
    }

    // --- QUESTION MODE INJECTION ---
    const field = state.nextField;
    const mode = getQuestionMode(field);

    let modeInstruction = "";
    switch (mode) {
        case 'mcq':
            modeInstruction = "FORMAT: Ask a Multiple Choice Question (MCQ). List 4-6 brief options. Do not ask open-endedly.";
            break;
        case 'scale':
            modeInstruction = "FORMAT: Ask for a rating on a scale of 1 to 5. Define extremities (e.g. 1=Low, 5=High).";
            break;
        case 'numeric':
            modeInstruction = "FORMAT: Ask for a specific number (e.g. minutes, hours).";
            break;
        case 'list':
            modeInstruction = "FORMAT: Ask the user to list items (separated by commas).";
            break;
        case 'free_text':
        default:
            modeInstruction = "FORMAT: Ask a clear, concise open-ended question.";
            break;
    }

    // Repetition/Clarification Handling
    let repetitionInstruction = "";
    if (field) {
        const repeatCount = state.repeatCountByField?.[field] || 0;
        if (repeatCount >= 1) {
            repetitionInstruction = `\nNOTE: User failed to answer correctly ${repeatCount} times. BE EXTREMELY CLEAR.`;
            if (repeatCount >= 2 && mode !== 'free_text') {
                repetitionInstruction += " FORCE CHOICES. Do not allow ambiguity.";
            }
        }
    }

    systemPrompt += `\n\nIMMEDIATE INSTRUCTION: ${goal}\n${modeInstruction}\n${repetitionInstruction}\n\nIgnore any conflicted internal 'nextQuestion' logic. Ask EXACTLY ONE question about '${field}'.`;

    try {
        const { output } = await ai.generate({
            model: DEFAULT_MODEL, // INTAKE_MODEL alias
            system: systemPrompt,
            prompt: "Generate the next question.",
            output: { schema: QuestionResponseSchema }
        });

        return output?.message || "Could you tell me a bit more?";
    } catch (e) {
        console.error("Composer Error", e);
        return "Could you provide more details?";
    }
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
