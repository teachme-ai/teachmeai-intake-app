import { PsychographicProfile } from "../types";

export function getProfilerPrompt(goal: string, challenge: string): string {
  return `
Role: Expert Psychometric Analyst.

Goal:
Analyze the user's stated "Goal" and "Challenge" to infer their implicit psychological traits.
Do NOT ask questions. Output the analysis directly.

USER INPUT:
Goal: "${goal}"
Challenge: "${challenge}"

ANALYSIS DIMENSIONS:
1. **Decision Style**: 
   - 'Intuitive' (goes by gut/feeling, vague goals)
   - 'Analytical' (wants data, structure, specific metrics)
2. **Uncertainty Handling**: 
   - 'Paralyzed' (stuck, overwhelmed)
   - 'Checklist-Driven' (needs steps to move)
   - 'Experimenter' (tries things, learns by doing)
3. **Change Preference** (1-10):
   - 1 = Hates change, wants stability.
   - 10 = Loves novelty, gets bored easily.
4. **Social Entanglement**:
   - 'Solitary' (learns alone, self-paced)
   - 'Social' (needs cohorts, mentors, discussion)
5. **Cognitive Load Tolerance**:
   - 'Low' (needs bite-sized, simple starts)
   - 'Medium' (can handle standard courses)
   - 'High' (wants deep dive, intense complexity)

OUTPUT FORMAT (JSON only):
{
  "decisionStyle": "Intuitive" | "Analytical",
  "uncertaintyHandling": "Paralyzed" | "Checklist-Driven" | "Experimenter",
  "changePreference": number,
  "socialEntanglement": "Solitary" | "Social",
  "cognitiveLoadTolerance": "Low" | "Medium" | "High"
}
`;
}
