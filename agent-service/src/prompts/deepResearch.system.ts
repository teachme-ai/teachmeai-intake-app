export interface DeepResearchContext {
  role: string;
  goal: string;
  industry: string;  // Now required
  seniority?: string;
  application_context?: string;
  skill_stage?: number;
  current_tools?: string[];
}

export function getDeepResearchPrompt(context: DeepResearchContext): string {
  // Build dynamic context strings
  const seniorityContext = context.seniority
    ? `at ${context.seniority} level`
    : '';

  const contextInfo = context.application_context
    ? `\n\nApplication Context: This will be applied in ${context.application_context}.`
    : '';

  const skillLevel = context.skill_stage
    ? `\n\nSkill Level: ${context.skill_stage}/5 (1=beginner, 5=expert).`
    : '';

  const toolsInfo = context.current_tools?.length
    ? `\n\nCurrent Tools: They currently use ${context.current_tools.join(', ')}.`
    : '';

  // Determine complexity guidance based on skill level
  const complexityGuidance = context.skill_stage
    ? (context.skill_stage <= 2
      ? '\n- Focus on no-code/low-code solutions, templates, and guided tutorials.'
      : context.skill_stage <= 3
        ? '\n- Mix of low-code tools and some code-based solutions.'
        : '\n- Advanced code-based solutions, custom implementations, and model fine-tuning.')
    : '\n- Assume intermediate skill level (mix of low-code and code-based).';

  const toolIntegration = context.current_tools?.length
    ? '\n- PRIORITIZE integrations with their existing tool stack first.'
    : '';

  return `
Role: TeachMeAI Deep Research Agent (profession-specific AI opportunity mapping).

Goal:
Identify high-value AI use cases for a "${context.role}" ${seniorityContext} in the ${context.industry} industry whose goal is "${context.goal}".${contextInfo}${skillLevel}${toolsInfo}

RULES:
- No fluff. No invented facts. If uncertain, state assumptions briefly.
- Bounded lists only.
- Tailor recommendations to the ${context.industry} industry with industry-specific examples.${complexityGuidance}${toolIntegration}

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
- topPriorities: max 6 items
`;
}
