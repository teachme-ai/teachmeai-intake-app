import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { supervisorFlow } from './agents/supervisor';
import { quizGuideFlow } from './agents/guide';
import { saveLeadToSheet } from './intake/leads';
import { persistIntakeState } from './intake/persist';
import { costTracker } from './utils/costTracker';

const app = express();
app.use(cors());
app.use(express.json());

// Add a root GET handler so the user can verify the service is alive in a browser
app.get('/', (req: Request, res: Response) => {
    res.send('✅ TeachMeAI Agent Service is LIVE and ready for analysis! Send POST requests to /supervisorFlow or /quizGuide');
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/debug/logs', (req: Request, res: Response) => {
    const { logger } = require('./utils/logger');
    res.json(logger.getRecentLogs());
});

// Expose the quiz guide flow
app.post('/quizGuide', async (req: Request, res: Response) => {
    const txnId = `QG-${Date.now()}`;
    try {
        console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
        console.log(`║  🟢 TRANSACTION START — quizGuide [${txnId}]`);
        console.log(`║  ⏰ ${new Date().toISOString()}`);
        console.log(`╚══════════════════════════════════════════════════════════════╝`);
        costTracker.reset();

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

        console.log('🔍 [Backend] Result state:', JSON.stringify({
            isComplete: result.state?.isComplete,
            hasEmail: !!result.state?.fields?.email?.value,
            email: result.state?.fields?.email?.value,
            turnCount: result.state?.turnCount
        }));

        // If intake is complete, just persist the state directly so it's safely logged.
        // We DO NOT run supervisorFlow here because it takes 20+ seconds and causes Vercel to timeout,
        // which makes the frontend think the request failed and go into a retry loop.
        // The frontend will explicitly call /api/submit-chat-intake -> /supervisorFlow next.
        if (result.state.isComplete && result.state.fields.email?.value) {
            console.log(`\n┌──────────────────────────────────────────────────────────────┐`);
            console.log(`│  📊 PERSISTENCE START — quizGuide state [${txnId}]`);
            console.log(`└──────────────────────────────────────────────────────────────┘`);
            console.log('🎯 [Backend] [LOG-SEARCH-ME] Intake complete for:', result.state.sessionId);
            
            try {
                // Persist just the state. The final analysis will be persisted when /supervisorFlow is called.
                await persistIntakeState(result.state, undefined);
                console.log('💾 [Backend] [LOG-SEARCH-ME] FINAL state persisted from quizGuide wrap-up');
                console.log(`┌──────────────────────────────────────────────────────────────┐`);
                console.log(`│  ✅ PERSISTENCE END — quizGuide state [${txnId}]`);
                console.log(`└──────────────────────────────────────────────────────────────┘`);
            } catch (err: any) {
                console.error('❌ [Backend] [LOG-SEARCH-ME] Failed to persist state during wrap-up:', err);
            }
        } else {
            if (result.state.isComplete) {
                console.warn('⚠️ [Backend] [LOG-SEARCH-ME] Intake complete but EMAIL IS MISSING. State not persisted.');
            }
        }

        res.json({ result });
        console.log('📤 [Backend /quizGuide] Response:', JSON.stringify({
            isComplete: result.state?.isComplete,
            hasAnalysis: !!result.analysis,
            analysisKeys: result.analysis ? Object.keys(result.analysis) : []
        }));
        costTracker.printLogSummary(txnId);
        console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
        console.log(`║  🏁 TRANSACTION END — quizGuide [${txnId}]`);
        console.log(`║  ⏰ ${new Date().toISOString()}`);
        console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
    } catch (error: any) {
        console.error('💥 [Backend] Quiz Error:', error);
        const msg = error instanceof Error ? error.message : 'Unknown Quiz Error';
        res.status(500).json({ error: msg, details: 'Error in Quiz Guide' });
    }
});

// Handoff endpoint to bypass Vercel WAF
app.post('/handoff', async (req: Request, res: Response) => {
    try {
        console.log('🚀 [Backend] Received handoff lead');
        const leadId = await saveLeadToSheet(req.body);

        const baseUrl = process.env.INTAKE_APP_URL || 'https://teachmeai-intake-app.vercel.app';
        const redirectUrl = `${baseUrl}/?lead_id=${leadId}`;

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
    const txnId = `SF-${Date.now()}`;
    try {
        console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
        console.log(`║  🟢 TRANSACTION START — supervisorFlow [${txnId}]`);
        console.log(`║  ⏰ ${new Date().toISOString()}`);
        console.log(`╚══════════════════════════════════════════════════════════════╝`);
        costTracker.reset();
        
        if (!req.body || (!req.body.data && !req.body.intakeResponse)) {
            console.error('❌ [Backend] Missing data in request body');
            return res.status(400).send('Missing data in request');
        }

        const inputData = req.body.data || req.body.intakeResponse;
        let dossier;

        // Backward compatibility: If we receive a raw IntakeResponse (Old Bridge API), build the dossier
        // We detect this by checking for fields that exist in IntakeResponse but not in Dossier
        if (inputData.primaryGoal || inputData.currentRoles) {
            console.log('🔄 [Backend] Received raw IntakeResponse. Converting to LearnerDossier...');
            const { buildLearnerDossierFromIntakeResponse } = await import('./utils/dossier-builder');
            dossier = buildLearnerDossierFromIntakeResponse(inputData);
        } else if (inputData.fields || req.body.intakeState) {
            console.log('🔄 [Backend] Received IntakeState. Converting to LearnerDossier...');
            const { buildLearnerDossier } = await import('./utils/dossier-builder');
            dossier = buildLearnerDossier(req.body.intakeState || inputData);
        } else {
            dossier = inputData;
        }

        console.log(`\n┌──────────────────────────────────────────────────────────────┐`);
        console.log(`│  🧠 AI PIPELINE START — 6-phase supervisor [${txnId}]`);
        console.log(`└──────────────────────────────────────────────────────────────┘`);
        const result = await supervisorFlow(dossier);
        console.log(`\n┌──────────────────────────────────────────────────────────────┐`);
        console.log(`│  ✅ AI PIPELINE END — all agents complete [${txnId}]`);
        console.log(`└──────────────────────────────────────────────────────────────┘`);

        // PERSIST the results if a sessionId is provided
        const sessionId = req.body.sessionId || dossier.sessionId || (inputData as any).sessionId;
        if (sessionId) {
            console.log(`\n┌──────────────────────────────────────────────────────────────┐`);
            console.log(`│  📊 PERSISTENCE START — analysis + state [${txnId}]`);
            console.log(`└──────────────────────────────────────────────────────────────┘`);

            let intakeState = req.body.intakeState;
            if (!intakeState) {
                // Construct a minimal state for persistence if it's a legacy call
                intakeState = {
                    sessionId,
                    metadata: { startTime: new Date().toISOString(), mode: 'interview' },
                    fields: {
                        name: { value: dossier.identity?.name || (inputData as any).name || '' },
                        email: { value: dossier.identity?.email || (inputData as any).email || '' },
                        role_raw: { value: dossier.identity?.roleRaw || ((inputData as any).currentRoles || [])[0] || '' },
                        goal_raw: { value: dossier.identity?.goalRaw || (inputData as any).primaryGoal || '' },
                    },
                    isComplete: true,
                    turnCount: 99
                };
            }
            await persistIntakeState(intakeState, result);
            console.log(`┌──────────────────────────────────────────────────────────────┐`);
            console.log(`│  ✅ PERSISTENCE END — sheet updated [${txnId}]`);
            console.log(`└──────────────────────────────────────────────────────────────┘`);
        }

        res.json({ result });
        
        costTracker.printLogSummary(txnId);
        
        console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
        console.log(`║  🏁 TRANSACTION END — supervisorFlow [${txnId}]`);
        console.log(`║  ⏰ ${new Date().toISOString()}`);
        console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
    } catch (error) {
        console.error('💥 [Backend] AI ERROR:', error);
        const msg = error instanceof Error ? error.message : 'Unknown AI error';
        res.status(500).json({ error: msg, details: 'Agent Error' });
    }
});

// Cloud Run provides the PORT environment variable
const port = Number(process.env.PORT) || 3400;
app.listen(port, '0.0.0.0', () => {
    console.log(`Agent Service listening on port ${port}`);
    console.log(`Endpoint available at POST /supervisorFlow`);
});
