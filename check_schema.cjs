/**
 * Verifica estrutura real da tabela empresas
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Verificando estrutura da tabela empresas...\n');
  
  // Inserir objeto vazio para ver quais campos são aceitos
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .limit(1);
  
  if (data && data.length > 0) {
    console.log('📋 Colunas disponíveis:');
    Object.keys(data[0]).forEach(col => {
      console.log(`   - ${col}`);
    });
  } else {
    console.log('Tabela vazia, tentando inserir registro teste...');
    
    const { error: insertError } = await supabase
      .from('empresas')
      .insert([{ nome: 'TESTE' }])
      .select();
    
    if (insertError) {
      console.log('\n❌ Erro:', insertError.message);
      console.log('Detalhes:', insertError);
    }
  }
}

checkSchema().catch(console.error);
