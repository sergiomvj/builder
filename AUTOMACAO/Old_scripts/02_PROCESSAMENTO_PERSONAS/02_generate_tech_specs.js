#!/usr/bin/env node
/**
 * 🎯 SCRIPT 2 - ESPECIFICAÇÕES TÉCNICAS (Node.js)
 * ===============================================
 * 
 * Geração de especificações técnicas detalhadas para sistemas e ferramentas
 * baseada na análise de competências, criando documentação para implementação.
 * 
 * Migrado de Python para Node.js mantendo funcionalidade 100% idêntica
 * 
 * Funcionalidades:
 * - Análise de competências e ferramentas identificadas
 * - Geração de especificações técnicas por categoria
 * - Mapeamento de requisitos de sistema e infraestrutura
 * - Documentação de APIs e integrações necessárias
 * - Output para Scripts 3-5 (RAG, Workflows)
 * 
 * @author Sergio Castro
 * @version 1.0.0 (Node.js)
 * @date 2024-12-19
 */

const fs = require('fs').promises;
const path = require('path');

class TechSpecsGenerator {
    constructor() {
        // Especificações técnicas base por categoria de ferramenta
        this.techSpecs = {
            crm_sistemas: {
                categoria: "CRM e Gestão de Relacionamento",
                ferramentas: ["HubSpot", "Salesforce", "Pipedrive", "Zoho CRM"],
                especificacoes: {
                    integracao_api: {
                        tipo: "REST API",
                        autenticacao: "OAuth 2.0 / API Key",
                        rate_limits: "1000-5000 requests/hour",
                        webhooks: true,
                        formatos_dados: ["JSON", "XML"]
                    },
                    requisitos_sistema: {
                        cloud_native: true,
                        backup_frequencia: "diário",
                        uptime_garantido: "99.9%",
                        seguranca: ["SSL/TLS", "2FA", "GDPR Compliance"]
                    },
                    funcionalidades_core: [
                        "Gestão de Contatos",
                        "Pipeline de Vendas",
                        "Automação de Marketing",
                        "Relatórios e Analytics",
                        "Gestão de Tarefas"
                    ]
                }
            },
            comunicacao_colaboracao: {
                categoria: "Comunicação e Colaboração",
                ferramentas: ["Slack", "Microsoft Teams", "Zoom", "Google Meet"],
                especificacoes: {
                    integracao_api: {
                        tipo: "REST API + WebSockets",
                        autenticacao: "OAuth 2.0",
                        real_time: true,
                        webhooks: true,
                        bot_framework: true
                    },
                    requisitos_sistema: {
                        largura_banda: "mínimo 1 Mbps por usuário",
                        latencia_maxima: "150ms",
                        dispositivos_suportados: ["Desktop", "Mobile", "Tablet"],
                        cross_platform: true
                    },
                    funcionalidades_core: [
                        "Mensagens Instantâneas",
                        "Videoconferência",
                        "Compartilhamento de Arquivos",
                        "Integrações com Apps",
                        "Canais Organizados"
                    ]
                }
            },
            produtividade_escritorio: {
                categoria: "Produtividade e Escritório",
                ferramentas: ["Microsoft Office 365", "Google Workspace", "Notion", "Trello"],
                especificacoes: {
                    integracao_api: {
                        tipo: "REST API + Graph API",
                        autenticacao: "OAuth 2.0 / SAML",
                        sincronizacao: "real-time",
                        offline_support: true,
                        versionamento: "automático"
                    },
                    requisitos_sistema: {
                        armazenamento_base: "1TB por usuário",
                        sincronizacao_dispositivos: "ilimitada",
                        backup_automatico: true,
                        colaboracao_simultanea: "100+ usuários"
                    },
                    funcionalidades_core: [
                        "Processamento de Texto",
                        "Planilhas Avançadas",
                        "Apresentações",
                        "Gerenciamento de E-mail",
                        "Calendário Integrado"
                    ]
                }
            },
            analytics_bi: {
                categoria: "Analytics e Business Intelligence",
                ferramentas: ["Power BI", "Tableau", "Google Analytics", "Looker"],
                especificacoes: {
                    integracao_api: {
                        tipo: "REST API + ODATA",
                        autenticacao: "Service Principal + OAuth",
                        data_refresh: "programado + real-time",
                        custom_connectors: true,
                        embedded_analytics: true
                    },
                    requisitos_sistema: {
                        processamento_dados: "até 10GB por dataset",
                        performance_queries: "< 5 segundos",
                        concurrent_users: "500+ usuários",
                        data_warehouse: "compatível com SQL"
                    },
                    funcionalidades_core: [
                        "Dashboards Interativos",
                        "Relatórios Automatizados",
                        "Data Modeling",
                        "Alertas Inteligentes",
                        "Visualizações Avançadas"
                    ]
                }
            },
            desenvolvimento_design: {
                categoria: "Desenvolvimento e Design",
                ferramentas: ["Adobe Creative Suite", "Figma", "Git/GitHub", "Docker"],
                especificacoes: {
                    integracao_api: {
                        tipo: "REST API + WebHooks",
                        autenticacao: "OAuth 2.0 + Personal Access Tokens",
                        ci_cd_integration: true,
                        version_control: "Git-based",
                        asset_management: true
                    },
                    requisitos_sistema: {
                        hardware_minimo: "16GB RAM, GPU dedicada",
                        armazenamento_projetos: "500GB por usuário",
                        network_speed: "100 Mbps para colaboração",
                        backup_versioned: "incremental diário"
                    },
                    funcionalidades_core: [
                        "Design Colaborativo",
                        "Version Control",
                        "Asset Libraries",
                        "Prototipagem Interativa",
                        "Deploy Automatizado"
                    ]
                }
            },
            cloud_infrastructure: {
                categoria: "Cloud e Infraestrutura",
                ferramentas: ["AWS", "Azure", "Google Cloud", "Docker", "Kubernetes"],
                especificacoes: {
                    integracao_api: {
                        tipo: "REST API + CLI + SDKs",
                        autenticacao: "IAM + Service Accounts",
                        automation: "Infrastructure as Code",
                        monitoring: "CloudWatch/Azure Monitor",
                        scaling: "auto-scaling habilitado"
                    },
                    requisitos_sistema: {
                        availability_zones: "mínimo 2 AZs",
                        disaster_recovery: "RTO < 4 horas",
                        security_compliance: ["SOC 2", "ISO 27001", "GDPR"],
                        cost_optimization: "reserved instances + spot"
                    },
                    funcionalidades_core: [
                        "Container Orchestration",
                        "Auto-scaling",
                        "Load Balancing",
                        "Monitoring e Alertas",
                        "Backup e Recovery"
                    ]
                }
            }
        };

        // Templates de documentação técnica
        this.documentTemplates = {
            sistema_overview: {
                sections: [
                    "Visão Geral do Sistema",
                    "Arquitetura Técnica",
                    "Componentes Principais", 
                    "Integrações e APIs",
                    "Requisitos de Infraestrutura",
                    "Segurança e Compliance",
                    "Monitoramento e Manutenção"
                ]
            },
            api_documentation: {
                sections: [
                    "Endpoints Disponíveis",
                    "Autenticação e Autorização",
                    "Rate Limiting",
                    "Formatos de Request/Response",
                    "Códigos de Erro",
                    "SDKs e Bibliotecas",
                    "Exemplos de Implementação"
                ]
            },
            deployment_guide: {
                sections: [
                    "Pré-requisitos de Sistema",
                    "Processo de Instalação",
                    "Configuração de Ambiente",
                    "Variáveis de Ambiente",
                    "Scripts de Deploy",
                    "Verificação de Health Check",
                    "Troubleshooting"
                ]
            }
        };
    }

    /**
     * Analisa competências e mapeia para especificações técnicas
     */
    analisarCompetenciasParaSpecs(competenciasData) {
        try {
            const ferramentasIdentificadas = new Set();
            const categoriasNecessarias = new Set();
            const especificacoesPersonalizadas = {};

            // Iterar por todas as personas
            for (const [personaId, personaData] of Object.entries(competenciasData.personas)) {
                const { competencias, persona } = personaData;

                // Adicionar ferramentas identificadas
                competencias.ferramentas.forEach(ferramenta => {
                    ferramentasIdentificadas.add(ferramenta);
                    
                    // Mapear para categorias de spec técnica
                    const categoria = this.mapearFerramentaParaCategoria(ferramenta);
                    if (categoria) {
                        categoriasNecessarias.add(categoria);
                    }
                });

                // Criar especificações personalizadas baseadas na especialidade
                if (persona.especialidade) {
                    especificacoesPersonalizadas[persona.especialidade] = 
                        this.gerarSpecPersonalizada(persona.especialidade, competencias);
                }
            }

            return {
                ferramentas_identificadas: Array.from(ferramentasIdentificadas),
                categorias_necessarias: Array.from(categoriasNecessarias),
                especificacoes_personalizadas: especificacoesPersonalizadas,
                total_ferramentas: ferramentasIdentificadas.size
            };

        } catch (error) {
            console.error(`❌ Erro na análise de competências: ${error.message}`);
            return null;
        }
    }

    /**
     * Mapeia ferramenta para categoria de especificação técnica
     */
    mapearFerramentaParaCategoria(ferramenta) {
        const mapeamento = {
            // CRM e relacionamento
            'HubSpot': 'crm_sistemas',
            'Salesforce': 'crm_sistemas', 
            'Pipedrive': 'crm_sistemas',
            'Zoho CRM': 'crm_sistemas',

            // Comunicação
            'Slack': 'comunicacao_colaboracao',
            'Microsoft Teams': 'comunicacao_colaboracao',
            'Zoom': 'comunicacao_colaboracao',
            'Google Meet': 'comunicacao_colaboracao',

            // Produtividade
            'Microsoft Office 365': 'produtividade_escritorio',
            'Google Workspace': 'produtividade_escritorio',
            'Notion': 'produtividade_escritorio',
            'Trello': 'produtividade_escritorio',

            // Analytics
            'Power BI': 'analytics_bi',
            'Tableau': 'analytics_bi',
            'Google Analytics': 'analytics_bi',
            'Looker': 'analytics_bi',

            // Design e desenvolvimento
            'Adobe Creative Suite': 'desenvolvimento_design',
            'Figma': 'desenvolvimento_design',
            'Git/GitHub': 'desenvolvimento_design',
            'Docker': 'cloud_infrastructure',

            // Cloud
            'AWS': 'cloud_infrastructure',
            'Azure': 'cloud_infrastructure',
            'Google Cloud': 'cloud_infrastructure',
            'Kubernetes': 'cloud_infrastructure'
        };

        return mapeamento[ferramenta] || null;
    }

    /**
     * Gera especificação personalizada para uma especialidade
     */
    gerarSpecPersonalizada(especialidade, competencias) {
        const specBase = {
            especialidade: especialidade,
            competencias_tecnicas: competencias.tecnicas,
            ferramentas_principais: competencias.ferramentas,
            requisitos_especificos: [],
            integracao_sugerida: [],
            documentacao_necessaria: []
        };

        // Especificações por especialidade
        switch (especialidade) {
            case 'youtube':
                specBase.requisitos_especificos = [
                    "Storage para vídeos: mínimo 2TB",
                    "Upload speed: mínimo 100 Mbps",
                    "GPU para edição: GTX 1660 ou superior",
                    "Backup automático de projetos"
                ];
                specBase.integracao_sugerida = [
                    "YouTube Data API v3",
                    "Google Drive API",
                    "Adobe Creative Cloud APIs",
                    "Analytics Reporting API"
                ];
                break;

            case 'midias_sociais':
                specBase.requisitos_especificos = [
                    "Social Media Management Platform",
                    "Multi-account authentication",
                    "Content scheduling system",
                    "Analytics aggregation dashboard"
                ];
                specBase.integracao_sugerida = [
                    "Facebook Graph API",
                    "Instagram Basic Display API",
                    "Twitter API v2",
                    "LinkedIn Marketing API"
                ];
                break;

            case 'marketing':
                specBase.requisitos_especificos = [
                    "Marketing automation platform",
                    "A/B testing framework",
                    "Customer segmentation engine",
                    "ROI tracking dashboard"
                ];
                specBase.integracao_sugerida = [
                    "Google Ads API",
                    "Facebook Marketing API",
                    "Email service provider APIs",
                    "CRM integration APIs"
                ];
                break;

            case 'financeiro':
                specBase.requisitos_especificos = [
                    "Financial data security (encryption)",
                    "Audit trail capabilities",
                    "Multi-currency support",
                    "Compliance reporting tools"
                ];
                specBase.integracao_sugerida = [
                    "Banking APIs (Open Banking)",
                    "ERP system integration",
                    "Tax calculation APIs",
                    "Regulatory reporting APIs"
                ];
                break;

            case 'hr':
                specBase.requisitos_especificos = [
                    "HRIS platform integration",
                    "Employee data privacy controls", 
                    "Performance tracking system",
                    "Recruitment workflow automation"
                ];
                specBase.integracao_sugerida = [
                    "ATS (Applicant Tracking) APIs",
                    "Payroll system APIs",
                    "Learning Management APIs",
                    "Background check APIs"
                ];
                break;

            case 'tecnologia':
                specBase.requisitos_especificos = [
                    "Development environment setup",
                    "CI/CD pipeline configuration",
                    "Code repository management",
                    "Monitoring and alerting system"
                ];
                specBase.integracao_sugerida = [
                    "GitHub/GitLab APIs",
                    "Container registry APIs",
                    "Cloud provider APIs",
                    "Monitoring service APIs"
                ];
                break;
        }

        specBase.documentacao_necessaria = [
            "API Integration Guide",
            "System Requirements Document",
            "Security Configuration Guide", 
            "User Training Materials",
            "Troubleshooting Handbook"
        ];

        return specBase;
    }

    /**
     * Gera documentação técnica completa
     */
    gerarDocumentacaoTecnica(analiseSpecs, empresaCodigo) {
        const documentacao = {
            empresa_codigo: empresaCodigo,
            data_geracao: new Date().toISOString(),
            
            // Visão geral do sistema
            sistema_overview: {
                descricao: `Sistema integrado para ${empresaCodigo.toUpperCase()} com ${analiseSpecs.total_ferramentas} ferramentas principais`,
                categorias_implementadas: analiseSpecs.categorias_necessarias,
                ferramentas_core: analiseSpecs.ferramentas_identificadas,
                arquitetura_recomendada: "Microserviços com API Gateway"
            },

            // Especificações por categoria
            especificacoes_categorias: {},

            // Requisitos de infraestrutura
            infraestrutura_requisitos: {
                cloud_provider: "AWS/Azure (recomendado)",
                compute_instances: "t3.medium para desenvolvimento, m5.large para produção",
                database: "PostgreSQL 13+ ou MySQL 8.0+",
                cache: "Redis 6.0+",
                monitoring: "CloudWatch/Azure Monitor + Grafana",
                backup_strategy: "Snapshots diários + replicação cross-region"
            },

            // Plano de implementação
            implementacao_roadmap: {
                fase_1: "Infraestrutura base e autenticação",
                fase_2: "Integração de ferramentas core",
                fase_3: "Automações e workflows",
                fase_4: "Analytics e relatórios",
                fase_5: "Otimização e scaling"
            }
        };

        // Gerar especificações por categoria identificada
        analiseSpecs.categorias_necessarias.forEach(categoria => {
            if (this.techSpecs[categoria]) {
                documentacao.especificacoes_categorias[categoria] = {
                    ...this.techSpecs[categoria],
                    status_implementacao: "planejado",
                    prioridade: this.definirPrioridadeCategoria(categoria),
                    tempo_estimado_implementacao: this.estimarTempoImplementacao(categoria)
                };
            }
        });

        return documentacao;
    }

    /**
     * Define prioridade de implementação para uma categoria
     */
    definirPrioridadeCategoria(categoria) {
        const prioridades = {
            'comunicacao_colaboracao': 'alta',
            'produtividade_escritorio': 'alta', 
            'crm_sistemas': 'média',
            'analytics_bi': 'média',
            'desenvolvimento_design': 'baixa',
            'cloud_infrastructure': 'alta'
        };

        return prioridades[categoria] || 'média';
    }

    /**
     * Estima tempo de implementação para uma categoria
     */
    estimarTempoImplementacao(categoria) {
        const tempos = {
            'comunicacao_colaboracao': '2-3 semanas',
            'produtividade_escritorio': '1-2 semanas',
            'crm_sistemas': '4-6 semanas', 
            'analytics_bi': '6-8 semanas',
            'desenvolvimento_design': '3-4 semanas',
            'cloud_infrastructure': '2-4 semanas'
        };

        return tempos[categoria] || '2-3 semanas';
    }

    /**
     * Processa análise de competências e gera especificações técnicas
     */
    async processarTechSpecs(empresaCodigo, inputPath = null, outputPath = null) {
        try {
            // Usar pasta AUTOMACAO como base
            const baseDir = path.join(__dirname, '..'); // AUTOMACAO/
            
            // Localizar arquivo de análise de competências
            let competenciasPath;
            if (inputPath) {
                competenciasPath = inputPath;
            } else {
                competenciasPath = path.join(baseDir, 'competencias_analysis.json');
            }

            console.log(`🔍 Carregando análise de competências: ${competenciasPath}`);

            // Verificar se arquivo existe
            try {
                await fs.access(competenciasPath);
            } catch (error) {
                throw new Error(`Arquivo de competências não encontrado: ${competenciasPath}`);
            }

            // Carregar dados de competências
            const competenciasData = JSON.parse(await fs.readFile(competenciasPath, 'utf8'));

            console.log(`📊 Analisando ${competenciasData.total_personas} personas para especificações técnicas`);

            // Analisar competências para especificações
            const analiseSpecs = this.analisarCompetenciasParaSpecs(competenciasData);
            
            if (!analiseSpecs) {
                throw new Error('Falha na análise de competências para especificações técnicas');
            }

            console.log(`🔧 Identificadas ${analiseSpecs.total_ferramentas} ferramentas únicas`);
            console.log(`📋 Categorias técnicas necessárias: ${analiseSpecs.categorias_necessarias.join(', ')}`);

            // Gerar documentação técnica completa
            const documentacaoTecnica = this.gerarDocumentacaoTecnica(analiseSpecs, empresaCodigo);

            // Criar estrutura de diretórios para scripts 2
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

                    // Criar pasta script2_techspecs
                    const script2Dir = path.join(personaPath, 'script2_techspecs');
                    await fs.mkdir(script2Dir, { recursive: true });

                    // Buscar dados específicos da persona
                    const personaData = competenciasData.personas[personaFolder];
                    
                    if (!personaData) continue;

                    // Gerar especificações técnicas específicas da persona
                    const techSpecsPersona = {
                        persona: personaData.persona,
                        especificacoes_tecnicas: {
                            ferramentas_utilizadas: personaData.competencias.ferramentas,
                            categorias_aplicaveis: personaData.competencias.ferramentas
                                .map(f => this.mapearFerramentaParaCategoria(f))
                                .filter(Boolean),
                            requisitos_personalizados: analiseSpecs.especificacoes_personalizadas[personaData.persona.especialidade] || {},
                            integracao_prioridade: this.definirPrioridadeIntegracao(personaData.competencias.ferramentas)
                        },
                        documentacao_tecnica: {
                            apis_necessarias: this.identificarAPIsNecessarias(personaData.competencias.ferramentas),
                            requisitos_sistema: this.definirRequisitosEspecificos(personaData.competencias.ferramentas),
                            guias_implementacao: this.gerarGuiasImplementacao(personaData.competencias.ferramentas)
                        },
                        data_processamento: new Date().toISOString()
                    };

                    // Salvar especificações técnicas da persona
                    const techSpecsPath = path.join(script2Dir, 'tech_specs_core.json');
                    await fs.writeFile(techSpecsPath, JSON.stringify(techSpecsPersona, null, 2), 'utf8');

                    console.log(`✅ Tech specs geradas: ${personaData.persona.nome} (${categoria})`);
                }
            }

            // Salvar documentação técnica consolidada
            const docTecnicaPath = path.join(baseDir, 'tech_specifications.json');
            await fs.writeFile(docTecnicaPath, JSON.stringify(documentacaoTecnica, null, 2), 'utf8');

            console.log(`\n✅ SCRIPT 2 - TECH SPECS FINALIZADO`);
            console.log(`📊 Especificações técnicas geradas para ${competenciasData.total_personas} personas`);
            console.log(`📁 Documentação técnica salva: ${docTecnicaPath}`);
            console.log(`🔧 Categorias implementadas: ${analiseSpecs.categorias_necessarias.length}`);
            console.log(`🛠️ APIs identificadas: ${analiseSpecs.total_ferramentas}`);

            return {
                success: true,
                total_personas: competenciasData.total_personas,
                categorias_specs: analiseSpecs.categorias_necessarias.length,
                output_path: docTecnicaPath,
                data: documentacaoTecnica
            };

        } catch (error) {
            console.error(`❌ Erro no Script 2 - Tech Specs: ${error.message}`);
            throw error;
        }
    }

    /**
     * Define prioridade de integração baseada nas ferramentas
     */
    definirPrioridadeIntegracao(ferramentas) {
        const prioridades = {
            alta: ['Microsoft Office 365', 'Google Workspace', 'Slack', 'Zoom'],
            media: ['HubSpot', 'Salesforce', 'Power BI', 'Tableau'],
            baixa: ['Adobe Creative Suite', 'Figma', 'Docker', 'Kubernetes']
        };

        const encontradas = { alta: 0, media: 0, baixa: 0 };
        
        ferramentas.forEach(ferramenta => {
            if (prioridades.alta.includes(ferramenta)) encontradas.alta++;
            else if (prioridades.media.includes(ferramenta)) encontradas.media++;
            else if (prioridades.baixa.includes(ferramenta)) encontradas.baixa++;
        });

        // Retorna a prioridade com maior contagem
        const maxPrioridade = Object.keys(encontradas).reduce((a, b) => 
            encontradas[a] > encontradas[b] ? a : b
        );

        return maxPrioridade;
    }

    /**
     * Identifica APIs necessárias para as ferramentas
     */
    identificarAPIsNecessarias(ferramentas) {
        const apiMapping = {
            'Microsoft Office 365': ['Microsoft Graph API', 'SharePoint API'],
            'Google Workspace': ['Google Workspace API', 'Gmail API', 'Drive API'],
            'Slack': ['Slack Web API', 'Slack Events API'],
            'Zoom': ['Zoom API v2', 'Zoom Webhooks'],
            'HubSpot': ['HubSpot CRM API', 'HubSpot Marketing API'],
            'Power BI': ['Power BI REST API', 'Power BI Embedded API'],
            'Salesforce': ['Salesforce REST API', 'Salesforce Bulk API']
        };

        const apisNecessarias = [];
        ferramentas.forEach(ferramenta => {
            if (apiMapping[ferramenta]) {
                apisNecessarias.push(...apiMapping[ferramenta]);
            }
        });

        return [...new Set(apisNecessarias)]; // Remove duplicatas
    }

    /**
     * Define requisitos específicos do sistema
     */
    definirRequisitosEspecificos(ferramentas) {
        const requisitos = {
            computacao: "2 vCPU, 4GB RAM mínimo",
            armazenamento: "50GB SSD mínimo",
            rede: "10 Mbps mínimo",
            seguranca: ["SSL/TLS", "OAuth 2.0"],
            backup: "diário automático"
        };

        // Ajustar baseado nas ferramentas
        if (ferramentas.some(f => ['Adobe Creative Suite', 'Figma'].includes(f))) {
            requisitos.computacao = "4 vCPU, 16GB RAM recomendado";
            requisitos.armazenamento = "500GB SSD recomendado";
        }

        if (ferramentas.some(f => ['Power BI', 'Tableau'].includes(f))) {
            requisitos.computacao = "4 vCPU, 8GB RAM recomendado";
            requisitos.rede = "50 Mbps recomendado";
        }

        return requisitos;
    }

    /**
     * Gera guias de implementação
     */
    gerarGuiasImplementacao(ferramentas) {
        return [
            "Setup e Configuração Inicial",
            "Integração de APIs",
            "Configuração de Segurança",
            "Testes de Conectividade",
            "Deploy em Produção",
            "Monitoramento e Manutenção"
        ];
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
        console.log('Uso: node 02_generate_tech_specs.js --empresa-codigo CODIGO_EMPRESA [--input-path PATH] [--output-path PATH]');
        process.exit(1);
    }

    try {
        const generator = new TechSpecsGenerator();
        const result = await generator.processarTechSpecs(empresaCodigo, inputPath, outputPath);
        
        console.log('\n🎉 Script 2 executado com sucesso!');
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
module.exports = { TechSpecsGenerator };