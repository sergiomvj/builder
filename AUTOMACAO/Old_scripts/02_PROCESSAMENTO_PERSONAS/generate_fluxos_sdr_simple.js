#!/usr/bin/env node
/**
 * 🎯 SCRIPT 4 - FLUXOS SDR E SALES ENABLEMENT 
 * ============================================
 * 
 * Geração de workflows N8N especializados para modelo SDR híbrido
 * Focado em automação de processos de vendas e suporte comercial
 * 
 * Funcionalidades:
 * - Fluxos de prospecting automatizado por nível de persona
 * - Workflows de lead nurturing e qualification 
 * - Automação de follow-up e appointment setting
 * - Integração CRM e ferramentas de sales enablement
 * - Suporte técnico automatizado para vendas
 * 
 * @author Sergio Castro  
 * @version 1.0.0 (SDR Focus)
 * @date 2024-11-15
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
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

class FluxosSDRGenerator {
    constructor() {
        // Templates de workflows SDR por tipo de persona
        this.workflowTemplates = {
            'CEO': {
                categoria: "Strategic Leadership & Revenue Oversight",
                fluxos: [
                    {
                        nome: "Revenue Dashboard Automation",
                        descricao: "Automação de relatórios de receita e pipeline para tomada de decisão estratégica",
                        etapas: ["Coleta de dados CRM", "Análise de pipeline", "Geração de insights", "Relatório executivo", "Alertas de performance"],
                        triggers: ["Daily at 8AM", "Pipeline changes", "Monthly targets"],
                        ferramentas: ["Salesforce API", "Analytics", "Email", "Slack"],
                        automacao_nivel: 90,
                        impacto_vendas: "Alto",
                        n8n_nodes: ["HTTP Request", "Function", "Email", "Salesforce", "Scheduler"]
                    },
                    {
                        nome: "Strategic Alerts & Notifications", 
                        descricao: "Sistema de alertas para oportunidades estratégicas e riscos no pipeline",
                        etapas: ["Monitor pipeline", "Detectar mudanças", "Análise de impacto", "Notificação", "Recomendações"],
                        triggers: ["Big deal movements", "Competitor activity", "Market changes"],
                        ferramentas: ["CRM", "Market Intelligence", "Slack", "Email"],
                        automacao_nivel: 85,
                        impacto_vendas: "Muito Alto",
                        n8n_nodes: ["CRM Webhook", "If", "Function", "Slack", "Email"]
                    }
                ]
            },
            'CTO': {
                categoria: "Technical Sales & Solution Architecture",
                fluxos: [
                    {
                        nome: "Technical Prospect Qualification",
                        descricao: "Automação de qualificação técnica de prospects baseada em tech stack e necessidades",
                        etapas: ["Tech stack discovery", "Compatibility analysis", "Solution matching", "Demo scheduling", "Technical follow-up"],
                        triggers: ["New technical lead", "Demo request", "Technical question"],
                        ferramentas: ["Lead intelligence", "CRM", "Demo platform", "Email sequencing"],
                        automacao_nivel: 70,
                        impacto_vendas: "Alto",
                        n8n_nodes: ["Webhook", "HTTP Request", "Function", "CRM Update", "Calendar"]
                    },
                    {
                        nome: "Automated Demo Environment Setup",
                        descricao: "Criação automática de ambientes de demo personalizados para prospects técnicos",
                        etapas: ["Prospect analysis", "Environment provisioning", "Data seeding", "Access setup", "Invitation sending"],
                        triggers: ["Demo scheduled", "Technical evaluation request"],
                        ferramentas: ["Cloud APIs", "Demo platform", "CRM", "Email"],
                        automacao_nivel: 95,
                        impacto_vendas: "Muito Alto",
                        n8n_nodes: ["CRM Trigger", "AWS/Azure", "Function", "Email", "Calendar"]
                    },
                    {
                        nome: "Technical Objection Response",
                        descricao: "Sistema de resposta automática para objeções técnicas comuns",
                        etapas: ["Objection detection", "Content matching", "Response generation", "Follow-up scheduling", "Feedback collection"],
                        triggers: ["Technical objection keywords", "Demo feedback", "Email replies"],
                        ferramentas: ["NLP", "Knowledge base", "Email", "CRM"],
                        automacao_nivel: 60,
                        impacto_vendas: "Médio-Alto",
                        n8n_nodes: ["Email Trigger", "AI/NLP", "Database", "Email", "CRM Update"]
                    }
                ]
            },
            'CFO': {
                categoria: "Financial Sales & ROI Justification",
                fluxos: [
                    {
                        nome: "ROI Calculator Automation",
                        descricao: "Geração automática de análises ROI personalizadas para prospects C-level",
                        etapas: ["Company data collection", "ROI calculation", "Report generation", "Executive presentation", "Follow-up"],
                        triggers: ["CFO prospect identified", "ROI request", "Budget cycle timing"],
                        ferramentas: ["Financial APIs", "ROI calculator", "PDF generator", "CRM", "Email"],
                        automacao_nivel: 80,
                        impacto_vendas: "Muito Alto",
                        n8n_nodes: ["CRM Trigger", "HTTP Request", "Function", "PDF", "Email"]
                    },
                    {
                        nome: "Budget Cycle Targeting",
                        descricao: "Automação de outreach baseada em ciclos orçamentários de empresas target",
                        etapas: ["Budget cycle research", "Timing optimization", "Personalized outreach", "Executive targeting", "Pipeline tracking"],
                        triggers: ["Budget season", "Quarterly planning", "Fiscal year end"],
                        ferramentas: ["Market intelligence", "CRM", "Email sequencing", "LinkedIn"],
                        automacao_nivel: 75,
                        impacto_vendas: "Alto",
                        n8n_nodes: ["Scheduler", "Database", "Function", "Email", "LinkedIn API"]
                    }
                ]
            },
            'COO': {
                categoria: "Operations Sales & Process Optimization",
                fluxos: [
                    {
                        nome: "Process Improvement Lead Generation",
                        descricao: "Identificação e abordagem de empresas com oportunidades de otimização operacional",
                        etapas: ["Company analysis", "Process gap identification", "Opportunity scoring", "Targeted outreach", "Solution presentation"],
                        triggers: ["Industry reports", "Company news", "Efficiency metrics"],
                        ferramentas: ["Business intelligence", "CRM", "Email", "Analytics"],
                        automacao_nivel: 65,
                        impacto_vendas: "Médio-Alto",
                        n8n_nodes: ["RSS/News", "Function", "CRM", "Email", "Analytics"]
                    },
                    {
                        nome: "Efficiency ROI Presentations",
                        descricao: "Automação de criação de apresentações ROI focadas em eficiência operacional",
                        etapas: ["Operations assessment", "Efficiency calculation", "Presentation creation", "Executive delivery", "Follow-up"],
                        triggers: ["Operations prospect", "Efficiency consultation request"],
                        ferramentas: ["Assessment tools", "Presentation generator", "CRM", "Calendar"],
                        automacao_nivel: 70,
                        impacto_vendas: "Alto",
                        n8n_nodes: ["CRM Trigger", "Function", "PowerPoint API", "Email", "Calendar"]
                    }
                ]
            },
            'Specialist': {
                categoria: "Technical Support & Solution Enablement",
                fluxos: [
                    {
                        nome: "Technical Support Automation",
                        descricao: "Suporte técnico automatizado para prospects durante processo de vendas",
                        etapas: ["Issue detection", "Solution matching", "Response automation", "Escalation if needed", "Follow-up"],
                        triggers: ["Technical question", "Implementation doubt", "Support request"],
                        ferramentas: ["Knowledge base", "Ticketing", "CRM", "Email"],
                        automacao_nivel: 80,
                        impacto_vendas: "Médio",
                        n8n_nodes: ["Email Trigger", "Database", "If", "Email", "CRM Update"]
                    },
                    {
                        nome: "Product Demo Support",
                        descricao: "Suporte automatizado durante demos técnicas e avaliações de produto",
                        etapas: ["Demo preparation", "Technical setup", "Real-time support", "Issue resolution", "Post-demo follow-up"],
                        triggers: ["Demo scheduled", "Technical issue", "Evaluation period"],
                        ferramentas: ["Demo platform", "Support tools", "CRM", "Chat"],
                        automacao_nivel: 60,
                        impacto_vendas: "Alto",
                        n8n_nodes: ["Calendar Trigger", "Function", "Chat API", "CRM", "Email"]
                    }
                ]
            },
            'Assistant': {
                categoria: "SDR Operations & Lead Management",
                fluxos: [
                    {
                        nome: "Lead Research & Enrichment", 
                        descricao: "Pesquisa e enriquecimento automático de leads para executivos SDR",
                        etapas: ["Lead capture", "Data enrichment", "Company research", "Contact verification", "CRM update"],
                        triggers: ["New lead", "Contact import", "Research request"],
                        ferramentas: ["Lead databases", "Enrichment APIs", "CRM", "Email validator"],
                        automacao_nivel: 95,
                        impacto_vendas: "Alto",
                        n8n_nodes: ["Webhook", "HTTP Request", "Function", "CRM", "Email"]
                    },
                    {
                        nome: "Appointment Setting Automation",
                        descricao: "Agendamento automático de reuniões para executivos baseado em qualificação de leads",
                        etapas: ["Lead qualification", "Executive matching", "Calendar check", "Appointment booking", "Confirmations"],
                        triggers: ["Qualified lead", "Meeting request", "Calendar availability"],
                        ferramentas: ["CRM", "Calendar", "Email sequencing", "Qualification tools"],
                        automacao_nivel: 85,
                        impacto_vendas: "Muito Alto", 
                        n8n_nodes: ["CRM Trigger", "Calendar API", "Function", "Email", "SMS"]
                    },
                    {
                        nome: "Follow-up Sequence Management",
                        descricao: "Gestão automática de sequências de follow-up personalizadas por executive",
                        etapas: ["Sequence setup", "Trigger monitoring", "Personalization", "Send optimization", "Response tracking"],
                        triggers: ["No response", "Meeting end", "Demo completion"],
                        ferramentas: ["Email sequencing", "CRM", "Analytics", "A/B testing"],
                        automacao_nivel: 90,
                        impacto_vendas: "Alto",
                        n8n_nodes: ["CRM Trigger", "Function", "Email", "Wait", "If"]
                    },
                    {
                        nome: "Pipeline Management Dashboard",
                        descricao: "Dashboard automático de gestão de pipeline para suporte aos executivos",
                        etapas: ["Data collection", "Pipeline analysis", "Alert generation", "Report creation", "Distribution"],
                        triggers: ["Daily schedule", "Pipeline changes", "Target updates"],
                        ferramentas: ["CRM API", "Analytics", "Dashboard", "Email"],
                        automacao_nivel: 95,
                        impacto_vendas: "Alto",
                        n8n_nodes: ["Scheduler", "CRM", "Function", "Dashboard API", "Email"]
                    }
                ]
            }
        };
    }

    mapearRoleParaTemplate(role) {
        // Mapear role completo para template key
        if (role === 'Chief Executive Officer') return 'CEO';
        if (role === 'Chief Technology Officer') return 'CTO';
        if (role === 'Chief Financial Officer') return 'CFO';
        if (role === 'Chief Operating Officer') return 'COO';
        if (role === 'Chief Marketing Officer') return 'CMO';
        if (role.includes('Assistant')) return 'Assistant';
        if (role.includes('Specialist')) return 'Specialist';
        
        return 'Assistant'; // fallback
    }

    determinarNivelPersona(role) {
        if (role.includes('Chief') || role === 'CEO') return 'Executive';
        if (role.includes('Manager')) return 'Manager';
        if (role.includes('Specialist')) return 'Specialist';
        if (role.includes('Assistant')) return 'Assistant';
        return 'Assistant'; // fallback
    }

    async gerarFluxosSDRParaEmpresa(empresaId) {
        try {
            console.log(`🔄 Gerando fluxos SDR para empresa: ${empresaId}`);

            // Buscar empresa
            const { data: empresas, error: empresaError } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', empresaId);

            if (empresaError) {
                throw new Error(`Erro ao buscar empresa: ${empresaError.message}`);
            }

            if (!empresas || empresas.length === 0) {
                throw new Error('Empresa não encontrada');
            }

            const empresa = empresas[0];
            console.log(`📊 Empresa: ${empresa.nome} (${empresa.codigo})`);

            // Buscar personas da empresa
            const { data: personas, error: personasError } = await supabase
                .from('personas')
                .select('*')
                .eq('empresa_id', empresaId)
                .eq('status', 'active');

            if (personasError) {
                throw new Error(`Erro ao buscar personas: ${personasError.message}`);
            }

            if (!personas || personas.length === 0) {
                throw new Error('Nenhuma persona ativa encontrada para esta empresa');
            }

            console.log(`👥 Encontradas ${personas.length} personas ativas`);

            // Gerar fluxos SDR para cada persona
            const fluxosResult = {
                empresa: {
                    id: empresa.id,
                    codigo: empresa.codigo,
                    nome: empresa.nome
                },
                data_processamento: new Date().toISOString(),
                total_personas: personas.length,
                sdr_model_info: {
                    description: "Modelo SDR híbrido - Executivos com expertise de área + competências SDR, Assistentes com foco total em SDR support",
                    automation_focus: "Sales enablement, lead management, technical demos, ROI presentations"
                },
                personas: {}
            };

            for (const persona of personas) {
                console.log(`⚙️ Processando: ${persona.full_name} (${persona.role})`);
                
                const templateKey = this.mapearRoleParaTemplate(persona.role);
                const nivelPersona = this.determinarNivelPersona(persona.role);
                const workflowTemplate = this.workflowTemplates[templateKey] || this.workflowTemplates['Assistant'];
                
                fluxosResult.personas[persona.persona_code] = {
                    info: {
                        nome: persona.full_name,
                        role: persona.role,
                        department: persona.department,
                        specialty: persona.specialty,
                        nivel: nivelPersona,
                        template_usado: templateKey
                    },
                    workflows: {
                        categoria: workflowTemplate.categoria,
                        fluxos: workflowTemplate.fluxos.map(fluxo => ({
                            ...fluxo,
                            persona_customization: this.customizarFluxoParaPersona(fluxo, persona, templateKey),
                            n8n_workflow: this.gerarWorkflowN8N(fluxo, persona)
                        }))
                    },
                    automation_metrics: {
                        total_workflows: workflowTemplate.fluxos.length,
                        automation_coverage: this.calcularCoberturaAutomacao(workflowTemplate.fluxos),
                        estimated_time_savings: this.calcularEconomiaTemp(workflowTemplate.fluxos),
                        sales_impact_score: this.calcularImpactoVendas(workflowTemplate.fluxos)
                    }
                };
            }

            // Salvar arquivo de fluxos SDR
            const outputDir = path.join(__dirname, '..', 'fluxos_sdr_output');
            await fs.mkdir(outputDir, { recursive: true });
            
            const outputFile = path.join(outputDir, `fluxos_sdr_${empresa.codigo}.json`);
            await fs.writeFile(outputFile, JSON.stringify(fluxosResult, null, 2), 'utf8');

            // SALVAR NO BANCO DE DADOS
            let totalFluxosSalvos = 0;
            
            for (const [personaCode, personaData] of Object.entries(fluxosResult.personas)) {
                const persona = personas.find(p => p.persona_code === personaCode);
                
                if (persona) {
                    // Salvar cada fluxo na tabela personas_fluxos_sdr
                    for (const fluxo of personaData.workflows.fluxos) {
                        const fluxoRecord = {
                            persona_id: persona.id,
                            empresa_id: empresaId,
                            nome_fluxo: fluxo.nome,
                            descricao: fluxo.descricao,
                            categoria: personaData.workflows.categoria,
                            etapas: fluxo.etapas,
                            triggers: fluxo.triggers,
                            ferramentas: fluxo.ferramentas,
                            automacao_nivel: fluxo.automacao_nivel,
                            impacto_vendas: fluxo.impacto_vendas,
                            n8n_nodes: fluxo.n8n_nodes,
                            persona_customization: fluxo.persona_customization,
                            n8n_workflow: fluxo.n8n_workflow,
                            ativo: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        const { error: fluxoError } = await supabase
                            .from('personas_fluxos')
                            .insert(fluxoRecord);
                        
                        if (fluxoError) {
                            console.error(`❌ Erro ao salvar fluxo ${fluxo.nome}:`, fluxoError.message);
                        } else {
                            totalFluxosSalvos++;
                            console.log(`💾 Fluxo salvo: ${fluxo.nome} (${persona.full_name})`);
                        }
                    }
                }
            }

            console.log(`✅ Fluxos SDR gerados com sucesso!`);
            console.log(`📁 Arquivo salvo: ${outputFile}`);
            console.log(`💾 ${totalFluxosSalvos} fluxos salvos no banco de dados`);

            return {
                success: true,
                file: outputFile,
                personas_processadas: personas.length,
                total_workflows: Object.values(fluxosResult.personas).reduce((total, p) => total + p.workflows.fluxos.length, 0),
                fluxos_salvos_bd: totalFluxosSalvos
            };

        } catch (error) {
            console.error(`❌ Erro ao gerar fluxos SDR: ${error.message}`);
            throw error;
        }
    }

    customizarFluxoParaPersona(fluxo, persona, templateKey) {
        return {
            persona_focus: `Customizado para ${persona.role} - ${persona.specialty}`,
            industry_adaptation: `Adaptado para ${persona.department}`,
            sdr_specialization: templateKey === 'Assistant' ? 'Full SDR Support' : 
                               templateKey === 'CEO' ? 'Strategic Sales Oversight' : 
                               `${templateKey} Sales Specialization`
        };
    }

    gerarWorkflowN8N(fluxo, persona) {
        return {
            name: `${fluxo.nome} - ${persona.full_name}`,
            description: `${fluxo.descricao} (${persona.role})`,
            active: true,
            nodes: fluxo.n8n_nodes.map((node, index) => ({
                id: `node_${index}`,
                name: node,
                type: this.mapearTipoNode(node),
                position: [100 + (index * 200), 100],
                parameters: this.gerarParametrosNode(node, fluxo, persona)
            })),
            connections: this.gerarConexoesNodes(fluxo.n8n_nodes),
            settings: {
                timezone: "America/Sao_Paulo",
                executionTimeout: 3600
            }
        };
    }

    mapearTipoNode(nodeType) {
        const nodeMapping = {
            'HTTP Request': 'n8n-nodes-base.httpRequest',
            'Function': 'n8n-nodes-base.function',
            'Email': 'n8n-nodes-base.gmail',
            'Salesforce': 'n8n-nodes-base.salesforce',
            'Scheduler': 'n8n-nodes-base.cron',
            'CRM Webhook': 'n8n-nodes-base.webhook',
            'If': 'n8n-nodes-base.if',
            'Slack': 'n8n-nodes-base.slack',
            'Calendar': 'n8n-nodes-base.googleCalendar',
            'SMS': 'n8n-nodes-base.twilio'
        };
        return nodeMapping[nodeType] || 'n8n-nodes-base.noOp';
    }

    gerarParametrosNode(nodeType, fluxo, persona) {
        // Parâmetros básicos por tipo de node
        switch(nodeType) {
            case 'Email':
                return {
                    resource: 'message',
                    operation: 'send',
                    subject: `${fluxo.nome} - ${persona.full_name}`,
                    message: `Workflow automático: ${fluxo.descricao}`
                };
            case 'Scheduler':
                return {
                    rule: {
                        interval: [{
                            field: 'cronExpression',
                            value: '0 8 * * 1-5' // 8h das manhãs, dias úteis
                        }]
                    }
                };
            case 'Function':
                return {
                    functionCode: `// Função automática para ${fluxo.nome}\nreturn items;`
                };
            default:
                return {};
        }
    }

    gerarConexoesNodes(nodes) {
        const connections = {};
        for (let i = 0; i < nodes.length - 1; i++) {
            connections[`node_${i}`] = {
                main: [[{
                    node: `node_${i + 1}`,
                    type: 'main',
                    index: 0
                }]]
            };
        }
        return connections;
    }

    calcularCoberturaAutomacao(fluxos) {
        const totalAutomacao = fluxos.reduce((sum, f) => sum + f.automacao_nivel, 0);
        return Math.round(totalAutomacao / fluxos.length);
    }

    calcularEconomiaTemp(fluxos) {
        // Estimar horas economizadas por semana por workflow
        return fluxos.length * 8; // 8 horas por workflow/semana
    }

    calcularImpactoVendas(fluxos) {
        const impactMap = { 'Baixo': 1, 'Médio': 2, 'Médio-Alto': 3, 'Alto': 4, 'Muito Alto': 5 };
        const totalImpact = fluxos.reduce((sum, f) => sum + (impactMap[f.impacto_vendas] || 2), 0);
        return Math.round((totalImpact / fluxos.length) * 20); // Score 0-100
    }
}

// Função principal
async function main() {
    const args = process.argv.slice(2);
    let empresaId = null;

    // Processar argumentos
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--empresaId') {
            empresaId = args[i + 1];
            i++; // Skip next argument
        }
    }

    if (!empresaId) {
        console.error('❌ Erro: --empresaId é obrigatório');
        console.log('Uso: node generate_fluxos_sdr_simple.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de fluxos SDR...');
        
        const generator = new FluxosSDRGenerator();
        const result = await generator.gerarFluxosSDRParaEmpresa(empresaId);
        
        console.log(`🎉 Processo concluído com sucesso!`);
        console.log(`📊 ${result.personas_processadas} personas processadas`);
        console.log(`🔄 ${result.total_workflows} workflows N8N gerados`);
        
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

export { FluxosSDRGenerator };