import { randomUUID } from 'crypto';
import { SHEET_TITLE, persistIntakeState } from './persist';

export async function saveLeadToSheet(leadData: any): Promise<string> {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error('No GOOGLE_SHEET_ID provided');

    const leadId = randomUUID();
    console.log(`📊 [Leads] Initializing lead ${leadId} in master sheet: ${spreadsheetId}`);

    // Map leadData to a partial IntakeState for the master sheet
    const state: any = {
        sessionId: leadId,
        metadata: {
            mode: 'interview',
            startTime: new Date().toISOString(),
            source: 'handoff'
        },
        fields: {
            name: { value: leadData.contact_info?.name || '', status: 'confirmed', confidence: 'high', evidence: 'prefill', updatedAt: new Date().toISOString() },
            email: { value: leadData.contact_info?.email || '', status: 'confirmed', confidence: 'high', evidence: 'prefill', updatedAt: new Date().toISOString() },
            role_raw: { value: leadData.persona_id || '', status: 'candidate', confidence: 'medium', evidence: 'prefill', updatedAt: new Date().toISOString() },
            goal_raw: { value: (leadData.answers_raw || [])[0] || '', status: 'candidate', confidence: 'medium', evidence: 'prefill', updatedAt: new Date().toISOString() }
        },
        turnCount: 0,
        isComplete: false,
        // Carry over extra data in a custom field or as part of the meta
        payload: leadData
    };

    // Use the unified persist logic (which now does upsert)
    await persistIntakeState(state);

    return leadId;
}
