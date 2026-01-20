require('dotenv').config({path:'../.env.local'});
const {createClient} = require('@supabase/supabase-js');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const ARVA_ID = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';

async function check() {
  console.log('\n=== VERIFICACAO DO SISTEMA ===\n');

  // 1. Ver estrutura de 1 persona
  console.log('1. Estrutura da tabela personas:');
  const { data: persona1, error: err1 } = await s.from('personas').select('*').limit(1);
  if (err1) {
    console.log('   ERRO:', err1.message);
  } else if (persona1 && persona1.length > 0) {
    console.log('   Colunas:', Object.keys(persona1[0]).join(', '));
  }

  // 2. Personas ARVA
  console.log('\n2. Personas da ARVA:');
  const { data: personas, error: err2 } = await s
    .from('personas')
    .select('*')
    .eq('empresa_id', ARVA_ID);
  
  if (err2) {
    console.log('   ERRO:', err2.message);
  } else {
    console.log(`   Total: ${personas.length} personas`);
    if (personas.length > 0) {
      console.log('   Primeira persona:');
      console.log(JSON.stringify(personas[0], null, 2));
    }
  }

  // 3. Tarefas
  console.log('\n3. Tarefas totais:');
  const { data: tasks, error: err3 } = await s.from('personas_tasks').select('id');
  if (err3) {
    console.log('   ERRO:', err3.message);
  } else {
    console.log(`   Total: ${tasks.length} tarefas`);
  }

  // 4. Assignments
  if (personas && personas.length > 0) {
    console.log('\n4. Assignments para ARVA:');
    const personaIds = personas.map(p => p.id);
    const { data: assigns, error: err4 } = await s
      .from('task_persona_assignments')
      .select('*')
      .in('persona_id', personaIds);
    
    if (err4) {
      console.log('   ERRO:', err4.message);
    } else {
      console.log(`   Total: ${assigns.length} assignments`);
    }
  }

  // 5. Verificar automation_opportunities manualmente
  console.log('\n5. Testar automation_opportunities:');
  const { data: opp, error: err5 } = await s.rpc('version', {});
  if (err5) {
    console.log('   RPC nao funciona:', err5.message);
  } else {
    console.log('   Supabase version:', opp);
  }

  console.log('\n');
}

check().catch(console.error);
