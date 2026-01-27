import { gemini20Flash } from '@genkit-ai/googleai';
import { QuizSessionSchema, QuizResponseSchema } from '../types';
import { ai } from '../genkit';

export const quizGuideFlow = ai.defineFlow(
    {
        name: 'quizGuideFlow',
        inputSchema: QuizSessionSchema,
        outputSchema: QuizResponseSchema,
    },
    async (input) => {
        console.log('🤖 [Agent Service] Processing Guide Flow (Form-First Logic)...');

        // QUICK BYPASS: If we already have the 4 nodes, don't even talk to the AI.
        // This makes the Form 100% reliable and prevents any hallucination loops.
        const d = input.extractedData || {};
        const hasName = typeof d.name === 'string' && d.name.trim().length > 1;
        const hasEmail = typeof d.email === 'string' && d.email.includes('@');
        const hasRole = typeof d.role === 'string' && d.role.trim().length > 1;
        const hasGoal = (typeof d.learningGoal === 'string' && d.learningGoal.trim().length > 1) ||
            (typeof (d as any).goal === 'string' && (d as any).goal.trim().length > 1);

        if (hasName && hasEmail && hasRole && hasGoal) {
            console.log('✅ [Agent Service] Data is full. Bypassing AI to ensure stability.');
            return {
                message: "Excellent! I have all your details. We're ready to start your AI analysis.",
                extractedData: {
                    name: String(d.name).trim(),
                    email: String(d.email).trim().toLowerCase(),
                    role: String(d.role).trim(),
                    learningGoal: String(d.learningGoal || (d as any).goal).trim()
                },
                isComplete: true
            };
        }

        // FALLBACK FOR CHAT: Only run AI if data is incomplete
        const historyText = (input.messages || [])
            .map(m => `${m.role.toUpperCase()}: ${m.content.substring(0, 200)}`)
            .slice(-4)
            .join('\n');

        const systemPrompt = `
You are the TeachMeAI Guide. Collect: Name, Email, Role, Goal.
Current Data: ${JSON.stringify(d)}
Recent History: ${historyText}
Rule: Be extremely brief (max 15 words). Extract data into the JSON.
`;

        try {
            const { output } = await ai.generate({
                model: gemini20Flash,
                system: systemPrompt,
                output: { schema: QuizResponseSchema },
            });

            if (!output) throw new Error("No output");

            return {
                message: output.message.substring(0, 200),
                extractedData: output.extractedData,
                isComplete: !!output.isComplete
            };
        } catch (error) {
            return {
                message: "Could you please tell me your professional role again?",
                extractedData: d,
                isComplete: false
            };
        }
    }
);
