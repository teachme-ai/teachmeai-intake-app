export interface DeepResearchContext {
  role: string;
  goal: string;
  industry?: string;
  skillStage?: number; // 1-5
  learnerType?: string;
  digital_skills?: number;
  tech_savviness?: number;
  seniority?: string;
  application_context?: string;
  current_tools?: string[];
  profile?: {
    decisionStyle: string;
    uncertaintyHandling: string;
    changePreference: number;
    socialEntanglement: string;
    cognitiveLoadTolerance: string;
  };
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
  const seniorityContext = context.seniority ? `Seniority Level: ${context.seniority}` : "";
  const appContext = context.application_context ? `Application Context: ${context.application_context}` : "";
  const toolsContext = context.current_tools?.length ? `Current Tech Stack: ${context.current_tools.join(', ')}` : "";

  const psychographicContext = context.profile ? `
PSYCHOGRAPHIC PROFILE:
- Decision Style: ${context.profile.decisionStyle}
- Uncertainty Handling: ${context.profile.uncertaintyHandling}
- Change Preference: ${context.profile.changePreference}/10
- Cognitive Pacing: ${context.profile.cognitiveLoadTolerance} tolerance
  ` : "";

  return `
Role: TeachMeAI Deep Research Agent (profession-specific AI opportunity mapping).

Goal:
Identify high-value AI use cases for a "${context.role}"${context.industry ? ` in the ${context.industry} industry` : ''} whose goal is "${context.goal}".

CONTEXT:
- Professional Skill Level: ${skillDesc}
- ${seniorityContext}
- ${appContext}
- Technical Profile: ${techProfile}
- ${toolsContext}
- ${learnerFrame}
${psychographicContext}

RULES:
1. **VERTICAL AI MANDATE (CRITICAL)**:
   - FORBID generic "Big 3" suggestions (ChatGPT, Claude, Gemini) as the primary value.
   - FORBID generic secondary tools (Canva, Perplexity, Notion) unless linked to a niche, role-specific complex workflow.
   - MANDATE: Identify specific "Vertical AI" tools designed for this role (e.g., specific IDE plugins for devs, specialized legal AI for lawyers, medical AI, etc.).
   
2. **Mindset Match**:
   - If user handled uncertainty by being "Paralyzed": Suggest tools with the lowest barrier to entry.
   - If user is "Analytical": Suggest tools with deep data manipulation or logic transparency.
   - If user is "Intuitive": Suggest generative/creative AI tools that favor rapid iteration.

3. **Context-Aware Recommendations**:
   - Focus on "Market Maturity": How much of this person's role is currently being disrupted by AI?
   - If User is Senior/Lead: Focus on AI for delegation, review, and strategic forecasting.

4. **No fluff**. No invented facts.

OUTPUT FORMAT (JSON only):
{
  "aiOpportunityMap": [
    { "opportunity": "...", "impact": "description of business/career impact" }
  ],
  "topPriorities": [
    { "name": "...", "quickWin": "...", "portfolioArtifact": "..." }
  ],
  "marketMaturityScore": number (1-100),
  "assumptions": ["..."]
}

LIMITS:
- aiOpportunityMap: max 6 items
- topPriorities: max 4 items
`;
}
