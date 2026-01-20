const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('📋 Verificando estrutura da tabela rag_knowledge...\n');
  
  // Tentar buscar um registro
  const { data, error } = await supabase
    .from('rag_knowledge')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Erro ao buscar:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Exemplo de registro:\n');
    console.log(JSON.stringify(data[0], null, 2));
    console.log('\n📋 Colunas disponíveis:');
    Object.keys(data[0]).forEach(col => console.log(`   - ${col}`));
  } else {
    console.log('⚠️  Tabela vazia. Tentando descobrir estrutura...\n');
    
    // Buscar schema via information_schema não funciona com Supabase client
    // Vamos verificar o SQL de criação se existir
    console.log('💡 Verifique o arquivo de criação da tabela ou Supabase Dashboard > Table Editor');
  }
}

checkSchema();
