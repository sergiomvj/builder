/**
 * 🤖 LLM FALLBACK HELPER - MÚLTIPLOS PROVEDORES
 * ============================================
 * Fallback entre 6 modelos (ordem de prioridade):
 * 1. x-ai/grok-4.1-fast (Grok - primário)
 * 2. z-ai/glm-4.6 (GLM-4.6)
 * 3. moonshotai/kimi-k2:free (Kimi-K2)
 * 4. openai/gpt-3.5-turbo-0613 (GPT-3.5)
 * 5. qwen/qwen3-max (Qwen3 Max)
 * 6. anthropic/claude-haiku-4.5 (Claude Haiku)
 *
 * Uso:
 * import { generateWithFallback } from './lib/llm_fallback.js';
 *
 * const result = await generateWithFallback(prompt, {
 *   temperature: 0.8,
 *   maxTokens: 2500
 * });
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const openrouter = process.env.OPENROUTER_API_KEY ? new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://vcm.arvabot.com",
    "X-Title": "VCM - Virtual Company Manager"
  }
}) : null;

/**
 * Gera texto com fallback entre 2 modelos OpenRouter
 * @param {string} prompt - Prompt para o LLM
 * @param {Object} options - Opções de configuração
 * @returns {Promise<string>} - Texto gerado
 */
export async function generateWithFallback(prompt, options = {}) {
  const {
    temperature = 0.8,
    maxTokens = 2500,
    parseJSON = false,
    timeout = 25000 // 25 segundos por tentativa
  } = options;

  if (!openai && !openrouter) {
    throw new Error('Nenhum provedor LLM disponível (sem API keys)');
  }

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

  // Modelos em ordem de prioridade (conforme especificado)
  const models = [];
  
  if (openrouter) {
    models.push(
      { client: openrouter, name: 'x-ai/grok-4.1-fast', display: 'Grok 4.1 Fast' },
      { client: openrouter, name: 'z-ai/glm-4.6', display: 'GLM-4.6' },
      { client: openrouter, name: 'moonshotai/kimi-k2:free', display: 'Kimi-K2' },
      { client: openrouter, name: 'openai/gpt-3.5-turbo-0613', display: 'GPT-3.5 Turbo' },
      { client: openrouter, name: 'qwen/qwen3-max', display: 'Qwen3 Max' },
      { client: openrouter, name: 'anthropic/claude-haiku-4.5', display: 'Claude Haiku 4.5' }
    );
  }
  
  if (openai) {
    models.push({ 
      client: openai, 
      name: 'gpt-4', 
      display: 'OpenAI GPT-4 (fallback final)' 
    });
  }

  // Tentar cada modelo em sequência
  let lastError = null;
  let usedModel = null;
  let usageTokens = { input: 0, output: 0 };
  
  for (const model of models) {
    try {
      console.log(`  🤖 Tentando ${model.display}...`);
      const startTime = Date.now();

      const completion = await withTimeout(
        model.client.chat.completions.create({
          model: model.name,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens
        }),
        timeout
      );

      rawText = completion.choices[0].message.content;
      const elapsed = Date.now() - startTime;
      
      // Capturar informações de uso
      usedModel = model.name;
      usageTokens = {
        input: completion.usage?.prompt_tokens || 0,
        output: completion.usage?.completion_tokens || 0
      };
      
      console.log(`  ✅ Sucesso com ${model.display} (${(elapsed/1000).toFixed(1)}s)`);
      
      // Retornar com metadados
      return {
        content: rawText,
        model: usedModel,
        tokens: usageTokens,
        duration: elapsed,
        parseJSON
      };

    } catch (error) {
      lastError = error;
      console.log(`  ⚠️  ${model.display} falhou: ${error.message}`);
      continue; // Tenta o próximo modelo
    }
  }

  // Se chegou aqui, todos falharam
  throw new Error(`Todos os provedores LLM falharam. Último erro: ${lastError?.message}`);
}

/**
 * Gera texto JSON estruturado com fallback
 * @param {string} prompt - Prompt para o LLM
 * @param {Object} options - Opções de configuração
 * @returns {Promise<Object>} - JSON parseado + metadados
 */
export async function generateJSONWithFallback(prompt, options = {}) {
  const result = await generateWithFallback(prompt, { ...options, parseJSON: false });
  
  // Parse JSON
  let cleanText = result.content
    .replace(/```json\n?|\n?```/g, '')  // Remove ```json e ```
    .replace(/^json\s*\n?/i, '')        // Remove "json" no início
    .replace(/^text\s*\n?/i, '')        // Remove "text" no início
    .trim();
  
  // Se ainda tiver problemas, tentar extrair apenas o JSON
  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleanText = jsonMatch[0];
  }
  
  const parsed = JSON.parse(cleanText);
  
  // Retornar apenas o objeto parseado (sem metadados)
  // Os scripts esperam acessar diretamente as propriedades
  return parsed;
}
