const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function executeSqlFile() {
  console.log('📜 Executando criação da tabela knowledge_chunks...\n');
  
  const sqlPath = path.join(__dirname, '..', 'src', 'sql', 'create_knowledge_chunks_table.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // Supabase client não suporta execução direta de SQL com DDL commands
  // Precisamos usar a API REST do Supabase com permissões de admin
  
  console.log('⚠️  ATENÇÃO: O SQL precisa ser executado via Supabase Dashboard ou psql.\n');
  console.log('📋 Passos para executar:\n');
  console.log('1. Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/sql/new');
  console.log('2. Cole o conteúdo do arquivo:');
  console.log(`   ${sqlPath}`);
  console.log('3. Clique em "RUN" ou "Execute SQL"\n');
  
  console.log('📄 Conteúdo do SQL:');
  console.log('═'.repeat(80));
  console.log(sqlContent);
  console.log('═'.repeat(80));
  
  // Teste se a tabela já existe
  console.log('\n🔍 Testando se a tabela já existe...');
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('id')
    .limit(1);

  if (error) {
    if (error.message.includes('relation') || error.message.includes('table')) {
      console.log('❌ Tabela knowledge_chunks NÃO existe ainda.');
      console.log('   Execute o SQL acima no Supabase Dashboard.');
    } else {
      console.log('❌ Erro ao verificar tabela:', error.message);
    }
  } else {
    console.log('✅ Tabela knowledge_chunks JÁ EXISTE!');
    console.log(`   Registros encontrados: ${data?.length || 0}`);
  }
}

executeSqlFile();
