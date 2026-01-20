#!/usr/bin/env node
/**
 * Script de teste simples para adicionar tarefas a uma persona
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

console.log('🧪 TESTE SIMPLES DE TAREFAS');
console.log('===========================');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testeSimples() {
    try {
        // Buscar uma persona para teste
        const { data: personas, error } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
            .limit(1);
        
        if (error || !personas?.length) {
            throw new Error(`Erro ao buscar persona: ${error?.message}`);
        }
        
        const persona = personas[0];
        console.log(`👤 Testando com: ${persona.full_name}`);
        
        // Criar dados de tarefas simples
        const tarefasSimples = {
            tarefas: [
                {
                    nome: "Tarefa de Teste",
                    descricao: "Esta é uma tarefa de teste",
                    tipo: "teste",
                    prioridade: "baixa"
                }
            ],
            metas: [
                {
                    nome: "Meta de Teste", 
                    descricao: "Esta é uma meta de teste",
                    valor_meta: 100,
                    unidade: "percentual"
                }
            ],
            gerado_em: new Date().toISOString()
        };
        
        console.log('📝 Atualizando persona com tarefas...');
        
        // Tentar atualizar usando ia_config
        const { data: updated, error: updateError } = await supabase
            .from('personas')
            .update({ 
                ia_config: { 
                    ...persona.ia_config || {},
                    tarefas_metas: tarefasSimples
                },
                updated_at: new Date().toISOString()
            })
            .eq('id', persona.id)
            .select();
        
        if (updateError) {
            console.error('❌ Erro na atualização:', updateError.message);
            console.error('💾 Detalhes:', updateError);
        } else {
            console.log('✅ Persona atualizada com sucesso!');
            console.log(`📊 Resultado:`, updated[0]?.tarefas_metas ? 'Dados salvos' : 'Campo não encontrado');
            
            // Verificar se foi salvo
            const { data: verificacao } = await supabase
                .from('personas')
                .select('id, full_name, ia_config')
                .eq('id', persona.id);
                
            if (verificacao?.[0]?.ia_config?.tarefas_metas) {
                console.log('🔍 Verificação: Dados foram salvos corretamente');
                console.log('📋 Conteúdo:', JSON.stringify(verificacao[0].ia_config.tarefas_metas, null, 2));
            } else {
                console.log('⚠️ Verificação: Dados não foram salvos');
            }
        }
        
    } catch (error) {
        console.error(`❌ Erro: ${error.message}`);
    }
}

await testeSimples();