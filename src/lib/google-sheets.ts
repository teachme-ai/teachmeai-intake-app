import { google } from 'googleapis'
import { IntakeResponse, IMPACTAnalysis, GoogleSheetsRow } from '@/types'

// Initialize Google Sheets API with robust auth
const getAuth = () => {
  const {
    GOOGLE_SERVICE_ACCOUNT_BASE64,
    GOOGLE_PROJECT_ID,
    GOOGLE_PRIVATE_KEY_ID,
    GOOGLE_PRIVATE_KEY,
    GOOGLE_CLIENT_EMAIL,
    GOOGLE_CLIENT_ID
  } = process.env;

  // Option 0: Base64-encoded service account JSON (most reliable for Vercel)
  if (GOOGLE_SERVICE_ACCOUNT_BASE64) {
    try {
      console.log('🔐 Google Sheets: Using base64-encoded service account');
      const decoded = Buffer.from(GOOGLE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      const credentials = JSON.parse(decoded);

      return new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (error) {
      console.error('❌ Google Sheets: Failed to decode base64 credentials:', error);
      // Fall through to other options
    }
  }

  // Option 1: Detailed individual environment variables (best for Vercel)
  // We check for both key and email to avoid partial auth crashes
  if (GOOGLE_PRIVATE_KEY && GOOGLE_CLIENT_EMAIL) {
    console.log('🔐 Google Sheets: Using environment variables for auth');

    try {
      // Clean the private key: handle escaped newlines and accidental quotes
      let formattedKey = GOOGLE_PRIVATE_KEY.trim();

      // Remove surrounding quotes if they exist
      formattedKey = formattedKey.replace(/^["'](.*)["']$/, '$1');

      // Handle different newline formats
      // Check if it contains literal \n strings (escaped)
      if (formattedKey.includes('\\n')) {
        formattedKey = formattedKey.replace(/\\n/g, '\n');
      }

      // Validate the key format
      if (!formattedKey.includes('BEGIN PRIVATE KEY') || !formattedKey.includes('END PRIVATE KEY')) {
        console.error('❌ Google Sheets: Private key does not contain BEGIN/END markers');
        throw new Error('Invalid private key format: missing BEGIN/END PRIVATE KEY markers');
      }

      // Additional validation: ensure proper PEM format
      const lines = formattedKey.split('\n');
      if (lines.length < 3) {
        console.error('❌ Google Sheets: Private key has too few lines');
        throw new Error('Invalid private key format: insufficient lines');
      }

      console.log('✅ Google Sheets: Private key formatted successfully');

      return new google.auth.GoogleAuth({
        credentials: {
          type: 'service_account',
          project_id: GOOGLE_PROJECT_ID,
          private_key_id: GOOGLE_PRIVATE_KEY_ID,
          private_key: formattedKey,
          client_email: GOOGLE_CLIENT_EMAIL,
          client_id: GOOGLE_CLIENT_ID
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } catch (error) {
      console.error('❌ Google Sheets: Error formatting private key:', error);
      throw error;
    }
  }

  // Option 2: Fallback to GOOGLE_APPLICATION_CREDENTIALS path (common for local dev)
  console.log('🔎 Google Sheets: Falling back to service account file auth');
  return new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

export const getSheets = () => google.sheets({ version: 'v4', auth: getAuth() })

// Helper to ensure Analysis sheet exists with correct headers
async function ensureAnalysisSheet(spreadsheetId: string, sheets: any) {
  try {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = response.data.sheets?.some(
      (s: any) => s.properties?.title === 'Sheet1'
    );

    if (!sheetExists) {
      // If Sheet1 doesn't exist, we might be in a new sheet. 
      // For now, let's assume Sheet1 is the main destination or "Analysis"
    }

    // Always update headers to match new spec
    const headers = [
      'Lead ID', 'Timestamp', 'Name', 'Role', 'Goal', 'Email',
      'Profile Summary', 'Strategy - Identify', 'Strategy - Plan',
      'Research - Top Opp 1', 'Research - Top Priority 1', 'Research - Quick Win 1',
      'Tactics - Next Step 1', 'Tactics - Full Plan', 'Raw Analysis JSON'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1:O1',
      valueInputOption: 'RAW',
      requestBody: { values: [headers] }
    });

  } catch (error) {
    console.error('❌ Google Sheets: Error ensuring Analysis headers:', error);
  }
}

export async function saveToGoogleSheets(
  intakeData: IntakeResponse,
  aiAnalysis: IMPACTAnalysis
): Promise<void> {
  try {
    console.log('📊 Google Sheets: Starting save process...')
    const spreadsheetId = process.env.GOOGLE_SHEET_ID
    if (!spreadsheetId) {
      console.warn('⚠️ Google Sheets: No GOOGLE_SHEET_ID provided, skipping save')
      return
    }

    const sheets = getSheets();
    await ensureAnalysisSheet(spreadsheetId, sheets);

    // Flatten nested data based on FINAL_REPORT_SPEC.md
    // Safely access deep properties with optional chaining
    const research = (aiAnalysis as any).research || {};
    const topOpp = research.aiOpportunityMap?.[0]?.opportunity || '';
    const topPriority = research.topPriorities?.[0] || {};

    const values = [
      [
        intakeData.sessionId || 'N/A',            // Lead ID (using sessionId as proxy or pass explicit from calling scope if avail)
        intakeData.timestamp || new Date().toISOString(),
        intakeData.name || 'N/A',
        intakeData.currentRoles?.[0] || 'N/A',
        intakeData.primaryGoal || 'N/A',
        intakeData.email || 'N/A',

        // AI Analysis
        JSON.parse(aiAnalysis.learnerProfile || '{}').psyCap || aiAnalysis.learnerProfile, // Simple profile
        aiAnalysis.Identify,
        aiAnalysis.Plan,

        // Deep Research (Flattened)
        topOpp,
        topPriority.name || '',
        topPriority.quickWin || '',

        // Tactics
        aiAnalysis.nextSteps?.[0] || '',
        aiAnalysis.Act,

        // Raw Backup
        JSON.stringify(aiAnalysis)
      ]
    ]

    console.log('📊 Google Sheets: Attempting to append to Sheet1...')
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A2',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    })

    console.log('✅ Google Sheets: Analysis data saved successfully!')

  } catch (error) {
    console.error('❌ Google Sheets: Save failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

// Helper to ensure Leads sheet exists
async function ensureLeadsSheet(spreadsheetId: string, sheets: any) {
  try {
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetExists = response.data.sheets?.some(
      (s: any) => s.properties?.title === 'Leads'
    );

    if (!sheetExists) {
      console.log('📝 Google Sheets: Creating Leads sheet...');
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: 'Leads',
                  gridProperties: { rowCount: 1000, columnCount: 10 }
                }
              }
            }
          ]
        }
      });

      // Add Headers
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
    console.error('❌ Google Sheets: Error ensuring Leads sheet:', error);
  }
}

export async function saveLeadToSheet(leadData: any, leadId: string): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('No GOOGLE_SHEET_ID provided');

  const sheets = getSheets();

  // Ensure the sheet exists before writing
  await ensureLeadsSheet(spreadsheetId, sheets);

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
}
