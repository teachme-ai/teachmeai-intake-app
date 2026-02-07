export interface DeepResearchContext {
  role: string;
  goal: string;
  industry?: string;
  skillStage?: number; // 1-5
  learnerType?: string;
  digital_skills?: number;
  tech_savviness?: number;
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
  const techProfile = `Digital Mastery: ${context.digital_skills || 3}/5, Technical Depth: ${context.tech_savviness || 3}/5.`;

  return `
Role: TeachMeAI Deep Research Agent (profession-specific AI opportunity mapping).

Goal:
Identify high-value AI use cases for a "${context.role}"${context.industry ? ` in the ${context.industry} industry` : ''} whose goal is "${context.goal}".

CONTEXT:
- Professional Skill Level: ${skillDesc}
- Technical Profile: ${techProfile}
- ${learnerFrame}

RULES:
1. **Filter by Technical Capability**:
   - If User has low Digital Skills (<3): Suggest simple web-based AI tools (ChatGPT, Perplexity). Avoid terminal, APIs, or complex setup.
   - If User is low Tech-Savy (<3): Explain technical concepts using non-technical analogies. Focus on "Outcome" rather than "Implementation".
   - If User is Tech-Savvy (>=4): Suggest specific libraries (LangChain), agents, or Python-based automation.
2. **Industry Specificity**:
   - Use jargon and use cases specific to ${context.industry || "their profession"}.
3. **No fluff**. No invented facts.

OUTPUT FORMAT (JSON only):
{
  "aiOpportunityMap": [
    { "opportunity": "...", "impact": "description of business/career impact" }
  ],
  "topPriorities": [
    { "name": "...", "quickWin": "...", "portfolioArtifact": "..." }
  ],
  "assumptions": ["..."]
}

LIMITS:
- aiOpportunityMap: max 6 items
- topPriorities: max 4 items
- assumptions: max 5 items
`;
}
