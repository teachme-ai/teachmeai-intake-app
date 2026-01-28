
const http = require('http');

const API_PORT = 3000;
const API_PATH = '/quizGuide';

// SCENARIO 1: Happy Path (PM + Agentic RAG)
const SCENARIO_HAPPY = [
    // Guide
    "Hi, I'm Khalid.",
    "khalid@teachmeai.com",

    // Profiler (Skill Stage -> 5)
    "I'm an Expert.",
    // Profiler (Time Barrier -> 2)
    "I have some constraints.",
    // Profiler (Learner Type -> Theorist)
    "I like to understand the theory first.",

    // Strategist (Industry -> BFSI [MCQ])
    "I work in Banking.",
    // Strategist (Role Category -> Product)
    "I manage products.",
    // Strategist (Goal -> Build Agentic RAG)
    "I want to build an Agentic RAG system.",

    // Tactician (Time -> 4 hours)
    "4 hours per week.",
    // Tactician (Constraints -> None)
    "No constraints."
];

// SCENARIO 2: Repetition & Fallback (Stress Test)
const SCENARIO_STRESS = [
    "I'm Stress.",
    "stress@test.com",

    // Profiler (Skill) -> Fail 1
    "I like bananas.",
    // Profiler (Skill) -> Fail 2 (Trigger MCQ)
    "Apple pie.",
    // Profiler (Skill) -> Fail 3 (Should Default to 3, NOT SKIP)
    "I refuse to answer.",

    // Profiler (Time Barrier) -> Success
    "No time barrier.", // 5 or 1?

    // Profiler (Learner Type) -> Fail 1
    "I don't know.",
    // Profiler (Learner Type) -> Fail 2 -> Success
    "I am a Theorist.",

    // Strategist (Vertical) -> Success
    "BFSI",

    // Strategist (Role) -> Success
    "Product",

    // Strategist (Goal) -> Success
    "Learn AI",

    // Tactician (Time) -> Fail 1
    "A while.",
    // Tactician (Time) -> Fail 2 -> Should SKIP (-1)
    "As long as it takes."
];


function postRequest(data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: API_PORT,
            path: API_PATH,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => body += chunk);
            res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(body)) : reject(body));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function runScenario(name, inputs) {
    console.log(`\n🚀 Starting Scenario: ${name}`);
    let currentState = { messages: [], extractedData: {} };
    let turn = 0;

    for (const userContent of inputs) {
        console.log(`\n👤 USER [${turn}]: ${userContent}`);
        currentState.messages.push({ role: 'user', content: userContent });

        try {
            // Ensure we send the sessionId if we have it
            if (currentState.sessionId) {
                // Keep it
            }

            const json = await postRequest(currentState);
            const result = json.result;

            // Capture sessionId for future turns
            if (result.state && result.state.sessionId) {
                currentState.sessionId = result.state.sessionId;
            }

            console.log(`🤖 AGENT: ${result.message}`);
            if (result.extractedData._activeAgent) console.log(`   [ActiveAgent]: ${result.extractedData._activeAgent}`);

            // Log interesting fields
            const fields = result.extractedData;
            console.log(`   [State]: Skill=${fields.skill_stage} Time=${fields.time_per_week_mins} Learner=${fields.learner_type} Vertical=${fields.industry_vertical}`);

            currentState.extractedData = { ...currentState.extractedData, ...result.extractedData };
            currentState.messages.push({ role: 'model', content: result.message });

            if (result.isComplete) { console.log("\n✅ FLOW COMPLETE!"); break; }
        } catch (e) {
            console.error("❌ Request Failed", e);
            break;
        }

        turn++;
        await new Promise(r => setTimeout(r, 200));
    }
}

async function runAll() {
    await runScenario("HAPPY PATH", SCENARIO_HAPPY);
    await runScenario("STRESS TEST", SCENARIO_STRESS);
}

runAll();
