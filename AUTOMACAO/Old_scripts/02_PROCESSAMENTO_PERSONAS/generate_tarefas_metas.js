#!/usr/bin/env node
/**
 * 🎯 SCRIPT 05 - GERAÇÃO DE TAREFAS E METAS DAS PERSONAS
 * ======================================================
 * 
 * Geração de tarefas específicas e metas mensuráveis para cada persona
 * baseado no seu role, competências e contexto empresarial.
 * 
 * Funcionalidades:
 * - Tarefas diárias/semanais/mensais específicas por role
 * - Metas SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
 * - KPIs e métricas de performance
 * - Objetivos de curto, médio e longo prazo
 * - Integrações com sistemas de gestão
 * 
 * @version 1.0.0
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

console.log('🎯 SCRIPT 05 - GERAÇÃO DE TAREFAS E METAS');
console.log('==========================================');

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
                        frequencia: "toda segunda-feira",
                        recursos_necessarios: ["Dashboard executivo", "Relatórios financeiros", "Métricas de crescimento"],
                        entregaveis: ["Relatório de performance", "Ações corretivas", "Comunicado para board"]
                    },
                    {
                        nome: "Planejamento Estratégico Trimestral",
                        descricao: "Definição de objetivos e estratégias para próximo trimestre",
                        tipo: "trimestral", 
                        prioridade: "crítica",
                        tempo_estimado: "8h",
                        frequencia: "último mês do trimestre",
                        recursos_necessarios: ["Análise de mercado", "Performance atual", "Recursos disponíveis"],
                        entregaveis: ["Plano estratégico", "OKRs trimestrais", "Budget allocation"]
                    }
                ],
                metas: [
                    {
                        nome: "Crescimento da Receita",
                        descricao: "Aumentar receita anual em 25%",
                        tipo: "financeira",
                        prazo: "12 meses",
                        metrica: "receita_total",
                        valor_atual: 0,
                        valor_meta: 25,
                        unidade: "percentual",
                        kpis: ["Receita mensal", "ARR", "Churn rate", "New business"]
                    },
                    {
                        nome: "Expansão de Mercado",
                        descricao: "Entrar em 3 novos mercados/segmentos",
                        tipo: "crescimento",
                        prazo: "18 meses",
                        metrica: "novos_mercados",
                        valor_atual: 0,
                        valor_meta: 3,
                        unidade: "mercados",
                        kpis: ["Market share", "Brand awareness", "Customer acquisition"]
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
                        frequencia: "a cada 2 semanas",
                        recursos_necessarios: ["Documentação técnica", "Métricas de performance", "Feedback da equipe"],
                        entregaveis: ["Relatório de arquitetura", "Roadmap técnico", "Recomendações de otimização"]
                    },
                    {
                        nome: "Avaliação de Tecnologias Emergentes",
                        descricao: "Pesquisa e avaliação de novas tecnologias para adoção",
                        tipo: "mensal",
                        prioridade: "média",
                        tempo_estimado: "6h",
                        frequencia: "primeira semana do mês",
                        recursos_necessarios: ["Research reports", "POCs", "Market analysis"],
                        entregaveis: ["Tech radar", "Recomendações de adoção", "Roadmap de inovação"]
                    }
                ],
                metas: [
                    {
                        nome: "Redução de Downtime",
                        descricao: "Reduzir downtime dos sistemas em 50%",
                        tipo: "operacional",
                        prazo: "6 meses",
                        metrica: "uptime_percentual",
                        valor_atual: 95,
                        valor_meta: 99.5,
                        unidade: "percentual",
                        kpis: ["Uptime", "MTTR", "MTBF", "Performance response time"]
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
                        frequencia: "primeiros 5 dias do mês",
                        recursos_necessarios: ["Dados contábeis", "Relatórios operacionais", "Budget vs actual"],
                        entregaveis: ["DRE mensal", "Cash flow", "Budget variance analysis"]
                    }
                ],
                metas: [
                    {
                        nome: "Otimização de Custos",
                        descricao: "Reduzir custos operacionais em 15%",
                        tipo: "financeira",
                        prazo: "12 meses",
                        metrica: "custos_operacionais",
                        valor_atual: 100,
                        valor_meta: 85,
                        unidade: "percentual_base_100",
                        kpis: ["OPEX", "Cost per acquisition", "Operating margin"]
                    }
                ]
            },
            'COO': {
                categoria: "Excelência Operacional",
                tarefas: [
                    {
                        nome: "Otimização de Processos",
                        descricao: "Revisão e melhoria contínua de processos operacionais",
                        tipo: "semanal",
                        prioridade: "alta",
                        tempo_estimado: "3h",
                        frequencia: "toda quinta-feira",
                        recursos_necessarios: ["Process mapping", "KPIs operacionais", "Feedback teams"],
                        entregaveis: ["Process improvements", "Efficiency metrics", "Action plans"]
                    }
                ],
                metas: [
                    {
                        nome: "Eficiência Operacional",
                        descricao: "Aumentar eficiência operacional em 20%",
                        tipo: "operacional",
                        prazo: "9 meses",
                        metrica: "eficiencia_operacional",
                        valor_atual: 100,
                        valor_meta: 120,
                        unidade: "índice_base_100",
                        kpis: ["Process efficiency", "Resource utilization", "Quality metrics"]
                    }
                ]
            },
            'Manager': {
                categoria: "Gestão de Equipe e Projetos",
                tarefas: [
                    {
                        nome: "1:1s com Equipe",
                        descricao: "Reuniões individuais com membros da equipe para desenvolvimento e feedback",
                        tipo: "semanal",
                        prioridade: "alta",
                        tempo_estimado: "1h por pessoa",
                        frequencia: "semanalmente por pessoa",
                        recursos_necessarios: ["Performance data", "Goal tracking", "Development plans"],
                        entregaveis: ["Meeting notes", "Action items", "Development recommendations"]
                    },
                    {
                        nome: "Planejamento de Sprint/Projetos",
                        descricao: "Planejamento e acompanhamento de sprints e projetos da equipe",
                        tipo: "quinzenal",
                        prioridade: "alta",
                        tempo_estimado: "2h",
                        frequencia: "início de cada sprint",
                        recursos_necessarios: ["Backlog", "Team capacity", "Dependencies"],
                        entregaveis: ["Sprint plan", "Resource allocation", "Risk assessment"]
                    }
                ],
                metas: [
                    {
                        nome: "Produtividade da Equipe",
                        descricao: "Aumentar produtividade da equipe em 15%",
                        tipo: "gestão",
                        prazo: "6 meses",
                        metrica: "produtividade_equipe",
                        valor_atual: 100,
                        valor_meta: 115,
                        unidade: "índice_base_100",
                        kpis: ["Sprint velocity", "Story points completed", "Quality metrics"]
                    }
                ]
            },
            'Specialist': {
                categoria: "Execução Técnica e Expertise",
                tarefas: [
                    {
                        nome: "Desenvolvimento e Entregas",
                        descricao: "Execução de tarefas técnicas específicas da área de especialização",
                        tipo: "diário",
                        prioridade: "alta",
                        tempo_estimado: "6-8h",
                        frequencia: "diariamente",
                        recursos_necessarios: ["Tools específicas", "Documentation", "Access rights"],
                        entregaveis: ["Feature delivery", "Code quality", "Technical documentation"]
                    },
                    {
                        nome: "Atualização Técnica",
                        descricao: "Estudo e atualização em tecnologias da área de especialização",
                        tipo: "semanal",
                        prioridade: "média",
                        tempo_estimado: "2h",
                        frequencia: "sexta-feira afternoon",
                        recursos_necessarios: ["Learning resources", "Courses", "Community forums"],
                        entregaveis: ["Learning summary", "New skills acquired", "Knowledge sharing"]
                    }
                ],
                metas: [
                    {
                        nome: "Qualidade de Entregas",
                        descricao: "Manter qualidade de entregas acima de 95%",
                        tipo: "qualidade",
                        prazo: "contínuo",
                        metrica: "qualidade_entregas",
                        valor_atual: 90,
                        valor_meta: 95,
                        unidade: "percentual",
                        kpis: ["Bug rate", "Code review approval", "Time to delivery"]
                    }
                ]
            },
            'Assistant': {
                categoria: "Suporte e Eficiência Administrativa",
                tarefas: [
                    {
                        nome: "Gestão de Agenda e Comunicações",
                        descricao: "Organização de agenda, emails e comunicações do executivo",
                        tipo: "diário",
                        prioridade: "alta",
                        tempo_estimado: "2h",
                        frequencia: "início e fim do dia",
                        recursos_necessarios: ["Calendar tools", "Email management", "Communication channels"],
                        entregaveis: ["Organized schedule", "Prioritized communications", "Meeting preparations"]
                    },
                    {
                        nome: "Preparação de Relatórios",
                        descricao: "Compilação e preparação de relatórios e apresentações",
                        tipo: "semanal",
                        prioridade: "média",
                        tempo_estimado: "3h",
                        frequencia: "final da semana",
                        recursos_necessarios: ["Data sources", "Templates", "Analysis tools"],
                        entregaveis: ["Executive reports", "Presentation decks", "Data summaries"]
                    }
                ],
                metas: [
                    {
                        nome: "Eficiência de Suporte",
                        descricao: "Reduzir tempo de resposta em tarefas administrativas em 30%",
                        tipo: "eficiência",
                        prazo: "3 meses",
                        metrica: "tempo_resposta",
                        valor_atual: 100,
                        valor_meta: 70,
                        unidade: "percentual_base_100",
                        kpis: ["Response time", "Task completion rate", "Executive satisfaction"]
                    }
                ]
            }
        };
    }

    mapearRoleParaTemplate(role) {
        if (role === 'Chief Executive Officer' || role.includes('CEO')) return 'CEO';
        if (role === 'Chief Technology Officer' || role.includes('CTO')) return 'CTO';
        if (role === 'Chief Financial Officer' || role.includes('CFO')) return 'CFO';
        if (role === 'Chief Operating Officer' || role.includes('COO')) return 'COO';
        if (role.includes('Manager') || role.includes('Director')) return 'Manager';
        if (role.includes('Assistant')) return 'Assistant';
        if (role.includes('Specialist') || role.includes('Engineer') || role.includes('Analyst')) return 'Specialist';
        
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

            let tarefasSalvas = 0;
            let metasSalvas = 0;

            // Gerar tarefas e metas para cada persona
            for (const persona of personas) {
                console.log(`⚙️ Processando: ${persona.full_name} (${persona.role})`);
                
                const templateKey = this.mapearRoleParaTemplate(persona.role);
                const template = this.tarefasTemplates[templateKey] || this.tarefasTemplates['Specialist'];
                
                // Salvar tarefas
                for (const tarefa of template.tarefas) {
                    const tarefaRecord = {
                        persona_id: persona.id,
                        empresa_id: empresaId,
                        nome: tarefa.nome,
                        descricao: tarefa.descricao,
                        tipo: tarefa.tipo,
                        prioridade: tarefa.prioridade,
                        tempo_estimado: tarefa.tempo_estimado,
                        frequencia: tarefa.frequencia,
                        recursos_necessarios: tarefa.recursos_necessarios,
                        entregaveis: tarefa.entregaveis,
                        categoria: template.categoria,
                        status: 'ativa',
                        ativo: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    const { error: tarefaError } = await supabase
                        .from('personas_tarefas')
                        .insert(tarefaRecord);
                    
                    if (tarefaError) {
                        console.error(`❌ Erro ao salvar tarefa ${tarefa.nome}:`, tarefaError.message);
                    } else {
                        tarefasSalvas++;
                        console.log(`✅ Tarefa salva: ${tarefa.nome}`);
                    }
                }

                // Salvar metas
                for (const meta of template.metas) {
                    const metaRecord = {
                        persona_id: persona.id,
                        empresa_id: empresaId,
                        nome: meta.nome,
                        descricao: meta.descricao,
                        tipo: meta.tipo,
                        prazo: meta.prazo,
                        metrica: meta.metrica,
                        valor_atual: meta.valor_atual,
                        valor_meta: meta.valor_meta,
                        unidade: meta.unidade,
                        kpis: meta.kpis,
                        categoria: template.categoria,
                        status: 'ativa',
                        ativo: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    const { error: metaError } = await supabase
                        .from('personas_tarefas')
                        .insert({...metaRecord, tipo_registro: 'meta'});
                    
                    if (metaError) {
                        console.error(`❌ Erro ao salvar meta ${meta.nome}:`, metaError.message);
                    } else {
                        metasSalvas++;
                        console.log(`🎯 Meta salva: ${meta.nome}`);
                    }
                }
            }

            // Salvar backup local
            const outputDir = path.join(__dirname, '..', 'tarefas_metas_output');
            await fs.mkdir(outputDir, { recursive: true });
            
            const outputFile = path.join(outputDir, `tarefas_metas_${empresa.codigo || empresa.nome.replace(/\s+/g, '_')}.json`);
            const backupData = {
                empresa: { id: empresa.id, nome: empresa.nome },
                data_processamento: new Date().toISOString(),
                total_personas: personas.length,
                tarefas_salvas: tarefasSalvas,
                metas_salvas: metasSalvas,
                personas: personas.map(p => ({
                    id: p.id,
                    nome: p.full_name,
                    role: p.role,
                    template_usado: this.mapearRoleParaTemplate(p.role)
                }))
            };
            
            await fs.writeFile(outputFile, JSON.stringify(backupData, null, 2), 'utf8');

            console.log(`\n📊 RELATÓRIO FINAL DE TAREFAS E METAS`);
            console.log(`=====================================`);
            console.log(`✅ Personas processadas: ${personas.length}`);
            console.log(`📝 Tarefas salvas: ${tarefasSalvas}`);
            console.log(`🎯 Metas salvas: ${metasSalvas}`);
            console.log(`📁 Backup salvo: ${outputFile}`);
            console.log(`🗃️ Dados salvos na tabela: personas_tarefas`);

            return {
                success: true,
                personas_processadas: personas.length,
                tarefas_salvas: tarefasSalvas,
                metas_salvas: metasSalvas,
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
        console.log('Uso: node generate_tarefas_metas.js --empresaId UUID_DA_EMPRESA');
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