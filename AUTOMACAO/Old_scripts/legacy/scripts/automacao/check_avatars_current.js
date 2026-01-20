import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VERIFICANDO AVATARES ATUAIS');
console.log('=====================================');

async function checkAvatars() {
  try {
    // Buscar avatares da ARVA
    const { data: avatars, error } = await supabase
      .from('personas_avatares')
      .select('persona_id, avatar_url, servico_usado, estilo, background_tipo, updated_at')
      .order('updated_at', { ascending: false })
      .limit(15);

    if (error) {
      console.error('❌ Erro ao buscar avatares:', error);
      return;
    }

    console.log(`✅ Encontrados ${avatars?.length || 0} avatares:`);
    
    avatars?.forEach((avatar, index) => {
      console.log(`\n${index + 1}. Persona ID: ${avatar.persona_id}`);
      console.log(`   Serviço usado: ${avatar.servico_usado || 'não especificado'}`);
      console.log(`   Estilo: ${avatar.estilo || 'não especificado'}`);
      console.log(`   Background: ${avatar.background_tipo || 'não especificado'}`);
      console.log(`   URL: ${avatar.avatar_url?.substring(0, 80)}...`);
      
      // Verificar se usa Unsplash
      if (avatar.avatar_url?.includes('unsplash')) {
        console.log('   🚨 USANDO UNSPLASH!');
      } else if (avatar.avatar_url?.includes('dicebear')) {
        console.log('   📱 Usando DiceBear (fallback)');
      } else {
        console.log('   🍌 Usando Google Nano Banana');
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkAvatars();