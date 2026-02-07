import { z } from 'zod';

export const IntakeFieldStatus = z.enum(['missing', 'candidate', 'confirmed']);
export type IntakeFieldStatus = z.infer<typeof IntakeFieldStatus>;

export type Confidence = 'low' | 'medium' | 'high';

export interface IntakeField {
    value: any;
    status: IntakeFieldStatus;
    confidence: Confidence;
    evidence?: string; // quote from user message or 'prefill'
    updatedAt: string;
}

export const IntakeSchemaV1 = z.object({
    // Core Identity (Prefilled usually)
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    role_raw: z.string().min(1, "Role is required"),
    role_category: z.string().optional(),
    industry_vertical: z.enum(['BFSI', 'Manufacturing', 'Sales & Marketing', 'IT Consultancy', 'Other', 'Healthcare', 'EdTech']).optional(), // V2

    // Core Calibration
    goal_raw: z.string().min(1, "Goal is required"),
    goal_calibrated: z.string().optional(), // Refined goal by AI

    // Logistics
    time_per_week_mins: z.number().min(-1, "Time must be positive or -1 for skip").optional(),

    // Multipliers
    industry: z.string().optional(),
    seniority: z.string().optional(),
    skill_stage: z.number().min(1).max(5).optional(),
    time_barrier: z.number().min(1).max(5).optional(),
    constraints: z.array(z.string()).optional(),

    // Learning Preferences
    vark_primary: z.enum(['visual', 'audio', 'read_write', 'kinesthetic']).optional(), // Legacy
    vark_ranked: z.array(z.string()).optional(), // V2
    learner_type: z.enum(['theorist', 'activist', 'reflector', 'pragmatist']).optional(), // V2

    // SRL (Self-Regulated Learning) - V2
    srl_goal_setting: z.number().min(1).max(5).optional(),
    srl_adaptability: z.number().min(1).max(5).optional(),
    srl_reflection: z.number().min(1).max(5).optional(),
    tech_confidence: z.number().min(1).max(5).optional(),
    resilience: z.number().min(1).max(5).optional(),

    // Motivation - V2
    vision_clarity: z.number().min(1).max(5).optional(),
    success_clarity_1yr: z.number().min(1).max(5).optional(),
    motivation_type: z.enum(['intrinsic', 'outcome', 'hybrid']).optional(),

    // Pain & Outcomes - V2
    frustrations: z.string().optional(),
    benefits: z.string().optional(),
    application_context: z.string().optional(),

    // Meta
    current_tools: z.array(z.string()).optional(),

    // Technical Proficiency - V2.1
    digital_skills: z.number().min(1).max(5).optional(),
    tech_savviness: z.number().min(1).max(5).optional()
});

export type IntakeData = z.infer<typeof IntakeSchemaV1>;

export interface IntakeState {
    sessionId: string;
    fields: Partial<Record<keyof IntakeData, IntakeField>>;
    turnCount: number;
    isComplete: boolean;
    lastUserMessage?: string;
    lastAssistantMessage?: string;
    nextAction: 'ask_next' | 'clarify' | 'confirm' | 'run_analysis' | 'done';
    nextField?: keyof IntakeData;
    lastQuestionField?: keyof IntakeData;
    repeatCountByField?: Partial<Record<keyof IntakeData, number>>;

    // Agent Sequencing
    activeAgent: "guide" | "profiler" | "strategist" | "learner_dimensions" | "tactician";
    handoffPending?: { from: string; to: string; message: string };
    agentTurnCount?: Record<string, number>;

    missingFields: Array<keyof IntakeData>;
    completionPercent: number;
    metadata: {
        startTime: string;
        lastUpdated: string;
        source: string;
        mode: 'static_form' | 'interview';
    };
}
