require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const tables = ['personas_atribuicoes', 'personas_competencias', 'personas_tasks'];
  
  for (const tableName of tables) {
    console.log(`\n📋 ${tableName}:`);
    console.log('='.repeat(60));
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erro:', error.message);
    } else if (data && data.length > 0) {
      const keys = Object.keys(data[0]);
      console.log('Campos:', keys.join(', '));
      console.log('\nExemplo:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️  Tabela vazia');
    }
  }
}

main();
