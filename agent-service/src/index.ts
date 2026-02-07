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
            console.log('🎯 [Backend] Intake complete. PERSISTING RAW STATE first...');
            // FAIL-SAFE: Save to sheet before complex analysis runs
            await persistIntakeState(result.state);

            console.log('🎯 [Backend] Generating IMPACT analysis...');
            try {
                const { supervisorFlow } = await import('./agents/supervisor');
                const intakeData = {
                    name: result.state.fields.name?.value || '',
                    email: result.state.fields.email?.value || '',
                    primaryGoal: result.state.fields.goal_calibrated?.value || result.state.fields.goal_raw?.value || '',
                    currentRoles: [result.state.fields.role_category?.value || result.state.fields.role_raw?.value || 'Professional'],
                    goalSettingConfidence: result.state.fields.srl_goal_setting?.value || 3,
                    newApproachesFrequency: result.state.fields.srl_adaptability?.value || 3,
                    reflectionFrequency: result.state.fields.srl_reflection?.value || 3,
                    aiToolsConfidence: result.state.fields.tech_confidence?.value || 3,
                    resilienceLevel: result.state.fields.resilience?.value || 3,
                    clearCareerVision: result.state.fields.vision_clarity?.value || 3,
                    successDescription: result.state.fields.success_clarity_1yr?.value || 3,
                    learningForChallenge: result.state.fields.motivation_type?.value === 'intrinsic' ? 5 : 3,
                    outcomeDrivenLearning: result.state.fields.motivation_type?.value === 'outcome' ? 5 : 3,
                    timeBarrier: result.state.fields.time_barrier?.value || 3,
                    currentFrustrations: result.state.fields.frustrations?.value || '',
                    learnerType: (result.state.fields.learner_type?.value || 'pragmatist') as any,
                    varkPreferences: {
                        visual: result.state.fields.vark_primary?.value === 'visual' ? 5 : 2,
                        audio: result.state.fields.vark_primary?.value === 'audio' ? 5 : 2,
                        readingWriting: result.state.fields.vark_primary?.value === 'reading' ? 5 : 2,
                        kinesthetic: result.state.fields.vark_primary?.value === 'kinesthetic' ? 5 : 2,
                    },
                    skillStage: result.state.fields.skill_stage?.value || 2,
                    concreteBenefits: result.state.fields.benefits?.value || '',
                    shortTermApplication: result.state.fields.application_context?.value || '',
                };

                console.log('📊 [Backend] Calling supervisorFlow with:', JSON.stringify(intakeData, null, 2));
                const analysis = await supervisorFlow(intakeData);
                console.log('✅ [Backend] IMPACT analysis generated:', JSON.stringify(analysis, null, 2));

                // Persist analysis to Google Sheets
                await persistIntakeState(result.state, analysis);
                console.log('💾 [Backend] Analysis persisted to Google Sheets');

                result.analysis = analysis;
            } catch (analysisError: any) {
                console.error('❌ [Backend] IMPACT analysis failed:', analysisError);
                console.error('❌ [Backend] Error details:', JSON.stringify({
                    message: analysisError.message,
                    stack: analysisError.stack?.split('\n').slice(0, 3),
                    cause: analysisError.cause
                }));
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

            // Use full intake state if provided, otherwise construct minimal
            const intakeState = req.body.intakeState || {
                sessionId,
                metadata: { startTime: new Date().toISOString(), mode: 'interview' },
                fields: {
                    name: { value: req.body.data.name || '' },
                    email: { value: req.body.data.email || '' },
                    role_raw: { value: (req.body.data.currentRoles || [])[0] || '' },
                    goal_raw: { value: req.body.data.primaryGoal || '' },
                    // Map additional fields from IntakeResponse
                    skill_stage: req.body.data.skillStage ? { value: req.body.data.skillStage } : undefined,
                    time_barrier: req.body.data.timeBarrier ? { value: req.body.data.timeBarrier } : undefined,
                    role_category: req.body.data.roleCategory ? { value: req.body.data.roleCategory } : undefined,
                    goal_calibrated: { value: req.body.data.primaryGoal || '' },
                    time_per_week_mins: req.body.data.timePerWeekMins ? { value: req.body.data.timePerWeekMins } : undefined
                },
                isComplete: true,
                turnCount: 99
            };
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
