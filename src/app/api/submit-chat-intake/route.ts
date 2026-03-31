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
        const { state } = body;

        console.log('🧪 [Bridge API] Forwarding state directly to Agent Service for:', state.sessionId);

        // We bypass the old Diagnostic Mapping and send the raw IntakeState to the Agent Service.
        // The Agent Service will convert it into a LearnerDossier.
        const analysis: IMPACTAnalysis = await analyzeWithAI(state as any);

        console.log('🎉 [Bridge API] IMPACT Analysis complete!');

        return NextResponse.json({
            success: true,
            analysis,
            enrichedData: state.fields 
        });

    } catch (error: any) {
        console.error('💥 [Bridge API] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
