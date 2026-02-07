
const jwt = require('jsonwebtoken');

// CONFIG
const SERVICE_URL = process.env.SERVICE_URL || 'https://agent-service-584680412286.us-central1.run.app';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// TEST DATA
const TEST_PAYLOAD = {
    name: "Alice",
    email: "alice@example.com",
    role: "Product Manager", // KEY: We want agents to know this!
    goal: "Launch an AI feature"
};

const SIMULATED_USER_ANSWERS = [
    "Hi, I'm ready.",
    "I work in EdTech.",
    "I want to save time.",
];

async function runTest() {
    console.log("🚀 Starting Personalization Test");
    console.log(`TARGET: ${SERVICE_URL}`);

    const token = jwt.sign(TEST_PAYLOAD, JWT_SECRET, { expiresIn: '1h' });

    let currentState = {
        sessionId: `test-pers-${Date.now()}`,
        turnCount: 0,
        fields: {
            name: { value: TEST_PAYLOAD.name, status: 'confirmed' },
            email: { value: TEST_PAYLOAD.email, status: 'confirmed' },
            role_raw: { value: TEST_PAYLOAD.role, status: 'implied' },
            goal_raw: { value: TEST_PAYLOAD.goal, status: 'implied' }
        },
        token: token,
        activeAgent: 'guide',
        isComplete: false
    };

    for (let i = 0; i < SIMULATED_USER_ANSWERS.length; i++) {
        const userMsg = SIMULATED_USER_ANSWERS[i];
        console.log(`\n--- TURN ${i + 1} ---`);
        console.log(`👤 User: "${userMsg}"`);

        try {
            const res = await fetch(`${SERVICE_URL}/quizGuide`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: currentState, userMessage: userMsg })
            });

            if (!res.ok) {
                console.error(`❌ Request Failed: ${res.status}`);
                break;
            }

            const data = await res.json();
            const result = data.result;

            console.log(`🤖 Agent (${result.state.activeAgent}): "${result.message}"`);

            // CHECK FOR PERSONALIZATION
            const msg = result.message.toLowerCase();
            if (msg.includes('alice') || msg.includes('product') || msg.includes('manager')) {
                console.log("✅ PERSONALIZATION DETECTED: Agent used name or role!");
            }

            currentState = result.state;
            if (result.isComplete) break;

        } catch (e) {
            console.error(e);
            break;
        }
    }
}

runTest();
