#!/usr/bin/env node
/**
 * 🔍 INVESTIGAR SCHEMA REAL DA TABELA PERSONAS_ATRIBUICOES
 * ========================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 INVESTIGANDO SCHEMA PERSONAS_ATRIBUICOES');
console.log('==========================================');

async function investigateSchema() {
  try {
    // 1. Verificar se a tabela existe
    const { data, error } = await supabase
      .from('personas_atribuicoes')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao acessar tabela:', error.message);
      
      // Tentar descobrir todas as tabelas
      console.log('\n📋 Tentando listar todas as tabelas...');
      
      const { data: tablesData, error: tablesError } = await supabase.rpc('get_tables');
      if (tablesError) {
        console.error('❌ Erro ao listar tabelas:', tablesError.message);
      } else {
        console.log('✅ Tabelas encontradas:', tablesData);
      }
      
      return;
    }

    console.log('✅ Tabela personas_atribuicoes existe');
    
    // 2. Se existir algum registro, mostrar estrutura
    if (data && data.length > 0) {
      console.log('📋 Exemplo de registro:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('🔍 Tabela vazia, tentando inserção de teste...');
      
      // 3. Tentar inserção simples para descobrir campos
      const { error: insertError } = await supabase
        .from('personas_atribuicoes')
        .insert({
          persona_id: 'test',
          empresa_id: 'test'
        });

      if (insertError) {
        console.log('💡 Erro de inserção revelou estrutura:');
        console.log(insertError.message);
      }
    }

    // 4. Tentar consulta em information_schema se possível
    console.log('\n🏗️ Tentando descobrir estrutura da tabela...');
    
    const { data: schemaData, error: schemaError } = await supabase.rpc('describe_table', {
      table_name: 'personas_atribuicoes'
    });
    
    if (schemaError) {
      console.log('⚠️ Não foi possível acessar schema:', schemaError.message);
    } else {
      console.log('🏗️ Estrutura da tabela:', schemaData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

investigateSchema();