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
        console.log('🤖 [Agent Service] Processing Guide Flow (Morning Restoration + Full States)...');

        const historyText = (input.messages || [])
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n');

        const systemPrompt = `
You are the TeachMeAI Guide, a friendly and professional AI advisor. 
Your goal is to have a natural conversation with the user to collect four key pieces of information:
1. Name
2. Email Address
3. Professional Role (succinct job title)
4. Primary Learning Goal (what they want to achieve with AI)

RULES:
- Be empathetic and conversational.
- Update the 'extractedData' object with any info found in the history.
- ALWAYS return the full 'extractedData' object with ALL previously collected information and any new information.
- DO NOT leave previously collected fields empty in the response.
- Only mark 'isComplete: true' when ALL FOUR fields (name, email, role, learningGoal) are present and valid.

CURRENT EXTRACTED DATA (Keep these and add new ones):
${JSON.stringify(input.extractedData || {}, null, 2)}

CONVERSATION HISTORY:
${historyText}

Return valid JSON with 'message', 'extractedData', and 'isComplete'.
`;

        try {
            const { output } = await ai.generate({
                model: gemini20Flash,
                system: systemPrompt,
                prompt: "Continue the conversation and update the extracted data.",
                output: { schema: QuizResponseSchema },
            });

            if (!output) throw new Error("AI returned no output");

            // Merge with input data to ensure we never lose states if AI forgets a field
            const prev = input.extractedData || {};
            const next = output.extractedData || {};

            const mergedData = {
                name: (next.name || prev.name || "").substring(0, 100),
                email: (next.email || prev.email || "").toLowerCase().trim().substring(0, 100),
                role: (next.role || prev.role || "").substring(0, 100),
                learningGoal: (next.learningGoal || prev.learningGoal || "").substring(0, 300)
            };

            const hasAll = !!(mergedData.name && mergedData.email && mergedData.role && mergedData.learningGoal);
            const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mergedData.email);

            return {
                message: output.message,
                extractedData: mergedData,
                isComplete: hasAll && validEmail && !!output.isComplete
            };
        } catch (error: any) {
            console.error('💥 [Agent Service] AI Flow Error:', error);
            return {
                message: "I'm processing that! Could you please repeat your last point so I can save it correctly?",
                extractedData: input.extractedData || {},
                isComplete: false
            };
        }
    }
);
