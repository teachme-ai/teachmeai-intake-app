import express from 'express';
import cors from 'cors';
import { supervisorFlow } from './agents/supervisor';

const app = express();
app.use(cors());
app.use(express.json());

// Add a root GET handler so the user can verify the service is alive in a browser
app.get('/', (req, res) => {
    res.send('✅ TeachMeAI Agent Service is LIVE and ready for analysis! Send POST requests to /supervisorFlow');
});

// Expose the flow via Express
app.post('/supervisorFlow', async (req, res) => {
    try {
        console.log('🚀 [Backend] Received request for supervisorFlow');
        if (!req.body || !req.body.data) {
            console.error('❌ [Backend] Missing data in request body');
            return res.status(400).send('Missing data in request');
        }

        console.log('🧠 [Backend] Starting AI Agents...');
        const result = await supervisorFlow(req.body.data);
        console.log('✅ [Backend] AI Agents finished successfully');
        res.json({ result });
    } catch (error) {
        console.error('💥 [Backend] AI ERROR:', error);
        const msg = error instanceof Error ? error.message : 'Unknown AI error';
        res.status(500).send(`Agent Error: ${msg}`);
    }
});

// Cloud Run provides the PORT environment variable
const port = process.env.PORT || 3400;
app.listen(port, () => {
    console.log(`Agent Service listening on port ${port}`);
    console.log(`Endpoint available at POST /supervisorFlow`);
});
