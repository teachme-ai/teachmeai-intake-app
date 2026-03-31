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

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/debug/logs', (req: Request, res: Response) => {
    const { logger } = require('./utils/logger');
    res.json(logger.getRecentLogs());
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

        console.log('🔍 [Backend] Result state:', JSON.stringify({
            isComplete: result.state?.isComplete,
            hasEmail: !!result.state?.fields?.email?.value,
            email: result.state?.fields?.email?.value,
            turnCount: result.state?.turnCount
        }));

        // If intake is complete, trigger IMPACT analysis
        if (result.state.isComplete && result.state.fields.email?.value) {
            console.log('🎯 [Backend] [LOG-SEARCH-ME] Intake complete for:', result.state.sessionId);
            // No longer persisting twice (raw and analysis). We just do it once inside the analysis block or after.

            console.log('🎯 [Backend] [LOG-SEARCH-ME] Generating IMPACT analysis...');
            try {
                const { supervisorFlow } = await import('./agents/supervisor');
                const { buildLearnerDossier } = await import('./utils/dossier-builder');

                const dossier = buildLearnerDossier(result.state);

                console.log('📊 [Backend] [LOG-SEARCH-ME] Dossier built for session:', result.state.sessionId);
                console.log('📊 [Backend] Dossier dimensions:', JSON.stringify({
                    identity: !!dossier.identity.roleCategory,
                    srl: !!dossier.srl.goalSetting,
                    motivation: !!dossier.motivation.type,
                    preferences: !!dossier.preferences.learnerType,
                    readiness: !!dossier.readiness.skillStage,
                    constraints: !!dossier.constraints.timePerWeekMins,
                    profile: !!dossier.psychographicProfile
                }));

                const analysis = await supervisorFlow(dossier);
                console.log('✅ [Backend] [LOG-SEARCH-ME] IMPACT analysis generated for:', result.state.sessionId);

                await persistIntakeState(result.state, analysis);
                console.log('💾 [Backend] [LOG-SEARCH-ME] FINAL state + analysis persisted');
                result.analysis = analysis;
            } catch (analysisError: any) {
                console.error('❌ [Backend] [LOG-SEARCH-ME] IMPACT analysis failed:', analysisError);
                console.error('❌ [Backend] [LOG-SEARCH-ME] Stack:', analysisError.stack?.split('\n').slice(0, 3));
            }
        } else {
            if (result.state.isComplete) {
                console.warn('⚠️ [Backend] [LOG-SEARCH-ME] Intake complete but EMAIL IS MISSING. Skipping analysis.');
            }
        }


        res.json({ result });
        console.log('📤 [Backend /quizGuide] Response:', JSON.stringify({
            isComplete: result.state?.isComplete,
            hasAnalysis: !!result.analysis,
            analysisKeys: result.analysis ? Object.keys(result.analysis) : []
        }));
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
    try {
        console.log('🚀 [Backend] Received request for supervisorFlow');
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
        } else {
            dossier = inputData;
        }

        console.log('🧠 [Backend] Starting AI Agents with Dossier...');
        const result = await supervisorFlow(dossier);
        console.log('✅ [Backend] AI Agents finished successfully');

        // PERSIST the results if a sessionId is provided
        const sessionId = req.body.sessionId || dossier.sessionId || (inputData as any).sessionId;
        if (sessionId) {
            console.log(`💾 [Backend] Persisting analysis for session: ${sessionId}`);

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
