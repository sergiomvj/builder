import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Importar módulos de RAG (serão usados no Edge Runtime via workaround)
// Nota: Edge Runtime não suporta módulos Node.js nativos, então esta API
// deve rodar em Node.js runtime ou usar fetch interno para Script 11

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * API Endpoint: RAG Query
 * POST /api/rag/query
 * 
 * Recebe pergunta do usuário, busca conhecimento relevante e gera resposta com LLM
 * 
 * Body:
 * {
 *   "query": "Como melhorar vendas de CRM?",
 *   "personaId": "uuid-da-persona",
 *   "empresaId": "uuid-da-empresa",
 *   "topK": 5,
 *   "useHybrid": false,
 *   "keywords": []
 * }
 */

// Forçar Node.js runtime para ter acesso aos módulos de filesystem
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      personaId,
      empresaId,
      topK = 5,
      minSimilarity = 0.7,
      useHybrid = false,
      keywords = [],
      includeRawChunks = false
    } = body;

    // Validações
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query não fornecida' },
        { status: 400 }
      );
    }

    if (!personaId && !empresaId) {
      return NextResponse.json(
        { error: 'personaId ou empresaId obrigatório' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY não configurada' },
        { status: 500 }
      );
    }

    console.log('🔍 RAG Query:', {
      query: query.substring(0, 50) + '...',
      personaId,
      empresaId,
      topK,
      useHybrid
    });

    // Importar módulos dinamicamente (workaround para Edge Runtime)
    const { retrieveRelevantChunks, formatChunksAsContext, hybridSearch, suggestRelatedQuestions } = 
      await import('@/../AUTOMACAO/lib/rag-retriever.js');

    // 1. Buscar chunks relevantes
    const startTime = Date.now();
    
    let chunks;
    if (useHybrid && keywords.length > 0) {
      chunks = await hybridSearch(query, keywords, personaId, { topK, minSimilarity });
    } else {
      chunks = await retrieveRelevantChunks(query, personaId, { topK, minSimilarity });
    }

    const retrievalTime = Date.now() - startTime;

    if (!chunks || chunks.length === 0) {
      return NextResponse.json({
        success: true,
        answer: 'Desculpe, não encontrei informações relevantes na base de conhecimento para responder sua pergunta.',
        chunks: [],
        context: null,
        retrievalTime,
        generationTime: 0,
        suggestedQuestions: []
      });
    }

    console.log(`✅ ${chunks.length} chunks recuperados em ${retrievalTime}ms`);

    // 2. Formatar contexto
    const context = formatChunksAsContext(chunks, 3000);

    // 3. Gerar resposta com LLM + contexto
    const generationStart = Date.now();

    const systemPrompt = `Você é um assistente especializado que responde perguntas baseado EXCLUSIVAMENTE no contexto fornecido.

REGRAS IMPORTANTES:
- Use APENAS informações presentes no contexto
- Se a resposta não estiver no contexto, diga "Não tenho essa informação na base de conhecimento"
- Seja preciso, objetivo e profissional
- Cite a fonte quando relevante (ex: "De acordo com [fonte]...")
- Não invente ou especule informações`;

    const userPrompt = `Contexto da base de conhecimento:

${context}

---

Pergunta do usuário: ${query}

Responda baseando-se APENAS no contexto acima.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3, // Baixa temperatura para respostas mais factuais
      max_tokens: 500
    });

    const answer = completion.choices[0].message.content;
    const generationTime = Date.now() - generationStart;

    console.log(`✅ Resposta gerada em ${generationTime}ms`);

    // 4. Sugerir perguntas relacionadas
    const suggestedQuestions = suggestRelatedQuestions(chunks);

    // 5. Retornar resposta completa
    return NextResponse.json({
      success: true,
      answer,
      chunks: includeRawChunks ? chunks : chunks.map(c => ({
        topic: c.topic,
        source: c.source,
        similarity: c.similarity,
        preview: c.content.substring(0, 150) + '...'
      })),
      context: includeRawChunks ? context : null,
      stats: {
        retrievalTime,
        generationTime,
        totalTime: retrievalTime + generationTime,
        chunksFound: chunks.length,
        tokensUsed: completion.usage?.total_tokens || 0,
        model: 'gpt-4o'
      },
      suggestedQuestions,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro no RAG Query:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar consulta RAG',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rag/query
 * Retorna informações sobre a API
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/rag/query',
    method: 'POST',
    description: 'Retrieval-Augmented Generation Query API',
    requiredFields: ['query', 'personaId OR empresaId'],
    optionalFields: {
      topK: 'Número de chunks a recuperar (default: 5)',
      minSimilarity: 'Similaridade mínima 0-1 (default: 0.7)',
      useHybrid: 'Combinar busca vetorial + keywords (default: false)',
      keywords: 'Array de palavras-chave para busca híbrida',
      includeRawChunks: 'Retornar chunks completos (default: false)'
    },
    example: {
      query: 'Como melhorar vendas de CRM?',
      personaId: '123e4567-e89b-12d3-a456-426614174000',
      topK: 5,
      minSimilarity: 0.7
    }
  });
}
