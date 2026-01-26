import { IntakeResponse, IMPACTAnalysis } from '@/types'

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'https://teachmeai-agent-service-584680412286.us-central1.run.app';

export async function analyzeWithAI(intakeData: IntakeResponse): Promise<IMPACTAnalysis> {
  try {
    const endpoint = `${AGENT_SERVICE_URL.replace(/\/$/, '')}/supervisorFlow`;
    console.log('Calling Agent Service at:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer ...' // Add auth in production
      },
      body: JSON.stringify({ data: intakeData })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Agent Service Error Response:', errorText);
      throw new Error(`Agent Service failed: ${response.statusText} - ${errorText}`);
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
