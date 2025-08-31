const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Read .env.local manually
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key] = value;
    }
  });
}

async function testGemini() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY not found in .env.local');
      console.log('Get your free key at: https://makersuite.google.com/app/apikey');
      return;
    }

    console.log('Testing Google Gemini...');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Say 'Gemini integration working!' if you can read this.");
    const response = result.response.text();
    
    console.log('✅ Response:', response);
    console.log('✅ Gemini integration is working!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('Get your free key at: https://makersuite.google.com/app/apikey');
    }
  }
}

testGemini();