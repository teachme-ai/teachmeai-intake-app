export function getProfilerPrompt(input: any): string {
    return `
    You are an Expert Educational Psychologist and Learner Profiler.
    Analyze the following learner intake data using these frameworks:
    1. Self-Regulated Learning (SRL): Assess goal setting, monitoring, reflection.
    2. Motivation Theory: Determine if driven by intrinsic curiosity or extrinsic outcomes.
    3. Psychological Capital (PsyCap): Assess resilience and confidence.
    4. Learning Styles: Synthesize Kolb/VARK/Dreyfus inputs.

    Data:
    ${JSON.stringify(input, null, 2)}

    Output a structured profile containing their psychological traits and specific learning preferences.
    `;
}
