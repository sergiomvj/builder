/**
 * Text Chunker Module
 * Divide documentos longos em chunks menores para embeddings e RAG
 * Suporta estratégias: fixed-size (com overlap) e semantic (por parágrafos/seções)
 */

/**
 * Estratégia Fixed-Size com Overlap
 * Divide texto em chunks de tamanho fixo com sobreposição para manter contexto
 * 
 * @param {string} text - Texto completo a ser dividido
 * @param {number} chunkSize - Tamanho de cada chunk em caracteres (default: 1000)
 * @param {number} overlap - Número de caracteres sobrepostos entre chunks (default: 200)
 * @returns {Array<{content: string, index: number, start: number, end: number}>}
 */
export function chunkByFixedSize(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    
    // Se não é o último chunk, tenta quebrar em fronteira de palavra
    if (end < text.length) {
      // Procura por espaço, ponto, vírgula ou quebra de linha próximos ao fim
      const searchStart = Math.max(start, end - 100);
      const searchEnd = Math.min(text.length, end + 100);
      const substring = text.substring(searchStart, searchEnd);
      
      const boundaryChars = ['\n\n', '\n', '. ', '! ', '? ', ', ', ' '];
      let bestBoundary = -1;
      
      for (const boundary of boundaryChars) {
        const pos = substring.lastIndexOf(boundary, end - searchStart);
        if (pos > 0 && pos > bestBoundary) {
          bestBoundary = pos;
          break; // Usa a primeira fronteira encontrada (mais forte)
        }
      }
      
      if (bestBoundary > 0) {
        end = searchStart + bestBoundary + 1;
      }
    }

    const content = text.substring(start, end).trim();
    
    if (content.length > 0) {
      chunks.push({
        content,
        index,
        start,
        end,
        size: content.length
      });
      index++;
    }

    // Próximo chunk começa com overlap
    start = end - overlap;
    
    // Evita loop infinito se overlap >= chunkSize
    if (start <= chunks[chunks.length - 1]?.start) {
      start = end;
    }
  }

  return chunks;
}

/**
 * Estratégia Semantic Chunking
 * Divide texto por parágrafos/seções mantendo unidades semânticas intactas
 * Agrupa parágrafos pequenos até atingir tamanho mínimo
 * 
 * @param {string} text - Texto completo a ser dividido
 * @param {number} minSize - Tamanho mínimo de cada chunk (default: 500)
 * @param {number} maxSize - Tamanho máximo de cada chunk (default: 1500)
 * @returns {Array<{content: string, index: number, paragraphs: number}>}
 */
export function chunkBySemantic(text, minSize = 500, maxSize = 1500) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Divide por parágrafos (dupla quebra de linha ou quebra simples seguida de maiúscula)
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const chunks = [];
  let currentChunk = '';
  let currentParagraphs = 0;
  let index = 0;

  for (const paragraph of paragraphs) {
    const potentialChunk = currentChunk 
      ? `${currentChunk}\n\n${paragraph}` 
      : paragraph;

    // Se adicionar este parágrafo ultrapassar maxSize E já temos conteúdo, salva chunk atual
    if (potentialChunk.length > maxSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        index,
        paragraphs: currentParagraphs,
        size: currentChunk.length
      });
      index++;
      currentChunk = paragraph;
      currentParagraphs = 1;
    } 
    // Se ainda não atingiu maxSize OU é o primeiro parágrafo, adiciona
    else {
      currentChunk = potentialChunk;
      currentParagraphs++;
    }

    // Se atingiu tamanho mínimo E terminou uma seção lógica (ex: parágrafo que termina com ponto)
    if (currentChunk.length >= minSize && paragraph.endsWith('.')) {
      chunks.push({
        content: currentChunk.trim(),
        index,
        paragraphs: currentParagraphs,
        size: currentChunk.length
      });
      index++;
      currentChunk = '';
      currentParagraphs = 0;
    }
  }

  // Adiciona último chunk se houver conteúdo restante
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      index,
      paragraphs: currentParagraphs,
      size: currentChunk.length
    });
  }

  return chunks;
}

/**
 * Estratégia Hybrid (recomendada)
 * Tenta semantic chunking primeiro, depois fixed-size para chunks muito grandes
 * 
 * @param {string} text - Texto completo
 * @param {Object} options - Configurações
 * @returns {Array<{content: string, index: number, strategy: string}>}
 */
export function chunkHybrid(text, options = {}) {
  const {
    minSize = 500,
    maxSize = 1500,
    overlap = 200
  } = options;

  // Primeiro tenta semantic
  const semanticChunks = chunkBySemantic(text, minSize, maxSize);

  // Se algum chunk ficou muito grande, quebra com fixed-size
  const finalChunks = [];
  let globalIndex = 0;

  for (const chunk of semanticChunks) {
    if (chunk.size > maxSize) {
      // Chunk muito grande, quebra com fixed-size
      const subChunks = chunkByFixedSize(chunk.content, maxSize - overlap, overlap);
      
      for (const subChunk of subChunks) {
        finalChunks.push({
          content: subChunk.content,
          index: globalIndex++,
          strategy: 'hybrid-fixed',
          originalIndex: chunk.index,
          size: subChunk.size
        });
      }
    } else {
      // Chunk OK, mantém
      finalChunks.push({
        content: chunk.content,
        index: globalIndex++,
        strategy: 'hybrid-semantic',
        paragraphs: chunk.paragraphs,
        size: chunk.size
      });
    }
  }

  return finalChunks;
}

/**
 * Calcula número aproximado de tokens para OpenAI
 * Regra simples: ~4 caracteres = 1 token para inglês, ~3 para português
 * 
 * @param {string} text - Texto a contar
 * @returns {number} - Estimativa de tokens
 */
export function estimateTokens(text) {
  if (!text) return 0;
  
  // Heurística: português tem palavras mais longas, então ~3 chars/token
  // Inglês tem ~4 chars/token
  // Usamos média 3.5 para textos mistos
  return Math.ceil(text.length / 3.5);
}

/**
 * Valida se chunks estão dentro dos limites do modelo
 * OpenAI embeddings suportam até 8191 tokens
 * 
 * @param {Array} chunks - Array de chunks
 * @param {number} maxTokens - Limite máximo de tokens (default: 8000)
 * @returns {Object} - {valid: boolean, issues: Array}
 */
export function validateChunks(chunks, maxTokens = 8000) {
  const issues = [];

  for (const chunk of chunks) {
    const tokens = estimateTokens(chunk.content);
    
    if (tokens > maxTokens) {
      issues.push({
        index: chunk.index,
        tokens,
        message: `Chunk ${chunk.index} tem ${tokens} tokens (limite: ${maxTokens})`
      });
    }

    if (chunk.content.trim().length === 0) {
      issues.push({
        index: chunk.index,
        message: `Chunk ${chunk.index} está vazio`
      });
    }
  }

  return {
    valid: issues.length === 0,
    totalChunks: chunks.length,
    issues
  };
}

// Exporta estratégia padrão
export default chunkHybrid;
