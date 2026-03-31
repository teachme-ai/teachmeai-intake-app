import { googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const ai = genkit({
    plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});

async function listModels() {
    console.log("Listing available actions in Genkit...");
    const actions = await ai.listActions();
    const models = actions.filter(a => a.name.startsWith('model/'));
    
    console.log("\nRegistered models:");
    models.forEach(m => console.log(` - ${m.name}`));
}

listModels().catch(console.error);
