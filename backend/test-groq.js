import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testGroq() {
  console.log('🧪 Testing Groq API...');
  console.log('API Key:', process.env.GROQ_API_KEY ? 'Present ✓' : 'MISSING ✗');

  try {
    const completion = await groq.chat.completions.create({
      model: 'groq/compound-mini',
      messages: [
        { role: 'user', content: 'Say hello and introduce yourself as an English tutor in one sentence.' }
      ],
      max_tokens: 100,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content || '';
    console.log('✅ Groq groq/compound-mini works!');
    console.log('Response:', response);
  } catch (error) {
    console.error('❌ Groq test failed:', error.message);
  }
}

testGroq();
