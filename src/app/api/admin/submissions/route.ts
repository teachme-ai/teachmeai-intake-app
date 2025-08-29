import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { JWT } from 'google-auth-library'

export async function GET(request: NextRequest) {
  try {
    // Basic admin authentication (you can enhance this later)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const authClient = await auth.getClient()
    const sheets = google.sheets({ version: 'v4', auth: authClient })
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    if (!spreadsheetId) {
      throw new Error('Google Sheet ID not configured')
    }

    // Read all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:F', // All columns
    })

    const rows = response.data.values || []
    
    if (rows.length === 0) {
      return NextResponse.json({ submissions: [] })
    }

    // Parse the data into structured format
    const submissions = rows.slice(1).map((row, index) => {
      try {
        const rawResponses = JSON.parse(row[2] || '{}')
        const impactAnalysis = JSON.parse(row[3] || '{}')
        
        return {
          id: index + 1,
          timestamp: row[0],
          sessionId: row[1],
          learnerType: rawResponses.learnerType || 'Unknown',
          skillStage: rawResponses.skillStage || 'Unknown',
          varkPreferences: rawResponses.varkPreferences || {},
          recommendations: impactAnalysis.recommendations || [],
          nextSteps: impactAnalysis.nextSteps || [],
          learnerProfile: impactAnalysis.learnerProfile || 'Unknown',
          rawData: rawResponses,
          analysis: impactAnalysis
        }
      } catch (error) {
        console.error(`Error parsing row ${index + 1}:`, error)
        return {
          id: index + 1,
          timestamp: row[0],
          sessionId: row[1],
          error: 'Data parsing error'
        }
      }
    })

    return NextResponse.json({ 
      submissions,
      total: submissions.length,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
