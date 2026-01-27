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
        const history = input.messages.slice(-10).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const systemPrompt = GUIDE_SYSTEM_PROMPT
            .replace('{{CURRENT_DATA}}', JSON.stringify(input.extractedData || {}, null, 2))
            .replace('{{HISTORY}}', history);

        const { output } = await ai.generate({
            model: gemini20Flash.withConfig({
                temperature: 0.1,
                maxOutputTokens: 500
            }),
            system: systemPrompt,
            output: { schema: QuizResponseSchema },
        });

        if (!output) {
            throw new Error("Quiz Guide failed to generate response");
        }

        // Final Safeguard: Ensure isComplete is boolean
        const result = {
            message: output.message,
            extractedData: output.extractedData || {},
            isComplete: !!output.isComplete
        };

        // Sanitize and Truncate to prevent long hallucinations from breaking the pipe
        const d = result.extractedData;
        const limit = (s: string | undefined) => s ? s.trim().substring(0, 150) : "";

        d.name = limit(d.name);
        d.email = limit(d.email).toLowerCase();
        d.role = limit(d.role);
        d.learningGoal = limit(d.learningGoal);

        // Verification Logic
        const hasAll = !!(d.name && d.email && d.role && d.learningGoal);
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email);

        if (result.isComplete && (!hasAll || !validEmail)) {
            console.warn('⚠️ [Agent Service] Rejecting hallucinated completion.');
            result.isComplete = false;
        }

        return result;
    }
);
