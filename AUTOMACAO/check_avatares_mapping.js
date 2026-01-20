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

async function checkAvataresMapping() {
  const empresaId = 'b356b561-cd43-4760-8377-98a0cc1463ad';

  console.log('🔍 VERIFICANDO MAPEAMENTO PERSONAS ↔ AVATARES');
  console.log('==============================================');

  // Buscar personas da empresa
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

  // Buscar avatares
  const { data: avatares, error: avataresError } = await supabase
    .from('personas_avatares')
    .select('id, persona_id, prompt_usado, servico_usado, metadados')
    .in('persona_id', personas.map(p => p.id));

  if (avataresError) {
    console.error('❌ Erro ao buscar avatares:', avataresError.message);
    return;
  }

  console.log(`🖼️  Registros de avatares: ${avatares.length}`);

  // Verificar mapeamento
  const problemas = [];
  const semAvatares = [];
  const comAvatares = [];

  for (const persona of personas) {
    const avatar = avatares.find(a => a.persona_id === persona.id);

    if (!avatar) {
      semAvatares.push(persona);
      problemas.push({
        tipo: 'SEM_AVATAR',
        persona: persona.full_name,
        email: persona.email,
        problema: 'Nenhum registro de avatar encontrado'
      });
    } else {
      comAvatares.push({ persona, avatar });

      if (!avatar.prompt_usado || avatar.prompt_usado.trim() === '') {
        problemas.push({
          tipo: 'SEM_PROMPT',
          persona: persona.full_name,
          email: persona.email,
          problema: `Prompt vazio: "${avatar.prompt_usado}"`
        });
      }
    }
  }

  console.log(`\n✅ Personas com avatares: ${comAvatares.length}`);
  console.log(`❌ Personas sem avatares: ${semAvatares.length}`);
  console.log(`⚠️  Total de problemas: ${problemas.length}`);

  if (problemas.length > 0) {
    console.log('\n🚨 PROBLEMAS ENCONTRADOS:');
    problemas.forEach((p, index) => {
      console.log(`   ${index + 1}. [${p.tipo}] ${p.persona} (${p.email})`);
      console.log(`      ${p.problema}`);
    });
  }

  if (semAvatares.length > 0) {
    console.log('\n❌ PERSONAS SEM AVATARES (execute Script 05a):');
    semAvatares.forEach(p => {
      console.log(`   - ${p.full_name} (${p.email})`);
    });
  }

  // Verificar se há avatares órfãos (sem persona correspondente)
  const personaIds = personas.map(p => p.id);
  const avataresOrfaos = avatares.filter(a => !personaIds.includes(a.persona_id));

  if (avataresOrfaos.length > 0) {
    console.log('\n🧹 AVATARES ÓRFÃOS (sem persona correspondente):');
    avataresOrfaos.forEach(a => {
      console.log(`   - Avatar ID: ${a.id}, Persona ID: ${a.persona_id}`);
    });
  }

  console.log('\n💡 RESUMO EXECUÇÃO:');
  console.log(`   Personas totais: ${personas.length}`);
  console.log(`   Avatares encontrados: ${avatares.length}`);
  console.log(`   Mapeamento correto: ${comAvatares.length}`);
  console.log(`   Problemas encontrados: ${problemas.length}`);

  if (problemas.length === 0) {
    console.log('\n✅ TUDO OK! Todos os mapeamentos estão corretos.');
  } else {
    console.log('\n🔧 CORREÇÕES NECESSÁRIAS:');
    if (semAvatares.length > 0) {
      console.log('   - Execute Script 05a para criar avatares faltantes');
    }
    if (problemas.filter(p => p.tipo === 'SEM_PROMPT').length > 0) {
      console.log('   - Execute Script 05a novamente para gerar prompts');
    }
  }
}

checkAvataresMapping().catch(console.error);