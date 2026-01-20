import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAvataresAfter05b() {
  const empresaId = 'b356b561-cd43-4760-8377-98a0cc1463ad';

  console.log('🔍 VERIFICANDO AVATARES APÓS SCRIPT 05b');
  console.log('========================================');

  // Buscar personas
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('id, full_name, email')
    .eq('empresa_id', empresaId)
    .order('full_name');

  if (personasError) {
    console.error('❌ Erro ao buscar personas:', personasError.message);
    return;
  }

  console.log(`👥 Personas encontradas: ${personas.length}`);

  // Buscar avatares com TODOS os campos
  const { data: avatares, error: avataresError } = await supabase
    .from('personas_avatares')
    .select('*')
    .in('persona_id', personas.map(p => p.id));

  if (avataresError) {
    console.error('❌ Erro ao buscar avatares:', avataresError.message);
    return;
  }

  console.log(`🖼️  Registros de avatares: ${avatares.length}\n`);

  let withAvatarUrl = 0;
  let withLocalPath = 0;
  let withBoth = 0;
  let withNone = 0;

  for (const avatar of avatares) {
    const persona = personas.find(p => p.id === avatar.persona_id);

    console.log(`🆔 ${persona?.full_name || 'DESCONHECIDA'}`);
    console.log(`   avatar_url: ${avatar.avatar_url ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   avatar_local_path: ${avatar.avatar_local_path ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   servico_usado: ${avatar.servico_usado || 'N/A'}`);

    if (avatar.avatar_url) {
      withAvatarUrl++;
      console.log(`   📡 URL: ${avatar.avatar_url.substring(0, 80)}...`);
    }

    if (avatar.avatar_local_path) {
      withLocalPath++;
      console.log(`   📁 Local: ${avatar.avatar_local_path}`);
    }

    if (avatar.avatar_url && avatar.avatar_local_path) {
      withBoth++;
    } else if (!avatar.avatar_url && !avatar.avatar_local_path) {
      withNone++;
    }

    console.log('');
  }

  console.log('📊 RESUMO:');
  console.log(`   Total de avatares: ${avatares.length}`);
  console.log(`   ✅ Com avatar_url: ${withAvatarUrl}`);
  console.log(`   ✅ Com avatar_local_path: ${withLocalPath}`);
  console.log(`   ✅ Com ambos: ${withBoth}`);
  console.log(`   ❌ Sem nenhum: ${withNone}`);

  if (withAvatarUrl === 0) {
    console.log('\n🚨 PROBLEMA: Nenhum avatar tem avatar_url!');
    console.log('💡 Isso explica por que o Script 05c não encontra imagens.');
    console.log('🔧 Verifique se o Script 05b salvou corretamente as URLs.');
  }

  if (withLocalPath > 0) {
    console.log('\n💡 SOLUÇÃO: O Script 05c pode usar avatar_local_path ao invés de avatar_url');
    console.log('   As imagens já estão salvas localmente em temp_avatars/');
  }
}

checkAvataresAfter05b().catch(console.error);