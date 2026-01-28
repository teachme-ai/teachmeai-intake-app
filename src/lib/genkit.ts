import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';


export const ai = genkit({
    plugins: [
        googleAI({
            // Note: The user is regenerating the key and will place it in .env.local
            // We use process.env to ensure it's loaded from the system environment
            apiKey: process.env.GEMINI_API_KEY
        })
    ],
});

export const DEFAULT_MODEL = 'googleai/gemini-2.0-flash';
export const INTAKE_MODEL = 'googleai/gemini-2.0-flash';
export const REPORT_MODEL = 'googleai/gemini-1.5-pro';



