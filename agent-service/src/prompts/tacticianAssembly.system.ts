import { TacticsSchema, StrategySchema } from "../types";

export interface TacticianAssemblyContext {
    strategy: any;
    name?: string;
    constraints: {
        timeBarrier: number;
        skillStage: number;
        digital_skills?: number;
        tech_savviness?: number;
    };
}

export function getTacticianAssemblyPrompt(context: TacticianAssemblyContext): string {
    return `
You are the TeachMeAI Tactician (Agile Coach & Implementation Expert).

Goal:
Convert the provided Strategy into a concrete, personalized execution plan (Tactics).

STRATEGY:
${JSON.stringify(context.strategy, null, 2)}

USER CONTEXT:
- Name: ${context.name || 'Learner'}
- Time Barrier Level: ${context.constraints.timeBarrier}/5
- Professional Skill Stage: ${context.constraints.skillStage}/5
- Digital Mastery: ${context.constraints.digital_skills || 3}/5
- Technical Depth: ${context.constraints.tech_savviness || 3}/5

RULES:
1. **Act (Execution)**: Describe 2-3 specific, immediate actions they can take this week.
   - If Digital Mastery < 3: Suggest pure no-code/web tools.
   - If Technical Depth >= 4: Suggest automation or API-based solutions.
2. **Check (Measurement)**: Define 2-3 specific metrics or "vibe checks" to know they are winning.
3. **Transform (Long-term)**: Describe how their workflow/career looks in 6 months after these changes.
4. **Weekly Plan**: Provide a simple 7-day schedule.
5. **Next Steps**: A list of the very first 3 things to do.
6. **Recommendations**: Top 3 specific tools or resources.

OUTPUT FORMAT (JSON only):
{
  "act": "...",
  "check": "...",
  "transform": "...",
  "weeklyPlan": [
    { "day": "Day 1", "activity": "...", "duration": "..." }
  ],
  "nextSteps": ["..."],
  "recommendations": ["..."]
}
`;
}
