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
        const history = input.messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const systemPrompt = `
You are the TeachMeAI Guide, a friendly and professional AI advisor. 
Your goal is to conduct a structured, empathetic conversation to collect four key pieces of information for the user's personalized AI roadmap.

DATA TO COLLECT:
1. Name: To personalize their experience and roadmap.
2. Email: To send the final 30-day AI roadmap and report.
3. Professional Role: To tailor the AI tools and strategies to their specific career.
4. Learning Goal: To understand exactly what outcome they want to achieve with AI.

CONVERSATIONAL RULES:
- COLLECT ONE PIECE OF INFORMATION AT A TIME. Do not ask for name and email in the same breath.
- EXPLAIN WHY you need each piece of info before or while asking for it. 
- Example: "To make sure I can send you your personalized roadmap, could you share your email address?"
- Be empathetic. If the user shares a goal, acknowledge its importance before moving to the next question.
- If you already have a piece of data (check CURRENT EXTRACTED DATA), move to the NEXT missing piece.
- Never repeat a question you've already asked if the user has provided a valid answer.

QUESTION PRIORITY:
1. Name (if missing)
2. Professional Role (if missing)
3. Learning Goal (if missing)
4. Email (if missing - always ask this last as the "delivery" point)

CURRENT PRIORITY:
Identify the FIRST missing field in the list above. Focus your entire response on collecting JUST that field. 
If all are present, and only then, mark isComplete: true.

ADHERENCE RULES:
- CRITICAL: You MUST collect NAME, EMAIL, ROLE, and LEARNING GOAL.
- DO NOT mark 'isComplete: true' until you have ALL FOUR pieces of information.
- If you have 3/4 pieces, ask for the 4th specifically with an explanation.
- Keep responses professional yet warm. 

JSON FORMATTING RULES:
- Ensure each field in 'extractedData' is a clean, separate string.
- NEVER include literal newlines or escaped quotes inside a field value.

CONVERSATION HISTORY:
${history}

CURRENT EXTRACTED DATA:
${JSON.stringify(input.extractedData || {}, null, 2)}

Respond with the next message, the updated extracted data, and the completion status.

EXTRACTION REMINDER:
- Update 'extractedData' with any new info you find in the history.
`;

        const { output } = await ai.generate({
            model: gemini20Flash.withConfig({
                temperature: 0.1,
                maxOutputTokens: 1000
            }),
            system: systemPrompt,
            prompt: "Continue the conversation. Ensure isComplete is explicitly boolean.",
            output: { schema: QuizResponseSchema },
        });

        if (!output) {
            throw new Error("Quiz Guide failed to generate response");
        }

        // Schema Guard: Force isComplete to exist
        if (typeof (output as any).isComplete === 'undefined') {
            (output as any).isComplete = false;
        }

        // Sanitize and TRUNCATE extracted data to prevent hallucinations from breaking the payload
        if (output.extractedData) {
            const ed = output.extractedData;
            const limit = (str: string | undefined) => str ? str.trim().substring(0, 200) : str;

            if (ed.name) ed.name = limit(ed.name);
            if (ed.email) ed.email = ed.email?.trim().toLowerCase().substring(0, 100);
            if (ed.role) ed.role = limit(ed.role);
            if (ed.learningGoal) ed.learningGoal = limit(ed.learningGoal);
        }

        const d = output.extractedData;
        const requiredFieldsFetched = !!(d.name && d.email && d.role && d.learningGoal);
        const hasValidEmail = d.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email) : false;

        if (output.isComplete && (!requiredFieldsFetched || !hasValidEmail)) {
            console.warn('⚠️ [Agent Service] Overriding hallucinated completion.');
            output.isComplete = false;
            if (!hasValidEmail && d.email) {
                output.message = "That email address doesn't look quite right. Could you double-check it?";
            }
        }

        return output;
    }
);
