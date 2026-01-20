require('dotenv').config({path:'../.env.local'});
const {createClient} = require('@supabase/supabase-js');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('\n=== VERIFICACAO DAS TABELAS DE WORKFLOWS ===\n');

  // Teste 1: automation_opportunities
  console.log('1. Tabela automation_opportunities:');
  const { data: opp, error: oppErr } = await s.from('automation_opportunities').select('id').limit(1);
  
  if (oppErr) {
    if (oppErr.message.includes('does not exist')) {
      console.log('   ❌ TABELA NAO EXISTE');
      console.log('   Execute: automation_opportunities.sql no Supabase Dashboard\n');
    } else if (oppErr.message.includes('schema cache')) {
      console.log('   ⚠️  TABELA EXISTE mas nao esta no cache (permissao?)');
      console.log('   Tente executar uma query SELECT no Supabase Dashboard SQL Editor\n');
    } else {
      console.log('   ❌ ERRO:', oppErr.message, '\n');
    }
  } else {
    console.log('   ✅ TABELA EXISTE E ACESSIVEL');
    console.log(`   Registros: ${opp.length > 0 ? 'Tem dados' : 'Vazia (ok)'}\n`);
  }

  // Teste 2: personas_workflows
  console.log('2. Tabela personas_workflows:');
  const { data: wf, error: wfErr } = await s.from('personas_workflows').select('id').limit(1);
  
  if (wfErr) {
    if (wfErr.message.includes('does not exist')) {
      console.log('   ❌ TABELA NAO EXISTE');
      console.log('   Execute: personas_workflows.sql no Supabase Dashboard\n');
    } else if (wfErr.message.includes('schema cache')) {
      console.log('   ⚠️  TABELA EXISTE mas nao esta no cache (permissao?)');
      console.log('   Tente executar uma query SELECT no Supabase Dashboard SQL Editor\n');
    } else {
      console.log('   ❌ ERRO:', wfErr.message, '\n');
    }
  } else {
    console.log('   ✅ TABELA EXISTE E ACESSIVEL');
    console.log(`   Registros: ${wf.length > 0 ? 'Tem dados' : 'Vazia (ok)'}\n`);
  }

  // Teste 3: Listar todas as tabelas
  console.log('3. Tentando listar views (se existirem):');
  const { data: views1 } = await s.from('automation_opportunities_priority').select('*').limit(1);
  const { data: views2 } = await s.from('workflows_active_metrics').select('*').limit(1);
  
  console.log(`   automation_opportunities_priority: ${views1 ? '✅ Existe' : '❌ Nao existe'}`);
  console.log(`   workflows_active_metrics: ${views2 ? '✅ Existe' : '❌ Nao existe'}\n`);

  // Resumo
  console.log('=== RESUMO ===\n');
  const oppOk = !oppErr;
  const wfOk = !wfErr;

  if (oppOk && wfOk) {
    console.log('✅ SISTEMA PRONTO!');
    console.log('Ambas tabelas estao criadas e acessiveis.\n');
    console.log('Proximo passo:');
    console.log('  node 02.5_analyze_tasks_for_automation.js --empresaId=7761ddfd-0ecc-4a11-95fd-5ee913a6dd17\n');
  } else {
    console.log('❌ SISTEMA NAO PRONTO\n');
    if (!oppOk) {
      console.log('ACAO NECESSARIA:');
      console.log('1. Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/sql');
      console.log('2. Clique em "New Query"');
      console.log('3. Cole o conteudo de: AUTOMACAO/database_schemas/automation_opportunities.sql');
      console.log('4. Execute (Run)\n');
    }
    if (!wfOk) {
      console.log('ACAO NECESSARIA:');
      console.log('1. Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/sql');
      console.log('2. Clique em "New Query"');
      console.log('3. Cole o conteudo de: AUTOMACAO/database_schemas/personas_workflows.sql');
      console.log('4. Execute (Run)\n');
    }
  }
}

checkTables().catch(console.error);
