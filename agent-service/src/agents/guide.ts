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
        console.log('🤖 [Agent Service] Processing Guide Flow (Atomic Stabilized)...');

        // SANITIZE HISTORY: Prevent previous hallucinations from feeding back into the model
        const historyText = (input.messages || [])
            .map(m => {
                const content = (m.content || "").substring(0, 300); // Strict limit on history context
                return `${m.role.toUpperCase()}: ${content}`;
            })
            .slice(-6) // Only look at last 6 messages
            .join('\n');

        const systemPrompt = `
You are the TeachMeAI Guide. Your ONE AND ONLY goal is to collect: Name, Email, Professional Role, and Learning Goal.

CURRENT STATE:
${JSON.stringify(input.extractedData || {}, null, 2)}

CONVERSATION HISTORY:
${historyText}

RULES:
- Be brief. No long sentences.
- Use CURRENT STATE to see what is already collected.
- If all 4 are present, set isComplete=true.
- Do NOT repeat yourself. Do NOT hallucinate.
- Just provide the next short conversational response and the data.
`;

        try {
            const { output } = await ai.generate({
                model: gemini20Flash,
                system: systemPrompt,
                output: { schema: QuizResponseSchema },
            });

            if (!output) throw new Error("AI returned no output");

            // STICKY DATA LOGIC: Merge new findings with previous state
            const prev: any = input.extractedData || {};
            const next: any = output.extractedData || {};

            const isVal = (val: any) => typeof val === 'string' && val.trim().length > 1 && !val.toLowerCase().includes('not provided');

            const mergedData = {
                name: isVal(next.name) ? String(next.name).trim().substring(0, 60) : (prev.name || ""),
                email: isVal(next.email) ? String(next.email).trim().toLowerCase().substring(0, 100) : (prev.email || ""),
                role: isVal(next.role) ? String(next.role).trim().substring(0, 100) : (prev.role || ""),
                learningGoal: isVal(next.learningGoal) ? String(next.learningGoal).trim().substring(0, 200) : (prev.learningGoal || "")
            };

            const hasAll = !!(mergedData.name && mergedData.email && mergedData.role && mergedData.learningGoal);
            const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mergedData.email);
            const isComplete = hasAll && validEmail;

            return {
                message: (output.message || "Next step?").substring(0, 500),
                extractedData: mergedData,
                isComplete
            };
        } catch (error: any) {
            console.error('💥 [Agent Service] Atomic Stabilizer Triggered:', error.message || error);
            return {
                message: "I'm having a bit of a moment! Could you please tell me your professional role again so I can get back on track?",
                extractedData: input.extractedData || {},
                isComplete: false
            };
        }
    }
);
