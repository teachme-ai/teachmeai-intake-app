export interface StrategistContext {
  profile: any;
  professionalRoles: string[];
  primaryGoal?: string;
  deepResearchResult?: any;
  roleRaw?: string;
  goalRaw?: string;
}

/**
 * Determine which slot needs clarification based on what's missing
 */
export function selectFollowUpSlot(context: StrategistContext): { slot: string; reason: string } {
  const { roleRaw, goalRaw, profile } = context;

  // Priority 1: Role scope (who/where/what)
  if (!profile?.role_category && !profile?.industry_vertical) {
    return { slot: 'role_scope', reason: 'Missing target audience and context' };
  }

  // Priority 2: Goal outcome (what success looks like)
  if (!profile?.goal_calibrated || profile?.goal_calibrated === goalRaw) {
    return { slot: 'goal_outcome', reason: 'Goal needs calibration with outcome' };
  }

  // Priority 3: Context (where it will be applied)
  if (!profile?.application_context) {
    return { slot: 'application_context', reason: 'Missing context for application' };
  }

  // Priority 4: Current Tools (anchoring the tech stack)
  if (!profile?.current_tools || profile.current_tools.length === 0) {
    return { slot: 'current_tools', reason: 'Need to know current tech stack to suggest relevant AI extensions' };
  }

  // Priority 5: Timeframe
  if (!profile?.vision_clarity) {
    return { slot: 'timeframe', reason: 'Missing success timeline' };
  }

  return { slot: 'done', reason: 'All slots filled' };
}

export function getStrategistPrompt(context: StrategistContext): string {
  const slot = selectFollowUpSlot(context);

  return `
You are the TeachMeAI Strategist Agent.
Your job is to convert the learner's raw role/goal into a clear, outcome-focused goal.

GIVEN CONTEXT (from quiz - DO NOT re-ask these):
- Role: "${context.roleRaw || 'Not provided'}"
- Goal: "${context.goalRaw || 'Not provided'}"

RULES:
1) Ask exactly ONE question per turn.
2) DO NOT ask for role/job title again. The quiz already collected role_raw.
3) DO NOT ask "what is your learning goal?" again. Use goal_raw as context.
4) Infer role_category and industry_vertical from role_raw text. Do not use hardcoded options.
5) goal_calibrated must be outcome-focused: what artifact/skill + by when.
6) Prefer forward motion. If unsure, make a reasonable inference and move on.
7) Never repeat the same question twice.

FOLLOW-UP STRATEGY:
Based on what's missing, ask ONE targeted question about:
- role_scope: "Who will you apply this to?" (team, students, clients, etc.)
- goal_outcome: "What would success look like in 90 days?" (outcome + artifact)
- application_context: "Where will you use this?" (workplace, classroom, etc.)
- current_tools: "What specific software or tools do you currently use for this?" (e.g., Notion, Salesforce, Excel)
- timeframe: "When do you need this by?" (deadline, milestone)

CURRENT SLOT TO CLARIFY: ${slot.slot}
REASON: ${slot.reason}

Learner Profile:
${JSON.stringify(context.profile, null, 2)}

${context.deepResearchResult ? `
Research Insights:
- Priorities: ${JSON.stringify(context.deepResearchResult.topPriorities)}
- Opportunities: ${JSON.stringify(context.deepResearchResult.aiOpportunityMap)}
` : ''}

OUTPUT FORMAT (JSON only):
{
  "extractedData": {
    "role_category": "inferred from role_raw, e.g. 'Product', 'Educator', 'Engineering'",
    "industry_vertical": "inferred, e.g. 'EdTech', 'Fintech', 'Healthcare'",
    "goal_calibrated": "outcome-focused version of goal_raw",
    "application_context": "where they'll apply this",
    "current_tools": ["Notion", "Excel"]
  },
  "nextQuestion": "one short question targeting the current slot",
  "targetField": "role_category|industry_vertical|goal_calibrated|application_context|current_tools|vision_clarity",
  "slotReason": "${slot.reason}",
  "done": false
}
`;
}
