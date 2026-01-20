const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const EMPRESA_ID = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';

async function checkTasks() {
  console.log('🔍 Verificando tarefas por persona...\n');

  // Buscar todas as personas
  const { data: personas } = await supabase
    .from('personas')
    .select('id, full_name, role')
    .eq('empresa_id', EMPRESA_ID)
    .order('full_name');

  // Buscar tarefas por persona através de task_persona_assignments
  const tasksByPersona = {};
  for (const persona of personas) {
    const { data: assignments, count } = await supabase
      .from('task_persona_assignments')
      .select(`
        *,
        personas_tasks (*)
      `, { count: 'exact', head: false })
      .eq('persona_id', persona.id);

    if (count > 0) {
      tasksByPersona[persona.id] = {
        name: persona.full_name,
        role: persona.role,
        count: count,
        assignments: assignments
      };
    }
  }

  console.log(`📊 TOTAL DE PERSONAS: ${personas.length}`);
  console.log(`👤 COM TAREFAS: ${Object.keys(tasksByPersona).length}`);
  console.log(`❌ SEM TAREFAS: ${personas.length - Object.keys(tasksByPersona).length}\n`);

  if (Object.keys(tasksByPersona).length > 0) {
    console.log('📋 PERSONAS COM TAREFAS:\n');
    for (const [id, info] of Object.entries(tasksByPersona)) {
      console.log(`   ${info.name} (${info.role}): ${info.count} tarefas`);
    }
  } else {
    console.log('❌ Nenhuma persona tem tarefas cadastradas!');
  }

  console.log('\n💡 SOLUÇÃO: As personas precisam ter tarefas cadastradas antes de gerar workflows.');
  console.log('   Execute o script de geração de tarefas primeiro.');
}

checkTasks().catch(console.error);
