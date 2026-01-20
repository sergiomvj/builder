#!/usr/bin/env node
/**
 * DIAGNÓSTICO COMPLETO - Verificar o que foi salvo
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const empresaId = '3c3bee15-b3a4-4442-89e9-5859c06e7575';

async function diagnostico() {
  console.log('\n🔍 DIAGNÓSTICO COMPLETO\n');

  // 1. Verificar empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('id, nome, estrutura_organizacional')
    .eq('id', empresaId)
    .single();

  if (!empresa) {
    console.error('❌ Empresa não encontrada!');
    process.exit(1);
  }

  console.log(`✅ Empresa: ${empresa.nome}`);
  console.log(`📋 Estrutura: ${JSON.stringify(empresa.estrutura_organizacional).substring(0, 100)}...`);

  // 2. Verificar personas (todas as colunas relevantes)
  const { data: personas, error } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);

  console.log(`\n👥 Personas encontradas: ${personas?.length || 0}`);
  
  if (error) {
    console.error('❌ Erro:', error.message);
  }

  if (personas && personas.length > 0) {
    personas.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.full_name || p.nome_completo || 'SEM NOME'}`);
      console.log(`   - ID: ${p.id}`);
      console.log(`   - Code: ${p.persona_code}`);
      console.log(`   - Role: ${p.role || p.cargo || 'N/A'}`);
      console.log(`   - Email: ${p.email || 'N/A'}`);
      console.log(`   - Biography: ${p.biography ? 'SIM' : 'NÃO'}`);
      console.log(`   - Biography Structured: ${p.biography_structured ? 'SIM' : 'NÃO'}`);
      console.log(`   - Created: ${p.created_at}`);
    });
  } else {
    console.log('⚠️  Nenhuma persona encontrada para esta empresa');
    
    // Verificar se existem personas órfãs com persona_code que seria desta empresa
    const { data: orfas } = await supabase
      .from('personas')
      .select('id, full_name, persona_code, empresa_id')
      .ilike('persona_code', 'lifeway%')
      .limit(10);

    if (orfas && orfas.length > 0) {
      console.log('\n⚠️  PERSONAS ÓRFÃS ENCONTRADAS (persona_code começa com "lifeway"):');
      orfas.forEach(p => {
        console.log(`   - ${p.persona_code} (empresa_id: ${p.empresa_id})`);
      });
    }
  }

  // 3. Verificar tabelas relacionadas
  console.log('\n📊 TABELAS RELACIONADAS:');

  const { data: biografias } = await supabase
    .from('personas_biografias')
    .select('persona_id')
    .eq('empresa_id', empresaId);
  console.log(`   - personas_biografias: ${biografias?.length || 0}`);

  const { data: atribuicoes } = await supabase
    .from('personas_atribuicoes')
    .select('persona_id')
    .eq('empresa_id', empresaId);
  console.log(`   - personas_atribuicoes: ${atribuicoes?.length || 0}`);

  const { data: competencias } = await supabase
    .from('personas_competencias')
    .select('persona_id')
    .eq('empresa_id', empresaId);
  console.log(`   - personas_competencias: ${competencias?.length || 0}`);

  const { data: avatares } = await supabase
    .from('avatares_personas')
    .select('persona_id')
    .eq('empresa_id', empresaId);
  console.log(`   - avatares_personas: ${avatares?.length || 0}`);

  console.log('\n✅ Diagnóstico concluído');
}

diagnostico().catch(console.error);
