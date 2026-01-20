// INVESTIGAÇÃO COMPLETA - Onde estão os dados?
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function investigarDados() {
  console.log('🔍 INVESTIGAÇÃO COMPLETA DE DADOS\n');
  console.log('='.repeat(80));
  
  const empresaId = '58234085-d661-4171-8664-4149b5559a3c';
  
  // 1. VERIFICAR ESTRUTURA DA TABELA PERSONAS
  console.log('\n📊 1. ESTRUTURA DA TABELA PERSONAS\n');
  const { data: personas, error: pError } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId)
    .limit(1);
  
  if (personas && personas.length > 0) {
    const p = personas[0];
    console.log('Persona exemplo:', p.full_name);
    console.log('Campos disponíveis:', Object.keys(p).join(', '));
    console.log('\nConteúdo dos campos JSONB:');
    console.log('- personalidade:', p.personalidade ? '✅ TEM DADOS' : '❌ VAZIO');
    console.log('- ia_config:', p.ia_config ? '✅ TEM DADOS' : '❌ VAZIO');
    console.log('- biografia_completa:', p.biografia_completa ? '✅ TEM DADOS' : '❌ VAZIO');
    console.log('- biografia_resumida:', p.biografia_resumida ? '✅ TEM DADOS' : '❌ VAZIO');
    console.log('- idiomas:', Array.isArray(p.idiomas) ? `✅ ${p.idiomas.length} idiomas` : '❌ VAZIO');
    
    if (p.personalidade) {
      console.log('\n📦 Conteúdo de personalidade:', Object.keys(p.personalidade));
    }
    
    if (p.ia_config) {
      console.log('\n📦 Conteúdo de ia_config:', Object.keys(p.ia_config));
      if (p.ia_config.atribuicoes_especificas) {
        console.log('   ✅ atribuicoes_especificas:', p.ia_config.atribuicoes_especificas.length, 'itens');
      }
      if (p.ia_config.tarefas_metas) {
        console.log('   ✅ tarefas_metas (competências):', Object.keys(p.ia_config.tarefas_metas));
      }
    }
  }
  
  // 2. VERIFICAR TODAS PERSONAS - IDIOMAS
  console.log('\n\n📊 2. IDIOMAS DE TODAS PERSONAS\n');
  const { data: todasPersonas } = await supabase
    .from('personas')
    .select('full_name, idiomas')
    .eq('empresa_id', empresaId)
    .order('full_name');
  
  if (todasPersonas) {
    todasPersonas.forEach(p => {
      const idiomas = Array.isArray(p.idiomas) ? p.idiomas : [];
      console.log(`${p.full_name}: ${idiomas.length} idiomas - ${idiomas.join(', ')}`);
    });
  }
  
  // 3. VERIFICAR TABELAS SEPARADAS
  console.log('\n\n📊 3. VERIFICAR TABELAS SEPARADAS\n');
  
  // Atribuições
  const { data: atrib, error: atribErr } = await supabase
    .from('personas_atribuicoes')
    .select('*')
    .limit(5);
  console.log('personas_atribuicoes:', atribErr ? `❌ ${atribErr.message}` : `✅ ${atrib?.length || 0} registros`);
  
  // Biografias
  const { data: bio, error: bioErr } = await supabase
    .from('personas_biografias')
    .select('*')
    .limit(5);
  console.log('personas_biografias:', bioErr ? `❌ ${bioErr.message}` : `✅ ${bio?.length || 0} registros`);
  
  // 4. VERIFICAR EMPRESA
  console.log('\n\n📊 4. CONFIGURAÇÃO DA EMPRESA\n');
  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();
  
  if (empresa) {
    console.log('Nome:', empresa.nome);
    console.log('Idiomas da empresa:', empresa.idiomas);
    console.log('Total personas:', empresa.total_personas);
    console.log('Scripts executados:', Object.keys(empresa.scripts_status || {}).filter(k => empresa.scripts_status[k]).join(', '));
  }
  
  // 5. CONTAR DADOS REAIS
  console.log('\n\n📊 5. CONTAGEM DE DADOS SALVOS\n');
  const { data: allPersonas } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);
  
  if (allPersonas) {
    let comBiografia = 0;
    let comAtribuicoes = 0;
    let comCompetencias = 0;
    let comIdiomas = 0;
    
    allPersonas.forEach(p => {
      if (p.biografia_completa || p.biografia_resumida) comBiografia++;
      if (p.ia_config?.atribuicoes_especificas) comAtribuicoes++;
      if (p.ia_config?.tarefas_metas) comCompetencias++;
      if (Array.isArray(p.idiomas) && p.idiomas.length > 1) comIdiomas++;
    });
    
    console.log(`Total personas: ${allPersonas.length}`);
    console.log(`Com biografia: ${comBiografia} (${Math.round(comBiografia/allPersonas.length*100)}%)`);
    console.log(`Com atribuições: ${comAtribuicoes} (${Math.round(comAtribuicoes/allPersonas.length*100)}%)`);
    console.log(`Com competências: ${comCompetencias} (${Math.round(comCompetencias/allPersonas.length*100)}%)`);
    console.log(`Com múltiplos idiomas: ${comIdiomas} (${Math.round(comIdiomas/allPersonas.length*100)}%)`);
  }
  
  console.log('\n' + '='.repeat(80));
}

investigarDados().then(() => process.exit(0));
