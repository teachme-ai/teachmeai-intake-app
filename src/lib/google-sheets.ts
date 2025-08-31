import { google } from 'googleapis'
import { IntakeResponse, IMPACTAnalysis, GoogleSheetsRow } from '@/types'

// Initialize Google Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID || 'teachmeai-intake-app',
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLIENT_EMAIL || '')}`,
    universe_domain: 'googleapis.com'
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

export async function saveToGoogleSheets(
  intakeData: IntakeResponse, 
  aiAnalysis: IMPACTAnalysis
): Promise<void> {
  try {
    console.log('📊 Google Sheets: Starting save process...')
    console.log('📊 Google Sheets: Environment variables check:')
    console.log('📊 Google Sheets: GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS)
    console.log('📊 Google Sheets: GOOGLE_SHEET_ID:', process.env.GOOGLE_SHEET_ID)
    
    const spreadsheetId = process.env.GOOGLE_SHEET_ID
    
    if (!spreadsheetId) {
      console.warn('⚠️ Google Sheets: No Google Sheet ID provided, skipping sheet save')
      return
    }

    console.log('📊 Google Sheets: Using spreadsheet ID:', spreadsheetId)

    const row: GoogleSheetsRow = {
      timestamp: intakeData.timestamp,
      sessionId: intakeData.sessionId,
      currentRoles: intakeData.currentRoles?.join(', ') || 'None selected',
      rawResponses: JSON.stringify(intakeData),
      impactAnalysis: JSON.stringify(aiAnalysis),
      learnerProfile: aiAnalysis.learnerProfile,
      recommendations: aiAnalysis.recommendations.join('; '),
    }

    console.log('📊 Google Sheets: Prepared row data:', JSON.stringify(row, null, 2))

    const values = [
      [
        row.timestamp,
        row.sessionId,
        row.currentRoles,
        row.rawResponses,
        row.impactAnalysis,
        row.learnerProfile,
        row.recommendations,
      ]
    ]

    console.log('📊 Google Sheets: Attempting to append to sheet...')
    console.log('📊 Google Sheets: Range: Sheet1!A:F')
    console.log('📊 Google Sheets: Values to append:', JSON.stringify(values, null, 2))

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A2:F', // Start from row 2 to preserve headers
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values,
      },
    })

    console.log('✅ Google Sheets: Data saved successfully!')
    console.log('✅ Google Sheets: Response from Google:', JSON.stringify(result.data, null, 2))

  } catch (error) {
    console.error('❌ Google Sheets: Error saving to Google Sheets:', error)
    console.error('❌ Google Sheets: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown error type'
    })
    // Don't throw error - we don't want to fail the entire intake process
    // if Google Sheets is unavailable
  }
}

// Helper function to create the spreadsheet if it doesn't exist
export async function createSpreadsheetIfNeeded(): Promise<string> {
  try {
    const drive = google.drive({ version: 'v3', auth })
    
    // Create new spreadsheet
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
