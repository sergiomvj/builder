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

async function checkAvataresDetailed() {
  const empresaId = 'b356b561-cd43-4760-8377-98a0cc1463ad';

  console.log('🔍 VERIFICAÇÃO DETALHADA DOS REGISTROS DE AVATARES');
  console.log('==================================================');

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

  // Buscar avatares com TODOS os campos
  const { data: avatares, error: avataresError } = await supabase
    .from('personas_avatares')
    .select('*')
    .in('persona_id', personas.map(p => p.id));

  if (avataresError) {
    console.error('❌ Erro ao buscar avatares:', avataresError.message);
    return;
  }

  console.log(`📊 Analisando ${avatares.length} registros de avatares...\n`);

  let problemas = [];
  let processados = [];
  let pendentes = [];
  let falhas = [];

  for (const avatar of avatares) {
    const persona = personas.find(p => p.id === avatar.persona_id);

    console.log(`🆔 Avatar ID: ${avatar.id}`);
    console.log(`👤 Persona: ${persona?.full_name || 'NÃO ENCONTRADA'}`);
    console.log(`📧 Email: ${persona?.email || 'N/A'}`);
    console.log(`🔤 Prompt usado: ${avatar.prompt_usado ? 'SIM' : 'NÃO'}`);
    console.log(`   Comprimento: ${avatar.prompt_usado?.length || 0} caracteres`);
    console.log(`🛠️  Serviço usado: ${avatar.servico_usado || 'NENHUM'}`);
    console.log(`📅 Criado em: ${avatar.created_at}`);
    console.log(`🔄 Atualizado em: ${avatar.updated_at || 'NUNCA'}`);

    // Verificar prompt
    if (!avatar.prompt_usado || avatar.prompt_usado.trim() === '') {
      problemas.push({
        avatar: avatar.id,
        persona: persona?.full_name,
        problema: 'Prompt vazio ou nulo'
      });
      console.log(`❌ PROBLEMA: Prompt vazio!`);
    } else {
      console.log(`✅ Prompt OK (${avatar.prompt_usado.length} chars)`);
    }

    // Classificar status
    if (avatar.servico_usado && avatar.servico_usado !== 'pending_fal_ai') {
      processados.push(avatar);
      console.log(`✅ STATUS: Já processado (${avatar.servico_usado})`);
    } else if (avatar.servico_usado === 'falhou') {
      falhas.push(avatar);
      console.log(`❌ STATUS: Falhou anteriormente`);
    } else {
      pendentes.push(avatar);
      console.log(`⏳ STATUS: Pendente`);
    }

    // Verificar metadados
    if (avatar.metadados) {
      console.log(`📋 Metadados: ${Object.keys(avatar.metadados).length} campos`);
      if (avatar.metadados.error) {
        console.log(`   ❌ Último erro: ${avatar.metadados.error}`);
      }
    } else {
      console.log(`📋 Metadados: Nenhum`);
    }

    console.log('---\n');
  }

  console.log('📊 RESUMO GERAL:');
  console.log(`   Total de avatares: ${avatares.length}`);
  console.log(`   ✅ Já processados: ${processados.length}`);
  console.log(`   ⏳ Pendentes: ${pendentes.length}`);
  console.log(`   ❌ Com falhas: ${falhas.length}`);
  console.log(`   🚨 Com problemas: ${problemas.length}`);

  if (problemas.length > 0) {
    console.log('\n🚨 PROBLEMAS DETECTADOS:');
    problemas.forEach((p, index) => {
      console.log(`   ${index + 1}. Avatar ${p.avatar} (${p.persona}): ${p.problema}`);
    });
  }

  if (pendentes.length > 0) {
    console.log('\n⏳ AVATARES PENDENTES (prontos para processamento):');
    pendentes.forEach((avatar, index) => {
      const persona = personas.find(p => p.id === avatar.persona_id);
      console.log(`   ${index + 1}. ${persona?.full_name} (${avatar.servico_usado || 'novo'})`);
    });
  }

  if (falhas.length > 0) {
    console.log('\n❌ AVATARES COM FALHAS (podem ser retentados):');
    falhas.forEach((avatar, index) => {
      const persona = personas.find(p => p.id === avatar.persona_id);
      const ultimoErro = avatar.metadados?.error || 'Erro desconhecido';
      console.log(`   ${index + 1}. ${persona?.full_name} - ${ultimoErro}`);
    });
  }

  console.log('\n💡 PRÓXIMOS PASSOS:');
  if (problemas.length > 0) {
    console.log('   - Corrigir problemas antes de executar o script');
  }
  if (pendentes.length > 0) {
    console.log('   - Executar script normalmente para processar pendentes');
  }
  if (falhas.length > 0) {
    console.log('   - Usar --retry-failed para tentar novamente os que falharam');
  }
}

checkAvataresDetailed().catch(console.error);