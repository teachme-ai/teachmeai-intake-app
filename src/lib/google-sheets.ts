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

const getSheets = () => google.sheets({ version: 'v4', auth: getAuth() })

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

    // Align with headers: Timestamp | Session ID | Raw Intake Data | IMPACT Analysis | Learner Profile | Recommendations
    const values = [
      [
        intakeData.timestamp || new Date().toISOString(),
        intakeData.sessionId || 'N/A',
        JSON.stringify(intakeData),
        JSON.stringify(aiAnalysis),
        aiAnalysis.learnerProfile || 'N/A',
        aiAnalysis.recommendations?.join('; ') || 'None'
      ]
    ]

    console.log('📊 Google Sheets: Attempting to append to Sheet1...')
    const sheets = getSheets()
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A2', // Append to Sheet1, starting from A2 (search for first empty row)
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    })

    console.log('✅ Google Sheets: Data saved successfully!')
    console.log('✅ Google Sheets: Update range:', result.data.updates?.updatedRange)

  } catch (error) {
    console.error('❌ Google Sheets: Save failed:', error instanceof Error ? error.message : error);

    // Log additional error details for debugging
    if (error instanceof Error) {
      console.error('❌ Google Sheets: Error stack:', error.stack);
      console.error('❌ Google Sheets: Error name:', error.name);
    }

    // Log the full error object for debugging
    console.error('❌ Google Sheets: Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    // Re-throw the error so it can be caught by the API route
    throw error;
  }
}

// Helper function to create the spreadsheet if it doesn't exist
export async function createSpreadsheetIfNeeded(): Promise<string> {
  try {
    const drive = google.drive({ version: 'v3', auth: getAuth() })

    // Create new spreadsheet
    const sheets = getSheets()
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: 'TeachMeAI Intake Responses',
        },
        sheets: [
          {
            properties: {
              title: 'Intake Data',
              gridProperties: {
                rowCount: 1000,
                columnCount: 6,
              },
            },
          },
        ],
      },
    })

    const spreadsheetId = spreadsheet.data.spreadsheetId!

    // Set up headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Intake Data!A1:F1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            'Timestamp',
            'Session ID',
            'Raw Responses',
            'AI Analysis',
            'Learner Profile',
            'Recommendations',
          ],
        ],
      },
    })

    // Format headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 6,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
        ],
      },
    })

    console.log('New spreadsheet created with ID:', spreadsheetId)
    return spreadsheetId

  } catch (error) {
    console.error('Error creating spreadsheet:', error)
    throw new Error('Failed to create Google Sheets spreadsheet')
  }
}
