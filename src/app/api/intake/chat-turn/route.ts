import { NextRequest, NextResponse } from 'next/server';
import { ChatTurnRequest } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    console.log('🚀 [Intake API] Received request at', new Date().toISOString());
    try {
        const body: ChatTurnRequest = await req.json();
        const { state, userMessage } = body;

        console.log(`💬 [Intake API] Turn ${state.turnCount + 1}: "${userMessage.substring(0, 50)}..."`);

        // 1. Call Cloud Run Service
        const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:3000';
        const endpoint = `${AGENT_SERVICE_URL.replace(/\/$/, '')}/quizGuide`;

        console.log(`📡 [Intake API] Calling Agent Service at: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state, userMessage })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Agent Service failed: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const result = data.result;

        console.log(`🤖 [Intake API] Reply received from agent service.`);

        return NextResponse.json(result);

    } catch (error) {
        console.error('💥 [Intake API] Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
