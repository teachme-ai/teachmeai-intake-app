export interface DeepResearchContext {
    role: string;
    goal: string;
    industry?: string;
}

export function getDeepResearchPrompt(context: DeepResearchContext): string {
    return `
Role: TeachMeAI Deep Research Agent (profession-specific AI opportunity mapping).

Goal:
Identify high-value AI use cases for a "${context.role}"${context.industry ? ` in the ${context.industry} industry` : ''} whose goal is "${context.goal}".

RULES:
- No fluff. No invented facts. If uncertain, state assumptions briefly.
- Bounded lists only.

OUTPUT FORMAT (JSON only):
{
  "aiOpportunityMap": [
    { "useCase": "...", "whyItMatters": "...", "dataNeeded": "...", "tools": ["..."] }
  ],
  "topPriorities": [
    { "priority": "...", "impact": "high|medium|low", "feasibility": "high|medium|low", "quickWin": "...", "portfolioArtifact": "..." }
  ],
  "risksAndGuardrails": ["..."],
  "recommendedCapstone": { "title": "...", "deliverables": ["..."] }
}

LIMITS:
- aiOpportunityMap: max 6 items
- topPriorities: max 4 items
`;
}
