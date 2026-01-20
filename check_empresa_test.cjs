const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkEmpresa() {
  console.log('🔍 Listando todas as empresas...');
  console.log('🔗 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  const { data, error } = await supabase
    .from('empresas')
    .select('id, nome');
  
  if (error) {
    console.error('❌ Erro:', error);
  } else {
    console.log('✅ Empresas encontradas:', data.length);
    data.forEach(emp => {
      console.log(`  - ${emp.nome} (${emp.id})`);
    });
  }
}

checkEmpresa();
