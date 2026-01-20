/**
 * Script para RESETAR o banco de dados
 * Deleta TODAS as empresas e personas
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
  console.log('\n⚠️  ATENÇÃO: Este script vai DELETAR TUDO!\n');
  
  // 1. Deletar todas as personas
  console.log('🗑️  Deletando todas as personas...');
  const { error: personasError } = await supabase
    .from('personas')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo
  
  if (personasError) {
    console.error('❌ Erro ao deletar personas:', personasError);
  } else {
    console.log('✅ Personas deletadas');
  }
  
  // 2. Deletar todas as empresas
  console.log('🗑️  Deletando todas as empresas...');
  const { error: empresasError } = await supabase
    .from('empresas')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo
  
  if (empresasError) {
    console.error('❌ Erro ao deletar empresas:', empresasError);
  } else {
    console.log('✅ Empresas deletadas');
  }
  
  // 3. Verificar se está vazio
  const { data: empresas } = await supabase.from('empresas').select('id');
  const { data: personas } = await supabase.from('personas').select('id');
  
  console.log(`\n📊 Status final:`);
  console.log(`   Empresas: ${empresas?.length || 0}`);
  console.log(`   Personas: ${personas?.length || 0}`);
  console.log('\n✅ Banco de dados resetado com sucesso!\n');
}

resetDatabase().catch(console.error);
