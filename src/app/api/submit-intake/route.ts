import { NextRequest, NextResponse } from 'next/server'
import { IntakeResponse, IMPACTAnalysis } from '@/types'
import { analyzeWithAI } from '@/lib/ai-analysis'
import { saveToGoogleSheets } from '@/lib/google-sheets'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API Route: Starting intake submission...')

    const intakeData: IntakeResponse = await request.json()
    console.log('📝 API Route: Received intake data:', JSON.stringify(intakeData, null, 2))

    // Validate required fields
    const requiredFields = ['goalSettingConfidence', 'learnerType']
    const missingFields = requiredFields.filter(field => intakeData[field as keyof IntakeResponse] === undefined || intakeData[field as keyof IntakeResponse] === null)

    if (missingFields.length > 0) {
      console.error('❌ API Route: Missing required fields:', missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate VARK preferences
    if (!intakeData.varkPreferences) {
      console.error('❌ API Route: VARK preferences missing')
      return NextResponse.json(
        { error: 'VARK preferences are required' },
        { status: 400 }
      )
    }

    console.log('✅ API Route: Validation passed, proceeding with AI analysis...')

    // Analyze responses with AI
    console.log('🤖 API Route: Starting AI analysis...')
    const aiAnalysis = await analyzeWithAI(intakeData)
    console.log('✅ API Route: AI analysis completed:', JSON.stringify(aiAnalysis, null, 2))

    // Save to Google Sheets
    console.log('📊 API Route: Starting Google Sheets save...')
    try {
      await saveToGoogleSheets(intakeData, aiAnalysis)
      console.log('✅ API Route: Google Sheets save completed successfully')
    } catch (sheetsError) {
      console.error('❌ API Route: Google Sheets save failed:', sheetsError)
      // Don't fail the entire request if Google Sheets fails
    }

    console.log('🎉 API Route: Intake submission completed successfully')
    return NextResponse.json({
      success: true,
      message: 'Intake submitted successfully',
      analysis: aiAnalysis
    })

  } catch (error) {
    console.error('💥 API Route: Error processing intake:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
