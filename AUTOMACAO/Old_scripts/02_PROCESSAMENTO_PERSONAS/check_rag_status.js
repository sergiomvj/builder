#!/usr/bin/env node
/**
 * Verificar status do RAG Knowledge Base
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

const { data } = await supabase
    .from('personas')
    .select('full_name, ia_config')
    .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
    .limit(10);

console.log('🧠 STATUS DO RAG KNOWLEDGE BASE:');
console.log('================================');

let comRAG = 0;
let comTarefas = 0;

data.forEach(p => {
    const temRAG = p.ia_config?.knowledge_base ? '✅ TEM RAG' : '❌ SEM RAG';
    const temTarefas = p.ia_config?.tarefas_metas ? '✅ TEM TAREFAS' : '❌ SEM TAREFAS';
    
    console.log(`${p.full_name}:`);
    console.log(`   RAG: ${temRAG}`);
    console.log(`   Tarefas: ${temTarefas}`);
    
    if (p.ia_config?.knowledge_base) comRAG++;
    if (p.ia_config?.tarefas_metas) comTarefas++;
});

console.log(`\n📊 RESUMO:`);
console.log(`=========`);
console.log(`📚 Com RAG: ${comRAG}/10`);
console.log(`📝 Com Tarefas: ${comTarefas}/10`);
console.log(`🔄 Status RAG: ${comRAG === 10 ? 'COMPLETO' : 'EM ANDAMENTO'}`);
console.log(`✅ Status Tarefas: ${comTarefas === 10 ? 'COMPLETO' : 'INCOMPLETO'}`);