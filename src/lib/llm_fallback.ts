// Minimal OpenRouter LLM call utility
import fetch from 'node-fetch';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function callOpenRouterLLM({ prompt, model = 'z-ai/glm-4.6', max_tokens = 1200 }) {
  if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY missing');
  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens
  };
  const res = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('OpenRouter LLM request failed');
  const data = await res.json();
  // Return first message content
  return data.choices?.[0]?.message || { content: '' };
}
