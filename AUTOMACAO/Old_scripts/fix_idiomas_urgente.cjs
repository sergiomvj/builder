// CORREÇÃO URGENTE: Adicionar 5 idiomas a todas personas
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function corrigirIdiomas() {
  const empresaId = '58234085-d661-4171-8664-4149b5559a3c';
  
  console.log('🔧 CORREÇÃO DE IDIOMAS\n');
  
  // Idiomas padrão para todas personas
  const idiomasPadrao = [
    'Português',
    'Inglês',
    'Espanhol',
    'Francês',
    'Alemão'
  ];
  
  console.log('📋 Idiomas a serem adicionados:', idiomasPadrao.join(', '));
  console.log('');
  
  // Buscar todas personas
  const { data: personas, error } = await supabase
    .from('personas')
    .select('id, full_name, idiomas')
    .eq('empresa_id', empresaId);
  
  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }
  
  console.log(`✅ ${personas.length} personas encontradas\n`);
  
  let atualizadas = 0;
  let erros = 0;
  
  for (const persona of personas) {
    const idiomasAtuais = persona.idiomas || [];
    console.log(`[${atualizadas + 1}/${personas.length}] ${persona.full_name}`);
    console.log(`  Atual: ${idiomasAtuais.join(', ')}`);
    
    // Atualizar com 5 idiomas
    const { error: updateError } = await supabase
      .from('personas')
      .update({ idiomas: idiomasPadrao })
      .eq('id', persona.id);
    
    if (updateError) {
      console.log(`  ❌ Erro: ${updateError.message}`);
      erros++;
    } else {
      console.log(`  ✅ Atualizado para: ${idiomasPadrao.join(', ')}`);
      atualizadas++;
    }
    console.log('');
  }
  
  console.log('='.repeat(60));
  console.log(`✅ Atualizadas: ${atualizadas}`);
  console.log(`❌ Erros: ${erros}`);
  console.log('='.repeat(60));
}

corrigirIdiomas().then(() => process.exit(0));
