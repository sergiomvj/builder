const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function corrigirCodigosDuplicados() {
  try {
    console.log('🔧 CORRIGINDO CÓDIGOS DUPLICADOS RESTANTES\n');
    
    // Buscar empresas com códigos ainda problemáticos
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('id, nome, codigo');

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    const empresasProblematicas = empresas?.filter(e => 
      e.codigo && e.codigo.length > 10
    ) || [];

    if (empresasProblematicas.length === 0) {
      console.log('✅ Todos os códigos já estão corretos!');
      return;
    }

    console.log(`📋 ${empresasProblematicas.length} empresas ainda precisam de correção:\n`);

    for (const empresa of empresasProblematicas) {
      // Gerar código único
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 999);
      const codigo = `DEL${timestamp.toString().slice(-3)}${random.toString().padStart(3, '0')}`;
      const codigoFinal = codigo.substring(0, 10);

      console.log(`🔄 ${empresa.nome}`);
      console.log(`   Código atual: "${empresa.codigo}" (${empresa.codigo.length} chars)`);
      console.log(`   Novo código:  "${codigoFinal}" (${codigoFinal.length} chars)`);

      try {
        const { error: updateError } = await supabase
          .from('empresas')
          .update({ codigo: codigoFinal })
          .eq('id', empresa.id);

        if (updateError) {
          console.error(`❌ Erro: ${updateError.message}`);
        } else {
          console.log(`✅ Atualizado com sucesso!\n`);
        }
      } catch (error) {
        console.error(`❌ Erro: ${error}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function verificarEstatisticasCorretas() {
  try {
    console.log('\n🔍 VERIFICANDO ESTATÍSTICAS CORRETAS\n');
    
    // Total de empresas (incluindo deletadas para debug)
    const todasEmpresas = await supabase
      .from('empresas')
      .select('id, nome, status', { count: 'exact' });
    
    console.log(`📊 Total de empresas no banco: ${todasEmpresas.count}`);
    
    // Empresas ativas (não deletadas)
    const empresasAtivas = await supabase
      .from('empresas')
      .select('id, nome, status')
      .neq('status', 'deleted')
      .not('nome', 'like', '[DELETED-%')
      .not('nome', 'like', '[EXCLUÍDA]%');

    console.log(`✅ Empresas ativas: ${empresasAtivas.data?.length || 0}`);
    
    if (empresasAtivas.data && empresasAtivas.data.length > 0) {
      console.log('   Lista de empresas ativas:');
      empresasAtivas.data.forEach((empresa, index) => {
        console.log(`   ${index + 1}. ${empresa.nome} (status: ${empresa.status || 'N/A'})`);
      });
    }

    // Personas de empresas ativas
    const empresasAtivasIds = empresasAtivas.data?.map(e => e.id) || [];
    
    if (empresasAtivasIds.length > 0) {
      const personasAtivas = await supabase
        .from('personas')
        .select('id, full_name, empresa_id')
        .in('empresa_id', empresasAtivasIds);

      console.log(`👥 Personas de empresas ativas: ${personasAtivas.data?.length || 0}`);
      
      if (personasAtivas.data && personasAtivas.data.length > 0) {
        console.log('   Personas encontradas:');
        personasAtivas.data.forEach((persona, index) => {
          console.log(`   ${index + 1}. ${persona.full_name}`);
        });
      }
    } else {
      console.log('👥 Personas de empresas ativas: 0 (nenhuma empresa ativa)');
    }

    console.log('\n💡 DIAGNÓSTICO:');
    if (empresasAtivas.data?.length === 0) {
      console.log('   ⚠️  Problema: Nenhuma empresa está marcada como ativa');
      console.log('   📝 Solução: Verificar filtros de status ou marcar empresas como ativas');
    } else {
      console.log('   ✅ Empresas ativas encontradas corretamente');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar estatísticas:', error);
  }
}

async function marcarEmpresasComoAtivas() {
  try {
    console.log('\n🔧 MARCANDO EMPRESAS REAIS COMO ATIVAS\n');
    
    // Buscar empresas que não são deletadas mas podem não ter status correto
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id, nome, status')
      .not('nome', 'like', '[DELETED-%')
      .not('nome', 'like', '[EXCLUÍDA]%');

    const empresasParaAtivar = empresas?.filter(e => 
      e.status !== 'ativa' && !e.nome.includes('[DELETED')
    ) || [];

    if (empresasParaAtivar.length === 0) {
      console.log('✅ Todas as empresas reais já estão ativas!');
      return;
    }

    console.log(`📋 ${empresasParaAtivar.length} empresas serão marcadas como ativas:`);
    
    for (const empresa of empresasParaAtivar) {
      console.log(`🔄 ${empresa.nome} (status atual: ${empresa.status || 'NULL'})`);
      
      const { error } = await supabase
        .from('empresas')
        .update({ status: 'ativa' })
        .eq('id', empresa.id);

      if (error) {
        console.error(`❌ Erro: ${error.message}`);
      } else {
        console.log(`✅ Marcada como ativa!`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

async function main() {
  await corrigirCodigosDuplicados();
  await verificarEstatisticasCorretas();
  await marcarEmpresasComoAtivas();
  await verificarEstatisticasCorretas(); // Verificar novamente após as correções
}

main();