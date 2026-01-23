import { startFlowsServer } from '@genkit-ai/flow';

// Import flows to register them
import './agents/profiler';
import './agents/strategist';
import './agents/tactician';
import './agents/supervisor';

// Start the server
startFlowsServer();
