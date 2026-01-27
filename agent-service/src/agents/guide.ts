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

        const KNOWLEDGE_BASE = `
BUSINESS CONTEXT:
- TeachMeAI helps professionals and organizations adopting AI to increase revenue and productivity.
- Offerings:
  1. Free AI Analysis (Lead Magnet): A 3-5 page report based on this quiz.
  2. Clarity Call (₹2,600): 1:1 consultation to identify specific AI opportunities.
  3. Deep Dive Package (₹6,000): Comprehensive strategy and tool selection.
  4. Ongoing Programs (₹8,600+): Implementation support and training.
- Target Audience: Marketing/Sales (Tier 1), Mid-Career Professionals, Teachers, and Business Leaders.
- Value Proposition: Moving beyond "chatbots" to strategic AI implementation for measurable ROI.
`;

        const systemPrompt = `
You are the TeachMeAI Guide. Your goal is to collect: Name, Role, Learning Goal, and Email.

RULES:
1. Ask for ONE thing at a time.
2. If the user asks questions about TeachMeAI, use the BUSINESS KNOWLEDGE BASE below to answer briefly, then gently steer back to the quiz.
3. Update the 'extractedData' object with any info found in the history.
4. DO NOT use placeholders. If info is missing, leave the field as an empty string "" in the JSON.
5. Mark 'isComplete: true' ONLY when all 4 fields (Name, Role, Goal, Email) are present and valid.

BUSINESS KNOWLEDGE BASE:
${KNOWLEDGE_BASE}

CURRENT DATA:
${JSON.stringify(input.extractedData || {})}

HISTORY:
${history}

CONSTRAINTS:
- No long explanations.
- No placeholders like "waiting for user".
- Just the next conversational message and the data.
`;

        const { output } = await ai.generate({
            model: gemini20Flash.withConfig({
                temperature: 0.1,
                maxOutputTokens: 800
            }),
            system: systemPrompt,
            prompt: "Respond. Ensure isComplete is boolean.",
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
