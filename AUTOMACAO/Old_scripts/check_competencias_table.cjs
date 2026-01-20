// Check tabelas de competências
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTables() {
  console.log('🔍 Verificando tabelas de competências...\n');
  
  // Testar tabela "competencias"
  const { data: comp1, error: err1 } = await supabase
    .from('competencias')
    .select('*')
    .limit(1);
  
  console.log('📋 Tabela "competencias":', err1 ? `❌ ${err1.message}` : `✅ Existe (${comp1?.length || 0} registros)`);
  
  // Testar tabela "personas_competencias"
  const { data: comp2, error: err2 } = await supabase
    .from('personas_competencias')
    .select('*')
    .limit(1);
  
  console.log('📋 Tabela "personas_competencias":', err2 ? `❌ ${err2.message}` : `✅ Existe (${comp2?.length || 0} registros)`);
  
  // Listar todas as tabelas disponíveis (tentar)
  console.log('\n🔍 Tentando listar estrutura...\n');
  
  const tables = ['personas', 'personas_avatares', 'personas_atribuicoes', 'empresas'];
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    console.log(`   ${table}: ${error ? '❌' : '✅'}`);
  }
}

checkTables().then(() => process.exit(0));
