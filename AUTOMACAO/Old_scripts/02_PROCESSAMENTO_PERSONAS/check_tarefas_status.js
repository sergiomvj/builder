#!/usr/bin/env node
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
    .limit(5);

console.log('🔍 STATUS DAS TAREFAS:');
console.log('======================');
data.forEach(p => {
    const temTarefas = p.ia_config?.tarefas_metas ? '✅ TEM TAREFAS' : '❌ SEM TAREFAS';
    console.log(`${p.full_name}: ${temTarefas}`);
});

console.log(`\nTotal verificado: ${data.length} personas`);