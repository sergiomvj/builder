#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verificarAtribuicoes() {
  const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
  
  // Ver atribuições existentes
  const { data: atribuicoes, error } = await supabase
    .from('personas_atribuicoes')
    .select('*')
    .eq('empresa_id', empresaId);

  // Ver total de personas
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);

  console.log('📊 STATUS DAS ATRIBUIÇÕES');
  console.log('========================');
  console.log(`Total personas: ${personas?.length || 0}`);
  console.log(`Total atribuições: ${atribuicoes?.length || 0}`);
  console.log(`Faltam: ${(personas?.length || 0) - (atribuicoes?.length || 0)}`);
  
  if (atribuicoes?.length > 0) {
    console.log('\n✅ Personas com atribuições:');
    atribuicoes.forEach((attr, i) => {
      console.log(`${i+1}. ${attr.departamento} - Nível ${attr.nivel_hierarquico}`);
    });
  }
}

verificarAtribuicoes().catch(console.error);