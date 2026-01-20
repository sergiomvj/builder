#!/usr/bin/env node
/**
 * Script 11: RAG Testing & Validation
 * Testa sistema RAG com perguntas pré-definidas e gera relatório de qualidade
 * 
 * Uso: node 11_test_rag_system.js --empresaId=UUID [--personaId=UUID]
 * 
 * Fluxo:
 * 1. Carrega personas da empresa
 * 2. Executa perguntas de teste para cada persona
 * 3. Avalia qualidade das respostas (relevância, precisão, cobertura)
 * 4. Gera relatório com métricas de desempenho
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { createClient } from '@supabase/supabase-js';
import { retrieveRelevantChunks, formatChunksAsContext, suggestRelatedQuestions } from './lib/rag-retriever.js';
import { ExecutionTracker } from './lib/execution-tracker.js';
import { generateWithFallback } from './lib/llm_fallback.js';
import { setupConsoleEncoding } from './lib/console_fix.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurar encoding do console
setupConsoleEncoding();

// Configuração
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

function getSupabaseClient() {
  if (!supabase) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas');
    }
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// Perguntas de teste genéricas (adaptadas ao contexto da persona)
const TEST_QUESTIONS = [
  "Quais são minhas principais responsabilidades?",
  "Que ferramentas devo usar no meu trabalho?",
  "Como posso melhorar meu desempenho?",
  "Quais são as melhores práticas da minha área?",
  "Que KPIs devo acompanhar?"
];

/**
 * Parse argumentos CLI
 */
function parseArgs() {
  const args = process.argv.slice(2);
  let empresaId = null;
  let personaId = null;

  for (const arg of args) {
    if (arg.startsWith('--empresaId=')) {
      empresaId = arg.split('=')[1];
    } else if (arg.startsWith('--personaId=')) {
      personaId = arg.split('=')[1];
    }
  }

  return { empresaId, personaId };
}

/**
 * Valida ambiente
 */
function validateEnvironment(empresaId) {
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

  if (errors.length > 0) {
    console.error('\n🚨 Erros de configuração:\n');
    errors.forEach(err => console.error(`   ${err}`));
    console.error('\n💡 Uso: node 11_test_rag_system.js --empresaId=UUID [--personaId=UUID]\n');
    process.exit(1);
  }
}

/**
 * Busca personas
 */
async function getPersonas(empresaId, personaId = null) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('personas')
    .select('id, full_name, role, department, email')
    .eq('empresa_id', empresaId);

  if (personaId) {
    query = query.eq('id', personaId);
  }

  const { data, error } = await query.order('full_name');

  if (error) {
    throw new Error(`Erro ao buscar personas: ${error.message}`);
  }

  return data || [];
}

/**
 * Verifica se persona tem conhecimento na base
 */
async function hasKnowledge(personaId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('id')
    .eq('persona_id', personaId)
    .limit(1);

  return !error && data && data.length > 0;
}

/**
 * Testa RAG para uma persona com uma pergunta
 */
async function testRAGQuery(persona, question, topK = 5) {
  const startTime = Date.now();

  try {
    // 1. Retrieval
    const chunks = await retrieveRelevantChunks(question, persona.id, { topK, minSimilarity: 0.6 });
    const retrievalTime = Date.now() - startTime;

    if (chunks.length === 0) {
      return {
        success: false,
        question,
        chunks: [],
        answer: null,
        retrievalTime,
        generationTime: 0,
        error: 'Nenhum chunk encontrado'
      };
    }

    // 2. Formatar contexto
    const context = formatChunksAsContext(chunks, 2000);

    // 3. Gerar resposta
    const generationStart = Date.now();

    const systemPrompt = `Você é ${persona.full_name}, ${persona.role} no departamento de ${persona.department}.
Responda perguntas baseado APENAS no contexto fornecido sobre seu trabalho.
Seja objetivo, profissional e cite fontes quando relevante.`;

    const userPrompt = `Contexto:

${context}

---

Pergunta: ${question}`;

    const result = await generateWithFallback(userPrompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 300,
      timeout: 30000
    });

    const answer = result.content;
    const generationTime = Date.now() - generationStart;

    console.log(`  ✅ Resposta gerada usando ${result.model} em ${result.duration}ms`);

    // 4. Avaliar qualidade (heurísticas simples)
    const avgSimilarity = chunks.reduce((sum, c) => sum + c.similarity, 0) / chunks.length;
    const hasSpecificInfo = answer.length > 50 && !answer.toLowerCase().includes('não tenho');
    const quality = avgSimilarity > 0.8 && hasSpecificInfo ? 'high' : avgSimilarity > 0.6 ? 'medium' : 'low';

    return {
      success: true,
      question,
      chunks: chunks.map(c => ({
        topic: c.topic,
        source: c.source,
        similarity: c.similarity
      })),
      answer,
      retrievalTime,
      generationTime,
      totalTime: retrievalTime + generationTime,
      quality,
      metrics: {
        avgSimilarity,
        chunksFound: chunks.length,
        answerLength: answer.length,
        tokensUsed: completion.usage?.total_tokens || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      question,
      chunks: [],
      answer: null,
      retrievalTime: Date.now() - startTime,
      generationTime: 0,
      error: error.message
    };
  }
}

/**
 * Gera relatório de testes
 */
async function generateReport(results, outputPath) {
  const totalTests = results.reduce((sum, r) => sum + r.tests.length, 0);
  const successfulTests = results.reduce((sum, r) => sum + r.tests.filter(t => t.success).length, 0);
  const failedTests = totalTests - successfulTests;

  const avgRetrievalTime = results
    .flatMap(r => r.tests)
    .reduce((sum, t) => sum + t.retrievalTime, 0) / totalTests;

  const avgGenerationTime = results
    .flatMap(r => r.tests)
    .filter(t => t.success)
    .reduce((sum, t) => sum + t.generationTime, 0) / successfulTests;

  const qualityDistribution = results
    .flatMap(r => r.tests)
    .filter(t => t.success)
    .reduce((acc, t) => {
      acc[t.quality] = (acc[t.quality] || 0) + 1;
      return acc;
    }, {});

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalPersonas: results.length,
      totalTests,
      successfulTests,
      failedTests,
      successRate: ((successfulTests / totalTests) * 100).toFixed(1) + '%'
    },
    performance: {
      avgRetrievalTime: Math.round(avgRetrievalTime) + 'ms',
      avgGenerationTime: Math.round(avgGenerationTime) + 'ms',
      avgTotalTime: Math.round(avgRetrievalTime + avgGenerationTime) + 'ms'
    },
    quality: {
      high: qualityDistribution.high || 0,
      medium: qualityDistribution.medium || 0,
      low: qualityDistribution.low || 0
    },
    personaResults: results
  };

  await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');

  return report;
}

/**
 * MAIN
 */
async function main() {
  console.log('\n🧪 Script 11: RAG System Testing & Validation\n');

  const { empresaId, personaId } = parseArgs();
  validateEnvironment(empresaId);

  const outputDir = join(__dirname, 'rag_test_output');
  await fs.mkdir(outputDir, { recursive: true });

  let tracker;

  try {
    // 1. Buscar personas
    console.log('👥 Buscando personas...');
    const personas = await getPersonas(empresaId, personaId);

    if (personas.length === 0) {
      console.error('❌ Nenhuma persona encontrada');
      process.exit(1);
    }

    console.log(`✅ ${personas.length} persona(s) encontrada(s)`);

    // Filtrar personas com conhecimento
    const personasWithKnowledge = [];
    for (const persona of personas) {
      if (await hasKnowledge(persona.id)) {
        personasWithKnowledge.push(persona);
      }
    }

    console.log(`📚 ${personasWithKnowledge.length} persona(s) com conhecimento na base`);

    if (personasWithKnowledge.length === 0) {
      console.error('❌ Nenhuma persona tem conhecimento. Execute Script 10 primeiro.');
      process.exit(1);
    }

    // Inicializar tracker
    const totalTests = personasWithKnowledge.length * TEST_QUESTIONS.length;
    tracker = new ExecutionTracker('11_test_rag_system', empresaId, totalTests);
    await tracker.start(`Testando RAG com ${totalTests} perguntas`);

    // 2. Executar testes
    const results = [];
    let testCount = 0;

    for (const persona of personasWithKnowledge) {
      console.log(`\n🧪 Testando: ${persona.full_name} (${persona.role})`);

      const personaTests = [];

      for (const question of TEST_QUESTIONS) {
        testCount++;
        await tracker.updateProgress(
          testCount,
          `Pergunta ${testCount}/${totalTests}`,
          `${persona.full_name}: ${question.substring(0, 30)}...`
        );

        console.log(`   ❓ ${question}`);

        const result = await testRAGQuery(persona, question);

        if (result.success) {
          console.log(`   ✅ ${result.quality.toUpperCase()} quality (${result.totalTime}ms)`);
          console.log(`      Similarity: ${(result.metrics.avgSimilarity * 100).toFixed(1)}%`);
          await tracker.success(`${persona.full_name}: ${question}`);
        } else {
          console.log(`   ❌ ${result.error}`);
          await tracker.error(`${persona.full_name}: ${result.error}`);
        }

        personaTests.push(result);

        // Delay para respeitar rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      results.push({
        persona: {
          id: persona.id,
          nome: persona.full_name,
          cargo: persona.role,
          departamento: persona.department
        },
        tests: personaTests
      });
    }

    // 3. Gerar relatório
    console.log('\n📊 Gerando relatório...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const reportPath = join(outputDir, `rag_test_report_${timestamp}.json`);

    const report = await generateReport(results, reportPath);

    await tracker.complete(`Testes concluídos: ${report.summary.successRate} sucesso`);

    // 4. Exibir resumo
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DOS TESTES RAG');
    console.log('='.repeat(70));
    console.log(`👥 Personas testadas: ${report.summary.totalPersonas}`);
    console.log(`🧪 Total de testes: ${report.summary.totalTests}`);
    console.log(`✅ Sucessos: ${report.summary.successfulTests}`);
    console.log(`❌ Falhas: ${report.summary.failedTests}`);
    console.log(`📈 Taxa de sucesso: ${report.summary.successRate}`);
    console.log('');
    console.log('⏱️ Performance:');
    console.log(`   Retrieval médio: ${report.performance.avgRetrievalTime}`);
    console.log(`   Generation médio: ${report.performance.avgGenerationTime}`);
    console.log(`   Total médio: ${report.performance.avgTotalTime}`);
    console.log('');
    console.log('⭐ Qualidade das respostas:');
    console.log(`   Alta: ${report.quality.high} (${((report.quality.high / report.summary.successfulTests) * 100).toFixed(1)}%)`);
    console.log(`   Média: ${report.quality.medium} (${((report.quality.medium / report.summary.successfulTests) * 100).toFixed(1)}%)`);
    console.log(`   Baixa: ${report.quality.low} (${((report.quality.low / report.summary.successfulTests) * 100).toFixed(1)}%)`);
    console.log('');
    console.log(`📄 Relatório salvo: ${reportPath}`);
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
