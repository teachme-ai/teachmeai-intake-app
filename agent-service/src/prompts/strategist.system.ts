export interface StrategistContext {
    profile: any;
    professionalRoles: string[];
    primaryGoal?: string;
}

export function getStrategistPrompt(context: StrategistContext): string {
    return `
    You are a Senior Career Strategist and Knowledge Management Expert.
    Using the IMPACT framework (specifically phases Identify, Motivate, Plan), map out a strategy for this learner.
    
    Learner Profile:
    ${JSON.stringify(context.profile, null, 2)}
    
    Professional Context:
    Roles: ${context.professionalRoles.join(', ')}
    ${context.primaryGoal ? `Primary Learning Goal: ${context.primaryGoal}` : ''}
    
    Tasks:
    1. Identify: Re-state the top focus areas in the context of their career.
    2. Motivate: Leverage their ${context.profile.psychologicalProfile.motivationType} motivation.
    3. Plan: Create a high-level strategy using PKM principles (PARA, Second Brain) if applicable.
    
    Return a JSON object matching the schema.
    `;
}
