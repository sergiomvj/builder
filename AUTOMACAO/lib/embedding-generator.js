/**
 * Embedding Generator Module
 * Gera embeddings vetoriais usando OpenAI text-embedding-3-small
 * Suporta batch processing e retry logic
 */

import OpenAI from 'openai';

// Inicializa cliente OpenAI (lazy initialization para evitar erro se API key não estiver configurada)
let openai = null;

function getOpenAIClient() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não configurada no ambiente');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

/**
 * Modelo de embedding padrão
 * text-embedding-3-small: 1536 dimensões, $0.00002/1K tokens
 * Melhor custo-benefício para a maioria dos casos
 */
const DEFAULT_MODEL = 'text-embedding-3-small';
const DEFAULT_DIMENSIONS = 1536;

/**
 * Gera embedding para um único texto
 * 
 * @param {string} text - Texto a ser embedado
 * @param {Object} options - Configurações
 * @returns {Promise<{embedding: Array<number>, tokens: number, model: string}>}
 */
export async function generateEmbedding(text, options = {}) {
  const {
    model = DEFAULT_MODEL,
    dimensions = DEFAULT_DIMENSIONS,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  if (!text || text.trim().length === 0) {
    throw new Error('Texto vazio não pode ser embedado');
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada no ambiente');
  }

  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const client = getOpenAIClient();
      const response = await client.embeddings.create({
        model,
        input: text,
        dimensions
      });

      return {
        embedding: response.data[0].embedding,
        tokens: response.usage.total_tokens,
        model: response.model,
        dimensions: response.data[0].embedding.length
      };

    } catch (error) {
      lastError = error;
      
      // Rate limit ou erro temporário: aguarda e tenta novamente
      if (attempt < maxRetries - 1) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.warn(`⚠️ Erro ao gerar embedding (tentativa ${attempt + 1}/${maxRetries}): ${error.message}`);
        console.warn(`   Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Falha ao gerar embedding após ${maxRetries} tentativas: ${lastError.message}`);
}

/**
 * Gera embeddings em lote (batch)
 * OpenAI suporta até 2048 inputs por request
 * 
 * @param {Array<string>} texts - Array de textos
 * @param {Object} options - Configurações
 * @returns {Promise<Array<{embedding: Array<number>, index: number, tokens: number}>>}
 */
export async function generateEmbeddingsBatch(texts, options = {}) {
  const {
    model = DEFAULT_MODEL,
    dimensions = DEFAULT_DIMENSIONS,
    batchSize = 100, // OpenAI recomenda lotes menores para estabilidade
    maxRetries = 3,
    retryDelay = 1000,
    onProgress = null // Callback: (current, total) => {}
  } = options;

  if (!texts || texts.length === 0) {
    return [];
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada no ambiente');
  }

  const results = [];
  const totalBatches = Math.ceil(texts.length / batchSize);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    console.log(`📦 Processando lote ${batchNumber}/${totalBatches} (${batch.length} textos)...`);

    let lastError;
    let batchResults = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const client = getOpenAIClient();
        const response = await client.embeddings.create({
          model,
          input: batch,
          dimensions
        });

        batchResults = response.data.map((item, idx) => ({
          embedding: item.embedding,
          index: i + idx,
          tokens: Math.ceil(response.usage.total_tokens / batch.length), // Aproximação
          dimensions: item.embedding.length
        }));

        break; // Sucesso, sai do loop de retry

      } catch (error) {
        lastError = error;

        if (attempt < maxRetries - 1) {
          const delay = retryDelay * Math.pow(2, attempt);
          console.warn(`⚠️ Erro no lote ${batchNumber} (tentativa ${attempt + 1}/${maxRetries}): ${error.message}`);
          console.warn(`   Aguardando ${delay}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!batchResults) {
      throw new Error(`Falha no lote ${batchNumber} após ${maxRetries} tentativas: ${lastError.message}`);
    }

    results.push(...batchResults);

    // Callback de progresso
    if (onProgress) {
      onProgress(results.length, texts.length);
    }

    // Delay entre lotes para evitar rate limits (ajustável)
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Calcula similaridade cosseno entre dois vetores
 * Útil para validar embeddings localmente
 * 
 * @param {Array<number>} vecA - Primeiro vetor
 * @param {Array<number>} vecB - Segundo vetor
 * @returns {number} - Similaridade entre -1 e 1 (1 = idênticos)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Vetores inválidos ou dimensões incompatíveis');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Valida se um embedding está no formato correto
 * 
 * @param {Array<number>} embedding - Vetor a validar
 * @param {number} expectedDimensions - Dimensões esperadas (default: 1536)
 * @returns {Object} - {valid: boolean, error: string}
 */
export function validateEmbedding(embedding, expectedDimensions = DEFAULT_DIMENSIONS) {
  if (!Array.isArray(embedding)) {
    return { valid: false, error: 'Embedding não é um array' };
  }

  if (embedding.length !== expectedDimensions) {
    return { 
      valid: false, 
      error: `Embedding tem ${embedding.length} dimensões (esperado: ${expectedDimensions})` 
    };
  }

  if (embedding.some(val => typeof val !== 'number' || isNaN(val))) {
    return { valid: false, error: 'Embedding contém valores não-numéricos' };
  }

  // Verifica se o vetor está normalizado (norma próxima de 1)
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (Math.abs(norm - 1.0) > 0.01) {
    return { 
      valid: false, 
      error: `Embedding não está normalizado (norma: ${norm.toFixed(4)})` 
    };
  }

  return { valid: true };
}

/**
 * Estima custo de embeddings
 * text-embedding-3-small: $0.00002/1K tokens
 * 
 * @param {number} totalTokens - Total de tokens processados
 * @param {string} model - Modelo usado
 * @returns {Object} - {cost: number, costFormatted: string}
 */
export function estimateCost(totalTokens, model = DEFAULT_MODEL) {
  const costs = {
    'text-embedding-3-small': 0.00002, // $0.02 per 1M tokens
    'text-embedding-3-large': 0.00013, // $0.13 per 1M tokens
    'text-embedding-ada-002': 0.0001   // $0.10 per 1M tokens (legacy)
  };

  const pricePerToken = costs[model] || costs['text-embedding-3-small'];
  const cost = (totalTokens / 1000) * pricePerToken;

  return {
    cost,
    costFormatted: `$${cost.toFixed(4)}`,
    tokens: totalTokens,
    model
  };
}

export default {
  generateEmbedding,
  generateEmbeddingsBatch,
  cosineSimilarity,
  validateEmbedding,
  estimateCost,
  DEFAULT_MODEL,
  DEFAULT_DIMENSIONS
};
