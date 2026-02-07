
const jwt = require('jsonwebtoken');

// CONFIG
const SERVICE_URL = process.env.SERVICE_URL || 'https://agent-service-584680412286.us-central1.run.app';

const TEST_PROFILES = [
    {
        name: "Engineering Lead",
        email: "eng_lead@example.com",
        role_raw: "Engineering Lead",
        goal_raw: "Master AI Infrastructure"
    },
    {
        name: "Data Scientist",
        email: "data_wiz@example.com",
        role_raw: "Data Scientist",
        goal_raw: "Advanced RAG Pipelines"
    },
    {
        name: "HR Manager",
        email: "hr_hero@example.com",
        role_raw: "HR Manager",
        goal_raw: "Automate Recruitment"
    },
    {
        name: "Marketing Specialist",
        email: "mkt_pro@example.com",
        role_raw: "Marketing Specialist",
        goal_raw: "Content Generation Scale"
    },
    {
        name: "Non-Tech Retailer",
        email: "retail_rep@example.com",
        role_raw: "Retail Manager",
        goal_raw: "Inventory Prediction",
        digital_skills: "2",
        tech_savviness: "1"
    }
];

// Pick a random profile
const SELECTED_PROFILE = TEST_PROFILES[Math.floor(Math.random() * TEST_PROFILES.length)];
console.log(`🎭 Testing with profile: ${SELECTED_PROFILE.name} (${SELECTED_PROFILE.role_raw})`);

const TEST_PAYLOAD = {
    name: SELECTED_PROFILE.name,
    email: SELECTED_PROFILE.email,
    role_raw: SELECTED_PROFILE.role_raw,
    goal_raw: SELECTED_PROFILE.goal_raw
};

function getAnswer(question, field) {
    const q = question.toLowerCase();

    // Use selected profile data for answers
    if (q.includes('details') || q.includes('clarify') || q.includes('more specific')) return SELECTED_PROFILE.goal_calibrated || "I want to master AI to improve my efficiency.";
    if (q.includes('learning goals') || field === 'srl_goal_setting') return "I set specific learning goals every single day.";
    if (q.includes('time') || q.includes('hours') || field === 'time_per_week_mins') return SELECTED_PROFILE.time_per_week || "5 hours";
    if (q.includes('constraint') || q.includes('barrier') || q.includes('stop') || field === 'constraints') return SELECTED_PROFILE.constraints || "Busy work schedule";
    if (q.includes('industry')) return SELECTED_PROFILE.industry || "Technology";
    if (q.includes('role') || q.includes('function') || field === 'role_category') return SELECTED_PROFILE.role_category || "Professional";
    if (q.includes('achieve') || q.includes('goal') || field === 'goal_calibrated') return SELECTED_PROFILE.goal_calibrated || "To implement AI in my daily workflow";
    if (q.includes('scale') || q.includes('rate') || field === 'skill_stage' || field === 'tech_confidence') return SELECTED_PROFILE.skill_stage || "3";
    if ((q.includes('style') && q.includes('learn')) || field === 'learner_type') return SELECTED_PROFILE.learner_type || "Pragmatist";
    if (q.includes('motivat') || q.includes('drive') || field === 'motivation_type') return SELECTED_PROFILE.motivation_type || "Hybrid";
    if (q.includes('reflect') || field === 'srl_reflection') return "I reflect on my progress regularly.";
    if ((q.includes('style') && q.includes('learn')) || field === 'learner_type') return SELECTED_PROFILE.learner_type || "Pragmatist";
    if (q.includes('motivat') || q.includes('drive') || field === 'motivation_type') return SELECTED_PROFILE.motivation_type || "Hybrid";
    if (q.includes('reflect') || field === 'srl_reflection') return "I reflect on my progress regularly.";
    if ((q.includes('style') && q.includes('learn')) || field === 'learner_type') return SELECTED_PROFILE.learner_type || "Pragmatist";
    if (q.includes('motivat') || q.includes('drive') || field === 'motivation_type') return SELECTED_PROFILE.motivation_type || "Hybrid";
    if (q.includes('reflect') || field === 'srl_reflection') return "I reflect on my progress regularly.";
    if (q.includes('approach') || q.includes('adapt') || field === 'srl_adaptability') return "I always try new methods.";
    if (q.includes('tool') || field === 'current_tools') return "Standard business tools and ChatGPT.";
    if (q.includes('digital skills') || field === 'digital_skills') return SELECTED_PROFILE.digital_skills || "4";
    if (q.includes('tech background') || q.includes('technology background') || field === 'tech_savviness') return SELECTED_PROFILE.tech_savviness || "4";

    return "I am ready to proceed. Please continue.";
}

async function runSmartTest() {
    console.log("🧠 Starting SMART E2E Test");
    console.log(`TARGET: ${SERVICE_URL}`);

    let currentState = {
        sessionId: `smart-e2e-${Date.now()}`,
        turnCount: 0,
        fields: {
            name: { value: TEST_PAYLOAD.name, status: 'confirmed' },
            email: { value: TEST_PAYLOAD.email, status: 'confirmed' },
        },
        activeAgent: 'strategist',
        isComplete: false
    };

    const MAX_TURNS = 20;
    let lastQuestion = "Intro";

    for (let i = 0; i < MAX_TURNS; i++) {
        // PREDICT ANSWER
        // We use the PREVIOUS result's message/field to decide what to say NOW.
        // For the first turn (i=0), we send an opening statement.

        let userMsg = "";
        if (i === 0) {
            userMsg = "Hi, I'm a Developer wanting to learn AI.";
        } else {
            // We need to look at what the agent JUST asked
            // But 'lastQuestion' is from the previous loop or init.
            // Wait, we need the response from the previous fetch to know what to answer.
            // In the loop structure, we send userMsg, THEN get prediction.
            // So we need to store the "pending question" from the previous turn?
            // Actually, for i > 0, we generated userMsg based on `lastResult`.
        }

        // Logic fix:
        // We can't generate the answer for Turn N until we see the Question from Agent (which came from Turn N-1 response).
        // So let's handle the loop differently.
    }
}

// RE-WRITE AS RECURSIVE OR PROPER LOOP
async function runLoop() {
    console.log("🧠 Starting SMART E2E Test");

    let state = {
        sessionId: `LOG-SEARCH-ME-${Date.now()}`,
        turnCount: 0,
        fields: {
            name: { value: TEST_PAYLOAD.name, status: 'confirmed', confidence: 'high', evidence: 'prefill', updatedAt: new Date().toISOString() },
            email: { value: TEST_PAYLOAD.email, status: 'confirmed', confidence: 'high', evidence: 'prefill', updatedAt: new Date().toISOString() },
            role_raw: { value: TEST_PAYLOAD.role_raw, status: 'confirmed', confidence: 'high', evidence: 'prefill', updatedAt: new Date().toISOString() },
            goal_raw: { value: TEST_PAYLOAD.goal_raw, status: 'confirmed', confidence: 'high', evidence: 'prefill', updatedAt: new Date().toISOString() },
        },
        activeAgent: 'strategist',
        isComplete: false,
        nextAction: 'clarify',
        missingFields: ['time_per_week_mins'],
        completionPercent: 20,
        metadata: {
            startTime: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            source: 'e2e_test',
            mode: 'interview'
        }
    };

    // Initial Trigger
    let nextUserMsg = "Hi, I'm a Developer wanting to learn AI."; // Agent will respond to this

    const transcript = [];

    for (let i = 1; i <= 20; i++) {
        console.log(`\n--- TURN ${i} ---`);
        console.log(`👤 User: "${nextUserMsg}"`);
        transcript.push({ role: 'User', message: nextUserMsg });

        const payload = { state: state, userMessage: nextUserMsg };
        // console.log(`DEBUG: Sending payload keys: ${Object.keys(payload)}`);

        const res = await fetch(`${SERVICE_URL}/quizGuide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const responseText = await res.text();
        // console.log(`DEBUG: Response text length: ${responseText.length}`);
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error(`💥 SERVER ERROR (Non-JSON): ${responseText}`);
            process.exit(1);
        }

        if (data.error || !data.result) {
            console.error(`💥 API ERROR:`, JSON.stringify(data.error || data, null, 2));
            process.exit(1);
        }

        const result = data.result;
        state = result.state;

        // console.log(`🤖 Agent (${state.activeAgent || 'End'}): "${result.message}"`);
        transcript.push({ role: 'Agent', agent: state.activeAgent || 'System', message: result.message });

        if (state.isComplete) {
            console.log("\n✅ SUCCESS: Conversation Complete!");

            console.log("\n==========================================");
            console.log("       📄 CONVERSATION TRANSCRIPT");
            console.log("==========================================\n");

            transcript.forEach(entry => {
                if (entry.role === 'User') {
                    console.log(`👤 **User**: ${entry.message}`);
                } else {
                    console.log(`🤖 **${entry.agent}**: ${entry.message}\n`);
                }
            });
            console.log("\n==========================================\n");

            if (result.analysis) {
                console.log("📊 FINAL ANALYSIS PREVIEW:");
                console.log(JSON.stringify(result.analysis, null, 2));
            } else {
                console.warn("⚠️ No analysis object found.");
            }
            break;
        }

        // PREPARE NEXT ANSWER
        nextUserMsg = getAnswer(result.message, ""); // We don't have nextField explicitly
    }
}

runLoop();
