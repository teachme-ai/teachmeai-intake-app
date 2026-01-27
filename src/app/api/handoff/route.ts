import { NextResponse } from 'next/server';
import { HandoffPayload } from '@/types/handoff';
import { saveLeadToSheet } from '@/lib/google-sheets';
import { randomUUID } from 'crypto';

function isValidPayload(data: any): data is HandoffPayload {
    if (!data) return false;
    if (typeof data.persona_id !== 'string') return false;
    if (typeof data.landing_page_id !== 'string') return false;
    if (!Array.isArray(data.answers_raw)) return false;
    if (!data.contact_info || typeof data.contact_info.email !== 'string') return false;
    return true;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Manual Validation
        if (!isValidPayload(body)) {
            return NextResponse.json(
                { status: 'error', message: 'Invalid payload: Missing required fields' },
                { status: 400 }
            );
        }

        const leadId = randomUUID();

        // 2. Persist Lead
        await saveLeadToSheet(body, leadId);

        // 3. Generate Redirect URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
        const redirectUrl = `${baseUrl}/intake?lead_id=${leadId}`;

        return NextResponse.json({
            status: 'success',
            lead_id: leadId,
            redirect_url: redirectUrl
        });

    } catch (error) {
        console.error('❌ [Handoff API] Error:', error);
        return NextResponse.json(
            { status: 'error', message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
