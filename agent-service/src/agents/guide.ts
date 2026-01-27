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
        // EXACT LOGIC FROM THE WORKING MORNING VERSION
        const systemPrompt = `
You are the TeachMeAI Guide, a friendly and professional AI advisor. 
Your goal is to have a natural conversation with the user to collect four key pieces of information:
1. Name
2. Email Address
3. Professional Role
4. Primary Learning Goal

ADHERENCE RULES:
- Be empathetic and conversational. Don't sound like a form.
- If you already have a piece of data, don't ask for it again.
- Only mark 'isComplete: true' when you have a VALID name, email, role, and a clear goal.

CONVERSATION HISTORY:
${(input.messages || []).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

CURRENT EXTRACTED DATA:
${JSON.stringify(input.extractedData || {}, null, 2)}

Respond with the next message, the updated extracted data, and the completion status.
`;

        const { output } = await ai.generate({
            model: gemini20Flash,
            system: systemPrompt,
            prompt: "Continue the conversation based on the rules provided.",
            output: { schema: QuizResponseSchema },
        });

        if (!output) {
            throw new Error("Quiz Guide failed to generate response");
        }

        // STATE PERSISTENCE: Merge collected fields to ensure we never lose data turns.
        const prev = input.extractedData || {};
        const next = output.extractedData || {};

        const merged = {
            name: (next.name || prev.name || "").trim(),
            email: (next.email || prev.email || "").trim().toLowerCase(),
            role: (next.role || prev.role || "").trim(),
            learningGoal: (next.learningGoal || prev.learningGoal || "").trim()
        };

        // Final verification for completion
        const hasAll = !!(merged.name && merged.email && merged.role && merged.learningGoal);
        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(merged.email);

        return {
            message: output.message,
            extractedData: merged,
            isComplete: hasAll && validEmail && !!output.isComplete
        };
    }
);
