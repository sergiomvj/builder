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

console.log('🔍 DESCOBRINDO SCHEMA PERSONAS_ATRIBUICOES');
console.log('==========================================');

async function investigateAtribuicoes() {
  try {
    console.log('\n1. Testando acesso à tabela personas_atribuicoes...');
    
    const { data, error } = await supabase
      .from('personas_atribuicoes')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Erro:', error.message);
      
      // Se tabela não existe ou tem problemas, vamos descobrir que campos existem
      console.log('\n2. Tentando inserção de teste para descobrir campos...');
      
      // Teste com campos básicos
      const { error: insertError } = await supabase
        .from('personas_atribuicoes')
        .insert({
          persona_id: 'test',
          empresa_id: 'test'
        });

      if (insertError) {
        console.log('💡 Erro de inserção (mostra campos esperados):', insertError.message);
      }
    } else {
      console.log('✅ Tabela acessível, registros encontrados:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('\n📋 Estrutura do primeiro registro:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('📋 Tabela vazia, vamos tentar descobrir campos...');
      }
    }
    
    // 3. Vamos verificar se ARVA tem personas para criar atribuições
    console.log('\n3. Verificando personas da ARVA...');
    const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
    
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresaId)
      .limit(5);

    if (personasError) {
      console.log('❌ Erro ao buscar personas:', personasError.message);
    } else {
      console.log(`✅ ${personas.length} personas encontradas na ARVA`);
      personas.forEach(p => {
        console.log(`  - ${p.full_name} (${p.role}) - ${p.department}`);
      });
    }

    // 4. Vamos ver se existe alguma competência com atribuições
    console.log('\n4. Verificando competências existentes...');
    
    const { data: competencias, error: compError } = await supabase
      .from('competencias')
      .select('*')
      .limit(3);

    if (compError) {
      console.log('❌ Erro ao buscar competências:', compError.message);
    } else {
      console.log(`✅ ${competencias?.length || 0} competências encontradas`);
      if (competencias && competencias.length > 0) {
        console.log('📋 Exemplo de competência:');
        console.log(JSON.stringify(competencias[0], null, 2));
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

investigateAtribuicoes();