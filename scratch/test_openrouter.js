import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  console.error('Missing OPENROUTER_API_KEY');
  process.exit(1);
}

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: apiKey,
});

async function testOpenRouter() {
  try {
    const response = await client.chat.completions.create({
      model: 'google/gemini-2.0-flash-001', // A common model on OpenRouter
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    console.log('OpenRouter Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('OpenRouter Error:', error.message);
  }
}

testOpenRouter();
