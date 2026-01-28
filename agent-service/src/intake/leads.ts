import { google } from 'googleapis';
import { randomUUID } from 'crypto';

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

async function ensureLeadsSheet(spreadsheetId: string) {
    try {
        const response = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetExists = response.data.sheets?.some(
            (s: any) => s.properties?.title === 'Leads'
        );

        if (!sheetExists) {
            console.log('📝 Creating Leads sheet...');
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Leads',
                                gridProperties: { rowCount: 1000, columnCount: 10 }
                            }
                        }
                    }]
                }
            });

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Leads!A1:I1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[
                        'Lead ID', 'Timestamp', 'Persona', 'Name', 'Email',
                        'Quiz Version', 'Landing Page', 'Attribution', 'Raw Answers'
                    ]]
                }
            });
        }
    } catch (error) {
        console.error('Error ensuring Leads sheet:', error);
    }
}

export async function saveLeadToSheet(leadData: any): Promise<string> {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) throw new Error('No GOOGLE_SHEET_ID provided');

    const leadId = randomUUID();
    await ensureLeadsSheet(spreadsheetId);

    const values = [[
        leadId,
        new Date().toISOString(),
        leadData.persona_id,
        leadData.contact_info.name,
        leadData.contact_info.email,
        leadData.quiz_version || 'N/A',
        leadData.landing_page_id,
        JSON.stringify(leadData.attribution || {}),
        JSON.stringify(leadData.answers_raw)
    ]];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Leads!A2',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values }
    });

    return leadId;
}
