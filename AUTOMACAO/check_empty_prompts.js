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

async function checkAvataresWithEmptyPrompts() {
  const empresaId = 'b356b561-cd43-4760-8377-98a0cc1463ad';

  console.log('🔍 VERIFICANDO AVATARES COM PROMPTS VAZIOS');
  console.log('==========================================');

  // Buscar personas da empresa
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('id, full_name, email')
    .eq('empresa_id', empresaId);

  if (personasError) {
    console.error('❌ Erro ao buscar personas:', personasError.message);
    return;
  }

  console.log(`📊 Personas na empresa: ${personas.length}`);

  // Buscar avatares dessas personas
  const personaIds = personas.map(p => p.id);
  const { data: avatares, error: avataresError } = await supabase
    .from('personas_avatares')
    .select('id, persona_id, prompt_usado, servico_usado, created_at')
    .in('persona_id', personaIds);

  if (avataresError) {
    console.error('❌ Erro ao buscar avatares:', avataresError.message);
    return;
  }

  console.log(`📊 Registros de avatares encontrados: ${avatares.length}`);

  // Separar avatares com e sem prompts
  const withPrompts = avatares.filter(a => a.prompt_usado && a.prompt_usado.trim() !== '');
  const withoutPrompts = avatares.filter(a => !a.prompt_usado || a.prompt_usado.trim() === '');

  console.log(`\n✅ Com prompts válidos: ${withPrompts.length}`);
  console.log(`❌ Sem prompts ou vazios: ${withoutPrompts.length}`);

  if (withoutPrompts.length > 0) {
    console.log('\n❌ AVATARES SEM PROMPTS:');
    for (const avatar of withoutPrompts) {
      const persona = personas.find(p => p.id === avatar.persona_id);
      console.log(`   ID: ${avatar.id}`);
      console.log(`   Persona: ${persona?.full_name || 'NÃO ENCONTRADA'}`);
      console.log(`   Email: ${persona?.email || 'N/A'}`);
      console.log(`   Prompt: "${avatar.prompt_usado || 'VAZIO'}"`);
      console.log(`   Serviço: ${avatar.servico_usado || 'N/A'}`);
      console.log(`   Criado em: ${avatar.created_at}`);
      console.log('');
    }
  }

  // Verificar se há personas sem avatares
  const avataresPersonaIds = avatares.map(a => a.persona_id);
  const personasSemAvatares = personas.filter(p => !avataresPersonaIds.includes(p.id));

  if (personasSemAvatares.length > 0) {
    console.log('\n⚠️  PERSONAS SEM REGISTROS DE AVATARES:');
    personasSemAvatares.forEach(persona => {
      console.log(`   - ${persona.full_name} (${persona.email})`);
    });
  }

  console.log('\n💡 RESUMO:');
  console.log(`   Personas totais: ${personas.length}`);
  console.log(`   Avatares encontrados: ${avatares.length}`);
  console.log(`   Avatares com prompts: ${withPrompts.length}`);
  console.log(`   Avatares sem prompts: ${withoutPrompts.length}`);
  console.log(`   Personas sem avatares: ${personasSemAvatares.length}`);

  if (withoutPrompts.length > 0) {
    console.log('\n🔧 SOLUÇÃO: Execute o Script 05a novamente para gerar prompts faltantes');
  }
}

checkAvataresWithEmptyPrompts().catch(console.error);