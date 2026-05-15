import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly reload .env
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Missing OPENAI_API_KEY');
  process.exit(1);
}

console.log('Testing with key:', apiKey.substring(0, 15) + '...');

const client = new OpenAI({
  apiKey: apiKey,
});

async function testOpenAI() {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', 
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    console.log('OpenAI Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI Error:', error.message);
  }
}

testOpenAI();
