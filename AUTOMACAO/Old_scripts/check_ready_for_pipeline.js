#!/usr/bin/env node
/**
 * Verificar se o sistema está pronto para executar o pipeline completo
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar env
config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const ARVA_EMPRESA_ID = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';

async function check() {
  console.log('\n=== VERIFICACAO DO SISTEMA ===\n');

  // 1. Verificar tabelas
  console.log('1. Tabelas necessarias:');
  
  const tables = ['empresas', 'personas', 'personas_tasks', 'automation_opportunities', 'personas_workflows'];
  
  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    console.log(`   ${table}: ${error ? 'ERRO' : 'OK'}`);
    if (error) console.log(`      ${error.message}`);
  }
  
  // 2. Verificar ARVA empresa
  console.log('\n2. Empresa ARVA Tech Solutions:');
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('id, nome, codigo')
    .eq('id', ARVA_EMPRESA_ID)
    .single();
    
  if (empresaError) {
    console.log('   ERRO:', empresaError.message);
  } else {
    console.log(`   Nome: ${empresa.nome}`);
    console.log(`   Codigo: ${empresa.codigo}`);
    console.log(`   ID: ${empresa.id}`);
  }
  
  // 3. Verificar personas
  console.log('\n3. Personas da ARVA:');
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('id, nome_completo, cargo')
    .eq('empresa_id', ARVA_EMPRESA_ID);
    
  if (personasError) {
    console.log('   ERRO:', personasError.message);
  } else {
    console.log(`   Total: ${personas.length} personas`);
    if (personas.length > 0) {
      console.log('   Exemplos:');
      personas.slice(0, 3).forEach(p => {
        console.log(`      - ${p.nome_completo} (${p.cargo})`);
      });
    }
  }
  
  // 4. Verificar tarefas
  console.log('\n4. Tarefas no sistema:');
  const { data: tasks, error: tasksError } = await supabase
    .from('personas_tasks')
    .select('id');
    
  if (tasksError) {
    console.log('   ERRO:', tasksError.message);
  } else {
    console.log(`   Total: ${tasks.length} tarefas`);
  }
  
  // 5. Verificar se ARVA tem tarefas atribuidas
  console.log('\n5. Tarefas atribuidas a personas ARVA:');
  const { data: assignments, error: assignError } = await supabase
    .from('task_persona_assignments')
    .select('task_id, persona_id')
    .in('persona_id', (personas || []).map(p => p.id));
    
  if (assignError) {
    console.log('   ERRO:', assignError.message);
  } else {
    console.log(`   Total: ${assignments.length} atribuicoes`);
  }
  
  // 6. Resumo final
  console.log('\n=== RESUMO ===\n');
  
  const ready = !empresaError && 
                !personasError && 
                personas && personas.length > 0 &&
                !tasksError &&
                !assignError &&
                assignments && assignments.length > 0;
  
  if (ready) {
    console.log('Status: PRONTO PARA EXECUTAR PIPELINE\n');
    console.log('Proximo comando:');
    console.log(`  node 02.5_analyze_tasks_for_automation.js --empresaId=${ARVA_EMPRESA_ID}\n`);
  } else {
    console.log('Status: NAO PRONTO\n');
    console.log('Problemas encontrados:');
    if (empresaError) console.log('  - Empresa ARVA nao encontrada');
    if (!personas || personas.length === 0) console.log('  - Nenhuma persona encontrada');
    if (!assignments || assignments.length === 0) {
      console.log('  - Nenhuma tarefa atribuida');
      console.log('\nExecute primeiro:');
      console.log(`  node 01.5_generate_tasks_from_atribuicoes.js --empresaId=${ARVA_EMPRESA_ID}\n`);
    }
  }
}

check().catch(console.error);
