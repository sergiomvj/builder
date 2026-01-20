require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('🔍 Verificando schema da tabela personas_avatares...\n');

  // Buscar um avatar de exemplo
  const { data: avatar, error } = await supabase
    .from('personas_avatares')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('📋 Campos disponíveis na tabela personas_avatares:\n');
  
  Object.keys(avatar || {}).forEach(key => {
    const value = avatar[key];
    const type = value === null ? 'NULL' : typeof value;
    console.log(`  ${key}: ${type} = ${value === null ? 'NULL' : JSON.stringify(value).substring(0, 50)}`);
  });

  console.log('\n\n🔍 Campos que esperamos mas podem estar faltando:');
  const expectedFields = [
    'prompt_descricao',
    'estilo_visual', 
    'generation_service',
    'status',
    'avatar_url',
    'persona_id'
  ];

  expectedFields.forEach(field => {
    const exists = field in (avatar || {});
    const value = avatar ? avatar[field] : null;
    console.log(`  ${field}: ${exists ? '✅ Existe' : '❌ Não existe'} - Valor: ${value === null ? 'NULL' : value}`);
  });
}

checkSchema();
