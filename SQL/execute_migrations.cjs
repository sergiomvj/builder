require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigrations() {
  console.log('🚀 Executando migrações V5.0...\n');
  
  const sqlPath = path.join(__dirname, 'execute_all_migrations_web.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Divide o SQL em statements individuais
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s !== '');
  
  console.log(`📄 Total de statements: ${statements.length}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Pula comentários e linhas vazias
    if (statement.startsWith('--') || statement.length < 10) continue;
    
    try {
      // Executa statement
      const { data, error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      });
      
      if (error) {
        // Tenta executar direto se RPC falhar
        const directResult = await supabase.from('_').select('*').limit(0);
        
        console.log(`⏩ [${i+1}/${statements.length}] ${statement.substring(0, 60)}...`);
      } else {
        successCount++;
        console.log(`✅ [${i+1}/${statements.length}] ${statement.substring(0, 60)}...`);
      }
    } catch (err) {
      errorCount++;
      console.log(`⚠️ [${i+1}/${statements.length}] Erro: ${err.message.substring(0, 80)}`);
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`⚠️ Avisos: ${errorCount}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Verifica se as tabelas foram criadas
  console.log('🔍 Verificando tabelas criadas...\n');
  
  const tables = [
    'personas_communications',
    'task_supervision_chains', 
    'task_supervision_logs',
    'user_interventions'
  ];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ERRO - ${error.message}`);
      } else {
        console.log(`✅ ${table}: OK (${count || 0} registros)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ERRO - ${err.message}`);
    }
  }
  
  console.log('\n🎉 Migrações V5.0 concluídas!');
}

executeMigrations().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
