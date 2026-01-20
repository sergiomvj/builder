#!/usr/bin/env node
/**
 * ATUALIZAR STATUS DOS SCRIPTS MANUALMENTE
 * Sincroniza o scripts_status da empresa baseado nos dados reais do banco
 */

require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const empresaId = process.argv.find(arg => arg.startsWith('--empresaId='))?.split('=')[1];

if (!empresaId) {
  console.error('❌ Uso: node sync_script_status.js --empresaId=UUID');
  process.exit(1);
}

async function syncStatus() {
  console.log('\n🔄 Sincronizando status dos scripts...\n');

  // 1. Buscar empresa
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();

  if (empresaError) {
    console.error('❌ Erro ao buscar empresa:', empresaError.message);
    process.exit(1);
  }

  console.log(`📋 Empresa: ${empresa.nome}`);

  // 2. Buscar personas
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('id, full_name')
    .eq('empresa_id', empresaId);

  if (personasError) {
    console.error('❌ Erro ao buscar personas:', personasError.message);
  }

  const totalPersonas = personas?.length || 0;
  console.log(`👥 ${totalPersonas} personas encontradas`);
  
  if (totalPersonas === 0) {
    console.log('\n⚠️  Nenhuma persona encontrada. Verifique se o empresa_id está correto.');
    console.log(`   empresa_id usado: ${empresaId}`);
  }

  // 3. Verificar status de cada script baseado nos dados reais
  const status = {
    create_personas: totalPersonas > 0,
    biografias: false,
    atribuicoes: false,
    competencias: false,
    avatares: false,
    automation_analysis: false,
    workflows: false,
    machine_learning: false,
    auditoria: false
  };

  // Verificar biografias na tabela personas_biografias
  if (personas && personas.length > 0) {
    const personaIds = personas.map(p => p.id);
    
    const { data: biografias } = await supabase
      .from('personas_biografias')
      .select('persona_id')
      .in('persona_id', personaIds);
    
    status.biografias = (biografias?.length || 0) > 0;
    console.log(`✓ Biografias: ${biografias?.length || 0}/${totalPersonas}`);

    // Verificar avatares
    const { data: avatares } = await supabase
      .from('avatares_personas')
      .select('persona_id')
      .in('persona_id', personaIds);
    
    status.avatares = (avatares?.length || 0) > 0;
    console.log(`✓ Avatares: ${avatares?.length || 0}/${totalPersonas}`);

    // Verificar atribuições
    const { data: atribuicoes } = await supabase
      .from('personas_atribuicoes')
      .select('persona_id')
      .in('persona_id', personaIds);
    
    status.atribuicoes = (atribuicoes?.length || 0) > 0;
    console.log(`✓ Atribuições: ${atribuicoes?.length || 0} registros`);

    // Verificar competências
    const { data: competencias } = await supabase
      .from('personas_competencias')
      .select('persona_id')
      .in('persona_id', personaIds);
    
    status.competencias = (competencias?.length || 0) > 0;
    console.log(`✓ Competências: ${competencias?.length || 0}/${totalPersonas}`);

    // Verificar análises de automação
    const { data: automacao } = await supabase
      .from('personas_automation_opportunities')
      .select('persona_id')
      .in('persona_id', personaIds);
    
    status.automation_analysis = (automacao?.length || 0) > 0;
    console.log(`✓ Análises automação: ${automacao?.length || 0} oportunidades`);

    // Verificar workflows
    const { data: workflows } = await supabase
      .from('personas_workflows')
      .select('persona_id')
      .in('persona_id', personaIds);
    
    status.workflows = (workflows?.length || 0) > 0;
    console.log(`✓ Workflows: ${workflows?.length || 0} workflows`);

    // Verificar ML models
    const { data: ml } = await supabase
      .from('personas_machine_learning')
      .select('persona_id')
      .in('persona_id', personaIds);
    
    status.machine_learning = (ml?.length || 0) > 0;
    console.log(`✓ ML Models: ${ml?.length || 0} modelos`);

    // Verificar auditoria
    const { data: auditoria } = await supabase
      .from('personas_auditorias')
      .select('persona_id')
      .in('persona_id', personaIds);
    
    status.auditoria = (auditoria?.length || 0) > 0;
    console.log(`✓ Auditoria: ${auditoria?.length || 0} logs`);
  }

  // 4. Atualizar scripts_status na empresa
  console.log('\n💾 Atualizando scripts_status...');
  
  const { error: updateError } = await supabase
    .from('empresas')
    .update({ scripts_status: status })
    .eq('id', empresaId);

  if (updateError) {
    console.error('❌ Erro ao atualizar:', updateError.message);
    process.exit(1);
  }

  console.log('\n✅ Status sincronizado com sucesso!');
  console.log('\n📊 Status final:');
  console.log(JSON.stringify(status, null, 2));
}

syncStatus().catch(error => {
  console.error('\n❌ ERRO:', error.message);
  process.exit(1);
});
