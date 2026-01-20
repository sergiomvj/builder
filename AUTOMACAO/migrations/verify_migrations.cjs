// ============================================================================
// SCRIPT: Verificar migrations aplicadas
// ============================================================================
// Execução: node verify_migrations.cjs
// Objetivo: Verificar se as migrations foram aplicadas corretamente
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyMigrations() {
  console.log('\n🔍 VERIFICANDO MIGRATIONS...\n');

  try {
    // 1. Verificar se tabela personas_metas existe
    console.log('1️⃣ Verificando tabela personas_metas...');
    const { data: metasCheck, error: metasError } = await supabase
      .from('personas_metas')
      .select('*')
      .limit(1);

    if (metasError) {
      console.log('❌ Tabela personas_metas NÃO existe ou há erro de permissão');
      console.log(`   Erro: ${metasError.message}`);
      console.log('\n⚠️  AÇÃO: Execute o arquivo 01_create_personas_metas.sql no Supabase SQL Editor\n');
    } else {
      console.log('✅ Tabela personas_metas existe!');
      console.log(`   Registros existentes: ${metasCheck?.length || 0}`);
    }

    // 2. Verificar campo procedimento_execucao em personas_tasks
    console.log('\n2️⃣ Verificando campo procedimento_execucao em personas_tasks...');
    const { data: tasksCheck, error: tasksError } = await supabase
      .from('personas_tasks')
      .select('task_id, title, procedimento_execucao, required_subsystems, complexity_score')
      .limit(3);

    if (tasksError) {
      console.log('❌ Erro ao verificar personas_tasks');
      console.log(`   Erro: ${tasksError.message}`);
      console.log('\n⚠️  AÇÃO: Execute o arquivo 02_alter_personas_tasks_add_procedures.sql no Supabase SQL Editor\n');
    } else {
      const hasProcedimentoField = tasksCheck && tasksCheck.length > 0 && 
        tasksCheck[0].hasOwnProperty('procedimento_execucao');
      
      if (hasProcedimentoField) {
        console.log('✅ Campo procedimento_execucao existe em personas_tasks!');
        console.log(`   Tarefas verificadas: ${tasksCheck.length}`);
        
        // Verificar quantas já têm procedimentos definidos
        const comProcedimentos = tasksCheck.filter(t => 
          t.procedimento_execucao && 
          Array.isArray(t.procedimento_execucao) && 
          t.procedimento_execucao.length > 0
        ).length;
        
        console.log(`   Tarefas com procedimentos: ${comProcedimentos}/${tasksCheck.length}`);
      } else {
        console.log('❌ Campo procedimento_execucao NÃO existe');
        console.log('\n⚠️  AÇÃO: Execute o arquivo 02_alter_personas_tasks_add_procedures.sql no Supabase SQL Editor\n');
      }
    }

    // 3. Verificar campos existentes em personas_tasks para referência
    console.log('\n3️⃣ Verificando campos atuais de personas_tasks...');
    if (tasksCheck && tasksCheck.length > 0) {
      const exemplo = tasksCheck[0];
      console.log('   Campos disponíveis:');
      Object.keys(exemplo).forEach(field => {
        const value = exemplo[field];
        let tipo = typeof value;
        if (Array.isArray(value)) tipo = `array[${value.length}]`;
        if (value === null) tipo = 'null';
        console.log(`     - ${field}: ${tipo}`);
      });
    }

    // 4. Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA VERIFICAÇÃO');
    console.log('='.repeat(60));
    
    const metasOk = !metasError;
    const tasksOk = !tasksError && tasksCheck && tasksCheck[0]?.hasOwnProperty('procedimento_execucao');
    
    if (metasOk && tasksOk) {
      console.log('✅ TODAS AS MIGRATIONS APLICADAS COM SUCESSO!');
      console.log('\n✅ Próximos passos:');
      console.log('   1. Criar APIs REST para CRUD das metas');
      console.log('   2. Criar APIs REST para edição de atribuições');
      console.log('   3. Atualizar UI da PersonaDetailPage');
      console.log('   4. Atualizar Scripts 04 e 06 para gerar novos dados');
    } else {
      console.log('⚠️  ALGUMAS MIGRATIONS PENDENTES');
      console.log('\n📋 Ações necessárias:');
      if (!metasOk) {
        console.log('   [ ] Executar 01_create_personas_metas.sql no Supabase');
      }
      if (!tasksOk) {
        console.log('   [ ] Executar 02_alter_personas_tasks_add_procedures.sql no Supabase');
      }
      console.log('\n💡 Após executar, rode este script novamente para verificar');
    }
    
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erro ao verificar migrations:', error.message);
  }
}

// Executar
verifyMigrations();
