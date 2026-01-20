#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverRealSchema() {
  console.log('🔍 DESCOBRINDO SCHEMA REAL DO BANCO');
  console.log('==================================');
  
  // Testar tabelas que podem existir
  const possibleTables = [
    'personas',
    'empresas', 
    'personas_biografias',
    'personas_atribuicoes',
    'personas_competencias',
    'avatares_personas',
    'biografias',
    'atribuicoes',
    'competencias',
    'tech_specs',
    'knowledge_base',
    'workflows',
    'empresas_tech_specs',
    'empresas_knowledge_base', 
    'empresas_workflows'
  ];
  
  const existingTables = [];
  
  for (const table of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        existingTables.push(table);
        console.log(`✅ ${table}: EXISTE`);
      } else {
        console.log(`❌ ${table}: ${error.code}`);
      }
    } catch (e) {
      console.log(`❌ ${table}: ERRO`);
    }
  }
  
  console.log('\n📋 TABELAS QUE REALMENTE EXISTEM:');
  existingTables.forEach(table => {
    console.log(`- ${table}`);
  });
  
  // Verificar personas com mais detalhes
  console.log('\n👤 DETALHES DAS PERSONAS:');
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
    .limit(3);
  
  if (personas && personas.length > 0) {
    console.log('Exemplo de persona:');
    console.log(JSON.stringify(personas[0], null, 2));
  }
}

discoverRealSchema().catch(console.error);