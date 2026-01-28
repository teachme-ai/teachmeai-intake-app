const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    console.log("🚀 Testing Gemini API Connection...");
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.MODEL_NAME || "gemini-2.0-flash";

    if (!apiKey) {
        console.error("❌ No GEMINI_API_KEY found in environment!");
        process.exit(1);
    }

    console.log(`📡 Using Key: ${apiKey.substring(0, 8)}...`);
    console.log(`🤖 Using Model: ${modelName}`);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        console.log("💬 Sending test prompt: 'Say hello'...");
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        const text = response.text();
        console.log("✅ Success! Response:", text);
    } catch (e) {
        console.error("💥 API call failed!");
        console.error("Message:", e.message);
        process.exit(1);
    }
}

test();
