#!/usr/bin/env node
/**
 * Script debug para verificar processamento de tarefas
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

console.log('🔍 DEBUG - PROCESSAMENTO DE TAREFAS');
console.log('====================================');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugTarefas() {
    try {
        // Buscar personas
        const { data: personas, error } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
            .eq('status', 'active');

        if (error) {
            throw new Error(`Erro ao buscar personas: ${error.message}`);
        }

        console.log(`👥 Encontradas ${personas.length} personas ativas`);
        
        // Testar uma persona específica que não tem tarefas
        const personasSemTarefas = personas.filter(p => !p.ia_config?.tarefas_metas);
        
        if (personasSemTarefas.length > 0) {
            const persona = personasSemTarefas[0];
            console.log(`\n🧪 Testando com: ${persona.full_name} (${persona.role})`);
            
            // Template simples para teste
            const tarefasSimples = {
                tarefas: [
                    {
                        nome: "Tarefa de Teste Debug",
                        descricao: "Teste de inserção automática",
                        tipo: "teste"
                    }
                ],
                gerado_em: new Date().toISOString(),
                debug_mode: true
            };
            
            console.log('📝 Tentando atualizar persona...');
            
            const currentIaConfig = persona.ia_config || {};
            const updateData = {
                ia_config: {
                    ...currentIaConfig,
                    tarefas_metas: tarefasSimples
                },
                updated_at: new Date().toISOString()
            };
            
            const { data: updated, error: updateError } = await supabase
                .from('personas')
                .update(updateData)
                .eq('id', persona.id)
                .select();
            
            if (updateError) {
                console.error(`❌ Erro na atualização:`, updateError);
            } else {
                console.log('✅ Atualização bem-sucedida!');
                
                // Verificar se foi salvo
                const { data: verificacao } = await supabase
                    .from('personas')
                    .select('ia_config')
                    .eq('id', persona.id);
                
                if (verificacao?.[0]?.ia_config?.tarefas_metas) {
                    console.log('🔍 Dados foram salvos corretamente');
                } else {
                    console.log('⚠️ Dados não foram salvos');
                }
            }
        }
        
        console.log('\n📊 Status atual das personas:');
        personas.forEach(p => {
            const status = p.ia_config?.tarefas_metas ? '✅' : '❌';
            console.log(`${status} ${p.full_name} (${p.role})`);
        });
        
    } catch (error) {
        console.error(`❌ Erro: ${error.message}`);
    }
}

await debugTarefas();