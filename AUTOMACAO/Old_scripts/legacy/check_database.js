const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRealState() {
  console.log('🔍 VERIFICAÇÃO DIRETA DO DATABASE\n');
  
  try {
    // Ver empresas
    const { data: empresas, error } = await supabase.from('empresas').select('*');
    
    if (error) {
      console.log('❌ ERRO AO ACESSAR DATABASE:', error.message);
      return;
    }

    console.log(`📊 EMPRESAS ENCONTRADAS: ${empresas?.length || 0}\n`);
    
    if (empresas && empresas.length > 0) {
      empresas.forEach((e, i) => {
        console.log(`${i + 1}. ${e.nome}`);
        console.log(`   ID: ${e.id}`);
        console.log(`   Status: ${e.status}`);
        console.log(`   Total Personas: ${e.total_personas}`);
        console.log(`   Criada em: ${e.created_at}`);
        console.log('');
      });

      // Testar permissões de exclusão com a primeira empresa
      const primeiraEmpresa = empresas[0];
      console.log(`🧪 TESTANDO EXCLUSÃO DA EMPRESA: ${primeiraEmpresa.nome}\n`);

      // Primeiro, contar personas relacionadas
      const { data: personas } = await supabase
        .from('personas')
        .select('*')
        .eq('empresa_id', primeiraEmpresa.id);

      console.log(`📋 Personas relacionadas: ${personas?.length || 0}`);

      if (personas && personas.length > 0) {
        console.log('⚠️ PARA EXCLUSÃO REAL, PRECISA:');
        console.log('1. Deletar personas primeiro');
        console.log('2. Depois deletar empresa');
      } else {
        console.log('✅ Empresa pode ser excluída (sem personas)');
      }

      // Tentar a exclusão real
      console.log('\n🚨 EXECUTANDO EXCLUSÃO REAL...');
      
      // Deletar personas primeiro
      if (personas && personas.length > 0) {
        const { error: personasError } = await supabase
          .from('personas')
          .delete()
          .eq('empresa_id', primeiraEmpresa.id);

        if (personasError) {
          console.log('❌ ERRO AO DELETAR PERSONAS:', personasError.message);
          return;
        } else {
          console.log('✅ Personas deletadas');
        }
      }

      // Deletar empresa
      const { data: deleted, error: deleteError } = await supabase
        .from('empresas')
        .delete()
        .eq('id', primeiraEmpresa.id)
        .select();

      if (deleteError) {
        console.log('❌ ERRO AO DELETAR EMPRESA:', deleteError.message);
      } else {
        console.log('✅ EMPRESA DELETADA COM SUCESSO:', deleted[0]?.nome);
      }

    } else {
      console.log('ℹ️ Nenhuma empresa encontrada no database');
    }

  } catch (error) {
    console.log('❌ ERRO GERAL:', error.message);
  }
}

checkRealState().catch(console.error);