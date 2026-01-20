#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateDatabase() {
  console.log('🔍 INVESTIGAÇÃO PROFUNDA DO BANCO DE DADOS');
  console.log('==========================================');
  
  const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17'; // ARVA Tech Solutions
  
  // 1. PERSONAS DA EMPRESA
  console.log('\n📊 PERSONAS DA ARVA TECH SOLUTIONS:');
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);
  
  if (personasError) {
    console.error('❌ Erro ao buscar personas:', personasError);
  } else {
    console.log(`✅ Encontradas ${personas.length} personas`);
    personas.forEach((p, i) => {
      console.log(`${i + 1}. ${p.nome} (${p.cargo}) - Status: ${p.status}`);
    });
  }
  
  // 2. TABELA BIOGRAFIAS
  console.log('\n📖 TABELA BIOGRAFIAS:');
  const { data: biografias, error: biografiasError } = await supabase
    .from('biografias')
    .select('*');
  
  if (biografiasError) {
    console.error('❌ Erro ao buscar biografias:', biografiasError);
  } else {
    console.log(`✅ Total de registros na tabela biografias: ${biografias.length}`);
    if (biografias.length > 0) {
      console.log('Primeiro registro:', {
        id: biografias[0].id,
        persona_id: biografias[0].persona_id,
        empresa_id: biografias[0].empresa_id,
        biografia_length: biografias[0].biografia?.length || 0
      });
    }
  }
  
  // 3. VERIFICAR TABELA ATRIBUICOES
  console.log('\n🎯 TABELA ATRIBUICOES:');
  const { data: atribuicoes, error: atribuicoesError } = await supabase
    .from('atribuicoes')
    .select('*');
  
  if (atribuicoesError) {
    console.error('❌ Erro ao buscar atribuições:', atribuicoesError);
  } else {
    console.log(`✅ Total de registros na tabela atribuicoes: ${atribuicoes.length}`);
    if (atribuicoes.length > 0) {
      console.log('Primeiro registro:', atribuicoes[0]);
    } else {
      console.log('⚠️ TABELA ATRIBUICOES ESTÁ VAZIA!');
    }
  }
  
  // 4. VERIFICAR SCHEMA DA TABELA ATRIBUICOES
  console.log('\n🔍 SCHEMA DA TABELA ATRIBUICOES:');
  try {
    const { data: schemaData, error: schemaError } = await supabase
      .from('atribuicoes')
      .select('*')
      .limit(1);
    
    if (schemaError && schemaError.code === '42P01') {
      console.log('❌ TABELA ATRIBUICOES NÃO EXISTE!');
    } else if (schemaError) {
      console.error('❌ Erro ao verificar schema:', schemaError);
    } else {
      console.log('✅ Tabela atribuicoes existe mas está vazia');
    }
  } catch (e) {
    console.error('❌ Erro crítico:', e);
  }
  
  // 5. VERIFICAR OUTRAS TABELAS RELACIONADAS
  console.log('\n🗄️ OUTRAS TABELAS DO SISTEMA:');
  
  const tabelas = [
    'avatares_personas',
    'personas_competencias', 
    'empresas_tech_specs',
    'empresas_knowledge_base',
    'empresas_workflows'
  ];
  
  for (const tabela of tabelas) {
    try {
      const { data, error } = await supabase
        .from(tabela)
        .select('*')
        .limit(5);
      
      if (error) {
        console.log(`❌ ${tabela}: ${error.message}`);
      } else {
        console.log(`✅ ${tabela}: ${data.length} registros`);
      }
    } catch (e) {
      console.log(`❌ ${tabela}: Erro crítico`);
    }
  }
  
  // 6. VERIFICAR SCRIPTS_STATUS DA EMPRESA
  console.log('\n⚙️ SCRIPTS STATUS DA ARVA:');
  const { data: empresa, error: empresaError } = await supabase
    .from('empresas')
    .select('scripts_status')
    .eq('id', empresaId)
    .single();
  
  if (empresaError) {
    console.error('❌ Erro ao buscar status:', empresaError);
  } else {
    console.log('Status dos scripts:', JSON.stringify(empresa.scripts_status, null, 2));
  }
}

investigateDatabase().catch(console.error);