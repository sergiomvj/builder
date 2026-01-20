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

async function checkPrompts() {
  const empresaId = 'b356b561-cd43-4760-8377-98a0cc1463ad';

  console.log('🔍 VERIFICANDO STATUS DOS SCRIPTS E PROMPTS');
  console.log('==========================================');

  // Verificar status da empresa
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('nome, scripts_status')
    .eq('id', empresaId)
    .single();

  if (empresaError) {
    console.error('❌ Erro ao buscar empresa:', empresaError.message);
    return;
  }

  console.log('🏢 Empresa:', empresa.nome);
  console.log('📊 Scripts Status:');

  if (empresa.scripts_status) {
    Object.entries(empresa.scripts_status).forEach(([script, status]) => {
      if (script.includes('05a') || script.includes('05b')) {
        console.log(`   ${script}: ${status.status || 'não executado'} (${status.executado_em || 'nunca'})`);
      }
    });
  } else {
    console.log('   Nenhum script executado ainda');
  }

  console.log('\n📝 VERIFICANDO PROMPTS DAS PERSONAS');
  console.log('====================================');

  // Buscar algumas personas com seus prompts
  const { data: avatares, error: avataresError } = await supabase
    .from('personas_avatares')
    .select('persona_id, prompt_usado, servico_usado, updated_at')
    .limit(5);

  if (avataresError) {
    console.error('❌ Erro ao buscar avatares:', avataresError.message);
    return;
  }

  if (!avatares || avatares.length === 0) {
    console.log('❌ Nenhum registro de avatar encontrado!');
    return;
  }

  console.log(`📊 Total de registros encontrados: ${avatares.length}`);
  console.log('');

  avatares.forEach((avatar, index) => {
    console.log(`${index + 1}. Persona ID: ${avatar.persona_id}`);
    console.log(`   Serviço usado: ${avatar.servico_usado || 'não definido'}`);
    console.log(`   Última atualização: ${avatar.updated_at || 'nunca'}`);

    if (avatar.prompt_usado) {
      const promptPreview = avatar.prompt_usado.substring(0, 100) + '...';
      console.log(`   Prompt: ${promptPreview}`);
    } else {
      console.log('   ❌ SEM PROMPT!');
    }
    console.log('');
  });

  // Verificar se todos têm prompts
  const { data: allAvatares, error: allError } = await supabase
    .from('personas_avatares')
    .select('persona_id, prompt_usado')
    .limit(100); // Buscar mais registros para ter uma amostra representativa

  if (!allError && allAvatares) {
    const withPrompts = allAvatares.filter(a => a.prompt_usado).length;
    const withoutPrompts = allAvatares.length - withPrompts;

    console.log('📈 RESUMO GERAL:');
    console.log(`   Total de registros verificados: ${allAvatares.length}`);
    console.log(`   ✅ Com prompts: ${withPrompts}`);
    console.log(`   ❌ Sem prompts: ${withoutPrompts}`);

    if (withoutPrompts > 0) {
      console.log('\n⚠️  ALERTA: Algumas personas não têm prompts!');
      console.log('💡 Execute o Script 05a primeiro: node 05a_generate_avatar_prompts.js --empresaId=' + empresaId);
    } else {
      console.log('\n✅ Todos os prompts estão prontos para geração de imagens!');
    }
  }
}

checkPrompts().catch(console.error);