import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    console.log("Fetching available models from Google AI REST API (v1beta)...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            console.error(`Error ${resp.status}: ${await resp.text()}`);
            return;
        }
        
        const data = await resp.json();
        console.log("\nAvailable Models:");
        data.models.forEach((m: any) => {
            console.log(` - ${m.name} [${m.supportedGenerationMethods.join(', ')}]`);
        });
    } catch (e: any) {
        console.error("Failed to fetch models:", e.message);
    }
}

listModels();
