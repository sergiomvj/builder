#!/usr/bin/env node
/**
 * Script para verificar estrutura das tabelas personas_*
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

async function checkTables() {
    const tables = [
        'empresas',
        'personas', 
        'avatares_personas',
        'personas_rag',
        'personas_tarefas',
        'personas_fluxos'
    ];
    
    console.log('📊 VERIFICANDO TABELAS');
    console.log('======================');
    
    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                console.log(`❌ ${table}: ERRO - ${error.message}`);
            } else {
                console.log(`✅ ${table}: ${count} registros`);
            }
        } catch (error) {
            console.log(`❌ ${table}: ERRO - ${error.message}`);
        }
        
        // Pequena pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Verificar estrutura específica da personas_tarefas
    console.log('\n🔍 VERIFICANDO ESTRUTURA personas_tarefas');
    console.log('==========================================');
    
    try {
        const { data: sample, error } = await supabase
            .from('personas_tarefas')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log(`❌ Erro ao consultar personas_tarefas: ${error.message}`);
        } else {
            console.log('✅ Tabela personas_tarefas acessível');
            if (sample && sample.length > 0) {
                console.log('📋 Campos disponíveis:', Object.keys(sample[0]).join(', '));
            } else {
                console.log('📋 Tabela vazia, não é possível ver estrutura');
            }
        }
    } catch (error) {
        console.log(`❌ Erro ao verificar estrutura: ${error.message}`);
    }
}

await checkTables();