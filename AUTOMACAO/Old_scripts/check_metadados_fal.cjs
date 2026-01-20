// Verificar metadados salvos pelo Script 01.3
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMetadados() {
  const { data, error } = await supabase
    .from('personas_avatares')
    .select('metadados, servico_usado')
    .eq('servico_usado', 'fal_ai_flux_schnell')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log('📋 METADADOS DO AVATAR FAL.AI:');
  console.log('================================\n');
  console.log('Tipo:', typeof data.metadados);
  console.log('\nConteúdo:');
  console.log(JSON.stringify(data.metadados, null, 2));
  
  let metadados = data.metadados;
  if (typeof metadados === 'string') {
    metadados = JSON.parse(metadados);
  }
  
  console.log('\n🔍 Verificando campos:');
  console.log('metadados.fal_ai:', metadados?.fal_ai);
  console.log('metadados.fal_ai.image_url_original:', metadados?.fal_ai?.image_url_original);
}

checkMetadados();
