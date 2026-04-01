import { gemini20Flash } from '@genkit-ai/googleai';
import { getTacticianAssemblyPrompt } from '../prompts/tacticianAssembly.system';
import { StrategySchema, TacticsSchema } from '../types';
import { logger } from '../utils/logger';
import { z } from 'zod';
import { DEFAULT_MODEL, ai } from '../genkit';
import { costTracker } from '../utils/costTracker';

const TacticianInput = z.object({
    strategy: StrategySchema,
    name: z.string().optional(),
    constraints: z.object({
        timeBarrier: z.number(),
        skillStage: z.number(),
        digital_skills: z.number().optional(),
        tech_savviness: z.number().optional()
    }),
    learnerType: z.enum(['theorist', 'activist', 'reflector', 'pragmatist']).optional(),
    constraintsList: z.array(z.string()).optional(),
    currentTools: z.array(z.string()).optional(),
    timePerWeekMins: z.number().optional(),
    frustrations: z.string().optional(),
    varkPrimary: z.enum(['visual', 'audio', 'read_write', 'kinesthetic']).optional(),
    motivationType: z.enum(['intrinsic', 'outcome', 'hybrid']).optional(),
});

export const tacticianFlow = ai.defineFlow(
    {
        name: 'tacticianFlow',
        inputSchema: TacticianInput,
        outputSchema: TacticsSchema,
    },
    async (input) => {
        const log = logger.child({ component: 'Tactician' });
        log.info({ event: 'tactician.start', msg: 'Assembling tactical learning steps...' });
        const prompt = getTacticianAssemblyPrompt({
            strategy: input.strategy,
            name: input.name,
            constraints: input.constraints,
            learnerType: input.learnerType,
            constraintsList: input.constraintsList,
            currentTools: input.currentTools,
            timePerWeekMins: input.timePerWeekMins,
            frustrations: input.frustrations,
            varkPrimary: input.varkPrimary,
            motivationType: input.motivationType,
        });

        const response = await ai.generate({
            model: DEFAULT_MODEL,
            prompt: prompt,
            output: { schema: TacticsSchema },
        });


        const { output, usage } = response;
        if (usage) {
            costTracker.addCall('Tactician', 'gemini-2.5-flash', {
                promptTokens: usage.inputTokens || 0,
                completionTokens: usage.outputTokens || 0,
                totalTokens: usage.totalTokens || 0
            });
        }

        if (!output) {
            throw new Error("Tactician Agent failed to generate output");
        }

        return output;
    }
);
