import { IntakeResponse, IMPACTAnalysis } from '@/types'

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:3400/supervisorFlow';

export async function analyzeWithAI(intakeData: IntakeResponse): Promise<IMPACTAnalysis> {
  try {
    console.log('Calling Agent Service at:', AGENT_SERVICE_URL);

    const response = await fetch(AGENT_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer ...' // Add auth in production
      },
      body: JSON.stringify({ data: intakeData })
    });

    if (!response.ok) {
      throw new Error(`Agent Service failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.result as IMPACTAnalysis; // Genkit returns { result: ... }

  } catch (error) {
    console.error('AI analysis error:', error)

    // Fallback or rethrow
    // Rethrowing so the UI knows it failed, or you can implement the fallback logic here again
    throw error;
  }
}
