#!/usr/bin/env node
/**
 * VERIFICAÇÃO FINAL COMPLETA
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🎯 VERIFICAÇÃO FINAL COMPLETA - ARVA TECH SOLUTIONS');
console.log('====================================================');

const { data } = await supabase
    .from('personas')
    .select('full_name, role, ia_config')
    .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
    .order('full_name');

let comTarefas = 0;
let comRAG = 0;
let comFluxos = 0;
let completasTotal = 0;

console.log('📊 STATUS POR PERSONA:');
console.log('=====================');

data.forEach((persona, index) => {
    const temTarefas = persona.ia_config?.tarefas_metas ? '✅' : '❌';
    const temRAG = persona.ia_config?.knowledge_base ? '✅' : '❌';
    const temFluxos = persona.ia_config?.fluxos_sdr ? '✅' : '❌';
    const completa = persona.ia_config?.tarefas_metas && persona.ia_config?.knowledge_base && persona.ia_config?.fluxos_sdr;
    
    console.log(`\n${index + 1}. ${persona.full_name} (${persona.role})`);
    console.log(`   📝 Tarefas: ${temTarefas}`);
    console.log(`   🧠 RAG: ${temRAG}`);
    console.log(`   🔄 Fluxos: ${temFluxos}`);
    console.log(`   🎯 Status: ${completa ? '✅ COMPLETA' : '⚠️ INCOMPLETA'}`);
    
    if (persona.ia_config?.tarefas_metas) comTarefas++;
    if (persona.ia_config?.knowledge_base) comRAG++;
    if (persona.ia_config?.fluxos_sdr) comFluxos++;
    if (completa) completasTotal++;
});

console.log(`\n🎯 RESUMO FINAL:`);
console.log(`===============`);
console.log(`👥 Total de personas: ${data.length}`);
console.log(`📝 Com tarefas: ${comTarefas}/${data.length} (${Math.round(comTarefas/data.length*100)}%)`);
console.log(`🧠 Com RAG: ${comRAG}/${data.length} (${Math.round(comRAG/data.length*100)}%)`);
console.log(`🔄 Com fluxos: ${comFluxos}/${data.length} (${Math.round(comFluxos/data.length*100)}%)`);
console.log(`🎯 Completas: ${completasTotal}/${data.length} (${Math.round(completasTotal/data.length*100)}%)`);

console.log(`\n🚀 STATUS FINAL DO SISTEMA:`);
console.log(`==========================`);
if (completasTotal === data.length) {
    console.log(`✅ SISTEMA 100% COMPLETO E FUNCIONAL! 🎉`);
    console.log(`📊 Todas as ${data.length} personas têm:`);
    console.log(`   - ✅ Tarefas e metas personalizadas`);
    console.log(`   - ✅ Knowledge base RAG específica`);
    console.log(`   - ✅ Fluxos de trabalho otimizados`);
    console.log(`\n🎯 O SISTEMA VCM ESTÁ PRONTO PARA PRODUÇÃO!`);
} else {
    console.log(`⚠️ Sistema ${Math.round(completasTotal/data.length*100)}% completo`);
    console.log(`❌ ${data.length - completasTotal} personas ainda precisam ser completadas`);
}

// Verificar estrutura de uma persona completa
if (completasTotal > 0) {
    const personaCompleta = data.find(p => p.ia_config?.tarefas_metas && p.ia_config?.knowledge_base && p.ia_config?.fluxos_sdr);
    
    console.log(`\n🔍 EXEMPLO DE ESTRUTURA COMPLETA:`);
    console.log(`=================================`);
    console.log(`Persona: ${personaCompleta.full_name}`);
    console.log(`Tarefas: ${personaCompleta.ia_config.tarefas_metas?.tarefas?.length || 0} tarefas`);
    console.log(`Metas: ${personaCompleta.ia_config.tarefas_metas?.metas?.length || 0} metas`);
    console.log(`Knowledge: ${personaCompleta.ia_config.knowledge_base?.knowledge_entries?.length || 0} entradas`);
    console.log(`Fluxos: ${personaCompleta.ia_config.fluxos_sdr?.fluxos?.length || 0} fluxos`);
}