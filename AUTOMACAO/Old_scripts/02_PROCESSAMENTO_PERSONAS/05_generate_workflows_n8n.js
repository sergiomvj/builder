#!/usr/bin/env node
/**
 * 🎯 SCRIPT 5 - GERAÇÃO DE WORKFLOWS N8N (Node.js)
 * ==============================================
 * 
 * Geração automática de workflows N8N baseados na análise de fluxos,
 * criando automações executáveis para os processos identificados.
 * 
 * Migrado de Python para Node.js mantendo funcionalidade 100% idêntica
 * 
 * Funcionalidades:
 * - Geração de workflows N8N em JSON
 * - Templates de automação por especialidade
 * - Configuração de triggers e actions
 * - Integração com APIs identificadas
 * - Documentação de implementação
 * 
 * @author Sergio Castro
 * @version 1.0.0 (Node.js)
 * @date 2024-12-19
 */

const fs = require('fs').promises;
const path = require('path');

class WorkflowsN8NGenerator {
    constructor() {
        // Templates base de workflows N8N
        this.n8nTemplates = {
            base_workflow: {
                name: "",
                nodes: [],
                connections: {},
                active: false,
                settings: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                versionId: "1"
            },
            
            // Nodes comuns
            common_nodes: {
                start_trigger: {
                    id: "start",
                    name: "Start",
                    type: "n8n-nodes-base.start",
                    position: [240, 300],
                    parameters: {},
                    typeVersion: 1
                },
                webhook_trigger: {
                    id: "webhook",
                    name: "Webhook",
                    type: "n8n-nodes-base.webhook",
                    position: [240, 300],
                    parameters: {
                        path: "workflow-trigger",
                        httpMethod: "POST"
                    },
                    typeVersion: 1
                },
                cron_trigger: {
                    id: "cron",
                    name: "Cron",
                    type: "n8n-nodes-base.cron",
                    position: [240, 300],
                    parameters: {
                        rule: {
                            interval: [{
                                field: "cronExpression",
                                value: "0 9 * * 1-5"
                            }]
                        }
                    },
                    typeVersion: 1
                },
                http_request: {
                    id: "http",
                    name: "HTTP Request",
                    type: "n8n-nodes-base.httpRequest",
                    position: [460, 300],
                    parameters: {
                        url: "",
                        method: "GET",
                        responseFormat: "json"
                    },
                    typeVersion: 1
                },
                set_node: {
                    id: "set",
                    name: "Set",
                    type: "n8n-nodes-base.set",
                    position: [680, 300],
                    parameters: {
                        values: {
                            string: []
                        }
                    },
                    typeVersion: 1
                }
            }
        };

        // Workflows específicos por especialidade
        this.workflowTemplates = {
            hr_recrutamento: {
                name: "Automação de Recrutamento",
                description: "Automatiza processo de triagem e agendamento de entrevistas",
                triggers: ["webhook", "email"],
                nodes: [
                    {
                        type: "webhook",
                        name: "Nova Candidatura",
                        config: { path: "nova-candidatura", method: "POST" }
                    },
                    {
                        type: "function",
                        name: "Processar Currículo", 
                        config: { code: "return items.map(item => ({ ...item, score: calculateResumeScore(item.resume) }));" }
                    },
                    {
                        type: "if",
                        name: "Score Qualificação",
                        config: { condition: "{{ $node.score >= 75 }}" }
                    },
                    {
                        type: "gmail",
                        name: "Enviar Email Aprovado",
                        config: { operation: "send", to: "{{ $json.email }}", subject: "Próximas etapas - Processo seletivo" }
                    },
                    {
                        type: "calendly",
                        name: "Agendar Entrevista",
                        config: { operation: "create", event_type: "entrevista-inicial" }
                    },
                    {
                        type: "slack",
                        name: "Notificar RH",
                        config: { channel: "#recrutamento", message: "Nova entrevista agendada: {{ $json.name }}" }
                    }
                ]
            },
            
            marketing_campanha: {
                name: "Automação de Campanhas",
                description: "Automatiza criação e monitoramento de campanhas digitais",
                triggers: ["webhook", "cron"],
                nodes: [
                    {
                        type: "cron",
                        name: "Trigger Semanal",
                        config: { expression: "0 9 * * 1" }
                    },
                    {
                        type: "googlesheets",
                        name: "Ler Planejamento",
                        config: { operation: "read", range: "Campanhas!A:Z" }
                    },
                    {
                        type: "function",
                        name: "Processar Dados",
                        config: { code: "return items.filter(item => item.status === 'Aprovado' && new Date(item.dataInicio) <= new Date());" }
                    },
                    {
                        type: "facebook",
                        name: "Criar Campanha FB",
                        config: { operation: "createCampaign", objective: "TRAFFIC" }
                    },
                    {
                        type: "google-ads",
                        name: "Criar Campanha Google",
                        config: { operation: "createCampaign", type: "SEARCH" }
                    },
                    {
                        type: "slack",
                        name: "Notificar Equipe",
                        config: { channel: "#marketing", message: "Campanhas ativadas: {{ $json.length }}" }
                    }
                ]
            },
            
            financeiro_aprovacao: {
                name: "Automação de Aprovações",
                description: "Automatiza fluxo de aprovação de despesas e pagamentos",
                triggers: ["webhook", "email"],
                nodes: [
                    {
                        type: "webhook",
                        name: "Nova Solicitação",
                        config: { path: "nova-despesa", method: "POST" }
                    },
                    {
                        type: "function",
                        name: "Validar Dados",
                        config: { code: "return items.map(item => ({ ...item, needsApproval: item.valor > 1000 }));" }
                    },
                    {
                        type: "if",
                        name: "Precisa Aprovação",
                        config: { condition: "{{ $json.needsApproval === true }}" }
                    },
                    {
                        type: "slack",
                        name: "Solicitar Aprovação",
                        config: { channel: "#aprovacoes", message: "Nova despesa para aprovação: R$ {{ $json.valor }}" }
                    },
                    {
                        type: "wait",
                        name: "Aguardar Resposta",
                        config: { amount: 24, unit: "hours" }
                    },
                    {
                        type: "erp-system",
                        name: "Registrar no ERP",
                        config: { operation: "create", module: "expenses" }
                    }
                ]
            },
            
            tecnologia_deploy: {
                name: "Automação de Deploy",
                description: "Automatiza processo de deploy e monitoramento",
                triggers: ["git-push", "webhook"],
                nodes: [
                    {
                        type: "github",
                        name: "Git Push Trigger",
                        config: { repository: "main", branch: "main" }
                    },
                    {
                        type: "function",
                        name: "Validar Branch",
                        config: { code: "return items.filter(item => item.ref === 'refs/heads/main');" }
                    },
                    {
                        type: "jenkins",
                        name: "Iniciar Build",
                        config: { job: "build-and-test", parameters: {} }
                    },
                    {
                        type: "wait",
                        name: "Aguardar Build",
                        config: { amount: 10, unit: "minutes" }
                    },
                    {
                        type: "if",
                        name: "Build Sucesso",
                        config: { condition: "{{ $json.status === 'SUCCESS' }}" }
                    },
                    {
                        type: "kubernetes",
                        name: "Deploy Produção",
                        config: { operation: "apply", namespace: "production" }
                    },
                    {
                        type: "slack",
                        name: "Notificar Deploy",
                        config: { channel: "#deployments", message: "Deploy realizado com sucesso! Version: {{ $json.version }}" }
                    }
                ]
            },
            
            youtube_otimizacao: {
                name: "Automação YouTube",
                description: "Automatiza otimização e análise de canal YouTube",
                triggers: ["cron", "webhook"],
                nodes: [
                    {
                        type: "cron",
                        name: "Análise Diária",
                        config: { expression: "0 10 * * *" }
                    },
                    {
                        type: "youtube",
                        name: "Buscar Vídeos Recentes",
                        config: { operation: "list", part: "statistics,snippet" }
                    },
                    {
                        type: "function",
                        name: "Calcular Métricas",
                        config: { code: "return items.map(item => ({ ...item, performanceScore: calculatePerformance(item.statistics) }));" }
                    },
                    {
                        type: "googlesheets",
                        name: "Atualizar Dashboard",
                        config: { operation: "append", spreadsheet: "YouTube Analytics" }
                    },
                    {
                        type: "if",
                        name: "Performance Baixa",
                        config: { condition: "{{ $json.performanceScore < 50 }}" }
                    },
                    {
                        type: "slack",
                        name: "Alert Performance",
                        config: { channel: "#youtube", message: "Vídeo com baixa performance: {{ $json.title }}" }
                    }
                ]
            },
            
            midias_sociais_monitoramento: {
                name: "Automação Mídias Sociais",
                description: "Monitora menções e automatiza engajamento",
                triggers: ["webhook", "cron"],
                nodes: [
                    {
                        type: "cron",
                        name: "Monitoramento Contínuo",
                        config: { expression: "*/15 * * * *" }
                    },
                    {
                        type: "twitter",
                        name: "Buscar Menções",
                        config: { operation: "search", query: "@empresa_handle" }
                    },
                    {
                        type: "instagram",
                        name: "Buscar Tags",
                        config: { operation: "searchHashtag", hashtag: "#empresa" }
                    },
                    {
                        type: "function",
                        name: "Analisar Sentimento",
                        config: { code: "return items.map(item => ({ ...item, sentiment: analyzeSentiment(item.text) }));" }
                    },
                    {
                        type: "if",
                        name: "Sentimento Negativo",
                        config: { condition: "{{ $json.sentiment === 'negative' }}" }
                    },
                    {
                        type: "slack",
                        name: "Alerta Crise",
                        config: { channel: "#crisis-management", message: "Menção negativa detectada: {{ $json.text }}" }
                    },
                    {
                        type: "airtable",
                        name: "Registrar Interação",
                        config: { operation: "create", table: "Social Monitoring" }
                    }
                ]
            }
        };

        // Configurações de integração por ferramenta
        this.integrationConfigs = {
            slack: {
                node_type: "n8n-nodes-base.slack",
                auth_type: "oauth2",
                required_scopes: ["chat:write", "channels:read"],
                common_operations: ["postMessage", "getChannels", "getUsers"]
            },
            gmail: {
                node_type: "n8n-nodes-base.gmail",
                auth_type: "oauth2",
                required_scopes: ["https://www.googleapis.com/auth/gmail.send"],
                common_operations: ["send", "get", "list"]
            },
            googlesheets: {
                node_type: "n8n-nodes-base.googleSheets",
                auth_type: "serviceAccount",
                required_scopes: ["https://www.googleapis.com/auth/spreadsheets"],
                common_operations: ["read", "append", "update", "create"]
            },
            hubspot: {
                node_type: "n8n-nodes-base.hubspot",
                auth_type: "apiKey",
                required_permissions: ["contacts", "deals", "tickets"],
                common_operations: ["create", "update", "get", "list"]
            }
        };
    }

    /**
     * Analisa fluxos e identifica workflows para automação
     */
    analisarWorkflowsParaAutomacao(fluxosData) {
        try {
            const workflowsCandidatos = [];

            // Analisar processos com alta automação potencial
            const processosAutomatizaveis = fluxosData.preparacao_n8n.processos_automatizaveis
                .filter(processo => processo.potencial >= 60);

            processosAutomatizaveis.forEach(processo => {
                const workflowTemplate = this.identificarTemplateWorkflow(processo.especialidade, processo.processo);
                
                if (workflowTemplate) {
                    workflowsCandidatos.push({
                        ...processo,
                        template: workflowTemplate,
                        prioridade: this.calcularPrioridadeWorkflow(processo),
                        complexidade: this.avaliarComplexidadeImplementacao(processo, workflowTemplate),
                        integrações_necessarias: this.identificarIntegracoes(processo.ferramentas)
                    });
                }
            });

            // Analisar workflows prioritários
            const workflowsPrioritarios = fluxosData.preparacao_n8n.workflows_prioritarios
                .map(workflow => ({
                    ...workflow,
                    template: this.criarTemplateCustomizado(workflow),
                    prioridade: "alta",
                    complexidade: "média"
                }));

            return {
                workflows_automatizaveis: workflowsCandidatos,
                workflows_prioritarios: workflowsPrioritarios,
                total_workflows: workflowsCandidatos.length + workflowsPrioritarios.length
            };

        } catch (error) {
            console.error(`❌ Erro na análise de workflows: ${error.message}`);
            return null;
        }
    }

    /**
     * Identifica template de workflow baseado na especialidade
     */
    identificarTemplateWorkflow(especialidade, processo) {
        const mapeamento = {
            "hr": {
                "Recrutamento e Seleção": "hr_recrutamento",
                "Onboarding": "hr_onboarding"
            },
            "marketing": {
                "Criação de Campanha": "marketing_campanha",
                "Gestão de Conteúdo": "marketing_conteudo"
            },
            "financeiro": {
                "Controle de Despesas": "financeiro_aprovacao",
                "Aprovações": "financeiro_aprovacao"
            },
            "tecnologia": {
                "Deploy": "tecnologia_deploy",
                "CI/CD": "tecnologia_deploy"
            },
            "youtube": {
                "Otimização": "youtube_otimizacao",
                "Analytics": "youtube_analytics"
            },
            "midias_sociais": {
                "Monitoramento": "midias_sociais_monitoramento",
                "Engagement": "midias_sociais_engagement"
            }
        };

        const especialidadeMap = mapeamento[especialidade];
        if (!especialidadeMap) return null;

        // Busca por correspondência no nome do processo
        for (const [processoKey, template] of Object.entries(especialidadeMap)) {
            if (processo.toLowerCase().includes(processoKey.toLowerCase()) || 
                processoKey.toLowerCase().includes(processo.toLowerCase())) {
                return template;
            }
        }

        return null;
    }

    /**
     * Calcula prioridade do workflow
     */
    calcularPrioridadeWorkflow(processo) {
        let score = 0;

        // Baseado no potencial de automação
        if (processo.potencial >= 80) score += 40;
        else if (processo.potencial >= 60) score += 30;
        else score += 20;

        // Baseado na especialidade (algumas são mais críticas)
        const especialidadesPrioritarias = ["tecnologia", "financeiro", "hr"];
        if (especialidadesPrioritarias.includes(processo.especialidade)) {
            score += 30;
        } else {
            score += 20;
        }

        // Baseado na complexidade (menos complexo = mais prioritário)
        const ferramentasCount = processo.ferramentas ? processo.ferramentas.length : 0;
        if (ferramentasCount <= 3) score += 30;
        else if (ferramentasCount <= 5) score += 20;
        else score += 10;

        if (score >= 80) return "crítica";
        if (score >= 60) return "alta";
        if (score >= 40) return "média";
        return "baixa";
    }

    /**
     * Avalia complexidade de implementação
     */
    avaliarComplexidadeImplementacao(processo, template) {
        let complexidade = 0;

        // Baseado no número de ferramentas
        const ferramentasCount = processo.ferramentas ? processo.ferramentas.length : 0;
        if (ferramentasCount > 5) complexidade += 30;
        else if (ferramentasCount > 3) complexidade += 20;
        else complexidade += 10;

        // Baseado no template (alguns são mais complexos)
        const templatesComplexos = ["tecnologia_deploy", "financeiro_aprovacao"];
        if (templatesComplexos.includes(template)) {
            complexidade += 30;
        } else {
            complexidade += 15;
        }

        // Baseado no potencial (mais automação = mais complexo)
        if (processo.potencial >= 80) complexidade += 25;
        else if (processo.potencial >= 60) complexidade += 15;
        else complexidade += 5;

        if (complexidade >= 60) return "alta";
        if (complexidade >= 35) return "média";
        return "baixa";
    }

    /**
     * Identifica integrações necessárias
     */
    identificarIntegracoes(ferramentas) {
        const integracoes = [];
        
        if (!ferramentas) return integracoes;

        ferramentas.forEach(ferramenta => {
            const normalizeFerramenta = ferramenta.toLowerCase().replace(/\s+/g, '');
            
            if (normalizeFerramenta.includes('slack')) {
                integracoes.push(this.integrationConfigs.slack);
            }
            if (normalizeFerramenta.includes('gmail') || normalizeFerramenta.includes('email')) {
                integracoes.push(this.integrationConfigs.gmail);
            }
            if (normalizeFerramenta.includes('sheets') || normalizeFerramenta.includes('planilha')) {
                integracoes.push(this.integrationConfigs.googlesheets);
            }
            if (normalizeFerramenta.includes('hubspot') || normalizeFerramenta.includes('crm')) {
                integracoes.push(this.integrationConfigs.hubspot);
            }
        });

        return integracoes;
    }

    /**
     * Cria template customizado para workflow específico
     */
    criarTemplateCustomizado(workflow) {
        const templateCustom = {
            name: `Automação ${workflow.nome}`,
            description: `Workflow automatizado para ${workflow.nome}`,
            triggers: ["webhook"],
            nodes: []
        };

        // Adicionar trigger inicial
        templateCustom.nodes.push({
            type: "webhook",
            name: "Trigger Inicial",
            config: { path: workflow.nome.toLowerCase().replace(/\s+/g, '-'), method: "POST" }
        });

        // Adicionar nós baseados nas etapas
        workflow.etapas.forEach((etapa, index) => {
            templateCustom.nodes.push({
                type: "function",
                name: `Processar ${etapa}`,
                config: { 
                    code: `// Processamento para: ${etapa}\nreturn items;`,
                    position: [460 + (index * 220), 300]
                }
            });
        });

        // Adicionar nó de finalização
        templateCustom.nodes.push({
            type: "slack",
            name: "Notificar Conclusão",
            config: { 
                channel: "#workflows", 
                message: `Workflow ${workflow.nome} executado com sucesso!`,
                position: [460 + (workflow.etapas.length * 220), 300]
            }
        });

        return templateCustom;
    }

    /**
     * Gera workflow N8N completo
     */
    gerarWorkflowN8N(workflowConfig, empresaCodigo) {
        try {
            const template = this.workflowTemplates[workflowConfig.template] || workflowConfig.template;
            
            // Criar estrutura base do workflow
            const workflow = {
                ...this.n8nTemplates.base_workflow,
                name: `${empresaCodigo.toUpperCase()}_${template.name}`,
                meta: {
                    empresa: empresaCodigo,
                    versao: "1.0.0",
                    autor: "VCM Auto-Generator",
                    data_criacao: new Date().toISOString(),
                    descricao: template.description,
                    especialidade: workflowConfig.especialidade,
                    processo_origem: workflowConfig.processo
                }
            };

            // Gerar nós do workflow
            const nodes = [];
            const connections = {};
            let nodeId = 1;
            let currentPosition = { x: 240, y: 300 };

            // Adicionar nós baseados no template
            template.nodes.forEach((nodeConfig, index) => {
                const node = this.criarNoN8N(nodeConfig, nodeId, currentPosition, empresaCodigo);
                nodes.push(node);

                // Configurar conexão (conectar ao nó anterior)
                if (index > 0) {
                    const previousNodeId = (nodeId - 1).toString();
                    const currentNodeId = nodeId.toString();
                    
                    if (!connections[previousNodeId]) {
                        connections[previousNodeId] = { main: [[]] };
                    }
                    connections[previousNodeId].main[0].push({
                        node: currentNodeId,
                        type: "main",
                        index: 0
                    });
                }

                nodeId++;
                currentPosition.x += 220; // Espaçamento horizontal entre nós
            });

            workflow.nodes = nodes;
            workflow.connections = connections;

            // Adicionar configurações específicas
            workflow.settings = {
                executionOrder: "v1",
                saveManualExecutions: true,
                callerPolicy: "workflowsFromSameOwner",
                errorWorkflow: this.criarWorkflowErro(empresaCodigo),
                timezone: "America/Sao_Paulo"
            };

            return workflow;

        } catch (error) {
            console.error(`❌ Erro ao gerar workflow N8N: ${error.message}`);
            return null;
        }
    }

    /**
     * Cria um nó N8N individual
     */
    criarNoN8N(nodeConfig, nodeId, position, empresaCodigo) {
        const baseNode = {
            id: nodeId.toString(),
            name: nodeConfig.name,
            type: this.mapearTipoNo(nodeConfig.type),
            position: [position.x, position.y],
            parameters: this.gerarParametrosNo(nodeConfig),
            typeVersion: 1,
            notes: `Gerado automaticamente para ${empresaCodigo}`
        };

        // Configurações específicas por tipo de nó
        if (nodeConfig.type === "webhook") {
            baseNode.webhookId = `${empresaCodigo}_${nodeConfig.config.path}`;
        }

        if (nodeConfig.type === "function") {
            baseNode.parameters.functionCode = nodeConfig.config.code;
        }

        if (nodeConfig.type === "slack") {
            baseNode.credentials = {
                slackApi: {
                    id: `slack_${empresaCodigo}`,
                    name: `Slack ${empresaCodigo.toUpperCase()}`
                }
            };
        }

        return baseNode;
    }

    /**
     * Mapeia tipo de nó para tipo N8N
     */
    mapearTipoNo(tipo) {
        const mapeamento = {
            "webhook": "n8n-nodes-base.webhook",
            "function": "n8n-nodes-base.function",
            "if": "n8n-nodes-base.if",
            "slack": "n8n-nodes-base.slack",
            "gmail": "n8n-nodes-base.gmail",
            "googlesheets": "n8n-nodes-base.googleSheets",
            "hubspot": "n8n-nodes-base.hubspot",
            "cron": "n8n-nodes-base.cron",
            "wait": "n8n-nodes-base.wait",
            "set": "n8n-nodes-base.set",
            "http": "n8n-nodes-base.httpRequest"
        };

        return mapeamento[tipo] || "n8n-nodes-base.function";
    }

    /**
     * Gera parâmetros específicos do nó
     */
    gerarParametrosNo(nodeConfig) {
        const parametros = {};

        switch (nodeConfig.type) {
            case "webhook":
                parametros.path = nodeConfig.config.path;
                parametros.httpMethod = nodeConfig.config.method || "POST";
                parametros.responseMode = "onReceived";
                break;

            case "slack":
                parametros.resource = "message";
                parametros.operation = "post";
                parametros.channel = nodeConfig.config.channel;
                parametros.text = nodeConfig.config.message;
                break;

            case "gmail":
                parametros.resource = "message";
                parametros.operation = "send";
                parametros.to = nodeConfig.config.to;
                parametros.subject = nodeConfig.config.subject;
                parametros.message = nodeConfig.config.message || "Enviado automaticamente pelo VCM";
                break;

            case "cron":
                parametros.rule = {
                    interval: [{
                        field: "cronExpression",
                        value: nodeConfig.config.expression
                    }]
                };
                break;

            case "if":
                parametros.conditions = {
                    string: [{
                        value1: nodeConfig.config.condition,
                        operation: "equal",
                        value2: "true"
                    }]
                };
                break;

            case "function":
                parametros.functionCode = nodeConfig.config.code;
                break;

            case "wait":
                parametros.amount = nodeConfig.config.amount;
                parametros.unit = nodeConfig.config.unit;
                break;

            default:
                parametros.operation = nodeConfig.config.operation || "execute";
                break;
        }

        return parametros;
    }

    /**
     * Cria workflow de tratamento de erro
     */
    criarWorkflowErro(empresaCodigo) {
        return `${empresaCodigo.toUpperCase()}_Error_Handler`;
    }

    /**
     * Gera documentação de implementação
     */
    gerarDocumentacaoImplementacao(workflows, empresaCodigo) {
        const documentacao = {
            empresa_codigo: empresaCodigo,
            data_geracao: new Date().toISOString(),
            total_workflows: workflows.length,
            
            // Guia de instalação
            guia_instalacao: {
                pre_requisitos: [
                    "N8N instalado e configurado",
                    "Credenciais configuradas para integrações",
                    "Webhooks URLs configuradas",
                    "Permissões de API validadas"
                ],
                passos_implementacao: [
                    "1. Importar workflows JSON no N8N",
                    "2. Configurar credenciais de integração",
                    "3. Testar conexões com sistemas externos",
                    "4. Ativar workflows em ambiente de teste",
                    "5. Validar execuções e ajustar parâmetros",
                    "6. Migrar para produção"
                ],
                configuracoes_necessarias: {
                    variaveis_ambiente: [
                        "N8N_HOST",
                        "N8N_PORT",
                        "N8N_PROTOCOL",
                        "WEBHOOK_URL_BASE"
                    ],
                    credenciais_integracoes: [
                        "Slack API Token",
                        "Google Service Account",
                        "HubSpot API Key",
                        "Email SMTP Config"
                    ]
                }
            },

            // Workflows implementados
            workflows_implementados: workflows.map(workflow => ({
                nome: workflow.name,
                descricao: workflow.meta.descricao,
                especialidade: workflow.meta.especialidade,
                processo_origem: workflow.meta.processo_origem,
                total_nos: workflow.nodes.length,
                triggers: workflow.nodes.filter(n => n.type.includes('webhook') || n.type.includes('cron')).length,
                integrações: [...new Set(workflow.nodes.map(n => n.type.split('.')[2]))],
                complexidade: this.avaliarComplexidadeWorkflow(workflow),
                tempo_estimado_setup: this.estimarTempoSetup(workflow)
            })),

            // Monitoramento e manutenção
            monitoramento: {
                metricas_acompanhar: [
                    "Taxa de sucesso de execuções",
                    "Tempo médio de execução",
                    "Frequência de erros",
                    "Uso de recursos (CPU/Memória)",
                    "Throughput de processamento"
                ],
                alertas_configurar: [
                    "Falha em workflow crítico",
                    "Execução com duração anômala",
                    "Erro de integração externa",
                    "Webhook não responsivo",
                    "Limite de API excedido"
                ],
                manutencao_periodica: [
                    "Revisão mensal de performance",
                    "Atualização de credenciais",
                    "Limpeza de logs antigos",
                    "Teste de disaster recovery",
                    "Backup de workflows"
                ]
            },

            // Troubleshooting
            troubleshooting: {
                problemas_comuns: [
                    {
                        problema: "Webhook não recebe dados",
                        causa: "URL incorreta ou filtros de rede",
                        solucao: "Verificar configuração de rede e URL"
                    },
                    {
                        problema: "Falha na autenticação API",
                        causa: "Credenciais expiradas ou inválidas",
                        solucao: "Renovar credenciais e testar conexão"
                    },
                    {
                        problema: "Timeout em execução",
                        causa: "Processamento demorado ou API lenta",
                        solucao: "Otimizar lógica ou aumentar timeout"
                    }
                ],
                logs_importantes: [
                    "Execução de workflows",
                    "Erros de integração",
                    "Performance de nós",
                    "Uso de credenciais"
                ]
            }
        };

        return documentacao;
    }

    /**
     * Avalia complexidade do workflow
     */
    avaliarComplexidadeWorkflow(workflow) {
        const totalNos = workflow.nodes.length;
        const tiposUnicos = [...new Set(workflow.nodes.map(n => n.type))].length;
        const conexoes = Object.keys(workflow.connections).length;

        const score = totalNos + (tiposUnicos * 2) + (conexoes * 1.5);

        if (score >= 20) return "alta";
        if (score >= 12) return "média";
        return "baixa";
    }

    /**
     * Estima tempo de setup
     */
    estimarTempoSetup(workflow) {
        const totalNos = workflow.nodes.length;
        const integracoes = [...new Set(workflow.nodes.map(n => n.type.split('.')[2]))].length;
        
        const tempoBase = 2; // horas base
        const tempoPorNo = 0.5; // horas por nó
        const tempoPorIntegracao = 1; // horas por integração

        const tempoTotal = tempoBase + (totalNos * tempoPorNo) + (integracoes * tempoPorIntegracao);

        return `${Math.ceil(tempoTotal)} horas`;
    }

    /**
     * Processa geração completa de workflows N8N
     */
    async processarWorkflowsN8N(empresaCodigo, inputPath = null, outputPath = null) {
        try {
            // Usar pasta AUTOMACAO como base
            const baseDir = path.join(__dirname, '..'); // AUTOMACAO/
            
            console.log(`🔍 Iniciando geração de workflows N8N para ${empresaCodigo.toUpperCase()}`);

            // Carregar análise de fluxos
            const fluxosPath = path.join(baseDir, 'fluxos_analise_completa.json');
            
            try {
                await fs.access(fluxosPath);
            } catch (error) {
                throw new Error(`Análise de fluxos não encontrada: ${fluxosPath}. Execute o Script 4 primeiro.`);
            }

            const fluxosData = JSON.parse(await fs.readFile(fluxosPath, 'utf8'));

            console.log(`📊 Analisando workflows de ${fluxosData.estatisticas.total_processos} processos`);

            // Analisar workflows para automação
            const analiseWorkflows = this.analisarWorkflowsParaAutomacao(fluxosData);
            
            if (!analiseWorkflows) {
                throw new Error('Falha na análise de workflows para automação');
            }

            console.log(`🔧 Identificados ${analiseWorkflows.total_workflows} workflows para automação`);

            // Gerar workflows N8N
            const workflowsGerados = [];
            const todosWorkflows = [
                ...analiseWorkflows.workflows_automatizaveis,
                ...analiseWorkflows.workflows_prioritarios
            ];

            for (const workflowConfig of todosWorkflows) {
                try {
                    const workflow = this.gerarWorkflowN8N(workflowConfig, empresaCodigo);
                    if (workflow) {
                        workflowsGerados.push({
                            config: workflowConfig,
                            workflow: workflow,
                            arquivo: `${workflow.name}.json`
                        });
                        console.log(`✅ Workflow gerado: ${workflow.name}`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Falha ao gerar workflow para ${workflowConfig.processo}: ${error.message}`);
                }
            }

            // Criar diretório de workflows
            const workflowsDir = path.join(baseDir, '06_N8N_WORKFLOWS');
            await fs.mkdir(workflowsDir, { recursive: true });

            // Salvar workflows individuais
            for (const workflowGerado of workflowsGerados) {
                const workflowPath = path.join(workflowsDir, workflowGerado.arquivo);
                await fs.writeFile(workflowPath, JSON.stringify(workflowGerado.workflow, null, 2), 'utf8');
            }

            // Gerar documentação de implementação
            const documentacao = this.gerarDocumentacaoImplementacao(
                workflowsGerados.map(w => w.workflow), 
                empresaCodigo
            );

            // Criar resultado consolidado
            const resultadoN8N = {
                empresa_codigo: empresaCodigo,
                versao_n8n: "1.0.0",
                data_geracao: new Date().toISOString(),
                
                // Workflows gerados
                workflows: workflowsGerados.map(w => ({
                    nome: w.workflow.name,
                    arquivo: w.arquivo,
                    processo_origem: w.config.processo,
                    especialidade: w.config.especialidade,
                    prioridade: w.config.prioridade,
                    complexidade: w.config.complexidade,
                    nos_count: w.workflow.nodes.length
                })),
                
                // Estatísticas
                estatisticas: {
                    total_workflows: workflowsGerados.length,
                    workflows_alta_prioridade: workflowsGerados.filter(w => w.config.prioridade === "alta" || w.config.prioridade === "crítica").length,
                    workflows_baixa_complexidade: workflowsGerados.filter(w => w.config.complexidade === "baixa").length,
                    especialidades_cobertas: [...new Set(workflowsGerados.map(w => w.config.especialidade))],
                    integracoes_unicas: [...new Set(workflowsGerados.flatMap(w => 
                        w.workflow.nodes.map(n => n.type.split('.')[2])
                    ))].filter(i => i !== 'base')
                },
                
                // Implementação
                implementacao: {
                    documentacao: documentacao,
                    ordem_implementacao: workflowsGerados
                        .sort((a, b) => {
                            const prioridades = { "crítica": 4, "alta": 3, "média": 2, "baixa": 1 };
                            return prioridades[b.config.prioridade] - prioridades[a.config.prioridade];
                        })
                        .map(w => ({
                            nome: w.workflow.name,
                            prioridade: w.config.prioridade,
                            ordem: workflowsGerados.indexOf(w) + 1
                        })),
                    tempo_total_setup: this.calcularTempoTotalSetup(workflowsGerados.map(w => w.workflow))
                }
            };

            // Criar estruturas individuais por persona
            const personasDir = path.join(baseDir, '04_BIOS_PERSONAS');
            const categorias = await fs.readdir(personasDir);

            for (const categoria of categorias) {
                const categoriaPath = path.join(personasDir, categoria);
                const categoriaStats = await fs.stat(categoriaPath);
                
                if (!categoriaStats.isDirectory()) continue;

                const personas = await fs.readdir(categoriaPath);
                
                for (const personaFolder of personas) {
                    const personaPath = path.join(categoriaPath, personaFolder);
                    const personaStats = await fs.stat(personaPath);
                    
                    if (!personaStats.isDirectory()) continue;

                    // Criar pasta script5_n8n
                    const script5Dir = path.join(personaPath, 'script5_n8n');
                    await fs.mkdir(script5Dir, { recursive: true });

                    // Buscar workflows relevantes para a persona
                    const workflowsRelevantes = workflowsGerados.filter(w => 
                        w.config.especialidade === categoria ||
                        w.workflow.meta.especialidade === categoria
                    );

                    const n8nPersona = {
                        persona_folder: personaFolder,
                        categoria: categoria,
                        workflows_aplicaveis: workflowsRelevantes.map(w => ({
                            nome: w.workflow.name,
                            arquivo: w.arquivo,
                            descricao: w.workflow.meta.descricao,
                            complexidade: w.config.complexidade,
                            prioridade: w.config.prioridade
                        })),
                        implementacao_sugerida: {
                            primeiro_workflow: workflowsRelevantes.length > 0 ? workflowsRelevantes[0].workflow.name : null,
                            ordem_implementacao: workflowsRelevantes.map((w, idx) => ({
                                ordem: idx + 1,
                                nome: w.workflow.name,
                                justificativa: `Workflow ${idx === 0 ? 'prioritário' : 'secundário'} para ${categoria}`
                            }))
                        },
                        recursos_necessarios: {
                            credenciais: [...new Set(workflowsRelevantes.flatMap(w =>
                                w.workflow.nodes
                                    .filter(n => n.credentials)
                                    .map(n => Object.keys(n.credentials)[0])
                            ))],
                            apis_integradas: [...new Set(workflowsRelevantes.flatMap(w =>
                                w.workflow.nodes.map(n => n.type.split('.')[2])
                            ))].filter(i => i !== 'base')
                        },
                        data_processamento: new Date().toISOString()
                    };

                    // Salvar dados N8N da persona
                    const n8nPersonaPath = path.join(script5Dir, 'n8n_workflows.json');
                    await fs.writeFile(n8nPersonaPath, JSON.stringify(n8nPersona, null, 2), 'utf8');

                    console.log(`✅ N8N configurado: ${personaFolder} (${categoria})`);
                }
            }

            // Salvar resultado consolidado
            const resultadoPath = path.join(baseDir, 'n8n_workflows_completo.json');
            await fs.writeFile(resultadoPath, JSON.stringify(resultadoN8N, null, 2), 'utf8');

            // Salvar documentação de implementação
            const documentacaoPath = path.join(workflowsDir, 'IMPLEMENTACAO.md');
            const markdownDoc = this.gerarDocumentacaoMarkdown(documentacao);
            await fs.writeFile(documentacaoPath, markdownDoc, 'utf8');

            console.log(`\n✅ SCRIPT 5 - WORKFLOWS N8N FINALIZADO`);
            console.log(`📊 Resultados:`);
            console.log(`   - ${workflowsGerados.length} workflows N8N gerados`);
            console.log(`   - ${resultadoN8N.estatisticas.workflows_alta_prioridade} workflows de alta prioridade`);
            console.log(`   - ${resultadoN8N.estatisticas.especialidades_cobertas.length} especialidades cobertas`);
            console.log(`   - ${resultadoN8N.estatisticas.integracoes_unicas.length} tipos de integração`);
            console.log(`📁 Workflows salvos em: ${workflowsDir}`);
            console.log(`📋 Documentação: ${documentacaoPath}`);
            console.log(`🎯 Resultado consolidado: ${resultadoPath}`);

            return {
                success: true,
                total_workflows: workflowsGerados.length,
                workflows_alta_prioridade: resultadoN8N.estatisticas.workflows_alta_prioridade,
                especialidades_cobertas: resultadoN8N.estatisticas.especialidades_cobertas.length,
                output_path: resultadoPath,
                workflows_dir: workflowsDir,
                data: resultadoN8N
            };

        } catch (error) {
            console.error(`❌ Erro no Script 5 - Workflows N8N: ${error.message}`);
            throw error;
        }
    }

    /**
     * Calcula tempo total de setup
     */
    calcularTempoTotalSetup(workflows) {
        const tempoTotal = workflows.reduce((total, workflow) => {
            const tempoWorkflow = parseInt(this.estimarTempoSetup(workflow).split(' ')[0]);
            return total + tempoWorkflow;
        }, 0);

        return `${tempoTotal} horas (${Math.ceil(tempoTotal / 8)} dias úteis)`;
    }

    /**
     * Gera documentação em Markdown
     */
    gerarDocumentacaoMarkdown(documentacao) {
        return `# Implementação de Workflows N8N - ${documentacao.empresa_codigo.toUpperCase()}

## 📋 Visão Geral

- **Total de Workflows:** ${documentacao.total_workflows}
- **Data de Geração:** ${new Date(documentacao.data_geracao).toLocaleDateString('pt-BR')}
- **Versão:** 1.0.0

## 🚀 Guia de Instalação

### Pré-requisitos
${documentacao.guia_instalacao.pre_requisitos.map(item => `- ${item}`).join('\n')}

### Passos de Implementação
${documentacao.guia_instalacao.passos_implementacao.map(item => `${item}`).join('\n')}

## ⚙️ Configurações Necessárias

### Variáveis de Ambiente
\`\`\`bash
${documentacao.guia_instalacao.configuracoes_necessarias.variaveis_ambiente.map(v => `${v}=valor_aqui`).join('\n')}
\`\`\`

### Credenciais de Integração
${documentacao.guia_instalacao.configuracoes_necessarias.credenciais_integracoes.map(cred => `- ${cred}`).join('\n')}

## 🔧 Workflows Implementados

${documentacao.workflows_implementados.map(w => `
### ${w.nome}
- **Descrição:** ${w.descricao}
- **Especialidade:** ${w.especialidade}
- **Complexidade:** ${w.complexidade}
- **Tempo de Setup:** ${w.tempo_estimado_setup}
- **Total de Nós:** ${w.total_nos}
`).join('\n')}

## 📊 Monitoramento

### Métricas a Acompanhar
${documentacao.monitoramento.metricas_acompanhar.map(m => `- ${m}`).join('\n')}

### Alertas Recomendados
${documentacao.monitoramento.alertas_configurar.map(a => `- ${a}`).join('\n')}

## 🔍 Troubleshooting

${documentacao.troubleshooting.problemas_comuns.map(p => `
### ${p.problema}
- **Causa:** ${p.causa}
- **Solução:** ${p.solucao}
`).join('\n')}

## 📝 Manutenção

${documentacao.monitoramento.manutencao_periodica.map(m => `- ${m}`).join('\n')}

---
*Gerado automaticamente pelo VCM (Virtual Company Manager)*`;
    }
}

// Função principal para execução via CLI
async function main() {
    const args = process.argv.slice(2);
    let empresaCodigo = null;
    let inputPath = null;
    let outputPath = null;

    // Processar argumentos da linha de comando
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--empresa-codigo') {
            empresaCodigo = args[i + 1];
        }
        if (args[i] === '--input-path') {
            inputPath = args[i + 1];
        }
        if (args[i] === '--output-path') {
            outputPath = args[i + 1];
        }
    }

    if (!empresaCodigo) {
        console.error('❌ Erro: --empresa-codigo é obrigatório');
        console.log('Uso: node 05_generate_workflows_n8n.js --empresa-codigo CODIGO_EMPRESA [--input-path PATH] [--output-path PATH]');
        process.exit(1);
    }

    try {
        const generator = new WorkflowsN8NGenerator();
        const result = await generator.processarWorkflowsN8N(empresaCodigo, inputPath, outputPath);
        
        console.log('\n🎉 Script 5 executado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error(`❌ Erro na execução: ${error.message}`);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

// Exportar classe para uso como módulo
module.exports = { WorkflowsN8NGenerator };