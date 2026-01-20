#!/usr/bin/env node
// ============================================================================
// DELETE PERSONAS - MANTÉM FUNDAÇÃO ESTRATÉGICA
// ============================================================================
// Deleta TODAS as personas e dados relacionados de uma empresa
// MANTÉM: empresas, empresas_missao, empresas_okrs, empresas_blocos_funcionais,
//         empresas_objetivos_estrategicos, empresas_value_stream, empresas_governanca
// DELETA: personas e TODAS as tabelas relacionadas (biografias, competências, etc)
// ============================================================================

require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================================
// CLI ARGUMENT
// ============================================================================
const args = process.argv.slice(2);
const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='));
const empresaId = empresaIdArg ? empresaIdArg.split('=')[1] : null;

if (!empresaId) {
  console.error('❌ Erro: --empresaId=ID é obrigatório');
  console.log('\nUso: node delete_personas_keep_foundation.cjs --empresaId=UUID\n');
  process.exit(1);
}

// ============================================================================
// MAIN
// ============================================================================
(async () => {
  console.log('\n🗑️  DELETE PERSONAS - MANTÉM FUNDAÇÃO ESTRATÉGICA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Verificar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('nome')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      console.error('❌ Empresa não encontrada:', empresaId);
      process.exit(1);
    }

    console.log(`🏢 Empresa: ${empresa.nome}`);
    console.log(`🆔 ID: ${empresaId}\n`);

    // 2. Contar personas
    const { count: personasCount } = await supabase
      .from('personas')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);

    console.log(`📊 Total de personas a deletar: ${personasCount}\n`);

    if (personasCount === 0) {
      console.log('✅ Nenhuma persona encontrada. Nada a fazer.\n');
      process.exit(0);
    }

    // 3. CONFIRMAÇÃO MANUAL
    console.log('⚠️  ATENÇÃO: Esta ação é IRREVERSÍVEL!\n');
    console.log('📦 SERÁ MANTIDO:');
    console.log('   ✅ Empresa (tabela empresas)');
    console.log('   ✅ Missão Operacional');
    console.log('   ✅ Objetivos Estratégicos');
    console.log('   ✅ OKRs');
    console.log('   ✅ Value Stream');
    console.log('   ✅ Blocos Funcionais');
    console.log('   ✅ Governança\n');
    console.log('🗑️  SERÁ DELETADO:');
    console.log(`   ❌ ${personasCount} personas`);
    console.log('   ❌ Biografias');
    console.log('   ❌ Atribuições');
    console.log('   ❌ Competências');
    console.log('   ❌ Avatares');
    console.log('   ❌ Workflows');
    console.log('   ❌ ML Models');
    console.log('   ❌ Audit Logs');
    console.log('   ❌ RAG Knowledge');
    console.log('   ❌ Automation Opportunities\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Usar readline para confirmação
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const confirmar = await new Promise(resolve => {
      rl.question('Digite "DELETAR" para confirmar: ', answer => {
        rl.close();
        resolve(answer);
      });
    });

    if (confirmar !== 'DELETAR') {
      console.log('\n❌ Operação cancelada pelo usuário.\n');
      process.exit(0);
    }

    console.log('\n🔄 Iniciando deleção em cascata...\n');

    // 4. DELETAR EM ORDEM (FK dependencies)
    const tabelas = [
      'personas_audit_logs',
      'personas_ml_models',
      'personas_workflows',
      'automation_opportunities',
      'rag_knowledge',
      'personas_avatares',
      'personas_competencias',
      'personas_atribuicoes',
      'personas_biografias',
      'personas'
    ];

    let totalDeletado = 0;

    for (const tabela of tabelas) {
      try {
        const { count, error } = await supabase
          .from(tabela)
          .delete({ count: 'exact' })
          .eq('empresa_id', empresaId);

        if (error) {
          // Ignorar erro se tabela não existir ou já estiver vazia
          console.log(`   ⚠️  ${tabela}: ${error.message}`);
        } else {
          console.log(`   ✅ ${tabela}: ${count || 0} registros deletados`);
          totalDeletado += (count || 0);
        }
      } catch (err) {
        console.log(`   ⚠️  ${tabela}: ${err.message}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`🎉 DELEÇÃO CONCLUÍDA COM SUCESSO!`);
    console.log(`📊 Total de registros deletados: ${totalDeletado}\n`);

    // 5. Verificar fundação mantida
    const { count: missaoCount } = await supabase
      .from('empresas_missao')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);

    const { count: blocosCount } = await supabase
      .from('empresas_blocos_funcionais')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);

    const { count: okrsCount } = await supabase
      .from('empresas_okrs')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresaId);

    console.log('✅ FUNDAÇÃO ESTRATÉGICA MANTIDA:');
    console.log(`   📝 Missão: ${missaoCount} registro`);
    console.log(`   🏗️  Blocos Funcionais: ${blocosCount} registros`);
    console.log(`   🎯 OKRs: ${okrsCount} registros\n`);

    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1️⃣  Execute: node 01_create_personas_from_structure_v5.js --empresaId=' + empresaId);
    console.log('   2️⃣  Execute os Scripts 02-11 em ordem\n');

  } catch (error) {
    console.error('\n❌ ERRO INESPERADO:', error.message);
    console.error(error);
    process.exit(1);
  }
})();
