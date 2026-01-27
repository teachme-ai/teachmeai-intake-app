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

        // Filter and map messages
        const allMessages = (input.messages || [])
            .filter(m => m && m.content && (m.role === 'user' || m.role === 'model'));

        // GEMINI STABILITY FIX: History must start with a 'user' message.
        // If the first message is 'model' (UI greeting), we skip it.
        let startIndex = 0;
        while (startIndex < allMessages.length && allMessages[startIndex].role !== 'user') {
            startIndex++;
        }

        const validHistory = allMessages.slice(startIndex).map(m => ({
            role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
            content: [{ text: m.content }]
        }));

        // Genkit best practice: Separate history and the current prompt
        const promptMessage = validHistory.pop();
        const history = validHistory;

        const systemPrompt = GUIDE_SYSTEM_PROMPT
            .replace('{{CURRENT_DATA}}', JSON.stringify(input.extractedData || {}, null, 2));

        try {
            console.log(`💬 [Agent Service] Sending to AI: ${promptMessage?.content[0]?.text || 'No prompt'}`);

            const { output } = await ai.generate({
                model: gemini20Flash,
                system: systemPrompt,
                history: history,
                prompt: promptMessage?.content[0]?.text || "Hello",
                output: { schema: QuizResponseSchema },
            });

            if (!output) throw new Error("AI returned empty output");

            const clean = (s: any) => typeof s === 'string' ? s.trim().substring(0, 500) : "";
            const d = output.extractedData || {};

            return {
                message: output.message || "Next step?",
                extractedData: {
                    name: clean(d.name),
                    email: clean(d.email).toLowerCase(),
                    learningGoal: clean(d.learningGoal),
                    role: clean(d.role)
                },
                isComplete: !!output.isComplete
            };
        } catch (error: any) {
            console.error('💥 [Agent Service] AI CRASH:', error.message || error);
            return {
                message: "I'm processing that right now! Please tell me your name to begin.",
                extractedData: input.extractedData || {},
                isComplete: false
            };
        }
    }
);
