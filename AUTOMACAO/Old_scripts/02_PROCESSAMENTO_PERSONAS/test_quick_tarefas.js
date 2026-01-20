#!/usr/bin/env node
/**
 * Script simplificado para testar geração de tarefas para uma persona
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

console.log('⚡ TESTE RÁPIDO - GERAÇÃO DE TAREFAS');
console.log('====================================');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Templates simplificados para teste
const templates = {
    'Manager': {
        categoria: "Gestão de Equipe",
        tarefas: [
            {
                nome: "1:1s com Equipe",
                descricao: "Reuniões individuais para feedback",
                tipo: "semanal",
                prioridade: "alta"
            },
            {
                nome: "Sprint Planning", 
                descricao: "Planejamento de sprints",
                tipo: "quinzenal",
                prioridade: "alta"
            }
        ],
        metas: [
            {
                nome: "Produtividade da Equipe",
                descricao: "Aumentar produtividade em 15%",
                valor_meta: 15,
                unidade: "percentual"
            }
        ]
    },
    'Specialist': {
        categoria: "Execução Técnica",
        tarefas: [
            {
                nome: "Desenvolvimento",
                descricao: "Execução de tarefas técnicas",
                tipo: "diário",
                prioridade: "alta"
            },
            {
                nome: "Code Review",
                descricao: "Revisão de código",
                tipo: "diário", 
                prioridade: "alta"
            }
        ],
        metas: [
            {
                nome: "Qualidade de Entregas",
                descricao: "Manter qualidade acima de 95%",
                valor_meta: 95,
                unidade: "percentual"
            }
        ]
    }
};

function mapearRole(role) {
    if (role.includes('Mgr') || role.includes('Manager')) return 'Manager';
    return 'Specialist';
}

async function testeRapido() {
    try {
        // Buscar uma persona específica
        const { data: personas, error } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
            .limit(1);
        
        if (error || !personas?.length) {
            throw new Error(`Erro: ${error?.message}`);
        }
        
        const persona = personas[0];
        console.log(`👤 Processando: ${persona.full_name} (${persona.role})`);
        
        const templateKey = mapearRole(persona.role);
        const template = templates[templateKey];
        
        console.log(`🏷️ Template usado: ${templateKey}`);
        console.log(`📝 ${template.tarefas.length} tarefas, ${template.metas.length} metas`);
        
        const tarefasMetas = {
            categoria: template.categoria,
            tarefas: template.tarefas,
            metas: template.metas,
            template_usado: templateKey,
            generated_at: new Date().toISOString()
        };
        
        // Atualizar persona
        const currentIaConfig = persona.ia_config || {};
        const { error: updateError } = await supabase
            .from('personas')
            .update({
                ia_config: {
                    ...currentIaConfig,
                    tarefas_metas: tarefasMetas
                },
                updated_at: new Date().toISOString()
            })
            .eq('id', persona.id);
        
        if (updateError) {
            throw new Error(`Erro na atualização: ${updateError.message}`);
        }
        
        console.log('✅ Persona atualizada com sucesso!');
        
        // Verificar
        const { data: verificacao } = await supabase
            .from('personas')
            .select('ia_config')
            .eq('id', persona.id);
        
        if (verificacao?.[0]?.ia_config?.tarefas_metas) {
            console.log('🔍 Dados salvos corretamente');
            const dados = verificacao[0].ia_config.tarefas_metas;
            console.log(`📊 Categoria: ${dados.categoria}`);
            console.log(`⏰ Gerado em: ${dados.generated_at}`);
        }
        
        console.log('🎉 Teste concluído!');
        
    } catch (error) {
        console.error(`❌ Erro: ${error.message}`);
    }
}

await testeRapido();