require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAvatares() {
  console.log('🔍 Verificando avatares na base de dados...\n');

  // Verificar total de avatares
  const { data: avatares, error, count } = await supabase
    .from('personas_avatares')
    .select('*', { count: 'exact' })
    .limit(10);

  if (error) {
    console.error('❌ Erro ao buscar avatares:', error);
    return;
  }

  console.log(`📊 Total de avatares: ${count}`);
  
  if (avatares && avatares.length > 0) {
    console.log('\n✅ Primeiros avatares encontrados:');
    avatares.forEach((avatar, index) => {
      console.log(`\n${index + 1}. Avatar ID: ${avatar.id}`);
      console.log(`   Persona ID: ${avatar.persona_id}`);
      console.log(`   Status: ${avatar.status}`);
      console.log(`   Avatar URL: ${avatar.avatar_url ? 'Sim' : 'Não'}`);
      console.log(`   Estilo: ${avatar.estilo_visual || 'N/A'}`);
      console.log(`   Prompt: ${avatar.prompt_descricao?.substring(0, 50) || 'N/A'}...`);
      console.log(`   Created: ${avatar.created_at}`);
    });

    // Verificar se as personas existem
    console.log('\n🔍 Verificando personas associadas...');
    const personaIds = avatares.map(a => a.persona_id).filter(Boolean);
    
    if (personaIds.length > 0) {
      const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select('id, nome, empresa_id')
        .in('id', personaIds);

      if (personasError) {
        console.error('❌ Erro ao buscar personas:', personasError);
      } else {
        console.log(`✅ ${personas?.length || 0} personas encontradas`);
        personas?.forEach(p => {
          console.log(`   - ${p.nome} (Empresa: ${p.empresa_id})`);
        });
      }
    }
  } else {
    console.log('\n⚠️ NENHUM AVATAR ENCONTRADO na tabela personas_avatares!');
    console.log('💡 Execute o script 05 para gerar avatares.');
  }
}

checkAvatares();
