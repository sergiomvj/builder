// Script para validar o sistema de tarefas multi-persona
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validateTasksSystem() {
  console.log('🔍 Validando Sistema de Tarefas Multi-Persona\n');
  console.log('='.repeat(60));
  
  // 1. Verificar tabela personas_tasks
  console.log('\n1️⃣ Verificando tabela personas_tasks...');
  const { data: tasks, error: tasksError, count: tasksCount } = await supabase
    .from('personas_tasks')
    .select('*', { count: 'exact', head: false })
    .limit(3);
  
  if (tasksError) {
    console.error('❌ Erro:', tasksError.message);
  } else {
    console.log(`✅ Tabela existe! Total de tarefas: ${tasksCount || 0}`);
    if (tasks && tasks.length > 0) {
      console.log('   Exemplo:', tasks[0].title);
    }
  }

  // 2. Verificar tabela task_persona_assignments
  console.log('\n2️⃣ Verificando tabela task_persona_assignments...');
  const { data: assignments, error: assignmentsError, count: assignmentsCount } = await supabase
    .from('task_persona_assignments')
    .select('*', { count: 'exact', head: false })
    .limit(3);
  
  if (assignmentsError) {
    console.error('❌ Erro:', assignmentsError.message);
    console.log('💡 Execute a migration: AUTOMACAO/08_DATABASE_SCHEMAS/create_task_persona_assignments.sql');
  } else {
    console.log(`✅ Tabela existe! Total de atribuições: ${assignmentsCount || 0}`);
  }

  // 3. Verificar personas disponíveis
  console.log('\n3️⃣ Verificando personas disponíveis...');
  const { data: personas, error: personasError, count: personasCount } = await supabase
    .from('personas')
    .select('id, full_name, role', { count: 'exact' })
    .limit(5);
  
  if (personasError) {
    console.error('❌ Erro:', personasError.message);
  } else {
    console.log(`✅ Total de personas: ${personasCount || 0}`);
    if (personas && personas.length > 0) {
      console.log('   Exemplos:');
      personas.forEach(p => console.log(`   - ${p.full_name} (${p.role || 'sem cargo'})`));
    }
  }

  // 4. Testar query com JOIN (task + assignments + personas)
  console.log('\n4️⃣ Testando query completa (task + assignments + personas)...');
  const { data: fullTasks, error: fullError } = await supabase
    .from('personas_tasks')
    .select(`
      id,
      title,
      status,
      priority,
      task_persona_assignments (
        id,
        persona_id,
        status,
        assigned_at,
        personas (
          id,
          full_name,
          role
        )
      )
    `)
    .limit(3);
  
  if (fullError) {
    console.error('❌ Erro no JOIN:', fullError.message);
    console.log('💡 Verifique se todas as foreign keys estão corretas');
  } else {
    console.log('✅ Query completa funciona!');
    if (fullTasks && fullTasks.length > 0) {
      fullTasks.forEach(task => {
        console.log(`\n   📋 Tarefa: ${task.title}`);
        console.log(`      Status: ${task.status || 'N/A'}`);
        console.log(`      Priority: ${task.priority || 'N/A'}`);
        if (task.task_persona_assignments && task.task_persona_assignments.length > 0) {
          console.log(`      Atribuída a ${task.task_persona_assignments.length} persona(s):`);
          task.task_persona_assignments.forEach(a => {
            if (a.personas) {
              console.log(`        - ${a.personas.full_name} (${a.status})`);
            }
          });
        } else {
          console.log('      ⚠️ Sem personas atribuídas');
        }
      });
    }
  }

  // 5. Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMO DA VALIDAÇÃO:\n');
  
  const checks = [
    { name: 'Tabela personas_tasks', ok: !tasksError },
    { name: 'Tabela task_persona_assignments', ok: !assignmentsError },
    { name: 'Personas disponíveis', ok: !personasError && personasCount && personasCount > 0 },
    { name: 'Query completa (JOIN)', ok: !fullError }
  ];

  checks.forEach(check => {
    console.log(`${check.ok ? '✅' : '❌'} ${check.name}`);
  });

  const allOk = checks.every(c => c.ok);
  
  console.log('\n' + '='.repeat(60));
  if (allOk) {
    console.log('\n🎉 Sistema de tarefas multi-persona está FUNCIONANDO!\n');
    console.log('Próximos passos:');
    console.log('1. npm run dev (porta 3001)');
    console.log('2. Acesse http://localhost:3001/tasks');
    console.log('3. Crie uma tarefa e atribua a múltiplas personas\n');
  } else {
    console.log('\n⚠️ Sistema precisa de configuração adicional.\n');
    console.log('Execute as migrations pendentes em:');
    console.log('AUTOMACAO/08_DATABASE_SCHEMAS/\n');
  }
}

validateTasksSystem();
