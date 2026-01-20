#!/usr/bin/env node
/**
 * Script para verificar todas as tabelas disponíveis
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function listAllTables() {
    console.log('📋 LISTANDO TODAS AS TABELAS DISPONÍVEIS');
    console.log('========================================');
    
    // Vamos tentar algumas queries para descobrir as tabelas
    const possibleTables = [
        'empresas',
        'personas', 
        'avatares_personas',
        'personas_rag',
        'personas_tarefas',
        'personas_fluxos',
        'personas_fluxos_sdr',
        'personas_competencias',
        'personas_biografias',
        'personas_specs',
        'personas_knowledge',
        'personas_tasks'
    ];
    
    const existingTables = [];
    
    for (const table of possibleTables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (!error) {
                existingTables.push({ name: table, count: count || 0 });
                console.log(`✅ ${table}: ${count || 0} registros`);
            }
        } catch (error) {
            // Tabela não existe, continuar
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n📊 TOTAL DE TABELAS ENCONTRADAS: ${existingTables.length}`);
    console.log('==========================================');
    
    return existingTables;
}

const tables = await listAllTables();

// Se existir uma tabela personas, vamos ver sua estrutura
if (tables.find(t => t.name === 'personas')) {
    console.log('\n🔍 ESTRUTURA DA TABELA PERSONAS:');
    console.log('================================');
    
    const { data: sample, error } = await supabase
        .from('personas')
        .select('*')
        .limit(1);
        
    if (sample && sample.length > 0) {
        console.log('📋 Campos:', Object.keys(sample[0]).join(', '));
    }
}