// Diagnóstico completo: status de todos os scripts e próximos passos
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const AVATARS_DIR = path.join(__dirname, '..', 'public', 'avatars');

async function diagnosticoCompleto() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA');
  console.log('===================================\n');
  
  const empresaId = '58234085-d661-4171-8664-4149b5559a3c';
  
  // Buscar empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();
  
  console.log(`🏢 Empresa: ${empresa.nome}`);
  console.log(`📋 Código: ${empresa.codigo}\n`);
  
  // Buscar personas
  const { data: personas } = await supabase
    .from('personas')
    .select('id, full_name, persona_code')
    .eq('empresa_id', empresaId);
  
  const totalPersonas = personas.length;
  console.log(`👥 Total de personas: ${totalPersonas}\n`);
  
  const personaIds = personas.map(p => p.id);
  
  // ========================================
  // 1. SCRIPT 00 - AVATARES (descrições LLM)
  // ========================================
  console.log('📊 SCRIPT 00 - Avatares (Descrições LLM)');
  console.log('─'.repeat(50));
  
  const { data: avatares } = await supabase
    .from('personas_avatares')
    .select('*')
    .in('persona_id', personaIds);
  
  const totalAvatares = avatares?.length || 0;
  const percAvatares = ((totalAvatares / totalPersonas) * 100).toFixed(1);
  
  console.log(`✅ Avatares gerados: ${totalAvatares}/${totalPersonas} (${percAvatares}%)`);
  
  if (totalAvatares < totalPersonas) {
    console.log(`⚠️  AÇÃO NECESSÁRIA: Execute 'node 00_generate_avatares_grok.cjs --empresaId=${empresaId}'`);
  } else {
    console.log(`✓ Concluído - Todas as personas têm descrições de avatar`);
  }
  console.log('');
  
  // ========================================
  // 2. SCRIPT 01.3 - IMAGENS (download fal.ai)
  // ========================================
  console.log('📊 SCRIPT 01.3 - Imagens de Avatares');
  console.log('─'.repeat(50));
  
  // Verificar quantos avatares têm imagens geradas (URLs da fal.ai nos metadados)
  let comImagemGerada = 0;
  let comImagemLocal = 0;
  let arquivosLocaisExistentes = 0;
  
  if (avatares && avatares.length > 0) {
    avatares.forEach(avatar => {
      // Verificar se tem URL da fal.ai nos metadados
      let metadados = avatar.metadados;
      if (typeof metadados === 'string') {
        try {
          metadados = JSON.parse(metadados);
        } catch (e) {}
      }
      
      if (metadados?.fal_ai?.image_url_original) {
        comImagemGerada++;
      }
      
      // Verificar se avatar_url aponta para arquivo local
      if (avatar.avatar_url?.startsWith('/avatars/')) {
        comImagemLocal++;
      }
    });
    
    // Verificar arquivos físicos no diretório
    if (fs.existsSync(AVATARS_DIR)) {
      const files = fs.readdirSync(AVATARS_DIR).filter(f => 
        f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
      );
      arquivosLocaisExistentes = files.length;
    }
  }
  
  const percImagensGeradas = ((comImagemGerada / totalPersonas) * 100).toFixed(1);
  const percImagensLocais = ((comImagemLocal / totalPersonas) * 100).toFixed(1);
  const percArquivosFisicos = ((arquivosLocaisExistentes / totalPersonas) * 100).toFixed(1);
  
  console.log(`🎨 Imagens geradas (fal.ai): ${comImagemGerada}/${totalPersonas} (${percImagensGeradas}%)`);
  console.log(`💾 URLs locais no banco: ${comImagemLocal}/${totalPersonas} (${percImagensLocais}%)`);
  console.log(`📁 Arquivos em public/avatars/: ${arquivosLocaisExistentes}/${totalPersonas} (${percArquivosFisicos}%)`);
  
  if (comImagemGerada === 0) {
    console.log(`⚠️  AÇÃO NECESSÁRIA: Execute 'node 01.3_generate_avatar_images.cjs --empresaId=${empresaId}'`);
  } else if (arquivosLocaisExistentes < comImagemGerada) {
    console.log(`⚠️  AÇÃO NECESSÁRIA: Execute 'node download_avatar_images.cjs --empresaId=${empresaId}'`);
  } else {
    console.log(`✓ Concluído - Todas as imagens estão armazenadas localmente`);
  }
  console.log('');
  
  // ========================================
  // 3. SCRIPT 01 - BIOGRAFIAS
  // ========================================
  console.log('📊 SCRIPT 01 - Biografias Completas');
  console.log('─'.repeat(50));
  
  const { data: biografias } = await supabase
    .from('personas_biografias')
    .select('persona_id')
    .in('persona_id', personaIds);
  
  const totalBiografias = biografias?.length || 0;
  const percBiografias = ((totalBiografias / totalPersonas) * 100).toFixed(1);
  
  console.log(`✅ Biografias geradas: ${totalBiografias}/${totalPersonas} (${percBiografias}%)`);
  
  if (totalBiografias < totalPersonas) {
    console.log(`⚠️  AÇÃO NECESSÁRIA: Execute 'node 01_generate_biografias_REAL.js --empresaId=${empresaId}'`);
  } else {
    console.log(`✓ Concluído`);
  }
  console.log('');
  
  // ========================================
  // 4. SCRIPT 01.7 - ATRIBUIÇÕES
  // ========================================
  console.log('📊 SCRIPT 01.7 - Atribuições Contextualizadas');
  console.log('─'.repeat(50));
  
  const { data: atribuicoes } = await supabase
    .from('personas_atribuicoes')
    .select('persona_id')
    .in('persona_id', personaIds);
  
  const totalAtribuicoes = atribuicoes?.length || 0;
  const percAtribuicoes = ((totalAtribuicoes / totalPersonas) * 100).toFixed(1);
  
  console.log(`✅ Atribuições geradas: ${totalAtribuicoes}/${totalPersonas} (${percAtribuicoes}%)`);
  
  if (totalAtribuicoes < totalPersonas) {
    console.log(`⚠️  AÇÃO NECESSÁRIA: Execute 'node 01.5_generate_atribuicoes_contextualizadas.cjs --empresaId=${empresaId}'`);
  } else {
    console.log(`✓ Concluído`);
  }
  console.log('');
  
  // ========================================
  // 5. PRÓXIMOS SCRIPTS
  // ========================================
  console.log('📊 SCRIPTS SEGUINTES (Ordem de Execução)');
  console.log('─'.repeat(50));
  console.log('📌 02 - Competências Técnicas e Comportamentais');
  console.log('📌 02.5 - Análise de Tasks para Automação');
  console.log('📌 03 - Tech Specs (Especificações Técnicas)');
  console.log('📌 04 - RAG Knowledge Base');
  console.log('📌 05 - Fluxos SDR');
  console.log('📌 06 - Workflows N8N');
  console.log('');
  
  // ========================================
  // RESUMO GERAL
  // ========================================
  console.log('='.repeat(60));
  console.log('📋 RESUMO GERAL E PRÓXIMOS PASSOS');
  console.log('='.repeat(60));
  
  const scriptsCompletos = [];
  const scriptsPendentes = [];
  
  if (totalAvatares === totalPersonas) scriptsCompletos.push('00 - Avatares');
  else scriptsPendentes.push('00 - Avatares');
  
  if (arquivosLocaisExistentes === totalPersonas) scriptsCompletos.push('01.3 - Imagens');
  else scriptsPendentes.push('01.3 - Imagens');
  
  if (totalBiografias === totalPersonas) scriptsCompletos.push('01 - Biografias');
  else scriptsPendentes.push('01 - Biografias');
  
  if (totalAtribuicoes === totalPersonas) scriptsCompletos.push('01.7 - Atribuições');
  else scriptsPendentes.push('01.7 - Atribuições');
  
  console.log(`\n✅ Scripts completos (${scriptsCompletos.length}):`);
  scriptsCompletos.forEach(s => console.log(`   - ${s}`));
  
  console.log(`\n⚠️  Scripts pendentes (${scriptsPendentes.length}):`);
  if (scriptsPendentes.length > 0) {
    scriptsPendentes.forEach(s => console.log(`   - ${s}`));
    console.log(`\n💡 Execute os scripts pendentes na ordem acima antes de continuar!`);
  } else {
    console.log(`   (Nenhum - todos os scripts iniciais estão completos!)`);
    console.log(`\n🎉 Pronto para executar os scripts 02, 03, 04, 05 e 06!`);
  }
  
  console.log('\n' + '='.repeat(60));
}

diagnosticoCompleto();
