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
        console.log('Received request for supervisorFlow');
        // In Genkit v1.0, flows are functions that can be called directly
        const result = await supervisorFlow(req.body.data);
        res.json({ result });
    } catch (error) {
        console.error('Flow execution failed:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal Server Error'
        });
    }
});

// Cloud Run provides the PORT environment variable
const port = process.env.PORT || 3400;
app.listen(port, () => {
    console.log(`Agent Service listening on port ${port}`);
    console.log(`Endpoint available at POST /supervisorFlow`);
});
