/**
 * SETUP: Cria tabela llm_usage_logs no Supabase
 */

require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function executeSQLFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Dividir por statements (separados por ponto-e-vírgula fora de comentários)
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== '');
  
  console.log(`📄 Executando ${statements.length} statements SQL...\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Pular comentários
    if (statement.startsWith('--') || statement.startsWith('/*')) continue;
    
    console.log(`[${i + 1}/${statements.length}] Executando...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_string: statement });
      
      if (error) {
        console.error(`❌ Erro: ${error.message}`);
        console.error(`   SQL: ${statement.substring(0, 100)}...`);
      } else {
        console.log(`✅ Sucesso`);
      }
    } catch (err) {
      console.error(`❌ Exceção: ${err.message}`);
    }
  }
  
  console.log('\n✅ Execução concluída!');
}

async function main() {
  console.log('\n🔧 SETUP: LLM Usage Logs Table');
  console.log('===============================\n');
  
  const sqlFile = path.join(__dirname, '..', 'SQL', 'create_llm_usage_logs.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ Arquivo SQL não encontrado:', sqlFile);
    process.exit(1);
  }
  
  console.log('⚠️  NOTA: Executando SQL via Supabase client');
  console.log('   Se falhar, execute manualmente no Supabase Dashboard\n');
  
  await executeSQLFile(sqlFile);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
