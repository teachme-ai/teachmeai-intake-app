import { google } from 'googleapis';
import { IntakeState, IntakeData } from './schema';

// Utility to convert to IST
function toIST(dateInput?: string | Date): string {
    const d = dateInput ? new Date(dateInput) : new Date();
    // UTC to IST is +5.5 hours
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(d.getTime() + istOffset);
    return istDate.toISOString().replace('Z', '+05:30');
}

const getAuth = () => {
    const {
        GOOGLE_SERVICE_ACCOUNT_BASE64,
        GOOGLE_PROJECT_ID,
        GOOGLE_PRIVATE_KEY_ID,
        GOOGLE_PRIVATE_KEY,
        GOOGLE_CLIENT_EMAIL,
        GOOGLE_CLIENT_ID
    } = process.env;

    if (GOOGLE_SERVICE_ACCOUNT_BASE64) {
        try {
            const decoded = Buffer.from(GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
            const credentials = JSON.parse(decoded);
            return new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } catch (e) {
            console.error('Auth error', e);
        }
    }

    // Fallback logic similar to main app...
    if (GOOGLE_PRIVATE_KEY && GOOGLE_CLIENT_EMAIL) {
        let formattedKey = GOOGLE_PRIVATE_KEY.trim().replace(/^["'](.*)["']$/, '$1').replace(/\\n/g, '\n');
        return new google.auth.GoogleAuth({
            credentials: {
                private_key: formattedKey,
                client_email: GOOGLE_CLIENT_EMAIL,
                project_id: GOOGLE_PROJECT_ID
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    return new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
};

const sheets = google.sheets({ version: 'v4', auth: getAuth() });

export const SHEET_TITLE = 'Intake_v2';
const HEADERS = [
    'Timestamp', 'Session ID', 'Intake Mode', 'Status', 'Name', 'Email',
    'Role Raw', 'Role Category', 'Goal Short', 'Time/Week (mins)',
    'Skill Stage', 'Time Barrier', 'Turns', 'Last Updated', 'Confidence Overall',
    'Prefill Payload JSON', 'Intake State JSON', 'Transcript JSON', 'Deep Research JSON',
    'Learner Profile JSON', 'IMPACT Strategy JSON', 'Execution Plan JSON', 'Final Report JSON',
    'Errors/Warn JSON', 'Versions JSON'
];

async function ensureSheetExists(spreadsheetId: string) {
    try {
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const exists = meta.data.sheets?.some((s: any) => s.properties?.title === SHEET_TITLE);

        if (!exists) {
            console.log(`Creating ${SHEET_TITLE} tab...`);
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: { properties: { title: SHEET_TITLE } }
                    }]
                }
            });
            // Write headers
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${SHEET_TITLE}!A1`,
                valueInputOption: 'RAW',
                requestBody: { values: [HEADERS] }
            });
        }
    } catch (e: any) {
        console.error('Error ensuring sheet exists:', e);
        throw new Error(`Google Sheets Access Failed: ${e.message}`);
    }
}

export async function persistIntakeState(state: IntakeState, analysis?: any): Promise<void> {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    console.log(`📊 [Persist] [LOG-SEARCH-ME] Starting persistence for session ${state.sessionId || 'unknown'} (Sheet: ${spreadsheetId || 'MISSING'})`);

    if (!spreadsheetId) {
        console.warn('No GOOGLE_SHEET_ID, skipping persistence');
        return;
    }

    try {
        await ensureSheetExists(spreadsheetId);

        // UPSERT LOGIC: Find existing row for this Session ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${SHEET_TITLE}!B:B`, // Column B is Session ID
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex((r: any) => r[0] === state.sessionId);

        const row = [
            toIST(state.metadata?.startTime || new Date()), // Timestamp (creation)
            state.sessionId,
            state.metadata?.mode || 'interview',
            state.isComplete ? 'COMPLETE' : 'IN_PROGRESS',
            state.fields.name?.value || '',
            state.fields.email?.value || '',
            state.fields.role_raw?.value || '',
            state.fields.role_category?.value || '',
            state.fields.goal_raw?.value || '',
            state.fields.time_per_week_mins?.value || '',
            state.fields.skill_stage?.value || '',
            state.fields.time_barrier?.value || '',
            state.turnCount,
            toIST(), // Last Updated
            'HIGH', // TODO: calc overall confidence

            // JSON BLOBS
            JSON.stringify({}), // Prefill Payload
            JSON.stringify(state),
            JSON.stringify([]), // Transcript
            JSON.stringify(analysis?.research || {}), // Deep Research JSON
            analysis?.learnerProfile || '',           // Learner Profile JSON
            JSON.stringify({
                Identify: analysis?.Identify,
                Motivate: analysis?.Motivate,
                Plan: analysis?.Plan
            }), // IMPACT Strategy JSON
            JSON.stringify({
                Act: analysis?.Act,
                Check: analysis?.Check,
                Transform: analysis?.Transform
            }), // Execution Plan JSON
            JSON.stringify({ nextSteps: analysis?.nextSteps, recommendations: analysis?.recommendations }), // Final Report JSON
            '', '' // Errors/Warn, Versions
        ];

        if (rowIndex !== -1) {
            // Update existing row (Row indexes are 1-based in Sheets)
            const sheetRowNumber = rowIndex + 1;
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${SHEET_TITLE}!A${sheetRowNumber}`,
                valueInputOption: 'RAW',
                requestBody: { values: [row] }
            });
            console.log(`✅ [Persist] Updated row ${sheetRowNumber} for session ${state.sessionId}`);
        } else {
            // Append new row
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${SHEET_TITLE}!A2`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: [row] }
            });
            console.log(`✅ [Persist] Appended new row for session ${state.sessionId}`);
        }

    } catch (error) {
        console.error('Persist failed:', error);
    }
}
