import jwt from 'jsonwebtoken';
// Uses native fetch (Node 18+)

// CONFIG
const SERVICE_URL = process.env.SERVICE_URL || 'https://agent-service-584680412286.us-central1.run.app'; // Prod URL
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret'; // WE NEED THE REAL SECRET IF TESTING PROD, OR DEV SECRET FOR LOCAL
// NOTE: For Prod testing, we might need the real secret if the service verifies it. 
// However, the service might accept any signature if we set the env var on the service to match, 
// OR if we are just testing the logic we can run locally. 
// Let's assume we test against PROD for now, but we might fail on signature if we don't have the key.
// User didn't provide the key in chat. I will default to a placeholder and ask user to run with key if needed.
// Actually, earlier the user confirmed they set JWT_SECRET.
// I will start the script assuming I need to pass the secret as an ENV var when running.

// TEST DATA (The "Quiz" Output)
const TEST_PAYLOAD = {
    name: "Test User",
    email: "test@example.com",
    role: "Product Manager",
    goal: "Automate daily workflows with AI"
};

const SIMULATED_USER_ANSWERS = [
    "Hi, I'm ready.", // Turn 0 (Init)
    "I work in EdTech.", // Turn 1 (Likely asking Industry)
    "I want to save 5 hours a week.", // Turn 2 (Goal/Time)
    "I'm a visual learner.", // Turn 3 (Profiler)
    "I'm a beginner.", // Turn 4 (Skill)
    "I'm mostly curious.", // Turn 5 (Motivation)
    "I set goals weekly.", // Turn 6 (SRL)
    "Time is my biggest barrier.", // Turn 7 (Constraints)
    "I use Notion and Slack.", // Turn 8 (Tools)
];

async function runTest() {
    console.log("🚀 Starting End-to-End Loop Test");
    console.log(`TARGET: ${SERVICE_URL}`);

    // 1. Generate Token
    const token = jwt.sign(TEST_PAYLOAD, JWT_SECRET, { expiresIn: '1h' });
    console.log(`🔑 Generated Token for: ${TEST_PAYLOAD.role}`);

    // 2. Initial State (Simulating what the Frontend sends)
    let currentState = {
        sessionId: `test-${Date.now()}`,
        turnCount: 0,
        fields: {}, // Will be populated by backend processing of JWT
        token: token,
        activeAgent: 'guide' // Starts here
    };

    // 3. Loop
    for (let i = 0; i < SIMULATED_USER_ANSWERS.length; i++) {
        const userMsg = SIMULATED_USER_ANSWERS[i];
        console.log(`\n\n--- TURN ${i + 1} ---`);
        console.log(`👤 User: "${userMsg}"`);

        try {
            const res = await fetch(`${SERVICE_URL}/quizGuide`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state: currentState,
                    userMessage: userMsg
                })
            });

            if (!res.ok) {
                console.error(`❌ Request Failed: ${res.status} ${res.statusText}`);
                const txt = await res.text();
                console.error(txt);
                break;
            }

            const data: any = await res.json();
            const result = data.result;

            console.log(`🤖 Agent (${result.state.activeAgent}): "${result.message}"`);

            // LOG DEBUG INFO
            if (result.action) {
                console.log(`   [Action Pending]: Field='${result.action.targetField}'`);
            }
            if (result.state.nextAction === 'ask_next') {
                console.log(`   [Next Field]: ${result.state.nextField}`);
            }

            // check for repetitions
            const lastQ = result.state.lastQuestionField;
            const repeatCount = result.state.repeatCountByField?.[lastQ] || 0;
            if (repeatCount > 0) {
                console.warn(`⚠️ REPETITION DETECTED! Field '${lastQ}' asked ${repeatCount + 1} times!`);
            }

            // Update state for next turn
            currentState = result.state;

            if (result.isComplete) {
                console.log("\n✅ Intake Complete!");
                break;
            }

        } catch (e) {
            console.error("💥 Error during test execution:", e);
            break;
        }
    }
}

runTest();
