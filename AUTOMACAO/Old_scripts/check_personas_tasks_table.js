#!/usr/bin/env node
/**
 * Verificar tabela personas_tasks
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const empresaId = '3c3bee15-b3a4-4442-89e9-5859c06e7575';

async function checkPersonasTasks() {
  console.log('\n🔍 VERIFICANDO TABELA personas_tasks\n');

  // Verificar se tabela existe
  const { data: tasks, error } = await supabase
    .from('personas_tasks')
    .select('*')
    .eq('empresa_id', empresaId)
    .limit(5);

  if (error) {
    console.error('❌ Erro ao buscar personas_tasks:', error.message);
    console.log('\n⚠️  A tabela personas_tasks pode não existir ou estar vazia');
    return;
  }

  console.log(`✅ ${tasks?.length || 0} tarefas encontradas (primeiras 5)\n`);

  if (tasks && tasks.length > 0) {
    tasks.forEach((t, i) => {
      console.log(`[${i + 1}] ${t.title || t.task_title || 'Sem título'}`);
      console.log(`    Persona ID: ${t.persona_id}`);
      console.log(`    Frequência: ${t.frequency || t.task_frequency || 'N/A'}`);
      console.log(`    Status: ${t.status || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('⚠️  Nenhuma tarefa encontrada na tabela personas_tasks');
    console.log('\n💡 As tarefas podem estar em:');
    console.log('   - personas_competencias (tarefas_diarias, tarefas_semanais, tarefas_mensais)');
    console.log('   - personas.ia_config.tarefas_metas (legado)');
  }

  // Verificar personas_competencias
  console.log('\n🔍 VERIFICANDO personas_competencias (alternativa)\n');

  // Primeiro buscar persona_ids desta empresa
  const { data: personas } = await supabase
    .from('personas')
    .select('id')
    .eq('empresa_id', empresaId);

  if (!personas || personas.length === 0) {
    console.log('❌ Nenhuma persona encontrada');
    return;
  }

  const personaIds = personas.map(p => p.id);

  const { data: comp, error: compError } = await supabase
    .from('personas_competencias')
    .select('persona_id, tarefas_diarias, tarefas_semanais, tarefas_mensais')
    .in('persona_id', personaIds)
    .limit(3);

  if (compError) {
    console.error('❌ Erro:', compError.message);
    return;
  }

  if (comp && comp.length > 0) {
    console.log(`✅ ${comp.length} registros encontrados\n`);
    
    let totalTarefas = 0;
    comp.forEach((c, i) => {
      const diarias = Array.isArray(c.tarefas_diarias) ? c.tarefas_diarias.length : 0;
      const semanais = Array.isArray(c.tarefas_semanais) ? c.tarefas_semanais.length : 0;
      const mensais = Array.isArray(c.tarefas_mensais) ? c.tarefas_mensais.length : 0;
      const total = diarias + semanais + mensais;
      
      totalTarefas += total;
      
      console.log(`[${i + 1}] Persona: ${c.persona_id}`);
      console.log(`    Diárias: ${diarias} | Semanais: ${semanais} | Mensais: ${mensais}`);
      console.log(`    Total: ${total} tarefas\n`);
    });

    console.log(`📊 Total de tarefas em personas_competencias: ${totalTarefas}`);
  } else {
    console.log('❌ Nenhum registro em personas_competencias');
  }
}

checkPersonasTasks().catch(console.error);
