
const jwt = require('jsonwebtoken');

// CONFIG
const SERVICE_URL = process.env.SERVICE_URL || 'https://agent-service-584680412286.us-central1.run.app';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// TEST DATA
const TEST_PAYLOAD = {
    name: "Test User",
    email: "test@example.com",
    role: "Product Manager",
    goal: "Automate daily workflows with AI"
};

const SIMULATED_USER_ANSWERS = [
    "Hi, I'm ready.", // Turn 0 (Init)
    "I work in EdTech.", // Turn 1
    "I want to save 5 hours a week.", // Turn 2
    "I'm a visual learner.", // Turn 3
    "I'm a beginner.", // Turn 4
    "I'm mostly curious.", // Turn 5
    "I set goals weekly.", // Turn 6
    "Time is my biggest barrier.", // Turn 7
    "I use Notion and Slack.", // Turn 8
];

async function runTest() {
    console.log("🚀 Starting End-to-End Loop Test (JS)");
    console.log(`TARGET: ${SERVICE_URL}`);

    // 1. Generate Token
    const token = jwt.sign(TEST_PAYLOAD, JWT_SECRET, { expiresIn: '1h' });
    console.log(`🔑 Generated Token for: ${TEST_PAYLOAD.role}`);

    let currentState = {
        sessionId: `test-${Date.now()}`,
        turnCount: 0,
        fields: {
            name: { value: TEST_PAYLOAD.name, status: 'confirmed' },
            email: { value: TEST_PAYLOAD.email, status: 'confirmed' },
            role_raw: { value: TEST_PAYLOAD.role, status: 'implied' }, // role_raw (from quiz)
            goal_raw: { value: TEST_PAYLOAD.goal, status: 'implied' }  // goal_raw (from quiz)
        },
        token: token,
        activeAgent: 'guide', // Starts here
        isComplete: false
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

            const data = await res.json();
            const result = data.result;

            console.log(`🤖 Agent (${result.state.activeAgent}): "${result.message}"`);

            if (result.action) {
                console.log(`   [Action Pending]: Field='${result.action.targetField}'`);
            }
            if (result.state.nextAction === 'ask_next') {
                console.log(`   [Next Field]: ${result.state.nextField}`);
            }

            const lastQ = result.state.lastQuestionField;
            const repeatCount = result.state.repeatCountByField && result.state.repeatCountByField[lastQ] ? result.state.repeatCountByField[lastQ] : 0;
            if (repeatCount > 0) {
                console.warn(`⚠️ REPETITION DETECTED! Field '${lastQ}' asked ${repeatCount + 1} times!`);
            }

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
