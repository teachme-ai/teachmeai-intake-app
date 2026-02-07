export interface DeepResearchContext {
  role: string;
  goal: string;
  industry?: string;
  skillStage?: number; // 1-5
  learnerType?: string;
}

function getSkillLevelDescription(stage?: number): string {
  if (!stage) return "General";
  if (stage <= 2) return "Beginner/Novice (Needs foundational simple tools)";
  if (stage === 3) return "Intermediate (Needs practical workflows)";
  return "Expert/Advanced (Needs fine-tuning, APIs, and complex integrations)";
}

export function getDeepResearchPrompt(context: DeepResearchContext): string {
  const skillDesc = getSkillLevelDescription(context.skillStage);
  const learnerFrame = context.learnerType ? `Optimized for a "${context.learnerType}" learner style.` : "";

  return `
Role: TeachMeAI Deep Research Agent (profession-specific AI opportunity mapping).

Goal:
Identify high-value AI use cases for a "${context.role}"${context.industry ? ` in the ${context.industry} industry` : ''} whose goal is "${context.goal}".

CONTEXT:
- Skill Level: ${skillDesc}
- ${learnerFrame}

RULES:
1. **Filter by Skill Level**:
   - If User is Novice: Suggest "off-the-shelf" tools (ChatGPT, Claude, Perplexity). Avoid Python/APIs.
   - If User is Expert: Suggest agents, automation (Make/Zapier), or fine-tuning models.
2. **Industry Specificity**:
   - Use jargon and use cases specific to ${context.industry || "their profession"}.
3. **No fluff**. No invented facts.

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
