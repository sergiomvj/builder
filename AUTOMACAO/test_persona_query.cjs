require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPersonaQuery() {
  console.log('🔍 Testando query de personas...\n');

  // Pegar um ID de exemplo do avatar
  const testId = 'f7151f2d-c6a1-460d-810d-3fafabd673ff';

  // Teste 1: Buscar uma persona específica
  console.log('1️⃣ Buscando persona individual:', testId);
  const { data: persona1, error: error1 } = await supabase
    .from('personas')
    .select('id, full_name, role, position, empresa_id, status')
    .eq('id', testId)
    .single();

  if (error1) {
    console.error('❌ Erro:', error1);
  } else {
    console.log('✅ Persona encontrada:', persona1);
  }

  // Teste 2: Buscar múltiplas personas
  console.log('\n2️⃣ Buscando múltiplas personas com .in()...');
  const testIds = [
    'f7151f2d-c6a1-460d-810d-3fafabd673ff',
    'b2d243f5-60ca-4664-a995-b3851cad06f5',
    '8aa69720-0770-460e-9889-16f033b258ae'
  ];

  const { data: personas2, error: error2 } = await supabase
    .from('personas')
    .select('id, full_name, role, position, empresa_id, status')
    .in('id', testIds);

  if (error2) {
    console.error('❌ Erro:', error2);
  } else {
    console.log(`✅ ${personas2?.length || 0} personas encontradas`);
    personas2?.forEach(p => {
      console.log(`  - ${p.full_name || 'SEM NOME'} (${p.role || 'SEM ROLE'})`);
    });
  }

  // Teste 3: Verificar se as colunas existem
  console.log('\n3️⃣ Verificando estrutura da tabela personas...');
  const { data: allPersonas, error: error3 } = await supabase
    .from('personas')
    .select('*')
    .limit(1);

  if (error3) {
    console.error('❌ Erro:', error3);
  } else if (allPersonas && allPersonas.length > 0) {
    console.log('✅ Colunas disponíveis:', Object.keys(allPersonas[0]).join(', '));
  }
}

testPersonaQuery();
