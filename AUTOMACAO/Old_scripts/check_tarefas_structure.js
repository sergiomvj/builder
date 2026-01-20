#!/usr/bin/env node
/**
 * Verificar estrutura do ia_config e tarefas_metas
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const empresaId = '3c3bee15-b3a4-4442-89e9-5859c06e7575';

async function checkTarefas() {
  console.log('\n🔍 VERIFICANDO ESTRUTURA DO ia_config\n');

  // Buscar uma persona de exemplo
  const { data: personas } = await supabase
    .from('personas')
    .select('id, full_name, ia_config')
    .eq('empresa_id', empresaId)
    .limit(3);

  if (!personas || personas.length === 0) {
    console.log('❌ Nenhuma persona encontrada');
    return;
  }

  personas.forEach((p, i) => {
    console.log(`\n[${i + 1}] ${p.full_name}`);
    console.log(`   ID: ${p.id}`);
    
    if (!p.ia_config) {
      console.log('   ❌ ia_config = NULL');
      return;
    }

    console.log(`   ✅ ia_config existe`);
    console.log(`   Chaves: ${Object.keys(p.ia_config).join(', ')}`);

    if (p.ia_config.tarefas_metas) {
      console.log(`   ✅ tarefas_metas existe`);
      console.log(`   Tipo: ${typeof p.ia_config.tarefas_metas}`);
      
      if (typeof p.ia_config.tarefas_metas === 'object') {
        console.log(`   Chaves: ${Object.keys(p.ia_config.tarefas_metas).join(', ')}`);
        
        const tm = p.ia_config.tarefas_metas;
        if (tm.diarias) console.log(`   - Diárias: ${tm.diarias.length} tarefas`);
        if (tm.semanais) console.log(`   - Semanais: ${tm.semanais.length} tarefas`);
        if (tm.mensais) console.log(`   - Mensais: ${tm.mensais.length} tarefas`);
      }
    } else {
      console.log('   ❌ tarefas_metas NÃO EXISTE');
    }
  });

  // Verificar personas_competencias
  console.log('\n\n🔍 VERIFICANDO TABELA personas_competencias\n');

  const { data: competencias } = await supabase
    .from('personas_competencias')
    .select('persona_id, tarefas_diarias, tarefas_semanais, tarefas_mensais')
    .eq('empresa_id', empresaId)
    .limit(3);

  if (!competencias || competencias.length === 0) {
    console.log('❌ Nenhuma competência encontrada');
    return;
  }

  competencias.forEach((c, i) => {
    console.log(`\n[${i + 1}] Persona ID: ${c.persona_id}`);
    console.log(`   Diárias: ${c.tarefas_diarias?.length || 0}`);
    console.log(`   Semanais: ${c.tarefas_semanais?.length || 0}`);
    console.log(`   Mensais: ${c.tarefas_mensais?.length || 0}`);
    
    if (c.tarefas_diarias && c.tarefas_diarias.length > 0) {
      console.log(`   Exemplo diária: ${c.tarefas_diarias[0]}`);
    }
  });
}

checkTarefas().catch(console.error);
