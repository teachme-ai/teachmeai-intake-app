
const jwt = require('jsonwebtoken');

// CONFIG
const SERVICE_URL = process.env.SERVICE_URL || 'https://agent-service-584680412286.us-central1.run.app';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret'; // The service uses this to verify, hopefully it matches or we rely on allow-unauthenticated for the endpoint but the endpoint checks token. 
// WAIT: The deployed service uses a REAL secret. I don't have it. 
// BUT: The service allows "unauthenticated" invocation for Cloud Run, but the code *inside* might check JWT.
// Let's check `src/app/api/intake/session/route.ts` or `agent-service/src/intake/session.ts`? 
// No, the agent service endpoints `/quizGuide` expects a `state` object. It doesn't strictly validate the JWT signature against a secret *unless* the state creation logic does.
// The `quizGuide` endpoint in `index.ts` takes `req.body`. 
// If I pass a full `state` object, it might just use it.
// Let's assume I can pass a state.

const TEST_PAYLOAD = {
    name: "E2E Tester",
    email: "e2e_tester@example.com", // Emails often trigger the "Guide" exit
    role: "Software Engineer",
    goal: "Master GenAI Agents"
};

// ANSWERS MAPPED TO INTENT
const USER_PERSONA = {
    // Strategist
    industry: "I work in the Tech industry.",

    // Learner Dimensions
    skill_stage: "I am an intermediate coder.",
    learner_type: "I prefer hands-on coding and building things.", // Pragmatist/Builder
    motivation_type: "I want to build my own startup.", // Intrinsic/Outcome
    srl_goal_setting: "I set daily goals.",

    // Tactician
    time_per_week_mins: "I have about 5 hours a week.",
    constraints: "My only constraint is my full-time job."
};

async function runE2ETest() {
    console.log("🚀 Starting End-to-End (E2E) Test");
    console.log(`TARGET: ${SERVICE_URL}`);

    // Initial State (Simulating what the Frontend sends)
    let currentState = {
        sessionId: `e2e-test-${Date.now()}`,
        turnCount: 0,
        fields: {
            name: { value: TEST_PAYLOAD.name, status: 'confirmed' },
            email: { value: TEST_PAYLOAD.email, status: 'confirmed' },
            // Let's leave role/goal as implied or empty to test Strategist
        },
        activeAgent: 'strategist', // Skip guide since email is there
        isComplete: false
    };

    // We will loop until complete or safety break
    const MAX_TURNS = 15;

    for (let i = 0; i < MAX_TURNS; i++) {
        // DECIDE ANSWER BASED ON PREVIOUS QUESTION (Simulation)
        // Since we don't know the question *before* we send the request (except for turn 0 which is intro),
        // we can used a canned sequence or try to match keywords. 
        // For simplicity/robustness in a script, we'll iterate through a sequence of likely answers 
        // that covers the flow. 

        let userMsg = "";

        if (i === 0) userMsg = "I am a Software Engineer looking to master AI Agents."; // Role + Goal
        else if (i === 1) userMsg = USER_PERSONA.skill_stage;
        else if (i === 2) userMsg = USER_PERSONA.learner_type;
        else if (i === 3) userMsg = USER_PERSONA.motivation_type;
        else if (i === 4) userMsg = USER_PERSONA.srl_goal_setting; // Maybe extra question
        else if (i === 5) userMsg = "Visual learning works best for me."; // Vark fallback
        else if (i === 6) userMsg = USER_PERSONA.time_per_week_mins;
        else if (i === 7) userMsg = USER_PERSONA.constraints;
        else userMsg = "Proceed.";

        console.log(`\n--- TURN ${i + 1} ---`);
        console.log(`👤 User: "${userMsg}"`);

        try {
            const res = await fetch(`${SERVICE_URL}/quizGuide`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: currentState, userMessage: userMsg })
            });

            if (!res.ok) {
                const txt = await res.text();
                console.error(`❌ Request Failed: ${res.status} - ${txt}`);
                break;
            }

            const data = await res.json();
            const result = data.result;

            console.log(`🤖 Agent (${result.state.activeAgent || 'Completed'}): "${result.message}"`);

            currentState = result.state;

            if (result.state.isComplete) {
                console.log("\n✅ CONVERSATION COMPLETE!");

                if (result.analysis) {
                    console.log("📊 ANALYSIS GENERATED:");
                    console.log(JSON.stringify(result.analysis, null, 2));
                } else {
                    console.log("⚠️ Conversation complete but NO ANALYSIS found in response.");
                    // Check if it's in the state? No, usually returned in result.analysis
                }
                break;
            }
        } catch (e) {
            console.error("💥 Error during fetch:", e);
            break;
        }
    }
}

runE2ETest();
