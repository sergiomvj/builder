#!/usr/bin/env node
/**
 * 🚀 EXECUTAR ANÁLISE E GERAÇÃO DE WORKFLOWS PARA TODAS AS PERSONAS
 * 
 * OTIMIZADO PARA GOOGLE AI FREE TIER:
 * - Gemini 1.5 Flash: 15 RPM (requests per minute)
 * - 1 milhão tokens/dia GRÁTIS
 * - 1,500 RPD (requests per day)
 * 
 * ESTRATÉGIA DE RATE LIMITING:
 * - 4 segundos entre chamadas = 15 RPM máximo
 * - Batch de 10 personas por vez
 * - Pausa de 1 minuto entre batches
 * - Total estimado: ~30 minutos para 15 personas
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const EMPRESA_ID = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17'; // ARVA

// ============================================================================
// CONFIGURAÇÃO DE RATE LIMITING PARA GOOGLE AI FREE TIER
// ============================================================================

const GEMINI_CONFIG = {
  RPM: 15,              // Requests per minute (Free tier)
  RPD: 1500,            // Requests per day (Free tier)
  TOKENS_PER_DAY: 1000000, // 1 milhão tokens/dia
  
  // Rate limiting conservador
  DELAY_BETWEEN_CALLS: 4500,  // 4.5s = ~13 RPM (margem de segurança)
  BATCH_SIZE: 10,             // 10 personas por batch
  DELAY_BETWEEN_BATCHES: 65000, // 65s entre batches = 1min+ de pausa
  
  // Modelo recomendado
  MODEL: 'gemini-1.5-flash',
  
  // Estimativas
  AVG_TASKS_PER_PERSONA: 5,
  AVG_TOKENS_PER_TASK: 2000, // Input + Output
};

// Calcular tempo estimado
const estimateTime = (numPersonas) => {
  const callsPerPersona = GEMINI_CONFIG.AVG_TASKS_PER_PERSONA;
  const totalCalls = numPersonas * callsPerPersona;
  const batches = Math.ceil(numPersonas / GEMINI_CONFIG.BATCH_SIZE);
  
  const timeInCalls = totalCalls * (GEMINI_CONFIG.DELAY_BETWEEN_CALLS / 1000);
  const timeInBatches = (batches - 1) * (GEMINI_CONFIG.DELAY_BETWEEN_BATCHES / 1000);
  const totalSeconds = timeInCalls + timeInBatches;
  
  return {
    totalCalls,
    batches,
    estimatedMinutes: Math.ceil(totalSeconds / 60),
    estimatedTokens: totalCalls * GEMINI_CONFIG.AVG_TOKENS_PER_TASK
  };
};

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function runOptimizedPipeline() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 PIPELINE OTIMIZADO PARA GOOGLE AI FREE TIER');
  console.log('='.repeat(80));
  console.log('\n📊 LIMITES DO GOOGLE AI (Free):');
  console.log(`   • Gemini 1.5 Flash: ${GEMINI_CONFIG.RPM} RPM, ${GEMINI_CONFIG.RPD} RPD`);
  console.log(`   • Tokens: ${GEMINI_CONFIG.TOKENS_PER_DAY.toLocaleString()}/dia GRÁTIS`);
  console.log(`   • Rate limiting: ${GEMINI_CONFIG.DELAY_BETWEEN_CALLS}ms entre chamadas`);
  console.log(`   • Batch size: ${GEMINI_CONFIG.BATCH_SIZE} personas por vez\n`);

  // 1. Buscar todas as personas da ARVA
  const { data: personas, error } = await supabase
    .from('personas')
    .select('id, full_name, role')
    .eq('empresa_id', EMPRESA_ID)
    .order('full_name');

  if (error || !personas) {
    console.error('❌ Erro ao buscar personas:', error);
    return;
  }

  console.log(`📋 Encontradas ${personas.length} personas na ARVA Tech Solutions\n`);

  // Estimativa
  const estimate = estimateTime(personas.length);
  console.log('⏱️  ESTIMATIVA DE EXECUÇÃO:');
  console.log(`   • Total de chamadas LLM: ~${estimate.totalCalls}`);
  console.log(`   • Batches: ${estimate.batches}`);
  console.log(`   • Tempo estimado: ~${estimate.estimatedMinutes} minutos`);
  console.log(`   • Tokens estimados: ~${estimate.estimatedTokens.toLocaleString()} (${((estimate.estimatedTokens / GEMINI_CONFIG.TOKENS_PER_DAY) * 100).toFixed(1)}% do limite diário)`);
  console.log('\n⚠️  IMPORTANTE: Este script respeita os limites do Google AI Free tier.');
  console.log('   Não interrompa a execução para evitar desperdício de chamadas.\n');

  // Confirmação
  console.log('Pressione Ctrl+C nos próximos 10 segundos para cancelar...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('▶️  Iniciando pipeline...\n');
  console.log('='.repeat(80));

  let successCount = 0;
  let errorCount = 0;
  let totalTokensUsed = 0;

  // Dividir personas em batches
  const batches = [];
  for (let i = 0; i < personas.length; i += GEMINI_CONFIG.BATCH_SIZE) {
    batches.push(personas.slice(i, i + GEMINI_CONFIG.BATCH_SIZE));
  }

  // Processar cada batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`\n📦 BATCH ${batchIndex + 1}/${batches.length} (${batch.length} personas)`);
    console.log('-'.repeat(80));

    for (let i = 0; i < batch.length; i++) {
      const persona = batch[i];
      const globalIndex = (batchIndex * GEMINI_CONFIG.BATCH_SIZE) + i + 1;
      
      console.log(`\n[${globalIndex}/${personas.length}] 👤 ${persona.full_name} (${persona.role})`);

      try {
        // Análise de tarefas com OpenAI (Gemini tem problemas de compatibilidade com v1beta)
        console.log('   🔍 Analisando tarefas com OpenAI GPT-4...');
        const analyzeCmd = `node "02.5_analyze_tasks_for_automation.js" --empresaId=${EMPRESA_ID} --personaId=${persona.id} --llm=openai`;
        
        const startTime = Date.now();
        const { stdout, stderr } = await execPromise(analyzeCmd, {
          cwd: __dirname,
          timeout: 180000 // 3 minutos timeout
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        // Extrair estatísticas do output
        const tasksMatch = stdout.match(/(\d+) tarefas analisadas/);
        const tokensMatch = stdout.match(/(\d+) tokens/);
        
        if (tasksMatch) {
          console.log(`   ✅ ${tasksMatch[1]} tarefas analisadas em ${duration}s`);
        }
        
        if (tokensMatch) {
          const tokens = parseInt(tokensMatch[1]);
          totalTokensUsed += tokens;
          console.log(`   📊 ~${tokens} tokens usados (total: ${totalTokensUsed.toLocaleString()})`);
        }

        successCount++;

        // Rate limiting: aguardar entre chamadas
        if (i < batch.length - 1 || batchIndex < batches.length - 1) {
          const delay = GEMINI_CONFIG.DELAY_BETWEEN_CALLS;
          console.log(`   ⏸️  Aguardando ${(delay / 1000).toFixed(1)}s (rate limiting)...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        console.error(`   ❌ Erro: ${error.message.substring(0, 100)}`);
        errorCount++;
        
        // Em caso de erro de rate limit, aguardar mais tempo
        if (error.message.includes('429') || error.message.includes('rate')) {
          console.log('   ⚠️  Rate limit detectado! Aguardando 2 minutos...');
          await new Promise(resolve => setTimeout(resolve, 120000));
        }
      }
    }

    // Pausa entre batches (exceto no último)
    if (batchIndex < batches.length - 1) {
      const pauseSeconds = GEMINI_CONFIG.DELAY_BETWEEN_BATCHES / 1000;
      console.log(`\n⏸️  PAUSA ENTRE BATCHES: ${pauseSeconds}s para respeitar rate limits...`);
      await new Promise(resolve => setTimeout(resolve, GEMINI_CONFIG.DELAY_BETWEEN_BATCHES));
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DA EXECUÇÃO');
  console.log('='.repeat(80));
  console.log(`✅ Sucesso: ${successCount}/${personas.length} personas`);
  console.log(`❌ Erros: ${errorCount}/${personas.length} personas`);
  console.log(`📊 Tokens usados: ~${totalTokensUsed.toLocaleString()} (${((totalTokensUsed / GEMINI_CONFIG.TOKENS_PER_DAY) * 100).toFixed(2)}% do limite diário)`);
  console.log(`⏱️  Tempo de execução: ${estimate.estimatedMinutes} minutos (estimado)\n`);

  // Gerar workflows N8N de todas as oportunidades
  if (successCount > 0) {
    console.log('='.repeat(80));
    console.log('🔄 GERANDO WORKFLOWS N8N...');
    console.log('='.repeat(80) + '\n');
    
    try {
      const workflowCmd = `node "03_generate_n8n_from_tasks.js" --empresaId=${EMPRESA_ID}`;
      const { stdout: wfOut } = await execPromise(workflowCmd, {
        cwd: __dirname,
        timeout: 300000 // 5 minutos
      });
      console.log(wfOut);
      console.log('\n✅ Workflows N8N gerados com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao gerar workflows:', error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 PIPELINE COMPLETO FINALIZADO!');
  console.log('='.repeat(80));
  console.log('\n📈 Próximos passos:');
  console.log('   1. Acesse /workflows para visualizar os workflows gerados');
  console.log('   2. Configure credenciais N8N em /integracoes');
  console.log('   3. Ative os workflows desejados');
  console.log('\n💡 Dica: Este script pode ser executado novamente para atualizar análises.\n');
}

// Executar
runOptimizedPipeline().catch(console.error);
