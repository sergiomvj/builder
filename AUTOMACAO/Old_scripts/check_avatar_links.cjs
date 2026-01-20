// Verificar se os links das imagens foram salvos no banco
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAvatarLinks() {
  console.log('🔍 Verificando links das imagens no banco...\n');
  
  const empresaId = '58234085-d661-4171-8664-4149b5559a3c';
  
  // Buscar personas com avatares
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('id, full_name, persona_code')
    .eq('empresa_id', empresaId)
    .limit(5);
  
  if (personasError) {
    console.error('❌ Erro:', personasError.message);
    return;
  }
  
  if (!personas || personas.length === 0) {
    console.log('⚠️  Nenhuma persona encontrada');
    return;
  }
  
  // Buscar avatares
  const personaIds = personas.map(p => p.id);
  const { data: avatares, error: avataresError } = await supabase
    .from('personas_avatares')
    .select('persona_id, avatar_url, servico_usado')
    .in('persona_id', personaIds);
  
  if (avataresError) {
    console.error('❌ Erro ao buscar avatares:', avataresError.message);
    return;
  }
  
  console.log(`📊 Total de personas verificadas: ${personas.length}`);
  console.log(`📊 Total de avatares encontrados: ${avatares?.length || 0}\n`);
  
  personas.forEach(persona => {
    const avatar = avatares?.find(a => a.persona_id === persona.id);
    if (avatar) {
      const hasLocalUrl = avatar.avatar_url?.startsWith('/avatars/');
      console.log(`${hasLocalUrl ? '✅' : '⚠️ '} ${persona.full_name}`);
      console.log(`   Código: ${persona.persona_code}`);
      console.log(`   URL: ${avatar.avatar_url || 'N/A'}`);
      console.log(`   Serviço: ${avatar.servico_usado || 'N/A'}\n`);
    } else {
      console.log(`❌ ${persona.full_name} - SEM AVATAR\n`);
    }
  });
}

checkAvatarLinks();
