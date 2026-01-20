#!/usr/bin/env node
/**
 * 🎯 SCRIPT 05 - GERAÇÃO COMPLETA DE TAREFAS E METAS
 * ===================================================
 * 
 * Versão otimizada que processa todas as personas da empresa
 * 
 * @version 3.0.0
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🎯 SCRIPT 05 - GERAÇÃO COMPLETA DE TAREFAS E METAS');
console.log('===================================================');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Templates completos de tarefas e metas
const templates = {
    'CEO': {
        categoria: "Liderança Estratégica e Visão Empresarial",
        tarefas: [
            {
                nome: "Revisão de Performance Estratégica",
                descricao: "Análise semanal de KPIs estratégicos e alinhamento com objetivos anuais",
                tipo: "semanal",
                prioridade: "alta",
                tempo_estimado: "2h",
                frequencia: "toda segunda-feira"
            },
            {
                nome: "Planejamento Estratégico Trimestral",
                descricao: "Definição de objetivos e estratégias para próximo trimestre",
                tipo: "trimestral", 
                prioridade: "crítica",
                tempo_estimado: "8h",
                frequencia: "último mês do trimestre"
            },
            {
                nome: "Reuniões com Board e Investidores",
                descricao: "Apresentações executivas e alinhamento estratégico com stakeholders",
                tipo: "mensal",
                prioridade: "alta",
                tempo_estimado: "4h",
                frequencia: "primeira semana do mês"
            }
        ],
        metas: [
            {
                nome: "Crescimento da Receita",
                descricao: "Aumentar receita anual em 25%",
                tipo: "financeira",
                prazo: "12 meses",
                valor_meta: 25,
                unidade: "percentual"
            },
            {
                nome: "Expansão de Mercado",
                descricao: "Entrar em 3 novos mercados/segmentos",
                tipo: "crescimento",
                prazo: "18 meses",
                valor_meta: 3,
                unidade: "mercados"
            }
        ]
    },
    'CTO': {
        categoria: "Inovação Tecnológica e Arquitetura",
        tarefas: [
            {
                nome: "Revisão de Arquitetura Técnica",
                descricao: "Análise e otimização da arquitetura de sistemas",
                tipo: "quinzenal",
                prioridade: "alta",
                tempo_estimado: "4h",
                frequencia: "a cada 2 semanas"
            },
            {
                nome: "Tech Leadership Meeting",
                descricao: "Reunião com líderes técnicos para alinhamento e roadmap",
                tipo: "semanal",
                prioridade: "alta",
                tempo_estimado: "2h",
                frequencia: "toda terça-feira"
            },
            {
                nome: "Avaliação de Tecnologias Emergentes",
                descricao: "Pesquisa e avaliação de novas tecnologias para adoção",
                tipo: "mensal",
                prioridade: "média",
                tempo_estimado: "6h",
                frequencia: "primeira semana do mês"
            }
        ],
        metas: [
            {
                nome: "Redução de Downtime",
                descricao: "Reduzir downtime dos sistemas em 50%",
                tipo: "operacional",
                prazo: "6 meses",
                valor_meta: 50,
                unidade: "percentual_reducao"
            },
            {
                nome: "Modernização da Stack",
                descricao: "Migrar 80% dos sistemas legacy para tecnologias modernas",
                tipo: "tecnologia",
                prazo: "12 meses",
                valor_meta: 80,
                unidade: "percentual"
            }
        ]
    },
    'CFO': {
        categoria: "Gestão Financeira e Controle",
        tarefas: [
            {
                nome: "Análise Financeira Mensal",
                descricao: "Consolidação e análise de resultados financeiros mensais",
                tipo: "mensal",
                prioridade: "crítica", 
                tempo_estimado: "6h",
                frequencia: "primeiros 5 dias do mês"
            },
            {
                nome: "Budget Planning e Forecasting",
                descricao: "Planejamento orçamentário e projeções financeiras trimestrais",
                tipo: "trimestral",
                prioridade: "alta",
                tempo_estimado: "8h",
                frequencia: "último mês do trimestre"
            },
            {
                nome: "Cash Flow Management",
                descricao: "Gestão e monitoramento do fluxo de caixa semanal",
                tipo: "semanal",
                prioridade: "alta",
                tempo_estimado: "2h",
                frequencia: "toda sexta-feira"
            }
        ],
        metas: [
            {
                nome: "Otimização de Custos",
                descricao: "Reduzir custos operacionais em 15%",
                tipo: "financeira",
                prazo: "12 meses",
                valor_meta: 15,
                unidade: "percentual_reducao"
            },
            {
                nome: "Melhoria do Cash Flow",
                descricao: "Reduzir tempo de recebimento em 30 dias",
                tipo: "financeira",
                prazo: "6 meses",
                valor_meta: 30,
                unidade: "dias_reducao"
            }
        ]
    },
    'Manager': {
        categoria: "Gestão de Equipe e Projetos",
        tarefas: [
            {
                nome: "1:1s com Equipe",
                descricao: "Reuniões individuais para desenvolvimento e feedback",
                tipo: "semanal",
                prioridade: "alta",
                tempo_estimado: "1h por pessoa",
                frequencia: "semanalmente por pessoa"
            },
            {
                nome: "Sprint Planning",
                descricao: "Planejamento de sprints e projetos da equipe",
                tipo: "quinzenal",
                prioridade: "alta",
                tempo_estimado: "2h",
                frequencia: "início de cada sprint"
            },
            {
                nome: "Performance Review",
                descricao: "Avaliação de performance e desenvolvimento da equipe",
                tipo: "mensal",
                prioridade: "média",
                tempo_estimado: "4h",
                frequencia: "última semana do mês"
            }
        ],
        metas: [
            {
                nome: "Produtividade da Equipe",
                descricao: "Aumentar produtividade da equipe em 15%",
                tipo: "gestão",
                prazo: "6 meses",
                valor_meta: 15,
                unidade: "percentual_aumento"
            },
            {
                nome: "Retenção de Talentos",
                descricao: "Manter turnover abaixo de 5%",
                tipo: "gestão",
                prazo: "12 meses",
                valor_meta: 5,
                unidade: "percentual_max"
            }
        ]
    },
    'Specialist': {
        categoria: "Execução Técnica e Expertise",
        tarefas: [
            {
                nome: "Desenvolvimento e Entregas",
                descricao: "Execução de tarefas técnicas específicas da área",
                tipo: "diário",
                prioridade: "alta",
                tempo_estimado: "6-8h",
                frequencia: "diariamente"
            },
            {
                nome: "Code Review e Qualidade",
                descricao: "Revisão de código e garantia de qualidade",
                tipo: "diário",
                prioridade: "alta",
                tempo_estimado: "1-2h",
                frequencia: "diariamente"
            },
            {
                nome: "Atualização Técnica",
                descricao: "Estudo e atualização em tecnologias da área",
                tipo: "semanal",
                prioridade: "média",
                tempo_estimado: "2h",
                frequencia: "sexta-feira tarde"
            }
        ],
        metas: [
            {
                nome: "Qualidade de Entregas",
                descricao: "Manter qualidade de entregas acima de 95%",
                tipo: "qualidade",
                prazo: "contínuo",
                valor_meta: 95,
                unidade: "percentual"
            },
            {
                nome: "Velocidade de Desenvolvimento",
                descricao: "Aumentar velocity de desenvolvimento em 20%",
                tipo: "performance",
                prazo: "3 meses",
                valor_meta: 20,
                unidade: "percentual_aumento"
            }
        ]
    },
    'Assistant': {
        categoria: "Suporte e Eficiência Administrativa",
        tarefas: [
            {
                nome: "Gestão de Agenda",
                descricao: "Organização de agenda e comunicações executivas",
                tipo: "diário",
                prioridade: "alta",
                tempo_estimado: "2h",
                frequencia: "início e fim do dia"
            },
            {
                nome: "Preparação de Reuniões",
                descricao: "Preparação de materiais e logística de reuniões",
                tipo: "conforme_demanda",
                prioridade: "alta",
                tempo_estimado: "1h por reunião",
                frequencia: "conforme agenda"
            },
            {
                nome: "Relatórios Executivos",
                descricao: "Compilação de relatórios semanais para executivos",
                tipo: "semanal",
                prioridade: "média",
                tempo_estimado: "3h",
                frequencia: "final da semana"
            }
        ],
        metas: [
            {
                nome: "Eficiência de Suporte",
                descricao: "Reduzir tempo de resposta em 30%",
                tipo: "eficiência",
                prazo: "3 meses",
                valor_meta: 30,
                unidade: "percentual_reducao"
            },
            {
                nome: "Satisfação do Executivo",
                descricao: "Manter satisfação do executivo acima de 90%",
                tipo: "qualidade",
                prazo: "contínuo",
                valor_meta: 90,
                unidade: "percentual"
            }
        ]
    }
};

function mapearRoleParaTemplate(role) {
    const roleUpper = role.toUpperCase();
    
    if (roleUpper.includes('CEO') || roleUpper.includes('CHIEF EXECUTIVE')) return 'CEO';
    if (roleUpper.includes('CTO') || roleUpper.includes('CHIEF TECHNOLOGY')) return 'CTO';
    if (roleUpper.includes('CFO') || roleUpper.includes('CHIEF FINANCIAL')) return 'CFO';
    if (roleUpper.includes('COO') || roleUpper.includes('CHIEF OPERATING')) return 'COO';
    if (roleUpper.includes('MANAGER') || roleUpper.includes('DIRECTOR') || roleUpper.includes('MGR')) return 'Manager';
    if (roleUpper.includes('ASSISTANT')) return 'Assistant';
    
    return 'Specialist'; // fallback
}

async function processarEmpresa(empresaId) {
    try {
        console.log(`🔄 Processando empresa: ${empresaId}`);

        // Buscar empresa
        const { data: empresas, error: empresaError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId);

        if (empresaError || !empresas?.length) {
            throw new Error(`Empresa não encontrada: ${empresaError?.message}`);
        }

        const empresa = empresas[0];
        console.log(`📊 Empresa: ${empresa.nome}`);

        // Buscar personas da empresa
        const { data: personas, error: personasError } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('status', 'active');

        if (personasError || !personas?.length) {
            throw new Error(`Personas não encontradas: ${personasError?.message}`);
        }

        console.log(`👥 Encontradas ${personas.length} personas ativas`);

        let personasProcessadas = 0;
        let totalTarefas = 0;
        let totalMetas = 0;
        const resultados = [];

        // Processar cada persona
        for (const persona of personas) {
            console.log(`\n⚙️ Processando: ${persona.full_name} (${persona.role})`);
            
            const templateKey = mapearRoleParaTemplate(persona.role);
            const template = templates[templateKey] || templates['Specialist'];
            
            console.log(`🏷️ Template: ${templateKey} - ${template.categoria}`);
            
            const tarefasMetas = {
                categoria: template.categoria,
                tarefas: template.tarefas.map(t => ({
                    ...t,
                    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                })),
                metas: template.metas.map(m => ({
                    ...m,
                    id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    valor_atual: 0
                })),
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
                console.error(`❌ Erro: ${updateError.message}`);
            } else {
                personasProcessadas++;
                totalTarefas += template.tarefas.length;
                totalMetas += template.metas.length;
                
                resultados.push({
                    persona: {
                        id: persona.id,
                        nome: persona.full_name,
                        role: persona.role,
                        template: templateKey
                    },
                    tarefas_count: template.tarefas.length,
                    metas_count: template.metas.length
                });
                
                console.log(`✅ Sucesso: ${template.tarefas.length} tarefas, ${template.metas.length} metas`);
            }

            // Pausa entre personas
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Salvar backup
        const outputDir = path.join(__dirname, '..', 'tarefas_metas_output');
        await fs.mkdir(outputDir, { recursive: true });
        
        const outputFile = path.join(outputDir, `tarefas_metas_${empresa.codigo || 'empresa'}_${Date.now()}.json`);
        const backupData = {
            empresa: { id: empresa.id, nome: empresa.nome },
            data_processamento: new Date().toISOString(),
            personas_processadas: personasProcessadas,
            total_tarefas: totalTarefas,
            total_metas: totalMetas,
            resultados: resultados
        };
        
        await fs.writeFile(outputFile, JSON.stringify(backupData, null, 2), 'utf8');

        console.log(`\n📊 RELATÓRIO FINAL`);
        console.log(`=================`);
        console.log(`✅ Personas processadas: ${personasProcessadas}/${personas.length}`);
        console.log(`📝 Total de tarefas: ${totalTarefas}`);
        console.log(`🎯 Total de metas: ${totalMetas}`);
        console.log(`📁 Backup: ${outputFile}`);
        
        return { success: true, personasProcessadas, totalTarefas, totalMetas };

    } catch (error) {
        console.error(`❌ Erro: ${error.message}`);
        throw error;
    }
}

// Main
async function main() {
    const args = process.argv.slice(2);
    let empresaId = null;

    for (const arg of args) {
        if (arg.startsWith('--empresaId=')) {
            empresaId = arg.split('=')[1];
        }
    }

    if (!empresaId) {
        console.error('❌ Erro: --empresaId é obrigatório');
        console.log('Uso: node generate_tarefas_final.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de tarefas e metas...\n');
        await processarEmpresa(empresaId);
        console.log('\n🎉 Processo concluído com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error(`💥 Erro fatal: ${error.message}`);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}