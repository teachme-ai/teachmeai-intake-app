
const http = require('http');

const API_PORT = 3401;
const API_PATH = '/quizGuide';

// User Persona
const USER_RESPONSES = [
    "Hi, I'm Khalid.",                                         // 1. Initial greeting
    "khalid@teachmeai.com",                                    // 2. Email
    "I am a Product Manager wanting to use AI for specs.",     // 3. Role/Goal
    "Product Management",                                      // 4. Role Category (if asked)
    "I want to save 5 hours a week writing PRDs.",             // 5. Calibrated Goal (if asked)
    "I learn by doing and building things.",                   // 6. Profiler: Style
    "I'm pretty good, maybe a 4 out of 5.",                    // 7. Skill Stage
    "I have about 3 hours a week.",                            // 8. Time/Constraints
    "No other constraints.",                                   // 9. Cleanup
];

function postRequest(data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: API_PORT,
            path: API_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) reject(`HTTP ${res.statusCode}: ${body}`);
                else resolve(JSON.parse(body));
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function runSimulation() {
    console.log("🚀 Starting Intake Flow Simulation (Native HTTP)...");

    let currentState = {
        messages: [],
        extractedData: {}
    };

    let responseCount = 0;

    for (const userContent of USER_RESPONSES) {
        console.log(`\n👤 USER: ${userContent}`);

        currentState.messages.push({ role: 'user', content: userContent });

        try {
            const json = await postRequest({
                messages: currentState.messages,
                extractedData: currentState.extractedData
            });
            const result = json.result;

            console.log(`🤖 AGENT: ${result.message}`);

            // Merge extracted data
            currentState.extractedData = { ...currentState.extractedData, ...result.extractedData };

            // Add assistant message
            currentState.messages.push({ role: 'model', content: result.message });

            if (result.isComplete) {
                console.log("\n✅ FLOW COMPLETE!");
                break;
            }

        } catch (e) {
            console.error("❌ Request Failed", e);
            break;
        }

        responseCount++;
        if (responseCount > 15) {
            console.log("⚠️ Force stopping after 15 turns.");
            break;
        }

        await new Promise(r => setTimeout(r, 500));
    }
}

runSimulation();
