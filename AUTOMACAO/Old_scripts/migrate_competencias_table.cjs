// Migração: Renomear competencias → personas_competencias
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runMigration() {
  console.log('🔄 Iniciando migração de tabela...\n');
  
  try {
    // Ler SQL file
    const sqlPath = path.join(__dirname, 'rename_competencias_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('📝 SQL a executar:');
    console.log('-'.repeat(60));
    console.log(sql.substring(0, 500) + '...');
    console.log('-'.repeat(60) + '\n');
    
    // Executar via RPC ou direto
    // Nota: Supabase JS client não suporta SQL direto, precisamos usar o painel admin
    console.log('⚠️  ATENÇÃO: Execute este SQL manualmente no Supabase Dashboard:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/editor');
    console.log('2. Abra o SQL Editor');
    console.log('3. Cole o conteúdo de: rename_competencias_table.sql');
    console.log('4. Execute o script\n');
    
    // Alternativamente, podemos verificar se já foi feito
    const { data, error } = await supabase
      .from('personas_competencias')
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log('✅ Tabela personas_competencias já existe!');
      console.log(`   Total de registros: ${data?.length || 0}\n`);
    } else {
      console.log('❌ Tabela personas_competencias ainda não existe');
      console.log(`   Erro: ${error.message}\n`);
      console.log('💡 Execute o SQL acima no dashboard do Supabase');
    }
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
  }
}

runMigration();
