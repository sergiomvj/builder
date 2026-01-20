require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDashboardData() {
  console.log('🔍 Testando dados para o Dashboard...\n');

  // 1. Contar personas ativas
  const { count: countAtivo } = await supabase
    .from('personas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ativo');

  console.log(`✅ Personas ATIVAS: ${countAtivo || 0}`);

  // 2. Contar personas inativas
  const { count: countInativo } = await supabase
    .from('personas')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'inativo');

  console.log(`✅ Personas INATIVAS: ${countInativo || 0}`);

  // 3. Total de personas
  const { count: totalPersonas } = await supabase
    .from('personas')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 TOTAL de Personas: ${totalPersonas || 0}\n`);

  // 4. Buscar empresas por setor
  const { data: empresasData, error } = await supabase
    .from('empresas')
    .select('id, nome, setor, status')
    .eq('status', 'ativa');

  if (error) {
    console.error('❌ Erro ao buscar empresas:', error);
    return;
  }

  console.log(`🏢 Empresas encontradas: ${empresasData?.length || 0}`);
  
  if (empresasData && empresasData.length > 0) {
    console.log('\nEmpresas:');
    empresasData.forEach(emp => {
      console.log(`  - ${emp.nome} (Setor: ${emp.setor || 'Não definido'})`);
    });

    const setores = empresasData.reduce((acc, emp) => {
      const setor = emp.setor || 'Não definido';
      acc[setor] = (acc[setor] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📈 Distribuição por setor:');
    Object.entries(setores).forEach(([setor, count]) => {
      const percentage = ((count / empresasData.length) * 100).toFixed(1);
      console.log(`  ${setor}: ${count} (${percentage}%)`);
    });
  }

  console.log('\n✅ Teste completo!');
}

testDashboardData();
