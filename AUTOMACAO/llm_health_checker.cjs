/**
 * LLM Health Checker - Testa disponibilidade de LLMs antes de executar scripts
 * Ordem de prioridade: Apenas OpenRouter com z-ai/glm-4.6
 * 
 * Uso:
 * const { testLLMs } = require('./llm_health_checker.cjs');
 * const activeLLM = await testLLMs();
 * // Retorna: { provider: 'openrouter', client: <objeto_cliente> }
 */

const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Timeout para teste de saúde (15 segundos)
const HEALTH_CHECK_TIMEOUT = 15000;

/**
 * Testa OpenAI primeiro, depois OpenRouter como fallback
 */
async function testOpenAI() {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.log('  ⚠️  OPENAI_API_KEY não configurada');
      return null;
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "Responda apenas: OK" }],
        max_tokens: 10,
        temperature: 0
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), HEALTH_CHECK_TIMEOUT)
      )
    ]);

    if (completion.choices?.[0]?.message?.content) {
      console.log(`  ✅ OpenAI (gpt-4): Operacional`);
      return { provider: 'openai', client: openai, model: 'gpt-4' };
    }
  } catch (error) {
    console.log(`  ❌ OpenAI falhou: ${error.message}`);
  }
  return null;
}

/**
 * Testa OpenRouter como fallback (usando modelo Grok que é mais rápido)
 */
async function testOpenRouterFallback() {
  try {
    const apiKeys = [process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_API_KEY2].filter(Boolean);
    if (apiKeys.length === 0) {
      console.log('  ⚠️  Nenhuma chave OpenRouter configurada');
      return null;
    }

    for (const apiKey of apiKeys) {
      try {
        const openai = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey,
          defaultHeaders: {
            "HTTP-Referer": "https://vcm.arvabot.com",
            "X-Title": "VCM - Virtual Company Manager"
          }
        });
        const completion = await Promise.race([
          openai.chat.completions.create({
            model: "x-ai/grok-4.1-fast:free",
            messages: [{ role: "user", content: "Responda apenas: OK" }],
            max_tokens: 10,
            temperature: 0
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), HEALTH_CHECK_TIMEOUT)
          )
        ]);
        if (completion.choices?.[0]?.message?.content) {
          console.log(`  ✅ OpenRouter (grok-4.1-fast:free): Operacional com chave ${apiKey.slice(0,12)}...`);
          return { provider: 'openrouter', client: openai, model: 'x-ai/grok-4.1-fast:free' };
        }
      } catch (error) {
        console.log(`  ❌ OpenRouter (chave ${apiKey.slice(0,12)}...): ${error.message}`);
      }
    }
    console.log('  ⚠️  Nenhuma chave OpenRouter funcionou.');
    return null;
  }
  catch (error) {
    console.log(`  ❌ Erro inesperado em testOpenRouterFallback: ${error.message}`);
    return null;
  }
}

/**
 * Testa todos os LLMs na ordem de prioridade: OpenAI primeiro, depois OpenRouter
 * Retorna o primeiro que responder ou null se nenhum funcionar
 */
async function testLLMs() {
  console.log('\n🔍 Testando disponibilidade de LLMs...\n');

  // Ordem de prioridade: OpenAI primeiro, depois OpenRouter
  const tests = [
    { name: 'OpenAI', fn: testOpenAI },
    { name: 'OpenRouter', fn: testOpenRouterFallback }
  ];

  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      console.log(`\n✅ LLM ativo: ${result.provider.toUpperCase()} (${result.model})\n`);
      return result;
    }
  }

  console.log('\n❌ ERRO: Nenhum LLM disponível!\n');
  console.log('Verifique:');
  console.log('  - Variável de ambiente OPENAI_API_KEY');
  console.log('  - Variável de ambiente OPENROUTER_API_KEY');
  console.log('  - Conexão com internet');
  console.log('  - Saldo/quota das APIs\n');
  
  return null;
}

/**
 * Gera conteúdo com fallback automático
 */
async function generateWithFallback(activeLLM, prompt, options = {}) {
  const {
    systemPrompt = '',
    temperature = 0.7,
    maxTokens = 2000
  } = options;

  if (!activeLLM) {
    throw new Error('Nenhum LLM ativo disponível');
  }

  try {
    if (activeLLM.provider === 'openai') {
      const messages = systemPrompt 
        ? [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        : [{ role: "user", content: prompt }];

      const completion = await activeLLM.client.chat.completions.create({
        model: activeLLM.model,
        messages,
        temperature,
        max_tokens: maxTokens
      });

      return completion.choices[0].message.content;
    } else if (activeLLM.provider === 'openrouter') {
      const messages = systemPrompt 
        ? [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ]
        : [{ role: "user", content: prompt }];

      const completion = await activeLLM.client.chat.completions.create({
        model: activeLLM.model,
        messages,
        temperature,
        max_tokens: maxTokens
      });

      return completion.choices[0].message.content;
    }
  } catch (error) {
    throw new Error(`Erro ao gerar conteúdo com ${activeLLM.provider}: ${error.message}`);
  }
}

module.exports = {
  testLLMs,
  generateWithFallback,
  testOpenAI,
  testOpenRouterFallback
};

// Executar teste se chamado diretamente
if (require.main === module) {
  testLLMs().then((result) => {
    if (result) {
      console.log(`\n🎉 Teste concluído com sucesso!`);
    } else {
      console.log(`\n❌ Nenhum LLM disponível.`);
      process.exit(1);
    }
  }).catch((error) => {
    console.error(`\n💥 Erro durante teste:`, error.message);
    process.exit(1);
  });
}
