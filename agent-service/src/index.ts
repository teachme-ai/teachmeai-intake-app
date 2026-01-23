import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { startFlowsServer } from '@genkit-ai/flow';

// Initialize Genkit
export const ai = genkit({
    plugins: [googleAI()],
});

// Import flows to register them
import './agents/profiler';
import './agents/strategist';
import './agents/tactician';
import './agents/supervisor';

// Start the server
startFlowsServer();
