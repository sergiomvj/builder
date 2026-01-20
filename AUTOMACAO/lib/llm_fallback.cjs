/**
 * 🤖 LLM FALLBACK HELPER (CommonJS)
 * ============================================
 * Versão CommonJS para scripts que usam require()
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai').default;
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

const googleAI = process.env.GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY) : null;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function generateWithFallback(prompt, options = {}) {
  const {
    geminiModel = 'gemini-2.0-flash-exp',
    openaiModel = 'gpt-4',
    grokModel = 'x-ai/grok-4.1-fast:free',
    temperature = 0.8,
    maxTokens = 2500,
    parseJSON = false,
    timeout = 25000 // 25 segundos por tentativa
  } = options;

  let rawText = null;

  // Helper para adicionar timeout em qualquer promise
  const withTimeout = (promise, ms) => {
    return Promise.race([
      promise,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout após ${ms/1000}s`)), ms)
      )
    ]);
  };

  // 1. Tentar Gemini primeiro
  if (googleAI) {
    try {
      console.log('  🤖 Tentando Gemini...');
      const model = googleAI.getGenerativeModel({ model: geminiModel });
      const result = await withTimeout(model.generateContent(prompt), timeout);
      const response = await result.response;
      rawText = response.text();
      console.log('  ✅ Sucesso com Gemini');
    } catch (geminiError) {
      console.log(`  ⚠️  Gemini falhou: ${geminiError.message}`);
    }
  }

  // 2. Tentar OpenAI
  if (!rawText && openai) {
    try {
      console.log('  🤖 Tentando OpenAI...');
      const completion = await withTimeout(
        openai.chat.completions.create({
          model: openaiModel,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens
        }),
        timeout
      );
      rawText = completion.choices[0].message.content;
      console.log('  ✅ Sucesso com OpenAI');
    } catch (openaiError) {
      console.log(`  ⚠️  OpenAI falhou: ${openaiError.message}`);
    }
  }

  // 3. Tentar Grok
  if (!rawText && process.env.OPENROUTER_API_KEY) {
    try {
      console.log('  🤖 Tentando Grok via OpenRouter...');
      const fetch = (await import('node-fetch')).default;
      const response = await withTimeout(
        fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://vcm-dashboard.com',
            'X-Title': 'VCM Dashboard',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: grokModel,
            messages: [{ role: 'user', content: prompt }],
            temperature,
            max_tokens: maxTokens
          })
        }),
        timeout
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Grok API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      rawText = data.choices[0].message.content;
      console.log('  ✅ Sucesso com Grok (OpenRouter)');
    } catch (grokError) {
      console.error(`  ❌ Grok falhou: ${grokError.message}`);
      throw new Error('Todos os provedores LLM falharam');
    }
  }

  if (!rawText) {
    throw new Error('Nenhum provedor LLM disponível ou todos falharam');
  }

  if (parseJSON) {
    const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanText);
  }

  return rawText;
}

async function generateJSONWithFallback(prompt, options = {}) {
  return generateWithFallback(prompt, { ...options, parseJSON: true });
}

module.exports = {
  generateWithFallback,
  generateJSONWithFallback
};
