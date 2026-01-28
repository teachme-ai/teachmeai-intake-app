import * as dotenv from 'dotenv';
dotenv.config();

import { genkit } from 'genkit';
import { googleAI, gemini20Flash } from '@genkit-ai/googleai';



export const ai = genkit({
    plugins: [
        googleAI({
            apiKey: process.env.GEMINI_API_KEY
        })
    ],
});

export const DEFAULT_MODEL = 'googleai/gemini-1.5-flash';
export const INTAKE_MODEL = 'googleai/gemini-1.5-flash';
export const REPORT_MODEL = 'googleai/gemini-1.5-pro'; // Or 2.0 Pro when available



