/**
 * RAG Retriever Module
 * Sistema de recuperação aumentada para consultas baseadas em conhecimento vetorial
 * Converte perguntas em embeddings e busca chunks relevantes via similarity search
 */

import { generateEmbedding } from './embedding-generator.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Cliente Supabase (lazy initialization)
let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar configuradas');
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

/**
 * Busca chunks relevantes usando similarity search
 * Usa operador <=> do pgvector para cosine distance
 * 
 * @param {string} query - Pergunta do usuário
 * @param {string} personaId - ID da persona (opcional, filtra por persona)
 * @param {Object} options - Configurações de busca
 * @returns {Promise<Array>} - Chunks ordenados por relevância
 */
export async function retrieveRelevantChunks(query, personaId = null, options = {}) {
  const {
    topK = 5,                    // Número de chunks a retornar
    minSimilarity = 0.7,         // Similaridade mínima (0-1)
    includeMetadata = true,      // Incluir metadata dos chunks
    rerank = false               // Re-ranquear resultados (futuro)
  } = options;

  try {
    // 1. Gera embedding da query
    console.log(`🔍 Gerando embedding para query: "${query.substring(0, 50)}..."`);
    const { embedding: queryEmbedding, tokens } = await generateEmbedding(query);

    if (!queryEmbedding || queryEmbedding.length !== 1536) {
      throw new Error('Embedding da query inválido');
    }

    console.log(`✅ Embedding gerado (${tokens} tokens)`);

    // 2. Busca vetorial no Supabase
    console.log(`🔎 Buscando top ${topK} chunks mais relevantes...`);

    // Construir query SQL com pgvector
    // Nota: <=> é operador de cosine distance (menor = mais similar)
    // Convertemos para similarity: 1 - distance
    let sqlQuery = supabase
      .from('knowledge_chunks')
      .select(`
        id,
        persona_id,
        topic,
        content,
        source,
        chunk_index,
        ${includeMetadata ? 'metadata,' : ''}
        created_at
      `)
      .order('embedding <=> $1', { ascending: true }) // Mais similar primeiro
      .limit(topK * 2); // Busca mais para filtrar depois

    // Filtrar por persona se fornecido
    if (personaId) {
      sqlQuery = sqlQuery.eq('persona_id', personaId);
    }

    // pgvector similarity search usando RPC function
    const supabase = getSupabaseClient();
    const { data: chunks, error } = await supabase.rpc('match_knowledge_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: minSimilarity,
      match_count: topK,
      filter_persona_id: personaId
    });

    if (error) {
      console.error('❌ Erro na busca vetorial:', error);
      throw new Error(`Erro na busca vetorial: ${error.message}`);
    }

    if (!chunks || chunks.length === 0) {
      console.warn('⚠️ Nenhum chunk encontrado acima do threshold de similaridade');
      return [];
    }

    console.log(`✅ ${chunks.length} chunks encontrados`);

    // 3. Enriquecer resultados com informações da persona
    const enrichedChunks = await enrichChunksWithPersonaInfo(chunks);

    // 4. Re-ranking (opcional, futuro)
    // Pode usar cross-encoder ou outras técnicas mais sofisticadas
    if (rerank && enrichedChunks.length > 1) {
      // TODO: implementar re-ranking
      console.log('🔄 Re-ranking não implementado ainda');
    }

    // 5. Retornar resultados
    return enrichedChunks.map(chunk => ({
      id: chunk.id,
      content: chunk.content,
      topic: chunk.topic,
      source: chunk.source,
      similarity: chunk.similarity,
      persona: chunk.persona_info,
      metadata: chunk.metadata,
      created_at: chunk.created_at
    }));

  } catch (error) {
    console.error('❌ Erro no retrieval:', error);
    throw error;
  }
}

/**
 * Enriquece chunks com informações das personas
 */
async function enrichChunksWithPersonaInfo(chunks) {
  if (!chunks || chunks.length === 0) return [];

  const personaIds = [...new Set(chunks.map(c => c.persona_id))];

  const supabase = getSupabaseClient();
  const { data: personas, error } = await supabase
    .from('personas')
    .select('id, full_name, role, department, email')
    .in('id', personaIds);

  if (error) {
    console.warn('⚠️ Erro ao buscar personas:', error.message);
    return chunks;
  }

  const personaMap = new Map(personas.map(p => [p.id, p]));

  return chunks.map(chunk => ({
    ...chunk,
    persona_info: personaMap.get(chunk.persona_id) || null
  }));
}

/**
 * Formata chunks em contexto para LLM
 * Combina múltiplos chunks em um único texto formatado
 * 
 * @param {Array} chunks - Chunks recuperados
 * @param {number} maxTokens - Limite de tokens para contexto (default: 3000)
 * @returns {string} - Contexto formatado
 */
export function formatChunksAsContext(chunks, maxTokens = 3000) {
  if (!chunks || chunks.length === 0) {
    return 'Nenhum contexto relevante encontrado na base de conhecimento.';
  }

  let context = '# Contexto relevante da base de conhecimento:\n\n';
  let currentTokens = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Estimativa de tokens (4 chars ≈ 1 token)
    const chunkTokens = Math.ceil(chunk.content.length / 4);
    
    if (currentTokens + chunkTokens > maxTokens) {
      console.log(`⚠️ Limite de tokens atingido (${currentTokens}/${maxTokens}). Parando em chunk ${i + 1}/${chunks.length}`);
      break;
    }

    context += `## Fonte: ${chunk.source} (Tópico: ${chunk.topic})\n`;
    context += `Relevância: ${(chunk.similarity * 100).toFixed(1)}%\n`;
    context += `${chunk.content}\n\n`;
    context += `---\n\n`;

    currentTokens += chunkTokens + 20; // +20 para metadados
  }

  return context.trim();
}

/**
 * Busca híbrida: combina busca vetorial com busca por palavras-chave
 * Útil quando embeddings não capturam termos técnicos específicos
 * 
 * @param {string} query - Pergunta
 * @param {Array<string>} keywords - Palavras-chave obrigatórias
 * @param {string} personaId - ID da persona
 * @param {Object} options - Opções
 * @returns {Promise<Array>} - Chunks combinados
 */
export async function hybridSearch(query, keywords = [], personaId = null, options = {}) {
  const { topK = 5 } = options;

  // 1. Busca vetorial
  const vectorResults = await retrieveRelevantChunks(query, personaId, { 
    topK: Math.floor(topK * 0.7) // 70% dos resultados via vector
  });

  // 2. Busca por keywords (se fornecidas)
  let keywordResults = [];
  
  if (keywords.length > 0) {
    console.log(`🔎 Busca por keywords: ${keywords.join(', ')}`);
    
    const supabase = getSupabaseClient();
    let keywordQuery = supabase
      .from('knowledge_chunks')
      .select('id, persona_id, topic, content, source, chunk_index, metadata, created_at');

    if (personaId) {
      keywordQuery = keywordQuery.eq('persona_id', personaId);
    }

    // Busca por cada keyword (OR)
    const keywordConditions = keywords.map(kw => 
      `content.ilike.%${kw}%`
    ).join(',');

    keywordQuery = keywordQuery.or(keywordConditions).limit(Math.ceil(topK * 0.3));

    const { data, error } = await keywordQuery;

    if (!error && data) {
      keywordResults = await enrichChunksWithPersonaInfo(data);
      // Adicionar similarity artificial baseada em contagem de keywords
      keywordResults = keywordResults.map(chunk => ({
        ...chunk,
        similarity: 0.85 // Score fixo para keyword matches
      }));
    }
  }

  // 3. Combinar e dedupcar resultados
  const allResults = [...vectorResults, ...keywordResults];
  const uniqueResults = Array.from(
    new Map(allResults.map(r => [r.id, r])).values()
  );

  // 4. Re-ordenar por similarity
  const sorted = uniqueResults
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  console.log(`✅ Busca híbrida: ${sorted.length} chunks (${vectorResults.length} vector + ${keywordResults.length} keyword)`);

  return sorted;
}

/**
 * Sugere perguntas relacionadas baseadas nos chunks recuperados
 * Útil para UI de sugestões
 * 
 * @param {Array} chunks - Chunks recuperados
 * @returns {Array<string>} - Perguntas sugeridas
 */
export function suggestRelatedQuestions(chunks) {
  if (!chunks || chunks.length === 0) return [];

  const topics = [...new Set(chunks.map(c => c.topic))];
  
  const suggestions = [
    `Quais são as melhores práticas em ${topics[0]}?`,
    `Como posso melhorar meu desempenho em ${topics[0]}?`,
    `Quais ferramentas são recomendadas para ${topics[0]}?`
  ];

  return suggestions.slice(0, 3);
}

export default {
  retrieveRelevantChunks,
  formatChunksAsContext,
  hybridSearch,
  suggestRelatedQuestions
};
