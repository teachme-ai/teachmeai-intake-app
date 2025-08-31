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

async function testOpenAI() {
  try {
    console.log('Testing OpenAI connection...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond with a simple confirmation."
        },
        {
          role: "user",
          content: "Say 'OpenAI integration working!' if you can read this."
        }
      ],
      max_tokens: 50,
    });

    console.log('✅ OpenAI Response:', completion.choices[0]?.message?.content);
    console.log('✅ Integration is working!');
    
  } catch (error) {
    console.error('❌ OpenAI Error:', error.message);
    
    if (error.code === 'invalid_api_key') {
      console.error('❌ Invalid API key. Check your OPENAI_API_KEY in .env.local');
    } else if (error.code === 'insufficient_quota') {
      console.error('❌ Insufficient quota. Check your OpenAI billing.');
    }
  }
}

testOpenAI();