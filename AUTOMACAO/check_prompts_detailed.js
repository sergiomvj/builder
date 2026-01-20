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

async function checkPromptsDetailed() {
  const empresaId = 'b356b561-cd43-4760-8377-98a0cc1463ad';

  console.log('🔍 VERIFICAÇÃO DETALHADA DOS PROMPTS');
  console.log('=====================================');

  // Buscar todos os registros de avatares
  const { data: allAvatares, error: allError } = await supabase
    .from('personas_avatares')
    .select('id, persona_id, prompt_usado, servico_usado, created_at, updated_at')
    .order('created_at');

  if (allError) {
    console.error('❌ Erro ao buscar avatares:', allError.message);
    return;
  }

  console.log(`📊 Total de registros encontrados: ${allAvatares.length}`);
  console.log('');

  // Separar por status
  const withPrompts = allAvatares.filter(a => a.prompt_usado);
  const withoutPrompts = allAvatares.filter(a => !a.prompt_usado);

  console.log('✅ REGISTROS COM PROMPTS:');
  console.log(`   Quantidade: ${withPrompts.length}`);
  if (withPrompts.length > 0) {
    console.log('   Últimos 3 criados:');
    withPrompts.slice(-3).forEach((avatar, index) => {
      console.log(`     ${index + 1}. ID: ${avatar.id} | Persona: ${avatar.persona_id} | Criado: ${avatar.created_at}`);
    });
  }
  console.log('');

  console.log('❌ REGISTROS SEM PROMPTS:');
  console.log(`   Quantidade: ${withoutPrompts.length}`);
  if (withoutPrompts.length > 0) {
    console.log('   Lista completa:');
    withoutPrompts.forEach((avatar, index) => {
      console.log(`     ${index + 1}. ID: ${avatar.id} | Persona: ${avatar.persona_id} | Criado: ${avatar.created_at}`);
    });
  } else {
    console.log('   Nenhum registro sem prompt encontrado!');
  }
  console.log('');

  // Verificar se há diferença entre personas e avatares
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('id, full_name')
    .eq('empresa_id', empresaId);

  if (!personasError && personas) {
    console.log('🔗 COMPARAÇÃO PERSONAS vs AVATARES:');
    console.log(`   Personas na empresa: ${personas.length}`);
    console.log(`   Registros de avatares: ${allAvatares.length}`);

    if (personas.length !== allAvatares.length) {
      console.log('⚠️  ALERTA: Número diferente de personas e avatares!');

      // Encontrar personas sem avatares
      const personaIds = personas.map(p => p.id);
      const avatarPersonaIds = allAvatares.map(a => a.persona_id);

      const personasSemAvatares = personaIds.filter(id => !avatarPersonaIds.includes(id));
      const avataresSemPersonas = avatarPersonaIds.filter(id => !personaIds.includes(id));

      if (personasSemAvatares.length > 0) {
        console.log('   Personas sem registros de avatares:');
        personasSemAvatares.forEach(id => {
          const persona = personas.find(p => p.id === id);
          console.log(`     - ${persona?.full_name} (${id})`);
        });
      }

      if (avataresSemPersonas.length > 0) {
        console.log('   Registros de avatares sem personas correspondentes:');
        avataresSemPersonas.forEach(id => console.log(`     - ${id}`));
      }
    } else {
      console.log('✅ Número de personas e avatares está consistente');
    }
  }

  // Verificar se o problema é timing - talvez alguns registros sejam mais recentes
  if (withoutPrompts.length > 0) {
    console.log('');
    console.log('🔍 ANÁLISE DOS REGISTROS SEM PROMPT:');
    console.log('Verificando se são registros mais recentes ou com problema...');

    // Buscar detalhes completos dos registros sem prompt
    for (const avatar of withoutPrompts.slice(0, 3)) { // Apenas os primeiros 3 para não sobrecarregar
      console.log(`\n   Registro ID: ${avatar.id}`);
      console.log(`   Persona ID: ${avatar.persona_id}`);
      console.log(`   Criado em: ${avatar.created_at}`);
      console.log(`   Atualizado em: ${avatar.updated_at}`);
      console.log(`   Serviço usado: ${avatar.servico_usado || 'não definido'}`);

      // Buscar a persona correspondente
      const { data: persona, error: pError } = await supabase
        .from('personas')
        .select('full_name, email')
        .eq('id', avatar.persona_id)
        .single();

      if (!pError && persona) {
        console.log(`   Persona: ${persona.full_name}`);
        console.log(`   Email: ${persona.email}`);
      }
    }
  }
}

checkPromptsDetailed().catch(console.error);