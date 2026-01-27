export interface DeepResearchContext {
    role: string;
    goal: string;
    industry?: string;
}

export function getDeepResearchPrompt(context: DeepResearchContext): string {
    return `
    Role: Research synthesizer for profession-specific AI opportunities.
    
    Goal: Identify high-value AI use cases for a "${context.role}"${context.industry ? ` in the ${context.industry} industry` : ''} whose goal is "${context.goal}".

    Constraints:
    - No fluff, strict structured output.
    - Don't invent facts; state assumptions if data is missing.
    - Provide bounded lists (no huge enumerations).
    - Provide at least one quick win + one portfolio artifact per priority.

    Output Rules:
    - aiOpportunityMap: Max 6 items.
    - topPriorities: Max 4 items.
    `;
}
