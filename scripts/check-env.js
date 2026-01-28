require('dotenv').config();
console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY start:', process.env.GEMINI_API_KEY?.substring(0, 10));
