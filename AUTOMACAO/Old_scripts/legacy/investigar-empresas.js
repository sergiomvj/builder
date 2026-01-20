const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function investigarEmpresasAtivas() {
  try {
    console.log('🔍 INVESTIGANDO EMPRESAS ATIVAS\n');
    
    // Listar TODAS as empresas para entender o problema
    const { data: todasEmpresas } = await supabase
      .from('empresas')
      .select('id, nome, status')
      .order('created_at', { ascending: false });

    console.log('📋 TODAS AS EMPRESAS NO BANCO:');
    todasEmpresas?.forEach((empresa, index) => {
      const isDeleted = empresa.nome.includes('[DELETED-') || empresa.nome.includes('[EXCLUÍDA]');
      console.log(`${index + 1}. ${empresa.nome}`);
      console.log(`   Status: ${empresa.status || 'NULL'}`);
      console.log(`   Deletada: ${isDeleted ? 'SIM' : 'NÃO'}`);
      console.log(`   ID: ${empresa.id.substring(0, 8)}...`);
      console.log('');
    });

    // Identificar empresas que deveriam estar ativas
    const empresasReais = todasEmpresas?.filter(empresa => 
      !empresa.nome.includes('[DELETED-') && 
      !empresa.nome.includes('[EXCLUÍDA]')
    ) || [];

    console.log('✅ EMPRESAS QUE DEVERIAM ESTAR ATIVAS:');
    if (empresasReais.length === 0) {
      console.log('   ❌ NENHUMA EMPRESA REAL ENCONTRADA!');
    } else {
      empresasReais.forEach((empresa, index) => {
        console.log(`${index + 1}. ${empresa.nome} (status: ${empresa.status || 'NULL'})`);
      });

      // Marcar empresas reais como ativas
      console.log('\n🔧 MARCANDO EMPRESAS REAIS COMO ATIVAS...\n');
      
      for (const empresa of empresasReais) {
        const { error } = await supabase
          .from('empresas')
          .update({ status: 'ativa' })
          .eq('id', empresa.id);

        if (error) {
          console.error(`❌ Erro ao atualizar ${empresa.nome}:`, error);
        } else {
          console.log(`✅ ${empresa.nome} marcada como ativa`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function testarEstatisticasFinais() {
  try {
    console.log('\n🧪 TESTANDO ESTATÍSTICAS FINAIS\n');
    
    // Contar usando a nova lógica
    const empresasAtivas = await supabase
      .from('empresas')
      .select('id, nome', { count: 'exact' })
      .eq('status', 'ativa');

    console.log(`📊 Empresas com status 'ativa': ${empresasAtivas.count}`);

    if (empresasAtivas.data && empresasAtivas.data.length > 0) {
      console.log('   Lista:');
      empresasAtivas.data.forEach((empresa, index) => {
        console.log(`   ${index + 1}. ${empresa.nome}`);
      });

      // Contar personas dessas empresas
      const empresasIds = empresasAtivas.data.map(e => e.id);
      const personasAtivas = await supabase
        .from('personas')
        .select('id, full_name', { count: 'exact' })
        .in('empresa_id', empresasIds);

      console.log(`👥 Personas de empresas ativas: ${personasAtivas.count}`);
      
      if (personasAtivas.data && personasAtivas.data.length > 0) {
        console.log('   Lista de personas:');
        personasAtivas.data.forEach((persona, index) => {
          console.log(`   ${index + 1}. ${persona.full_name}`);
        });
      }
    }

    console.log('\n🎯 ESTATÍSTICAS PARA O DASHBOARD:');
    console.log(`   Total Empresas: ${empresasAtivas.count || 0}`);
    console.log(`   Total Personas: ${empresasAtivas.data ? 
      (await supabase
        .from('personas')
        .select('id', { count: 'exact', head: true })
        .in('empresa_id', empresasAtivas.data.map(e => e.id))
      ).count || 0 : 0
    }`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function main() {
  await investigarEmpresasAtivas();
  await testarEstatisticasFinais();
}

main();