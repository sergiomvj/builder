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

console.log('🔍 VERIFICANDO TABELA PERSONAS_AVATARES\n');

const empresaId = '27470d32-9cce-4975-9a62-1d76f3ab77a4';

// Buscar personas da empresa
const { data: personas, error: personasError } = await supabase
  .from('personas')
  .select('id, full_name, role')
  .eq('empresa_id', empresaId)
  .order('full_name');

if (personasError) {
  console.error('❌ Erro ao buscar personas:', personasError.message);
  process.exit(1);
}

console.log(`📊 Total de personas: ${personas.length}\n`);

// Buscar avatares
const { data: avatares, error: avataresError } = await supabase
  .from('personas_avatares')
  .select('*')
  .in('persona_id', personas.map(p => p.id));

if (avataresError) {
  console.error('❌ Erro ao buscar avatares:', avataresError.message);
  process.exit(1);
}

console.log(`🎨 Total de registros em personas_avatares: ${avatares.length}\n`);

// Mostrar resumo
let comImagens = 0;
let semImagens = 0;

for (const persona of personas) {
  const avatar = avatares.find(a => a.persona_id === persona.id);
  
  if (avatar) {
    if (avatar.avatar_url) {
      comImagens++;
      console.log(`✅ ${persona.full_name}`);
      console.log(`   📝 Prompt: ${avatar.prompt_usado?.substring(0, 100)}...`);
      console.log(`   📸 URL: ${avatar.avatar_url.substring(0, 60)}...`);
      console.log(`   🎲 Seed: ${avatar.metadados?.fal_ai_generation?.seed_used || 'N/A'}`);
      console.log(`   🔧 Serviço: ${avatar.servico_usado || 'N/A'}`);
      console.log(`   💾 Local: ${avatar.avatar_local_path || 'Ainda não baixado'}\n`);
    } else {
      semImagens++;
      console.log(`⚠️  ${persona.full_name} - Sem imagem ainda`);
    }
  } else {
    console.log(`❌ ${persona.full_name} - Sem registro em personas_avatares`);
  }
}

console.log('\n📊 RESUMO FINAL');
console.log('================');
console.log(`✅ Com imagens: ${comImagens}`);
console.log(`⚠️  Sem imagens: ${semImagens}`);
console.log(`📋 Total: ${personas.length}`);
