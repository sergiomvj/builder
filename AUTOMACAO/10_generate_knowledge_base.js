#!/usr/bin/env node
/**
 * Script 10: Knowledge Base Generation
 * Processa documentos, gera chunks, cria embeddings e armazena no banco para RAG
 * 
 * Uso: node 10_generate_knowledge_base.js --empresaId=UUID [--source=caminho/arquivo.txt]
 * 
 * Fluxo:
 * 1. Lê documentos de uma fonte (arquivo local ou diretório)
 * 2. Divide em chunks otimizados (hybrid chunking)
 * 3. Gera embeddings com OpenAI text-embedding-3-small
 * 4. Armazena chunks + embeddings no PostgreSQL/pgvector
 * 5. Associa conhecimento às personas relevantes baseado em tópicos
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import chunkHybrid, { validateChunks, estimateTokens } from './lib/text-chunker.js';
import { generateEmbeddingsBatch, estimateCost, validateEmbedding } from './lib/embedding-generator.js';
import { ExecutionTracker } from './lib/execution-tracker.js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do .env.local na raiz do projeto
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Configurar encoding do console para UTF-8
setupConsoleEncoding();

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const CHUNK_MIN_SIZE = 500;
const CHUNK_MAX_SIZE = 1500;
const CHUNK_OVERLAP = 200;

// Cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Extrai empresaId e source dos argumentos CLI
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let empresaId = null;
  let source = null;

  for (const arg of args) {
    if (arg.startsWith('--empresaId=')) {
      empresaId = arg.split('=')[1];
    } else if (arg.startsWith('--source=')) {
      source = arg.split('=')[1];
    }
  }

  return { empresaId, source };
}

/**
 * Valida ambiente e argumentos
 */
function validateEnvironment(empresaId, source) {
  const errors = [];

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    errors.push('❌ Variáveis NEXT_PUBLIC_SUPABASE_* não configuradas');
  }

  if (!OPENAI_API_KEY) {
    errors.push('❌ Variável OPENAI_API_KEY não configurada');
  }

  if (!empresaId) {
    errors.push('❌ Argumento --empresaId=UUID obrigatório');
  }

  if (!source) {
    errors.push('❌ Argumento --source=caminho obrigatório');
  }

  if (errors.length > 0) {
    console.error('\n🚨 Erros de configuração:\n');
    errors.forEach(err => console.error(`   ${err}`));
    console.error('\n💡 Uso: node 10_generate_knowledge_base.js --empresaId=UUID --source=arquivo.txt\n');
    process.exit(1);
  }
}

/**
 * Carrega documento(s) da fonte
 * Suporta: arquivo único (.txt, .md) ou diretório
 */
async function loadDocuments(sourcePath) {
  const documents = [];

  try {
    const stats = await fs.stat(sourcePath);

    if (stats.isFile()) {
      // Arquivo único
      const content = await fs.readFile(sourcePath, 'utf-8');
      const filename = sourcePath.split('/').pop();
      
      documents.push({
        filename,
        content,
        path: sourcePath,
        size: content.length,
        type: filename.split('.').pop()
      });

    } else if (stats.isDirectory()) {
      // Diretório: lê todos .txt e .md
      const files = await fs.readdir(sourcePath);
      const textFiles = files.filter(f => f.endsWith('.txt') || f.endsWith('.md'));

      for (const file of textFiles) {
        const filePath = join(sourcePath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        documents.push({
          filename: file,
          content,
          path: filePath,
          size: content.length,
          type: file.split('.').pop()
        });
      }
    }

  } catch (error) {
    throw new Error(`Erro ao carregar documentos: ${error.message}`);
  }

  if (documents.length === 0) {
    throw new Error('Nenhum documento encontrado na fonte especificada');
  }

  return documents;
}

/**
 * Busca personas da empresa
 */
async function getPersonas(empresaId) {
  const { data, error } = await supabase
    .from('personas')
    .select(`
      id,
      personas_biografias(biografia_estruturada)
    `)
    .eq('empresa_id', empresaId)
    .order('id');

  if (error) {
    throw new Error(`Erro ao buscar personas: ${error.message}`);
  }

  // Extrair dados do JSONB biografia_estruturada
  const personas = (data || []).map(p => {
    const bio = p.personas_biografias?.[0]?.biografia_estruturada || {};
    
    // Extrair nome de biografia_completa (primeiras palavras) ou usar placeholder
    const nomeMatch = bio.biografia_completa?.match(/^([^,]+)/);
    const nome = nomeMatch ? nomeMatch[1].trim() : 'Persona Sem Nome';
    
    // Extrair cargo de hard_skills.areas_conhecimento ou usar placeholder
    const cargo = bio.hard_skills?.areas_conhecimento?.[0] || 'Sem cargo definido';
    
    // Extrair departamento de hard_skills.areas_conhecimento
    const departamento = bio.hard_skills?.areas_conhecimento?.join(', ') || 'Geral';
    
    return {
      id: p.id,
      nome,
      cargo,
      departamento
    };
  });

  return personas;
}

/**
 * Busca recomendações RAG das personas para determinar tópicos relevantes
 */
async function getRagRecommendations(personaIds) {
  const { data, error } = await supabase
    .from('rag_knowledge')
    .select('persona_id, topicos, areas_conhecimento')
    .in('persona_id', personaIds);

  if (error) {
    console.warn(`⚠️ Erro ao buscar recomendações RAG: ${error.message}`);
    return [];
  }

  return data || [];
}

/**
 * Identifica personas relevantes para um chunk baseado em tópicos
 */
function matchPersonasToChunk(chunkContent, personas, ragRecommendations) {
  const matches = [];
  const contentLower = chunkContent.toLowerCase();

  for (const persona of personas) {
    let score = 0;

    // Verifica se há recomendações RAG para esta persona
    const recommendation = ragRecommendations.find(r => r.persona_id === persona.id);
    
    if (recommendation) {
      // Verifica tópicos recomendados
      const topicos = recommendation.topicos || [];
      for (const topico of topicos) {
        if (contentLower.includes(topico.toLowerCase())) {
          score += 3; // Match em tópico recomendado tem peso alto
        }
      }

      // Verifica áreas de conhecimento
      const areas = recommendation.areas_conhecimento || [];
      for (const area of areas) {
        if (contentLower.includes(area.toLowerCase())) {
          score += 2;
        }
      }
    }

    // Match por cargo/departamento (fallback)
    if (persona.cargo && contentLower.includes(persona.cargo.toLowerCase())) {
      score += 1;
    }
    if (persona.departamento && contentLower.includes(persona.departamento.toLowerCase())) {
      score += 1;
    }

    if (score > 0) {
      matches.push({ persona, score });
    }
  }

  // Ordena por score e retorna apenas IDs
  return matches
    .sort((a, b) => b.score - a.score)
    .map(m => m.persona.id);
}

/**
 * Extrai tópico principal do chunk
 */
function extractTopic(content, source) {
  // Estratégia simples: primeira linha não-vazia ou primeiras palavras
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    // Se primeira linha parece título (< 100 chars, sem ponto final), usa ela
    if (firstLine.length < 100 && !firstLine.endsWith('.')) {
      return firstLine;
    }
  }

  // Fallback: primeiras 60 caracteres
  const preview = content.substring(0, 60).trim();
  return preview + (content.length > 60 ? '...' : '');
}

/**
 * Salva chunks com embeddings no banco
 */
async function saveKnowledgeChunks(chunks, embeddings, personas, ragRecommendations, sourceFile) {
  const saved = [];
  const errors = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embeddingData = embeddings[i];

    // Valida embedding
    const validation = validateEmbedding(embeddingData.embedding);
    if (!validation.valid) {
      errors.push({
        chunk: chunk.index,
        error: `Embedding inválido: ${validation.error}`
      });
      continue;
    }

    // Identifica personas relevantes
    const relevantPersonaIds = matchPersonasToChunk(chunk.content, personas, ragRecommendations);
    
    if (relevantPersonaIds.length === 0) {
      console.warn(`⚠️ Chunk ${chunk.index} sem personas relevantes, atribuindo a todas`);
      relevantPersonaIds.push(...personas.map(p => p.id));
    }

    // Extrai tópico
    const topic = extractTopic(chunk.content, sourceFile);

    // Salva um registro para cada persona relevante
    for (const personaId of relevantPersonaIds) {
      const record = {
        persona_id: personaId,
        topic,
        content: chunk.content,
        embedding: JSON.stringify(embeddingData.embedding), // pgvector aceita array JSON
        source: sourceFile,
        chunk_index: chunk.index,
        metadata: {
          strategy: chunk.strategy,
          size: chunk.size,
          tokens: embeddingData.tokens,
          file_type: sourceFile.split('.').pop()
        }
      };

      const { data, error } = await supabase
        .from('knowledge_chunks')
        .insert(record)
        .select()
        .single();

      if (error) {
        errors.push({
          chunk: chunk.index,
          persona: personaId,
          error: error.message
        });
      } else {
        saved.push(data);
      }
    }
  }

  return { saved, errors };
}

/**
 * MAIN
 */
async function main() {
  console.log('\n📚 Script 10: Knowledge Base Generation\n');

  const { empresaId, source } = parseArgs();
  validateEnvironment(empresaId, source);

  let tracker;

  try {
    // 1. Carrega documentos
    console.log('📂 Carregando documentos...');
    const documents = await loadDocuments(source);
    console.log(`✅ ${documents.length} documento(s) carregado(s)`);
    
    documents.forEach(doc => {
      console.log(`   📄 ${doc.filename} (${doc.size} chars, ~${estimateTokens(doc.content)} tokens)`);
    });

    // 2. Busca personas
    console.log('\n👥 Buscando personas...');
    const personas = await getPersonas(empresaId);
    console.log(`✅ ${personas.length} personas encontradas`);

    // 3. Busca recomendações RAG
    console.log('\n🎯 Buscando recomendações RAG...');
    const personaIds = personas.map(p => p.id);
    const ragRecommendations = await getRagRecommendations(personaIds);
    console.log(`✅ ${ragRecommendations.length} recomendações encontradas`);

    // 4. Processa cada documento
    let totalChunks = 0;
    let totalTokens = 0;
    let totalSaved = 0;
    let totalErrors = 0;

    for (const doc of documents) {
      console.log(`\n📖 Processando: ${doc.filename}`);

      // Inicializa tracker para este documento
      const totalEstimatedChunks = Math.ceil(doc.content.length / CHUNK_MAX_SIZE);
      tracker = new ExecutionTracker('10_generate_knowledge_base', empresaId, totalEstimatedChunks);
      await tracker.start(`Processando ${doc.filename}`);

      // 4.1. Chunking
      console.log(`   🔪 Dividindo em chunks (${CHUNK_MIN_SIZE}-${CHUNK_MAX_SIZE} chars)...`);
      const chunks = chunkHybrid(doc.content, {
        minSize: CHUNK_MIN_SIZE,
        maxSize: CHUNK_MAX_SIZE,
        overlap: CHUNK_OVERLAP
      });

      const validation = validateChunks(chunks);
      if (!validation.valid) {
        console.error(`   ❌ Chunks inválidos:`);
        validation.issues.forEach(issue => console.error(`      - ${issue.message}`));
        await tracker.error('Chunks inválidos');
        continue;
      }

      console.log(`   ✅ ${chunks.length} chunks criados`);
      totalChunks += chunks.length;

      // 4.2. Gera embeddings
      console.log(`   🧠 Gerando embeddings...`);
      const chunkTexts = chunks.map(c => c.content);
      
      const embeddings = await generateEmbeddingsBatch(chunkTexts, {
        batchSize: 100,
        onProgress: (current, total) => {
          tracker.updateProgress(current, `Embeddings: ${current}/${total}`, doc.filename);
        }
      });

      const docTokens = embeddings.reduce((sum, e) => sum + e.tokens, 0);
      totalTokens += docTokens;

      const cost = estimateCost(docTokens);
      console.log(`   ✅ ${embeddings.length} embeddings gerados (${docTokens} tokens, ${cost.costFormatted})`);

      // 4.3. Salva no banco
      console.log(`   💾 Salvando chunks no banco...`);
      const { saved, errors } = await saveKnowledgeChunks(
        chunks, 
        embeddings, 
        personas, 
        ragRecommendations, 
        doc.filename
      );

      totalSaved += saved.length;
      totalErrors += errors.length;

      console.log(`   ✅ ${saved.length} chunks salvos`);
      if (errors.length > 0) {
        console.error(`   ⚠️ ${errors.length} erros durante salvamento`);
        errors.slice(0, 3).forEach(err => {
          console.error(`      - Chunk ${err.chunk}: ${err.error}`);
        });
      }

      await tracker.success(`${doc.filename}: ${saved.length} chunks salvos`);
    }

    // 5. Resumo final
    const finalCost = estimateCost(totalTokens);
    
    await tracker.complete(
      `✅ Processamento concluído: ${totalChunks} chunks, ${totalSaved} salvos, ${totalErrors} erros`
    );

    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO FINAL');
    console.log('='.repeat(70));
    console.log(`📄 Documentos processados: ${documents.length}`);
    console.log(`🔪 Total de chunks: ${totalChunks}`);
    console.log(`🧠 Total de embeddings: ${totalChunks}`);
    console.log(`💾 Chunks salvos no banco: ${totalSaved}`);
    console.log(`⚠️ Erros: ${totalErrors}`);
    console.log(`🪙 Tokens consumidos: ${totalTokens.toLocaleString()}`);
    console.log(`💰 Custo estimado: ${finalCost.costFormatted}`);
    console.log('='.repeat(70) + '\n');

    process.exit(0);

  } catch (error) {
    console.error(`\n❌ Erro fatal: ${error.message}`);
    console.error(error.stack);
    
    if (tracker) {
      await tracker.fail(error.message);
    }
    
    process.exit(1);
  }
}

main();
