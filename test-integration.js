const OpenAI = require('openai');
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testIntegration() {
  try {
    console.log('Testing OpenAI GPT-3.5-turbo...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Say 'Integration working!' if you can read this."
        }
      ],
      max_tokens: 20,
    });

    console.log('✅ Response:', completion.choices[0]?.message?.content);
    console.log('✅ OpenAI integration is working!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testIntegration();