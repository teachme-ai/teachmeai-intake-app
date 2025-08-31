import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    // Basic admin authentication (you can enhance this later)
    const authHeader = request.headers.get('authorization')
    const adminToken = process.env.ADMIN_TOKEN || 'admin-token-123'
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - Missing Bearer token' }, { status: 401 })
    }
    
    const token = authHeader.substring(7)
    if (token !== adminToken) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    // Initialize Google Sheets API
    const spreadsheetId = process.env.GOOGLE_SHEET_ID
    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Google Sheet ID not configured' }, { status: 500 })
    }

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
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const authClient = await auth.getClient()
    const sheets = google.sheets({ version: 'v4', auth: authClient })

    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:F', // Actual range is A-F (6 columns)
    })

    const rows = response.data.values || []
    
    if (rows.length === 0) {
      return NextResponse.json({ submissions: [] })
    }

    // Parse the data into structured format (skip header row)
    const dataRows = rows.slice(1) // Skip first row (headers)
    const submissions = dataRows.map((row, index) => {
      try {
        // Skip empty rows
        if (!row || row.length === 0) return null
        
        // Handle different data structures in the sheet
        let rawResponses = {}
        let impactAnalysis = {}
        let currentRoles = 'None selected'
        
        // Actual structure: [timestamp, sessionId, rawResponses(JSON), impactAnalysis(JSON), learnerProfile(text), recommendations(text)]
        if (row.length >= 4) {
          try {
            // Column C: Raw Responses (JSON)
            if (row[2] && row[2].startsWith('{')) {
              rawResponses = JSON.parse(row[2])
              currentRoles = rawResponses.currentRoles?.join(', ') || 'None selected'
            }
            
            // Column D: Impact Analysis (JSON)
            if (row[3] && row[3].startsWith('{')) {
              impactAnalysis = JSON.parse(row[3])
            }
          } catch (parseError) {
            console.warn(`Parsing error for row ${index}:`, parseError)
          }
        }
        
        return {
          id: index + 1,
          timestamp: row[0] || 'Unknown',
          sessionId: row[1] || 'Unknown',
          currentRoles,
          learnerType: rawResponses.learnerType || 'Unknown',
          skillStage: rawResponses.skillStage || 'Unknown',
          varkPreferences: rawResponses.varkPreferences || {},
          recommendations: impactAnalysis.recommendations || [],
          nextSteps: impactAnalysis.nextSteps || [],
          learnerProfile: impactAnalysis.learnerProfile || row[4] || 'Unknown',
          rawData: rawResponses,
          analysis: impactAnalysis
        }
      } catch (error) {
        console.error(`Error parsing row ${index}:`, error)
        return {
          id: index + 1,
          timestamp: row[0] || 'Unknown',
          sessionId: row[1] || 'Unknown',
          currentRoles: 'Parse Error',
          error: `Data parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          rawRowData: row
        }
      }
    }).filter(Boolean) // Remove null entries

    return NextResponse.json({ 
      submissions,
      total: submissions.length,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin API error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch submissions',
          details: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch submissions - Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
