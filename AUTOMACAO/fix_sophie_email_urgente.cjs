/**
 * Fix urgente do email da Sophie
 */
require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('🔧 CORRIGINDO EMAIL DA SOPHIE URGENTE\n');
  
  const sophieId = '4697d8be-864d-4104-8c9a-a90c50bb7382';
  
  // 1. Verificar email atual
  const { data: before } = await supabase
    .from('personas')
    .select('full_name, email')
    .eq('id', sophieId)
    .single();
  
  console.log('📧 Email ANTES:', before?.email);
  
  // 2. Atualizar para email correto
  const { error } = await supabase
    .from('personas')
    .update({ 
      email: 'sophie.dubois@arvabot.com'
    })
    .eq('id', sophieId);
  
  if (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
  
  // 3. Verificar email atualizado
  const { data: after } = await supabase
    .from('personas')
    .select('full_name, email')
    .eq('id', sophieId)
    .single();
  
  console.log('📧 Email DEPOIS:', after?.email);
  console.log('✅ CORRIGIDO!');
}

main();
