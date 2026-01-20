#!/usr/bin/env node
/**
 * Script para processar tarefas uma persona por vez (robusto)
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

console.log('⚡ PROCESSAMENTO ROBUSTO DE TAREFAS');
console.log('===================================');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Templates simplificados
const templates = {
    'CEO': {
        categoria: "Liderança Estratégica",
        tarefas: [
            { nome: "Revisão Estratégica", tipo: "semanal", prioridade: "alta" },
            { nome: "Board Meetings", tipo: "mensal", prioridade: "crítica" }
        ],
        metas: [
            { nome: "Crescimento Receita", valor_meta: 25, unidade: "%" }
        ]
    },
    'CTO': {
        categoria: "Tecnologia",
        tarefas: [
            { nome: "Arquitetura Review", tipo: "quinzenal", prioridade: "alta" },
            { nome: "Tech Meeting", tipo: "semanal", prioridade: "alta" }
        ],
        metas: [
            { nome: "Uptime", valor_meta: 99.5, unidade: "%" }
        ]
    },
    'CFO': {
        categoria: "Financeiro",
        tarefas: [
            { nome: "Análise Financeira", tipo: "mensal", prioridade: "crítica" },
            { nome: "Cash Flow", tipo: "semanal", prioridade: "alta" }
        ],
        metas: [
            { nome: "Redução Custos", valor_meta: 15, unidade: "%" }
        ]
    },
    'Manager': {
        categoria: "Gestão",
        tarefas: [
            { nome: "1:1s", tipo: "semanal", prioridade: "alta" },
            { nome: "Sprint Planning", tipo: "quinzenal", prioridade: "alta" }
        ],
        metas: [
            { nome: "Produtividade", valor_meta: 15, unidade: "%" }
        ]
    },
    'Specialist': {
        categoria: "Execução",
        tarefas: [
            { nome: "Desenvolvimento", tipo: "diário", prioridade: "alta" },
            { nome: "Code Review", tipo: "diário", prioridade: "alta" }
        ],
        metas: [
            { nome: "Qualidade", valor_meta: 95, unidade: "%" }
        ]
    },
    'Assistant': {
        categoria: "Suporte",
        tarefas: [
            { nome: "Gestão Agenda", tipo: "diário", prioridade: "alta" },
            { nome: "Relatórios", tipo: "semanal", prioridade: "média" }
        ],
        metas: [
            { nome: "Eficiência", valor_meta: 30, unidade: "% redução" }
        ]
    }
};

function mapearRole(role) {
    const roleUpper = role.toUpperCase();
    
    if (roleUpper.includes('CEO')) return 'CEO';
    if (roleUpper.includes('CTO')) return 'CTO';
    if (roleUpper.includes('CFO')) return 'CFO';
    if (roleUpper.includes('MANAGER') || roleUpper.includes('MGR')) return 'Manager';
    if (roleUpper.includes('ASSISTANT') || roleUpper.includes('ASST')) return 'Assistant';
    
    return 'Specialist';
}

async function processarTodasPersonas() {
    try {
        // Buscar personas sem tarefas
        const { data: personas, error } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
            .eq('status', 'active');

        if (error) {
            throw new Error(`Erro: ${error.message}`);
        }

        console.log(`👥 Total de personas: ${personas.length}`);
        
        // Filtrar personas sem tarefas
        const personasSemTarefas = personas.filter(p => !p.ia_config?.tarefas_metas);
        console.log(`📝 Personas sem tarefas: ${personasSemTarefas.length}`);
        
        let processadas = 0;
        let errors = 0;

        for (const persona of personasSemTarefas) {
            try {
                console.log(`\n⚙️ Processando: ${persona.full_name} (${persona.role})`);
                
                const templateKey = mapearRole(persona.role);
                const template = templates[templateKey];
                
                const tarefasMetas = {
                    categoria: template.categoria,
                    tarefas: template.tarefas.map(t => ({
                        ...t,
                        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
                    })),
                    metas: template.metas.map(m => ({
                        ...m,
                        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        valor_atual: 0
                    })),
                    template_usado: templateKey,
                    generated_at: new Date().toISOString()
                };

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
                    console.error(`❌ Erro: ${updateError.message}`);
                    errors++;
                } else {
                    console.log(`✅ Sucesso: ${template.tarefas.length} tarefas, ${template.metas.length} metas`);
                    processadas++;
                }

                // Pausa para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (personaError) {
                console.error(`❌ Erro processando ${persona.full_name}: ${personaError.message}`);
                errors++;
            }
        }

        console.log(`\n📊 RESULTADO FINAL:`);
        console.log(`===================`);
        console.log(`✅ Processadas: ${processadas}`);
        console.log(`❌ Erros: ${errors}`);
        console.log(`📈 Total com tarefas agora: ${personas.length - personasSemTarefas.length + processadas}`);
        
    } catch (error) {
        console.error(`❌ Erro fatal: ${error.message}`);
    }
}

await processarTodasPersonas();