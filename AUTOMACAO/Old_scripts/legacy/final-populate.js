#!/usr/bin/env node
/**
 * 🎯 POPULAR PERSONAS_ATRIBUICOES - VERSÃO FINAL
 * =============================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function popularFinal() {
  const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
  
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);

  console.log(`🎯 Criando atribuições para ${personas.length} personas...`);

  const records = personas.map(p => ({
    persona_id: p.id,
    empresa_id: empresaId,
    departamento: p.department || 'Geral',
    nivel_hierarquico: p.role.includes('CEO') ? 1 : p.role.includes('CFO') || p.role.includes('CTO') ? 2 : p.role.includes('Manager') ? 3 : p.role.includes('Senior') ? 4 : 5,
    email_corporativo: p.email || `${p.full_name.toLowerCase().replace(/\s+/g, '.')}@arvabot.com`
  }));

  const { data: inserted, error } = await supabase
    .from('personas_atribuicoes')
    .insert(records)
    .select();

  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log(`✅ ${inserted.length} atribuições criadas com sucesso!`);
    
    console.log('\n📋 Estrutura da tabela descoberta:');
    if (inserted[0]) {
      console.log(JSON.stringify(inserted[0], null, 2));
    }
    
    console.log('\n🎉 TABELA PERSONAS_ATRIBUICOES POPULADA!');
    console.log(`📊 Total de registros: ${inserted.length}`);
  }
}

popularFinal().catch(console.error);