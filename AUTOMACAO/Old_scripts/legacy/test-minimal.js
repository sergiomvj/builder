#!/usr/bin/env node
/**
 * 🎯 TESTE MINIMALISTA PARA DESCOBRIR SCHEMA
 * =========================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testeMinimo() {
  const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
  
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId)
    .limit(1);

  const persona = personas[0];
  console.log('🧪 Testando com:', persona.full_name);

  // Teste 1: Só campos obrigatórios mínimos
  console.log('\n1. Teste básico...');
  const { error: e1 } = await supabase
    .from('personas_atribuicoes')
    .insert({
      persona_id: persona.id,
      empresa_id: empresaId,
      departamento: persona.department || 'Geral',
      nivel_hierarquico: 3
    });

  if (e1) {
    console.log('❌ Erro teste 1:', e1.message);
  } else {
    console.log('✅ Teste 1 funcionou!');
    
    // Se funcionou, vamos popular todas
    console.log('\n2. Populando todas as personas...');
    
    // Limpar teste
    await supabase
      .from('personas_atribuicoes')
      .delete()
      .eq('persona_id', persona.id);
    
    // Popular todas
    const { data: todasPersonas } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresaId);

    const records = todasPersonas.map(p => ({
      persona_id: p.id,
      empresa_id: empresaId,
      departamento: p.department || 'Geral',
      nivel_hierarquico: p.role.includes('CEO') ? 1 : p.role.includes('Manager') ? 2 : 3
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('personas_atribuicoes')
      .insert(records)
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir todas:', insertError.message);
    } else {
      console.log(`✅ ${inserted.length} registros inseridos!`);
      
      console.log('\n📋 Primeiro registro criado:');
      console.log(JSON.stringify(inserted[0], null, 2));
    }
  }
}

testeMinimo().catch(console.error);