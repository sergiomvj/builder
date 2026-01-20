const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkBiografiasSchema() {
  console.log('📋 Verificando estrutura da tabela personas_biografias...\n');
  
  // Buscar uma biografia exemplo
  const { data, error } = await supabase
    .from('personas_biografias')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  if (data) {
    console.log('✅ Exemplo de registro:\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n📋 Colunas disponíveis:');
    Object.keys(data).forEach(col => console.log(`   - ${col}`));
  } else {
    console.log('⚠️  Nenhum registro encontrado');
  }
}

checkBiografiasSchema();
