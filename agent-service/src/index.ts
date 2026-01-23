import { ai } from './genkit';

// Import agents to ensure they are registered with the 'ai' instance
import './agents/profiler';
import './agents/strategist';
import './agents/tactician';
import './agents/supervisor';

// Start the server using the genkit instance method
ai.startFlowsServer();
