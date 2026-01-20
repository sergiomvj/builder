#!/usr/bin/env node
/**
 * 🧠 SCRIPT RAG ROBUSTO
 * =====================
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

console.log('🧠 SCRIPT RAG ROBUSTO');
console.log('====================');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Templates simplificados de knowledge base
const knowledgeTemplates = {
    'CEO': {
        categoria: "Liderança Executiva",
        knowledge: [
            {
                titulo: "Strategic Leadership Framework",
                conteudo: "Metodologias para liderança estratégica, visão corporativa e tomada de decisões executivas",
                tipo: "framework",
                relevancia: "crítica"
            },
            {
                titulo: "Executive KPIs Dashboard", 
                conteudo: "KPIs executivos: receita, EBITDA, market share, customer metrics",
                tipo: "métricas",
                relevancia: "alta"
            }
        ]
    },
    'CTO': {
        categoria: "Tecnologia",
        knowledge: [
            {
                titulo: "Technical Architecture",
                conteudo: "Best practices para arquitetura de sistemas, scalabilidade e tech stack",
                tipo: "guidelines",
                relevancia: "crítica"
            },
            {
                titulo: "DevOps Excellence",
                conteudo: "CI/CD, monitoring, automated testing e deployment strategies",
                tipo: "processo",
                relevancia: "alta"
            }
        ]
    },
    'CFO': {
        categoria: "Financeiro",
        knowledge: [
            {
                titulo: "Financial Planning & Analysis",
                conteudo: "Budgeting, forecasting, variance analysis e financial modeling",
                tipo: "metodologia",
                relevancia: "crítica"
            },
            {
                titulo: "Cash Flow Management",
                conteudo: "Working capital optimization e liquidity management",
                tipo: "estratégia", 
                relevancia: "alta"
            }
        ]
    },
    'Manager': {
        categoria: "Gestão",
        knowledge: [
            {
                titulo: "People Management",
                conteudo: "Team leadership, performance management e development strategies",
                tipo: "best_practices",
                relevancia: "alta"
            },
            {
                titulo: "Agile Methodologies",
                conteudo: "Scrum, sprint planning, backlog management e team productivity",
                tipo: "metodologia",
                relevancia: "alta"
            }
        ]
    },
    'Specialist': {
        categoria: "Execução",
        knowledge: [
            {
                titulo: "Technical Excellence",
                conteudo: "Coding standards, design patterns, testing strategies",
                tipo: "best_practices", 
                relevancia: "alta"
            },
            {
                titulo: "Quality Assurance",
                conteudo: "QA methodologies, testing frameworks e quality metrics",
                tipo: "framework",
                relevancia: "alta"
            }
        ]
    },
    'Assistant': {
        categoria: "Suporte",
        knowledge: [
            {
                titulo: "Executive Support",
                conteudo: "Calendar management, meeting coordination, communication protocols",
                tipo: "best_practices",
                relevancia: "alta"
            },
            {
                titulo: "Office Management",
                conteudo: "Administrative efficiency, document management, office organization",
                tipo: "sistema",
                relevancia: "média"
            }
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

async function processarRAGRobusto() {
    try {
        // Buscar personas
        const { data: personas, error } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
            .eq('status', 'active');

        if (error) {
            throw new Error(`Erro: ${error.message}`);
        }

        console.log(`👥 Total de personas: ${personas.length}`);
        
        // Filtrar personas sem knowledge base
        const personasSemRAG = personas.filter(p => !p.ia_config?.knowledge_base);
        console.log(`🧠 Personas sem RAG: ${personasSemRAG.length}`);
        
        let processadas = 0;
        let errors = 0;

        for (const persona of personasSemRAG) {
            try {
                console.log(`\n🧠 Processando: ${persona.full_name} (${persona.role})`);
                
                const templateKey = mapearRole(persona.role);
                const template = knowledgeTemplates[templateKey];
                
                const knowledgeData = {
                    categoria: template.categoria,
                    persona_specialty: persona.specialty,
                    knowledge_entries: template.knowledge.map(k => ({
                        ...k,
                        id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        persona_id: persona.id,
                        status: 'active',
                        created_at: new Date().toISOString()
                    })),
                    contexto: {
                        department: persona.department,
                        experience_years: persona.experiencia_anos,
                        languages: persona.idiomas || []
                    },
                    template_usado: templateKey,
                    generated_at: new Date().toISOString()
                };

                const currentIaConfig = persona.ia_config || {};
                const { error: updateError } = await supabase
                    .from('personas')
                    .update({
                        ia_config: {
                            ...currentIaConfig,
                            knowledge_base: knowledgeData
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', persona.id);

                if (updateError) {
                    console.error(`❌ Erro: ${updateError.message}`);
                    errors++;
                } else {
                    console.log(`✅ Sucesso: ${template.knowledge.length} entradas de conhecimento`);
                    processadas++;
                }

                // Pausa para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 1500));

            } catch (personaError) {
                console.error(`❌ Erro processando ${persona.full_name}: ${personaError.message}`);
                errors++;
            }
        }

        console.log(`\n📊 RESULTADO FINAL RAG:`);
        console.log(`======================`);
        console.log(`✅ Processadas: ${processadas}`);
        console.log(`❌ Erros: ${errors}`);
        console.log(`📈 Total com RAG agora: ${personas.length - personasSemRAG.length + processadas}`);
        
    } catch (error) {
        console.error(`❌ Erro fatal: ${error.message}`);
    }
}

await processarRAGRobusto();