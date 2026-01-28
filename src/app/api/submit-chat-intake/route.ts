import { NextRequest, NextResponse } from 'next/server';
import { ai, DEFAULT_MODEL } from '@/lib/genkit';
import { z } from 'zod';
import { IntakeResponse, IMPACTAnalysis } from '@/types';
import { analyzeWithAI } from '@/lib/ai-analysis';

export const runtime = 'nodejs';

/**
 * This schema matches the final IntakeResponse expected by the Supervisor Agent
 */
const EnrichedIntakeSchema = z.object({
    goalSettingConfidence: z.number().min(1).max(5),
    newApproachesFrequency: z.number().min(1).max(5),
    reflectionFrequency: z.number().min(1).max(5),
    aiToolsConfidence: z.number().min(1).max(5),
    resilienceLevel: z.number().min(1).max(5),
    clearCareerVision: z.number().min(1).max(5),
    successDescription: z.number().min(1).max(5),
    learningForChallenge: z.number().min(1).max(5),
    outcomeDrivenLearning: z.number().min(1).max(5),
    timeBarrier: z.number().min(1).max(5),
    skillStage: z.number().min(1).max(5),
    learnerType: z.enum(['theorist', 'activist', 'reflector', 'pragmatist']),
    varkPreferences: z.object({
        visual: z.number().min(1).max(5),
        audio: z.number().min(1).max(5),
        readingWriting: z.number().min(1).max(5),
        kinesthetic: z.number().min(1).max(5),
    }),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { state, messages } = body;

        console.log('🧪 [Bridge API] Starting Diagnostic Mapping for:', state.sessionId);

        const transcript = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const systemPrompt = `
        You are an Expert Educational Psychologist. 
        Analyze the provided chat transcript and estimate the user's psychological and learning profile scores (1-5).
        
        FIELDS TO ESTIMATE:
        - goalSettingConfidence: How confident they seem in setting learning goals.
        - newApproachesFrequency: How often they try new learning methods.
        - reflectionFrequency: How often they reflect on their progress.
        - aiToolsConfidence: Their self-reported comfort with AI.
        - resilienceLevel: How they handle setbacks or complex challenges.
        - clearCareerVision: How clear their long-term career goals are.
        - skillStage: 1 (Novice) to 5 (Expert).
        - learnerType: Select one of 'theorist', 'activist', 'reflector', 'pragmatist'.
        - varkPreferences: Rate 1-5 for Visual, Audio, Reading/Writing, Kinesthetic.
        
        If unsure, use 3 (neutral) as default.
        `;

        const { output: enrichedData } = await ai.generate({
            model: DEFAULT_MODEL,
            system: systemPrompt,
            prompt: `TRANSCRIPT:\n${transcript}\n\nUSER DATA:\n${JSON.stringify(state.fields, null, 2)}`,
            output: { schema: EnrichedIntakeSchema }
        });

        if (!enrichedData) throw new Error("Diagnostic Mapping failed to produce output");

        console.log('✅ [Bridge API] Mapping complete. Triggering Agent Service...');

        // Assemble the final IntakeResponse
        const finalIntake: IntakeResponse = {
            name: state.fields.name?.value,
            email: state.fields.email?.value,
            primaryGoal: state.fields.goal_raw?.value,
            currentRoles: [state.fields.role_raw?.value],
            ...enrichedData,
            currentFrustrations: state.fields.constraints?.value ? String(state.fields.constraints.value) : "Not specified",
            concreteBenefits: "Not specified",
            shortTermApplication: "Not specified",
            timestamp: new Date().toISOString(),
            sessionId: state.sessionId
        };

        // Call the multi-agent system
        const analysis: IMPACTAnalysis = await analyzeWithAI(finalIntake);

        console.log('🎉 [Bridge API] IMPACT Analysis complete!');

        return NextResponse.json({
            success: true,
            analysis,
            enrichedData
        });

    } catch (error: any) {
        console.error('💥 [Bridge API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
