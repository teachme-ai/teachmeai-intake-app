import { gemini20Flash } from '@genkit-ai/googleai';
import { GUIDE_SYSTEM_PROMPT } from '../prompts/guide.system';
import { QuizSessionSchema, QuizResponseSchema } from '../types';
import { ai } from '../genkit';

export const quizGuideFlow = ai.defineFlow(
    {
        name: 'quizGuideFlow',
        inputSchema: QuizSessionSchema,
        outputSchema: QuizResponseSchema,
    },
    async (input) => {
        console.log('🤖 [Agent Service] Processing Guide Flow...');

        // Map messages correctly for Genkit/Gemini
        // Ensure role is exactly 'user' or 'model'
        const messages: any[] = (input.messages || [])
            .filter(m => m && m.content && (m.role === 'user' || m.role === 'model'))
            .map(m => ({
                role: m.role as 'user' | 'model',
                content: [{ text: m.content }]
            }));

        const systemPrompt = GUIDE_SYSTEM_PROMPT
            .replace('{{CURRENT_DATA}}', JSON.stringify(input.extractedData || {}, null, 2));

        try {
            const { output } = await ai.generate({
                model: gemini20Flash,
                system: systemPrompt,
                messages: messages,
                output: { schema: QuizResponseSchema },
            });

            if (!output) {
                throw new Error("Quiz Guide failed to generate response");
            }

            // Clean data
            const clean = (s: any) => typeof s === 'string' ? s.trim().substring(0, 500) : "";
            const d = output.extractedData || {};

            return {
                message: output.message || "I missed that. Could you repeat?",
                extractedData: {
                    name: clean(d.name),
                    email: clean(d.email).toLowerCase(),
                    learningGoal: clean(d.learningGoal),
                    role: clean(d.role)
                },
                isComplete: !!output.isComplete
            };
        } catch (error) {
            console.error('💥 [Agent Service] AI Generate Error:', error);
            // Fallback object to prevent schema crash if AI flakes
            return {
                message: "I'm processing that right now! Could you please repeat your last point so I can make sure I've got it saved correctly?",
                extractedData: input.extractedData || {},
                isComplete: false
            };
        }
    }
);
