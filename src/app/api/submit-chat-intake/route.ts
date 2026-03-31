import { NextRequest, NextResponse } from 'next/server';
import { ai, DEFAULT_MODEL } from '@/lib/genkit';
import { z } from 'zod';
import { IntakeResponse, IMPACTAnalysis } from '@/types';
import { analyzeWithAI } from '@/lib/ai-analysis';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds to allow the multi-agent system to complete

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
