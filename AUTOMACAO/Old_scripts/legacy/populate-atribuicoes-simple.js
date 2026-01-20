#!/usr/bin/env node
/**
 * 🎯 POPULAR PERSONAS_ATRIBUICOES COM SCHEMA CORRETO
 * =================================================
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function popularCorreto() {
  const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
  
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);

  console.log(`📋 ${personas.length} personas encontradas`);
  
  // Mapear nível hierárquico por cargo
  const nivelPorCargo = {
    'CEO': 1,
    'CFO': 2,
    'CTO': 2,
    'HR Manager': 3,
    'Mkt Mgr': 3,
    'SDR Mgr': 3,
    'YT Manager': 4,
    'SDR Senior': 4,
    'Social Mkt': 4,
    'SDR Junior': 5,
    'SDR Analst': 5,
    'Asst Fin': 5,
    'Asst Admin': 5,
    'Asst RH': 5,
    'Asst Mkt': 5
  };

  let sucessos = 0;

  for (const persona of personas) {
    const nivel = nivelPorCargo[persona.role] || 5;
    
    const { error } = await supabase
      .from('personas_atribuicoes')
      .insert({
        persona_id: persona.id,
        empresa_id: empresaId,
        departamento: persona.department || 'Geral',
        nivel_hierarquico: nivel,
        responsabilidades: [
          `Executar atividades de ${persona.role}`,
          `Colaborar com equipe`,
          `Cumprir metas e objetivos`,
          `Reportar progresso`,
          `Manter qualidade do trabalho`
        ]
      });

    if (error) {
      console.log(`❌ ${persona.full_name}: ${error.message}`);
    } else {
      console.log(`✅ ${persona.full_name} - Nível ${nivel}`);
      sucessos++;
    }
  }

  console.log(`\n🎉 ${sucessos}/${personas.length} atribuições criadas!`);
  
  // Verificar resultado final
  const { data: result } = await supabase
    .from('personas_atribuicoes')
    .select('*')
    .eq('empresa_id', empresaId);

  console.log(`📊 Total na tabela: ${result?.length || 0} registros`);
}

popularCorreto().catch(console.error);