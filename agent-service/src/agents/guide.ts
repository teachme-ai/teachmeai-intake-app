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
        console.log('🤖 [Agent Service] Processing Guide Flow (Strict State Restoration)...');

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
- If info is present in the CURRENT EXTRACTED DATA, do NOT ask for it again.
- If all info is present, thank the user and set 'isComplete: true'.

CURRENT EXTRACTED DATA:
${JSON.stringify(input.extractedData || {}, null, 2)}

CONVERSATION HISTORY:
${historyText}

Respond with the updated extractedData and completion status.
`;

        try {
            const { output } = await ai.generate({
                model: gemini20Flash,
                system: systemPrompt,
                prompt: "Continue the conversation. Extract all available data and set isComplete if all 4 fields are present.",
                output: { schema: QuizResponseSchema },
            });

            if (!output) throw new Error("AI returned no output");

            // STICKY DATA LOGIC: We never "forget" a field once it has been captured.
            const prev = input.extractedData || {};
            const next = output.extractedData || {};

            const isVal = (val: any) => typeof val === 'string' && val.trim().length > 1 && !val.toLowerCase().includes('not provided');

            const mergedData = {
                name: (isVal(next.name) ? next.name.trim() : (prev.name || "")),
                email: (isVal(next.email) ? next.email.trim().toLowerCase() : (prev.email || "")),
                role: (isVal(next.role) ? next.role.trim() : (prev.role || "")),
                learningGoal: (isVal(next.learningGoal) ? next.learningGoal.trim() : (prev.learningGoal || ""))
            };

            // Programmatic Validation
            const hasAll = !!(mergedData.name && mergedData.email && mergedData.role && mergedData.learningGoal);
            const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mergedData.email);

            // FORCE isComplete: If all valid data is present, we are DONE.
            const isComplete = hasAll && validEmail;

            // If we are auto-completing, ensure the message is a final confirmation
            let message = output.message;
            if (isComplete && !output.isComplete) {
                message = `Great! I have all your details. I've got your name as ${mergedData.name}, and I'll send the AI analysis for your role as a ${mergedData.role} to ${mergedData.email}. We're all set!`;
            }

            return {
                message,
                extractedData: mergedData,
                isComplete
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
