#!/usr/bin/env node
/**
 * 🚀 EXECUTAR ANÁLISE E GERAÇÃO DE WORKFLOWS PARA PERSONAS
 * 
 * USANDO OPENAI GPT-4:
 * - GPT-4 Turbo: 10,000 RPM (muito mais que suficiente)
 * - Rate limiting: 2s entre chamadas (conservador)
 * - Processamento sequencial de personas selecionadas
 * 
 * USO:
 *   node run_full_pipeline_openai.js                          # Todas as personas
 *   node run_full_pipeline_openai.js --personaIds=id1,id2,id3 # Personas específicas
 *   node run_full_pipeline_openai.js --names="Sarah,Michael"  # Por nome (match parcial)
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
// CONFIGURAÇÃO DE RATE LIMITING PARA OPENAI
// ============================================================================

const CONFIG = {
  DELAY_BETWEEN_CALLS: 2000,  // 2s entre chamadas (conservador)
  CALLS_PER_PERSONA: 5,        // ~5 chamadas LLM por persona em média
};

function estimateTime(personasCount) {
  const totalCalls = personasCount * CONFIG.CALLS_PER_PERSONA;
  const totalSeconds = (totalCalls * CONFIG.DELAY_BETWEEN_CALLS) / 1000;
  const minutes = Math.ceil(totalSeconds / 60);
  
  return {
    totalCalls,
    estimatedMinutes: minutes,
  };
}

async function runPipeline() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 PIPELINE DE WORKFLOWS - OPENAI GPT-4');
  console.log('='.repeat(80));
  console.log('\n📊 CONFIGURAÇÃO:');
  console.log(`   • LLM: OpenAI GPT-4 Turbo`);
  console.log(`   • Rate limiting: ${CONFIG.DELAY_BETWEEN_CALLS}ms entre chamadas\n`);

  // Parse argumentos da linha de comando
  const args = process.argv.slice(2);
  const personaIdsArg = args.find(arg => arg.startsWith('--personaIds='));
  const namesArg = args.find(arg => arg.startsWith('--names='));

  let targetPersonaIds = null;
  let targetNames = null;

  if (personaIdsArg) {
    targetPersonaIds = personaIdsArg.split('=')[1].split(',').map(id => id.trim());
    console.log(`🎯 Filtrando por IDs: ${targetPersonaIds.length} persona(s)\n`);
  } else if (namesArg) {
    targetNames = namesArg.split('=')[1].split(',').map(name => name.trim().toLowerCase());
    console.log(`🎯 Filtrando por nomes: ${targetNames.join(', ')}\n`);
  }

  // 1. Buscar personas da ARVA
  let query = supabase
    .from('personas')
    .select('id, full_name, role')
    .eq('empresa_id', EMPRESA_ID);

  // Aplicar filtro de IDs se especificado
  if (targetPersonaIds) {
    query = query.in('id', targetPersonaIds);
  }

  const { data: allPersonas, error } = await query.order('full_name');

  if (error || !allPersonas) {
    console.error('❌ Erro ao buscar personas:', error);
    return;
  }

  // Aplicar filtro de nomes se especificado (match parcial case-insensitive)
  let personas = allPersonas;
  if (targetNames) {
    personas = allPersonas.filter(p => 
      targetNames.some(name => p.full_name.toLowerCase().includes(name))
    );
    
    if (personas.length === 0) {
      console.error(`❌ Nenhuma persona encontrada com os nomes: ${targetNames.join(', ')}`);
      console.log('\n📋 Personas disponíveis:');
      allPersonas.forEach(p => console.log(`   - ${p.full_name} (${p.role})`));
      return;
    }
  }

  console.log(`📋 ${personas.length} persona(s) selecionada(s):`);
  personas.forEach(p => console.log(`   - ${p.full_name} (${p.role})`));
  console.log();

  // Estimativa
  const estimate = estimateTime(personas.length);
  console.log('⏱️  ESTIMATIVA DE EXECUÇÃO:');
  console.log(`   • Total de chamadas LLM: ~${estimate.totalCalls}`);
  console.log(`   • Tempo estimado: ~${estimate.estimatedMinutes} minutos\n`);

  // Confirmação
  console.log('Pressione Ctrl+C nos próximos 5 segundos para cancelar...\n');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('▶️  Iniciando pipeline...\n');
  console.log('='.repeat(80));

  let successCount = 0;
  let errorCount = 0;

  // Processar cada persona
  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    
    console.log(`\n[${i + 1}/${personas.length}] 👤 ${persona.full_name} (${persona.role})`);

    try {
      // Análise de tarefas com OpenAI
      console.log('   🔍 Analisando tarefas com OpenAI GPT-4...');
      const analyzeCmd = `node "02.5_analyze_tasks_for_automation.js" --empresaId=${EMPRESA_ID} --personaId=${persona.id}`;
      
      const startTime = Date.now();
      const { stdout, stderr } = await execPromise(analyzeCmd, {
        cwd: __dirname,
        timeout: 300000 // 5 minutos timeout
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      // Extrair estatísticas do output
      const tasksMatch = stdout.match(/(\d+) tarefas analisadas/);
      const opportunitiesMatch = stdout.match(/(\d+) oportunidade\(s\) identificada\(s\)/);
      
      if (tasksMatch) {
        console.log(`   ✅ ${tasksMatch[1]} tarefas analisadas em ${duration}s`);
      }
      
      if (opportunitiesMatch) {
        console.log(`   🎯 ${opportunitiesMatch[1]} oportunidade(s) de automação encontrada(s)`);
      }

      successCount++;
  console.log('='.repeat(80));
  console.log('🎉 PIPELINE COMPLETO FINALIZADO!');
  console.log('='.repeat(80));
  console.log('\n📈 Próximos passos:');
  console.log('   1. Acesse /workflows para visualizar os workflows gerados');
  console.log('   2. Configure credenciais N8N em /integracoes');
  console.log('   3. Ative os workflows desejados\n');
  console.log('💡 Exemplos de uso:');
  console.log('   - Todas as personas:');
  console.log('     node run_full_pipeline_openai.js');
  console.log('   - Personas específicas por ID:');
  console.log('     node run_full_pipeline_openai.js --personaIds=id1,id2,id3');
  console.log('   - Personas por nome (match parcial):');
  console.log('     node run_full_pipeline_openai.js --names="Sarah,Michael"\n');
}

async function executarPipeline(empresaId, personaFilter) {
  let successCount = 0;
  let errorCount = 0;

  try {
    // Buscar personas
    const personas = await buscarPersonas(empresaId, personaFilter);
    
    for (const persona of personas) {
      try {
        // Processar persona
        console.log(`Processando: ${persona.full_name}...`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Erro: ${error.message.substring(0, 200)}`);
        errorCount++;
      }
    }
  } catch (error) {
      console.error(`   ❌ Erro: ${error.message.substring(0, 200)}`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DA EXECUÇÃO');
  console.log('='.repeat(80));
  console.log(`✅ Sucesso: ${successCount}/${personas.length} personas`);
  console.log(`❌ Erros: ${errorCount}/${personas.length} personas\n`);

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
      console.log('✅ Workflows N8N gerados com sucesso!\n');
    } catch (wfError) {
      console.error('❌ Erro ao gerar workflows N8N:', wfError.message);
    }
  }

  console.log('='.repeat(80));
  console.log('🎉 PIPELINE COMPLETO FINALIZADO!');
  console.log('='.repeat(80));
  console.log('\n📈 Próximos passos:');
  console.log('   1. Acesse /workflows para visualizar os workflows gerados');
  console.log('   2. Configure credenciais N8N em /integracoes');
  console.log('   3. Ative os workflows desejados\n');
  console.log('💡 Dica: Este script pode ser executado novamente para atualizar análises.\n');
}

runPipeline().catch(console.error);
