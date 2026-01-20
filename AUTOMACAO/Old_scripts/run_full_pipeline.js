#!/usr/bin/env node
/**
 * 🚀 EXECUTAR ANÁLISE E GERAÇÃO DE WORKFLOWS PARA TODAS AS PERSONAS
 * Executa o pipeline completo: 02.5 (análise) → 03 (geração workflows)
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

async function runForAllPersonas() {
  console.log('\n🚀 PIPELINE COMPLETO: Análise + Geração de Workflows\n');
  console.log('=' .repeat(70));

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

  console.log(`\n📋 Encontradas ${personas.length} personas na ARVA Tech Solutions\n`);

  let successCount = 0;
  let errorCount = 0;

  // 2. Executar para cada persona
  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    console.log(`\n[${ i + 1}/${personas.length}] 👤 ${persona.full_name} (${persona.role})`);
    console.log('-'.repeat(70));

    try {
      // Passo 1: Análise de tarefas
      console.log('   🔍 Analisando tarefas...');
      const analyzeCmd = `node "02.5_analyze_tasks_for_automation.js" --empresaId=${EMPRESA_ID} --personaId=${persona.id} --llm=openai`;
      
      const { stdout: analyzeOut, stderr: analyzeErr } = await execPromise(analyzeCmd, {
        cwd: __dirname,
        timeout: 120000 // 2 minutos por persona
      });

      if (analyzeErr && !analyzeErr.includes('warning')) {
        console.error('   ⚠️  Avisos durante análise:', analyzeErr.substring(0, 200));
      }

      console.log('   ✅ Análise concluída');

      // Aguardar 2 segundos entre chamadas (rate limiting)
      await new Promise(resolve => setTimeout(resolve, 2000));

      successCount++;
    } catch (error) {
      console.error(`   ❌ Erro ao processar ${persona.full_name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ Pipeline concluído!`);
  console.log(`   Sucesso: ${successCount}/${personas.length} personas`);
  console.log(`   Erros: ${errorCount}/${personas.length} personas`);

  // 3. Gerar workflows N8N de todas as oportunidades
  console.log('\n🔄 Gerando workflows N8N...\n');
  try {
    const workflowCmd = `node "03_generate_n8n_from_tasks.js" --empresaId=${EMPRESA_ID}`;
    const { stdout: wfOut } = await execPromise(workflowCmd, {
      cwd: __dirname,
      timeout: 180000 // 3 minutos
    });
    console.log(wfOut);
    console.log('\n✅ Workflows N8N gerados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao gerar workflows:', error.message);
  }

  console.log('\n🎉 Processo completo finalizado!\n');
}

runForAllPersonas().catch(console.error);
