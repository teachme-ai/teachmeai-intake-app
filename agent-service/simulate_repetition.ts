
const http = require('http');

const API_PORT = 3401;
const API_PATH = '/quizGuide';

// Scenario: Stuck on Skill Stage (MCQ trigger) and Time (Skip trigger)
const USER_RESPONSES = [
    "Hi, I'm Khalid.",
    "khalid@teachmeai.com",
    "I am a Product Manager.",
    "Product Management", // Role Category
    "I want to build things.", // Goal
    "I learn by doing.", // Vark

    // SKILL STAGE - Attempt 1 (Fail)
    "I like bananas.",
    // SKILL STAGE - Attempt 2 (Fail) -> Should trigger MCQ next
    "I really like apples.",
    // SKILL STAGE - Attempt 3 (MCQ Answer) -> Should succeed
    "I am an Expert.",

    // TIME BARRIER - Attempt 1 (Fail)
    "Blue is a color.",
    // TIME BARRIER - Attempt 2 (Fail) -> Should trigger MCQ or map
    "The sky is blue.",
    // TIME BARRIER - Success
    "No barrier.", // "No" might extract as 1?

    // TIME PER WEEK (Numeric) - Attempt 1 (Fail)
    "A lot.",
    // TIME PER WEEK - Attempt 2 (Fail) -> Should SKIP (-1) automatically
    "As much as needed.",

    // If skipped, next is Constraints
    "No constraints."
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

async function runSimulation() {
    console.log("🚀 Starting Repetition Guard Simulation...");
    let currentState = { messages: [], extractedData: {} };
    let turn = 0;

    for (const userContent of USER_RESPONSES) {
        console.log(`\n👤 USER [${turn}]: ${userContent}`);
        currentState.messages.push({ role: 'user', content: userContent });

        try {
            const json = await postRequest(currentState);
            const result = json.result;

            console.log(`🤖 AGENT: ${result.message}`);
            if (result.extractedData._activeAgent) console.log(`   [ActiveAgent]: ${result.extractedData._activeAgent}`);

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

runSimulation();
