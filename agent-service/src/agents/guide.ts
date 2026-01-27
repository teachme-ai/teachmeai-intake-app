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
        console.log('🤖 [Agent Service] Processing Guide Flow (Restoration Mode)...');

        const historyText = (input.messages || [])
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n');

        const systemPrompt = `
You are the TeachMeAI Guide, a friendly and professional AI advisor. 
Your goal is to have a natural conversation with the user to collect four key pieces of information for their personalized AI roadmap:
1. Their Name
2. Their Email Address
3. Their Professional Role (succinct job title)
4. Their Primary Learning Goal (what they want to achieve with AI)

ADHERENCE RULES:
- Be empathetic and conversational. Don't sound like a form.
- If you already have a piece of data, don't ask for it again.
- If the user provides multiple pieces of info at once, update all of them in 'extractedData'.
- Only mark 'isComplete: true' when you have ALL FOUR pieces of information.
- If information is missing, use empty string "" in 'extractedData'.
- Use the CURRENT DATA below to keep track of what you have.

CURRENT DATA:
${JSON.stringify(input.extractedData || {}, null, 2)}

CONVERSATION HISTORY:
${historyText}

Respond with a JSON object:
{
  "message": "your next conversational response",
  "extractedData": { "name": "...", "email": "...", "role": "...", "learningGoal": "..." },
  "isComplete": boolean
}
`;

        try {
            const { output } = await ai.generate({
                model: gemini20Flash,
                prompt: systemPrompt, // Passing the whole context as one prompt is what worked this morning
                output: { schema: QuizResponseSchema },
            });

            if (!output) throw new Error("AI returned no response");

            // Safeguard: Ensure isComplete isn't hallucinated early
            const d = output.extractedData;
            const hasAll = !!(d.name && d.email && d.role && d.learningGoal);
            const isComplete = hasAll && !!output.isComplete;

            return {
                message: output.message,
                extractedData: {
                    name: (d.name || "").substring(0, 100),
                    email: (d.email || "").toLowerCase().substring(0, 100),
                    role: (d.role || "").substring(0, 100),
                    learningGoal: (d.learningGoal || "").substring(0, 200)
                },
                isComplete
            };
        } catch (error: any) {
            console.error('💥 [Agent Service] AI Flow Error:', error);
            // Fallback that keeps the convo moving
            return {
                message: "I'm processing that! Could you please repeat your last point so I can save it correctly?",
                extractedData: input.extractedData || {},
                isComplete: false
            };
        }
    }
);
