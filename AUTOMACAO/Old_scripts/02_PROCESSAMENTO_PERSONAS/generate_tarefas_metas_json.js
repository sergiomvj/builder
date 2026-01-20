#!/usr/bin/env node
/**
 * 🎯 SCRIPT 05 - GERAÇÃO DE TAREFAS E METAS DAS PERSONAS (Versão Simplificada)
 * ============================================================================
 * 
 * Como a tabela personas_tarefas não existe, vamos armazenar as informações
 * de tarefas e metas como campos JSON na tabela personas existente.
 * 
 * @version 2.0.0
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Para obter __dirname em ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

console.log('🎯 SCRIPT 05 - GERAÇÃO DE TAREFAS E METAS (Versão JSON)');
console.log('========================================================');

class TarefasMetasGenerator {
    constructor() {
        this.tarefasTemplates = this.initTarefasTemplates();
    }

    initTarefasTemplates() {
        return {
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
                        descricao: "Apresentações executivas e alinhamento estratégico",
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
                        metrica: "receita_total",
                        valor_meta: 25,
                        unidade: "percentual"
                    },
                    {
                        nome: "Expansão de Mercado",
                        descricao: "Entrar em 3 novos mercados/segmentos",
                        tipo: "crescimento",
                        prazo: "18 meses",
                        metrica: "novos_mercados",
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
                        descricao: "Reunião com líderes técnicos para alinhamento",
                        tipo: "semanal",
                        prioridade: "alta",
                        tempo_estimado: "2h",
                        frequencia: "toda terça-feira"
                    },
                    {
                        nome: "Avaliação de Tecnologias Emergentes",
                        descricao: "Pesquisa e avaliação de novas tecnologias",
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
                        metrica: "uptime_percentual",
                        valor_meta: 99.5,
                        unidade: "percentual"
                    },
                    {
                        nome: "Modernização da Stack",
                        descricao: "Migrar 80% dos sistemas legacy",
                        tipo: "tecnologia",
                        prazo: "12 meses",
                        metrica: "sistemas_modernos",
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
                        descricao: "Planejamento orçamentário e projeções financeiras",
                        tipo: "trimestral",
                        prioridade: "alta",
                        tempo_estimado: "8h",
                        frequencia: "último mês do trimestre"
                    },
                    {
                        nome: "Cash Flow Management",
                        descricao: "Gestão e monitoramento do fluxo de caixa",
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
                        metrica: "custos_operacionais",
                        valor_meta: 15,
                        unidade: "percentual_reducao"
                    },
                    {
                        nome: "Melhoria do Cash Flow",
                        descricao: "Reduzir tempo de recebimento em 30 dias",
                        tipo: "financeira",
                        prazo: "6 meses",
                        metrica: "dias_recebimento",
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
                        descricao: "Avaliação de performance da equipe",
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
                        metrica: "produtividade_equipe",
                        valor_meta: 15,
                        unidade: "percentual_aumento"
                    },
                    {
                        nome: "Retenção de Talentos",
                        descricao: "Manter turnover abaixo de 5%",
                        tipo: "gestão",
                        prazo: "12 meses",
                        metrica: "turnover_rate",
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
                        descricao: "Execução de tarefas técnicas específicas",
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
                        descricao: "Estudo e atualização em tecnologias",
                        tipo: "semanal",
                        prioridade: "média",
                        tempo_estimado: "2h",
                        frequencia: "sexta-feira tarde"
                    }
                ],
                metas: [
                    {
                        nome: "Qualidade de Entregas",
                        descricao: "Manter qualidade acima de 95%",
                        tipo: "qualidade",
                        prazo: "contínuo",
                        metrica: "qualidade_entregas",
                        valor_meta: 95,
                        unidade: "percentual"
                    },
                    {
                        nome: "Velocidade de Desenvolvimento",
                        descricao: "Aumentar velocity em 20%",
                        tipo: "performance",
                        prazo: "3 meses",
                        metrica: "story_points",
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
                        descricao: "Organização de agenda e comunicações",
                        tipo: "diário",
                        prioridade: "alta",
                        tempo_estimado: "2h",
                        frequencia: "início e fim do dia"
                    },
                    {
                        nome: "Preparação de Reuniões",
                        descricao: "Preparação de materials e logística",
                        tipo: "conforme_demanda",
                        prioridade: "alta",
                        tempo_estimado: "1h por reunião",
                        frequencia: "conforme agenda"
                    },
                    {
                        nome: "Relatórios Executivos",
                        descricao: "Compilação de relatórios semanais",
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
                        metrica: "tempo_resposta",
                        valor_meta: 30,
                        unidade: "percentual_reducao"
                    },
                    {
                        nome: "Satisfação do Executivo",
                        descricao: "Manter satisfação acima de 90%",
                        tipo: "qualidade",
                        prazo: "contínuo",
                        metrica: "satisfacao_executivo",
                        valor_meta: 90,
                        unidade: "percentual"
                    }
                ]
            }
        };
    }

    mapearRoleParaTemplate(role) {
        const roleUpper = role.toUpperCase();
        
        if (roleUpper.includes('CEO') || roleUpper.includes('CHIEF EXECUTIVE')) return 'CEO';
        if (roleUpper.includes('CTO') || roleUpper.includes('CHIEF TECHNOLOGY')) return 'CTO';
        if (roleUpper.includes('CFO') || roleUpper.includes('CHIEF FINANCIAL')) return 'CFO';
        if (roleUpper.includes('COO') || roleUpper.includes('CHIEF OPERATING')) return 'COO';
        if (roleUpper.includes('MANAGER') || roleUpper.includes('DIRECTOR') || roleUpper.includes('MGR')) return 'Manager';
        if (roleUpper.includes('ASSISTANT')) return 'Assistant';
        
        return 'Specialist'; // fallback
    }

    async gerarTarefasMetasParaEmpresa(empresaId) {
        try {
            console.log(`🔄 Gerando tarefas e metas para empresa: ${empresaId}`);

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

            let personasAtualizadas = 0;
            const tarefasMetasGeradas = [];

            // Gerar tarefas e metas para cada persona
            for (const persona of personas) {
                console.log(`⚙️ Processando: ${persona.full_name} (${persona.role})`);
                
                const templateKey = this.mapearRoleParaTemplate(persona.role);
                const template = this.tarefasTemplates[templateKey] || this.tarefasTemplates['Specialist'];
                
                // Criar estrutura de tarefas e metas para a persona
                const tarefasMetas = {
                    categoria: template.categoria,
                    tarefas: template.tarefas.map(tarefa => ({
                        ...tarefa,
                        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        status: 'ativa',
                        created_at: new Date().toISOString()
                    })),
                    metas: template.metas.map(meta => ({
                        ...meta,
                        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        valor_atual: 0,
                        status: 'ativa',
                        created_at: new Date().toISOString()
                    })),
                    template_usado: templateKey,
                    generated_at: new Date().toISOString()
                };

                // Atualizar a persona com os dados de tarefas e metas
                const currentIaConfig = persona.ia_config || {};
                const updateData = {
                    ia_config: {
                        ...currentIaConfig,
                        tarefas_metas: tarefasMetas
                    },
                    updated_at: new Date().toISOString()
                };

                const { error: updateError } = await supabase
                    .from('personas')
                    .update(updateData)
                    .eq('id', persona.id);

                if (updateError) {
                    console.error(`❌ Erro ao atualizar persona ${persona.full_name}:`, updateError.message);
                } else {
                    personasAtualizadas++;
                    tarefasMetasGeradas.push({
                        persona: {
                            id: persona.id,
                            nome: persona.full_name,
                            role: persona.role,
                            template: templateKey
                        },
                        tarefas_count: template.tarefas.length,
                        metas_count: template.metas.length,
                        dados: tarefasMetas
                    });
                    console.log(`✅ Persona atualizada: ${persona.full_name} (${template.tarefas.length} tarefas, ${template.metas.length} metas)`);
                }

                // Pausa entre atualizações
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Salvar backup local
            const outputDir = path.join(__dirname, '..', 'tarefas_metas_output');
            await fs.mkdir(outputDir, { recursive: true });
            
            const outputFile = path.join(outputDir, `tarefas_metas_${empresa.codigo || empresa.nome.replace(/\s+/g, '_')}_${Date.now()}.json`);
            const backupData = {
                empresa: { id: empresa.id, nome: empresa.nome },
                data_processamento: new Date().toISOString(),
                total_personas: personas.length,
                personas_atualizadas: personasAtualizadas,
                tarefas_metas_geradas: tarefasMetasGeradas,
                summary: {
                    total_tarefas: tarefasMetasGeradas.reduce((sum, item) => sum + item.tarefas_count, 0),
                    total_metas: tarefasMetasGeradas.reduce((sum, item) => sum + item.metas_count, 0),
                    templates_usados: [...new Set(tarefasMetasGeradas.map(item => item.persona.template))]
                }
            };
            
            await fs.writeFile(outputFile, JSON.stringify(backupData, null, 2), 'utf8');

            console.log(`\n📊 RELATÓRIO FINAL DE TAREFAS E METAS`);
            console.log(`=====================================`);
            console.log(`✅ Personas processadas: ${personas.length}`);
            console.log(`🔄 Personas atualizadas: ${personasAtualizadas}`);
            console.log(`📝 Total de tarefas geradas: ${backupData.summary.total_tarefas}`);
            console.log(`🎯 Total de metas geradas: ${backupData.summary.total_metas}`);
            console.log(`🏷️ Templates usados: ${backupData.summary.templates_usados.join(', ')}`);
            console.log(`📁 Backup salvo: ${outputFile}`);
            console.log(`🗃️ Dados salvos no campo 'ia_config.tarefas_metas' da tabela personas`);

            return {
                success: true,
                personas_processadas: personas.length,
                personas_atualizadas: personasAtualizadas,
                total_tarefas: backupData.summary.total_tarefas,
                total_metas: backupData.summary.total_metas,
                backup_file: outputFile
            };

        } catch (error) {
            console.error(`❌ Erro ao gerar tarefas e metas: ${error.message}`);
            throw error;
        }
    }
}

// Função principal
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
        console.log('Uso: node generate_tarefas_metas_json.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de tarefas e metas...');
        
        const generator = new TarefasMetasGenerator();
        const result = await generator.gerarTarefasMetasParaEmpresa(empresaId);
        
        console.log(`🎉 Processo concluído com sucesso!`);
        
        process.exit(0);
    } catch (error) {
        console.error(`💥 Erro na execução: ${error.message}`);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { TarefasMetasGenerator };