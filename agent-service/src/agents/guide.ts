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
        const systemPrompt = `
You are the TeachMeAI Guide, a friendly and professional AI advisor. 
Your goal is to have a natural conversation with the user to collect three key pieces of information for their personalized AI roadmap:
1. Their Name
2. Their Email Address (to send the report)
3. Their Primary Learning Goal (what they want to achieve with AI)

ADHERENCE RULES:
- Be empathetic and conversational. Don't sound like a form.
- If you already have a piece of data, don't ask for it again.
- If the user provides a goal, acknowledge it with enthusiasm and explain how the full analysis will help.
- Only mark 'isComplete: true' when you have a VALID name, email, and a clear goal.
- If the user asks questions about TeachMeAI, answer them briefly but steer back to the collection.
- TeachMeAI helps professionals build real AI capability in 30-90 days through structured, psychological-science-backed roadmap.

CONVERSATION HISTORY:
${input.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

CURRENT EXTRACTED DATA:
${JSON.stringify(input.extractedData || {}, null, 2)}

Respond with the next message, the updated extracted data, and the completion status.
`;

        const { output } = await ai.generate({
            model: gemini20Flash,
            system: systemPrompt,
            // We pass the messages as history if needed, but for now we rely on the system prompt construction
            // for absolute control over the extraction logic.
            prompt: "Continue the conversation based on the rules provided.",
            output: { schema: QuizResponseSchema },
        });

        if (!output) {
            throw new Error("Quiz Guide failed to generate response");
        }

        return output;
    }
);
