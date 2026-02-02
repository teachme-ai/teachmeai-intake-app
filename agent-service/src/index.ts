import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { supervisorFlow } from './agents/supervisor';
import { quizGuideFlow } from './agents/guide';
import { saveLeadToSheet } from './intake/leads';
import { persistIntakeState } from './intake/persist';

const app = express();
app.use(cors());
app.use(express.json());

// Add a root GET handler so the user can verify the service is alive in a browser
app.get('/', (req: Request, res: Response) => {
    res.send('✅ TeachMeAI Agent Service is LIVE and ready for analysis! Send POST requests to /supervisorFlow or /quizGuide');
});

// Expose the quiz guide flow
app.post('/quizGuide', async (req: Request, res: Response) => {
    try {
        console.log('🚀 [Backend] Received request for quizGuide');

        // Payload Contract Log (keys + flags, no PII)
        const keys = Object.keys(req.body);
        const flags = {
            hasState: !!req.body.state,
            hasUserMessage: !!req.body.userMessage,
            hasSessionId: !!req.body.state?.sessionId,
            hasRoleRaw: !!req.body.state?.fields?.role_raw?.value,
            hasGoalRaw: !!req.body.state?.fields?.goal_raw?.value,
            hasEmail: !!req.body.state?.fields?.email?.value,
            turnCount: req.body.state?.turnCount ?? -1
        };
        console.log(JSON.stringify({
            event: 'quizGuide.payload_shape',
            keys,
            flags,
            sizeBytes: JSON.stringify(req.body).length
        }));

        console.log('📦 [Backend] Request Body:', JSON.stringify(req.body, null, 2));
        const result = await quizGuideFlow(req.body);
        res.json({ result });
    } catch (error) {
        console.error('💥 [Backend] Quiz Error:', error);
        const msg = error instanceof Error ? error.message : 'Unknown Quiz Error';
        res.status(500).send(`Error in Quiz Guide: ${msg}`);
    }
});

// Handoff endpoint to bypass Vercel WAF
app.post('/handoff', async (req: Request, res: Response) => {
    try {
        console.log('🚀 [Backend] Received handoff lead');
        const leadId = await saveLeadToSheet(req.body);

        const baseUrl = process.env.INTAKE_APP_URL || 'https://teachmeai-intake-app.vercel.app';
        const redirectUrl = `${baseUrl}/intake?lead_id=${leadId}`;

        console.log('✅ [Backend] Lead persisted:', leadId);
        res.json({
            status: 'success',
            lead_id: leadId,
            redirect_url: redirectUrl
        });
    } catch (error: any) {
        console.error('💥 [Backend] Handoff Error:', error);
        const msg = error.message || 'Handoff failed';
        res.status(500).json({ status: 'error', message: msg, details: error.errors || error });
    }
});

// Expose the flow via Express
app.post('/supervisorFlow', async (req: Request, res: Response) => {
    try {
        console.log('🚀 [Backend] Received request for supervisorFlow');
        if (!req.body || !req.body.data) {
            console.error('❌ [Backend] Missing data in request body');
            return res.status(400).send('Missing data in request');
        }

        console.log('🧠 [Backend] Starting AI Agents...');
        const result = await supervisorFlow(req.body.data);
        console.log('✅ [Backend] AI Agents finished successfully');

        // PERSIST the results if a sessionId is provided
        const sessionId = req.body.sessionId || req.body.data.sessionId;
        if (sessionId) {
            console.log(`💾 [Backend] Persisting analysis for session: ${sessionId}`);
            // Construct a minimal state for persistence
            const minimalState: any = {
                sessionId,
                metadata: { startTime: new Date().toISOString(), mode: 'interview' },
                fields: {
                    name: { value: req.body.data.name || '' },
                    email: { value: req.body.data.email || '' },
                    role_raw: { value: (req.body.data.currentRoles || [])[0] || '' },
                    goal_raw: { value: req.body.data.primaryGoal || '' }
                },
                isComplete: true,
                turnCount: 99 // indicate final turn
            };
            await persistIntakeState(minimalState, result);
        }

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
