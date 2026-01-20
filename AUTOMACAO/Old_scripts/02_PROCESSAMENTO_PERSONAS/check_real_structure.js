#!/usr/bin/env node
/**
 * Script para verificar estrutura das tabelas que realmente existem
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

async function checkExistingTables() {
    console.log('🔍 VERIFICANDO TABELAS QUE REALMENTE EXISTEM');
    console.log('============================================');
    
    // Vamos testar essas que sabemos que existem
    const confirmedTables = ['empresas', 'personas', 'avatares_personas', 'personas_biografias'];
    
    for (const table of confirmedTables) {
        try {
            const { data: sample, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
                
            if (!error && sample) {
                console.log(`\n✅ TABELA: ${table.toUpperCase()}`);
                console.log('═'.repeat(table.length + 9));
                
                if (sample.length > 0) {
                    const fields = Object.keys(sample[0]);
                    console.log('📋 Campos:', fields.join(', '));
                    
                    // Mostrar tipos de dados básicos
                    const sampleData = sample[0];
                    console.log('📊 Tipos:');
                    fields.forEach(field => {
                        const value = sampleData[field];
                        const type = Array.isArray(value) ? 'array' : typeof value;
                        console.log(`   ${field}: ${type}`);
                    });
                } else {
                    console.log('📋 Tabela vazia');
                }
                
                // Contar registros
                const { count } = await supabase
                    .from(table)
                    .select('*', { count: 'exact', head: true });
                console.log(`📈 Total de registros: ${count}`);
                
            } else {
                console.log(`❌ ${table}: ERRO - ${error?.message}`);
            }
        } catch (error) {
            console.log(`❌ ${table}: ERRO - ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Verificar se podemos criar na personas
    console.log(`\n🧪 VERIFICANDO SE PODEMOS ADICIONAR CAMPOS À personas`);
    console.log('===================================================');
    
    const { data: personas, error } = await supabase
        .from('personas')
        .select('*')
        .limit(1);
        
    if (personas && personas.length > 0) {
        console.log('✅ Tabela personas acessível para leitura');
        console.log('📋 Campos atuais:', Object.keys(personas[0]).join(', '));
    }
}

await checkExistingTables();