import OpenAI from 'openai'
import { IntakeResponse, IMPACTAnalysis } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function analyzeWithAI(intakeData: IntakeResponse): Promise<IMPACTAnalysis> {
  try {
    const prompt = `
You are an expert learning mentor analyzing a learner's intake responses. 
Generate a personalized IMPACT analysis based on the TeachMeAI Framework.

Learner Responses:
${JSON.stringify(intakeData, null, 2)}

Please analyze this data and provide:

1. IMPACT Framework Analysis (6 sections):
   - Identify: What are the key learning needs and current state?
   - Motivate: What will drive this learner's engagement?
   - Plan: What learning pathway would be most effective?
   - Act: What immediate actions should they take?
   - Check: How should they measure progress?
   - Transform: What long-term transformation can they expect?

2. Learner Profile Summary: A concise analysis of their learning style, preferences, and readiness

3. Specific Recommendations: 3-5 actionable next steps tailored to their profile

4. Next Steps: Immediate actions they can take

Focus on:
- Self-Learning Foundations (SRL, MAL, Andragogy, PsyCap, Motivation, Reflection)
- Personal Knowledge Management (PKM) approaches
- Mentoring models that would work best
- Learner typology insights (Kolb/HM, VARK, Dreyfus)
- AI in Learning & Mentoring opportunities
- Designing personalized pathways

Return the response as a JSON object with this structure:
{
  "Identify": "detailed analysis",
  "Motivate": "detailed analysis", 
  "Plan": "detailed analysis",
  "Act": "detailed analysis",
  "Check": "detailed analysis",
  "Transform": "detailed analysis",
  "learnerProfile": "summary of learner characteristics",
  "recommendations": ["array of specific recommendations"],
  "nextSteps": ["array of immediate actions"]
}
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert learning mentor. Always respond with valid JSON in the exact format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const responseText = completion.choices[0]?.message?.content || ''
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }
    
    const analysis: IMPACTAnalysis = JSON.parse(jsonMatch[0])
    
    return analysis

  } catch (error) {
    console.error('AI analysis error:', error)
    
    // Fallback analysis if AI fails
    return {
      Identify: `Based on your responses, you appear to be a ${intakeData.learnerType} learner with ${intakeData.skillStage}/5 skill level.`,
      Motivate: `Your motivation seems driven by ${intakeData.outcomeDrivenLearning > 3 ? 'outcomes and results' : 'intrinsic interest and challenge'}.`,
      Plan: `A structured learning pathway focusing on your VARK preferences would be most effective.`,
      Act: `Start with small, manageable learning sessions that align with your preferred learning style.`,
      Check: `Track your progress through regular reflection and milestone achievements.`,
      Transform: `Long-term, you can expect significant skill development and career advancement.`,
      learnerProfile: `Learner type: ${intakeData.learnerType}, Skill level: ${intakeData.skillStage}/5, Confidence: ${intakeData.goalSettingConfidence}/5`,
      recommendations: [
        'Set specific, measurable learning goals',
        'Create a consistent learning schedule',
        'Use reflection techniques to track progress'
      ],
      nextSteps: [
        'Schedule 30 minutes daily for learning',
        'Identify 3 specific skills to develop',
        'Set up a progress tracking system'
      ]
    }
  }
}
