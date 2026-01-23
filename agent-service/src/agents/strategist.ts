import { gemini15Pro } from '@genkit-ai/googleai';
import { LearnerProfileSchema, StrategySchema } from '../types';
import { z } from 'zod';
import { ai } from '../index';

export const StrategistInputSchema = z.object({
    profile: LearnerProfileSchema,
    professionalRoles: z.array(z.string()),
    careerVision: z.string().optional(),
});

export const strategistFlow = ai.defineFlow(
    {
        name: 'strategistFlow',
        inputSchema: StrategistInputSchema,
        outputSchema: StrategySchema,
    },
    async (input) => {
        const prompt = `
    You are a Senior Career Strategist and Knowledge Management Expert.
    Using the IMPACT framework (specifically phases Identify, Motivate, Plan), map out a strategy for this learner.
    
    Learner Profile:
    ${JSON.stringify(input.profile, null, 2)}
    
    Professional Context:
    Roles: ${input.professionalRoles.join(', ')}
    
    Tasks:
    1. Identify: Re-state the top focus areas in the context of their career.
    2. Motivate: Leverage their ${input.profile.psychologicalProfile.motivationType} motivation.
    3. Plan: Create a high-level strategy using PKM principles (PARA, Second Brain) if applicable.
    
    Return a JSON object matching the schema.
    `;

        const { output } = await ai.generate({
            model: gemini15Pro,
            prompt: prompt,
            output: { schema: StrategySchema },
        });

        if (!output) {
            throw new Error("Strategist Agent failed to generate output");
        }

        return output;
    }
);
