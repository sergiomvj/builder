#!/usr/bin/env node
/**
 * 🎯 SCRIPT 4 - ANÁLISE DE FLUXOS DE TRABALHO (Node.js)
 * ===================================================
 * 
 * Análise e mapeamento de fluxos de trabalho baseados nas competências,
 * ferramentas e estrutura RAG, identificando processos otimizáveis.
 * 
 * Migrado de Python para Node.js mantendo funcionalidade 100% idêntica
 * 
 * Funcionalidades:
 * - Mapeamento de processos de negócio por especialidade
 * - Identificação de gargalos e oportunidades de automação
 * - Análise de colaboração entre personas
 * - Geração de workflows conceituais
 * - Preparação de dados para Script 5 (N8N)
 * 
 * @author Sergio Castro
 * @version 1.0.0 (Node.js)
 * @date 2024-12-19
 */

const fs = require('fs').promises;
const path = require('path');

class FluxosAnaliseGenerator {
    constructor() {
        // Templates de processos por especialidade
        this.processTemplates = {
            hr: {
                categoria: "Recursos Humanos",
                processos_base: [
                    {
                        nome: "Recrutamento e Seleção",
                        etapas: ["Abertura de vaga", "Triagem curricular", "Entrevistas", "Testes técnicos", "Contratação"],
                        personas_envolvidas: ["HR Business Partner", "Recrutador", "Gerente da área"],
                        ferramentas: ["ATS", "LinkedIn Recruiter", "Calendário", "E-mail"],
                        automacao_potencial: 70,
                        kpis: ["Time to hire", "Custo por contratação", "Quality of hire"]
                    },
                    {
                        nome: "Onboarding de Funcionários", 
                        etapas: ["Documentação", "Treinamentos", "Apresentação da equipe", "Setup de ferramentas", "Follow-up"],
                        personas_envolvidas: ["HR Generalist", "Manager", "IT Support"],
                        ferramentas: ["HRIS", "LMS", "Slack", "Office 365"],
                        automacao_potencial: 60,
                        kpis: ["Time to productivity", "Employee satisfaction", "Retention rate"]
                    },
                    {
                        nome: "Avaliação de Performance",
                        etapas: ["Setup ciclo", "Autoavaliação", "Avaliação 360", "Calibração", "Feedback"],
                        personas_envolvidas: ["HR Business Partner", "Managers", "Employees"],
                        ferramentas: ["Performance Management System", "Calendário", "Office 365"],
                        automacao_potencial: 50,
                        kpis: ["Completion rate", "Manager engagement", "Goal achievement"]
                    }
                ]
            },
            marketing: {
                categoria: "Marketing",
                processos_base: [
                    {
                        nome: "Criação de Campanha Digital",
                        etapas: ["Briefing", "Pesquisa", "Criação", "Aprovação", "Veiculação", "Monitoramento"],
                        personas_envolvidas: ["Marketing Manager", "Designer", "Copywriter", "Analista"],
                        ferramentas: ["Figma", "Canva", "Google Ads", "Facebook Ads", "Analytics"],
                        automacao_potencial: 40,
                        kpis: ["CTR", "CPC", "ROAS", "Conversions"]
                    },
                    {
                        nome: "Gestão de Conteúdo",
                        etapas: ["Planejamento", "Criação", "Revisão", "Agendamento", "Publicação", "Engajamento"],
                        personas_envolvidas: ["Content Manager", "Social Media", "Designer", "Copywriter"],
                        ferramentas: ["Hootsuite", "Buffer", "Canva", "Google Drive", "Analytics"],
                        automacao_potencial: 65,
                        kpis: ["Engagement rate", "Reach", "Brand awareness", "Lead generation"]
                    },
                    {
                        nome: "Lead Nurturing",
                        etapas: ["Captura", "Segmentação", "Scoring", "Campanhas", "Conversão", "Análise"],
                        personas_envolvidas: ["Marketing Automation", "Sales", "Content Creator"],
                        ferramentas: ["HubSpot", "Mailchimp", "CRM", "Analytics"],
                        automacao_potencial: 80,
                        kpis: ["Lead quality", "Conversion rate", "Cost per lead", "ROI"]
                    }
                ]
            },
            financeiro: {
                categoria: "Financeiro",
                processos_base: [
                    {
                        nome: "Controle de Despesas",
                        etapas: ["Solicitação", "Aprovação", "Pagamento", "Conciliação", "Relatório"],
                        personas_envolvidas: ["Analista Financeiro", "Controller", "Gerente"],
                        ferramentas: ["ERP", "Excel", "Sistema bancário", "Power BI"],
                        automacao_potencial: 75,
                        kpis: ["Tempo de aprovação", "Acurácia", "Compliance", "Custo operacional"]
                    },
                    {
                        nome: "Fechamento Mensal",
                        etapas: ["Coleta dados", "Conciliações", "Ajustes", "Demonstrativos", "Análise"],
                        personas_envolvidas: ["Contador", "Analista", "Controller", "CFO"],
                        ferramentas: ["ERP", "Excel", "Power BI", "Sistema contábil"],
                        automacao_potencial: 60,
                        kpis: ["Prazo fechamento", "Acurácia", "Variações", "Insights gerados"]
                    },
                    {
                        nome: "Planejamento Orçamentário",
                        etapas: ["Diretrizes", "Coleta inputs", "Consolidação", "Revisões", "Aprovação"],
                        personas_envolvidas: ["Controller", "CFO", "Gerentes", "Diretores"],
                        ferramentas: ["Excel", "Power BI", "ERP", "BI Tools"],
                        automacao_potencial: 45,
                        kpis: ["Acurácia previsão", "Tempo planejamento", "Aderência orçamento"]
                    }
                ]
            },
            tecnologia: {
                categoria: "Tecnologia",
                processos_base: [
                    {
                        nome: "Deploy de Aplicação",
                        etapas: ["Code review", "Testes", "Build", "Deploy staging", "Testes UAT", "Deploy produção"],
                        personas_envolvidas: ["Developer", "DevOps", "QA", "Tech Lead"],
                        ferramentas: ["Git", "Jenkins", "Docker", "Kubernetes", "Monitoring"],
                        automacao_potencial: 85,
                        kpis: ["Deploy frequency", "Lead time", "MTTR", "Change failure rate"]
                    },
                    {
                        nome: "Gestão de Incidentes",
                        etapas: ["Detecção", "Triagem", "Investigação", "Resolução", "Post-mortem"],
                        personas_envolvidas: ["SRE", "Developer", "Tech Lead", "Support"],
                        ferramentas: ["Monitoring", "Ticketing", "Slack", "Documentation"],
                        automacao_potencial: 70,
                        kpis: ["MTTR", "MTBF", "SLA compliance", "Customer satisfaction"]
                    },
                    {
                        nome: "Desenvolvimento de Feature",
                        etapas: ["Requisitos", "Design", "Desenvolvimento", "Testes", "Review", "Deploy"],
                        personas_envolvidas: ["Product Owner", "Developer", "Designer", "QA"],
                        ferramentas: ["Jira", "Git", "IDE", "Testing framework", "CI/CD"],
                        automacao_potencial: 60,
                        kpis: ["Velocity", "Quality", "Time to market", "Technical debt"]
                    }
                ]
            },
            youtube: {
                categoria: "YouTube/Criação de Conteúdo",
                processos_base: [
                    {
                        nome: "Produção de Vídeo",
                        etapas: ["Planejamento", "Roteiro", "Gravação", "Edição", "Revisão", "Upload"],
                        personas_envolvidas: ["Content Creator", "Editor", "Thumbnail Designer"],
                        ferramentas: ["Premiere Pro", "After Effects", "Photoshop", "YouTube Studio"],
                        automacao_potencial: 35,
                        kpis: ["Views", "Watch time", "Engagement", "Subscriber growth"]
                    },
                    {
                        nome: "Otimização de Canal",
                        etapas: ["Análise métricas", "Pesquisa palavras-chave", "Otimização SEO", "A/B test thumbnails", "Ajustes conteúdo"],
                        personas_envolvidas: ["YouTube Manager", "Analista", "Designer"],
                        ferramentas: ["YouTube Analytics", "TubeBuddy", "VidIQ", "Photoshop"],
                        automacao_potencial: 55,
                        kpis: ["CTR", "Retention rate", "Search ranking", "Revenue"]
                    },
                    {
                        nome: "Gestão de Comunidade",
                        etapas: ["Moderação comentários", "Resposta audiência", "Engagement posts", "Live streams", "Community polls"],
                        personas_envolvidas: ["Community Manager", "Content Creator"],
                        ferramentas: ["YouTube Studio", "Social Media Tools", "Analytics"],
                        automacao_potencial: 45,
                        kpis: ["Engagement rate", "Community growth", "Sentiment analysis"]
                    }
                ]
            },
            midias_sociais: {
                categoria: "Mídias Sociais",
                processos_base: [
                    {
                        nome: "Gestão de Conteúdo Multiplataforma",
                        etapas: ["Planejamento", "Criação", "Adaptação por plataforma", "Agendamento", "Monitoramento", "Engajamento"],
                        personas_envolvidas: ["Social Media Manager", "Designer", "Copywriter"],
                        ferramentas: ["Hootsuite", "Canva", "Analytics", "Scheduling tools"],
                        automacao_potencial: 70,
                        kpis: ["Reach", "Engagement", "Follower growth", "Brand mentions"]
                    },
                    {
                        nome: "Influencer Marketing",
                        etapas: ["Identificação", "Outreach", "Negociação", "Briefing", "Acompanhamento", "Análise ROI"],
                        personas_envolvidas: ["Influencer Manager", "Marketing Manager"],
                        ferramentas: ["Influencer platforms", "CRM", "Analytics", "Payment systems"],
                        automacao_potencial: 50,
                        kpis: ["Reach amplification", "Engagement rate", "ROI", "Brand alignment"]
                    },
                    {
                        nome: "Crisis Management",
                        etapas: ["Monitoramento", "Detecção", "Avaliação", "Resposta", "Escalação", "Follow-up"],
                        personas_envolvidas: ["Social Media Manager", "PR Manager", "Leadership"],
                        ferramentas: ["Social listening", "Alert systems", "Communication tools"],
                        automacao_potencial: 60,
                        kpis: ["Response time", "Sentiment recovery", "Mention volume", "Brand reputation"]
                    }
                ]
            }
        };

        // Padrões de colaboração entre especialidades
        this.colaboracaoPatterns = {
            "marketing_tecnologia": {
                processos_compartilhados: ["Landing pages", "Marketing automation", "Analytics implementation"],
                sinergias: ["Tech stack integration", "Data pipeline", "Performance optimization"],
                pontos_friccao: ["Different priorities", "Technical complexity", "Timeline alignment"]
            },
            "hr_marketing": {
                processos_compartilhados: ["Employer branding", "Internal communications", "Event management"],
                sinergias: ["Brand consistency", "Employee advocacy", "Content creation"],
                pontos_friccao: ["Compliance requirements", "Message approval", "Target audiences"]
            },
            "financeiro_marketing": {
                processos_compartilhados: ["Budget planning", "ROI measurement", "Cost optimization"],
                sinergias: ["Data-driven decisions", "Performance tracking", "Resource allocation"],
                pontos_friccao: ["Cost control vs growth", "Attribution complexity", "Reporting standards"]
            },
            "youtube_midias_sociais": {
                processos_compartilhados: ["Content planning", "Cross-promotion", "Analytics"],
                sinergias: ["Content repurposing", "Audience growth", "Brand consistency"],
                pontos_friccao: ["Platform-specific optimization", "Resource allocation", "Content formats"]
            }
        };

        // Métricas de automação e eficiência
        this.automacaoMetrics = {
            niveis: {
                baixo: { min: 0, max: 30, descricao: "Processo manual com poucas oportunidades de automação" },
                medio: { min: 31, max: 60, descricao: "Algumas etapas podem ser automatizadas" },
                alto: { min: 61, max: 85, descricao: "Maior parte do processo pode ser automatizada" },
                critico: { min: 86, max: 100, descricao: "Processo altamente automatizável com ROI significativo" }
            },
            beneficios_automacao: {
                tempo_economizado: "20-80% redução em tempo de execução",
                reducao_erros: "60-95% redução em erros manuais", 
                escalabilidade: "Capacidade de processar 3-10x mais volume",
                consistencia: "Padronização 100% dos processos",
                rastreabilidade: "Audit trail completo de todas as ações"
            }
        };
    }

    /**
     * Analisa processos baseado nos dados RAG
     */
    analisarProcessosRAG(ragData) {
        try {
            const analiseProcessos = {
                processos_identificados: [],
                colaboracoes_mapeadas: [],
                automacao_oportunidades: [],
                gargalos_identificados: [],
                otimizacao_recomendacoes: []
            };

            // Analisar especialidades presentes
            const especialidadesPresentes = new Set();
            ragData.personas.forEach(persona => {
                if (persona.especialidade) {
                    especialidadesPresentes.add(persona.especialidade);
                }
                especialidadesPresentes.add(persona.categoria);
            });

            console.log(`📊 Especialidades identificadas: ${Array.from(especialidadesPresentes).join(', ')}`);

            // Mapear processos por especialidade
            especialidadesPresentes.forEach(especialidade => {
                if (this.processTemplates[especialidade]) {
                    const template = this.processTemplates[especialidade];
                    
                    template.processos_base.forEach(processo => {
                        const processomapeado = this.mapearProcessoParaPersonas(processo, ragData.personas, especialidade);
                        analiseProcessos.processos_identificados.push(processomapeado);
                        
                        // Identificar oportunidades de automação
                        if (processo.automacao_potencial >= 60) {
                            analiseProcessos.automacao_oportunidades.push({
                                processo: processo.nome,
                                especialidade: especialidade,
                                potencial: processo.automacao_potencial,
                                ferramentas_necessarias: this.identificarFerramentasAutomacao(processo),
                                roi_estimado: this.calcularROIAutomacao(processo)
                            });
                        }
                    });
                }
            });

            // Analisar colaborações entre especialidades
            const especialidadesArray = Array.from(especialidadesPresentes);
            for (let i = 0; i < especialidadesArray.length; i++) {
                for (let j = i + 1; j < especialidadesArray.length; j++) {
                    const colaboracao = this.analisarColaboracao(
                        especialidadesArray[i], 
                        especialidadesArray[j], 
                        ragData.personas
                    );
                    if (colaboracao) {
                        analiseProcessos.colaboracoes_mapeadas.push(colaboracao);
                    }
                }
            }

            // Identificar gargalos baseado em ferramentas compartilhadas
            analiseProcessos.gargalos_identificados = this.identificarGargalos(ragData);

            // Gerar recomendações de otimização
            analiseProcessos.otimizacao_recomendacoes = this.gerarRecomendacoesOtimizacao(analiseProcessos);

            return analiseProcessos;

        } catch (error) {
            console.error(`❌ Erro na análise de processos: ${error.message}`);
            return null;
        }
    }

    /**
     * Mapeia processo para personas específicas
     */
    mapearProcessoParaPersonas(processo, personas, especialidade) {
        const personasAplicaveis = personas.filter(persona => 
            persona.especialidade === especialidade || 
            persona.categoria === especialidade ||
            this.verificarCompatibilidadeProcesso(persona, processo)
        );

        const ferramentasDisponiveis = new Set();
        personasAplicaveis.forEach(persona => {
            persona.ferramentas.forEach(ferramenta => {
                ferramentasDisponiveis.add(ferramenta.nome);
            });
        });

        const cobertura_ferramentas = processo.ferramentas.filter(ferramenta => 
            Array.from(ferramentasDisponiveis).some(f => f.includes(ferramenta) || ferramenta.includes(f))
        ).length / processo.ferramentas.length * 100;

        return {
            id: `processo_${processo.nome.replace(/\s+/g, '_').toLowerCase()}`,
            nome: processo.nome,
            categoria: especialidade,
            etapas: processo.etapas,
            personas_disponiveis: personasAplicaveis.map(p => ({
                id: p.id,
                nome: p.nome_completo,
                categoria: p.categoria,
                especialidade: p.especialidade,
                nivel_competencia: this.calcularNivelCompetenciaProcesso(p, processo)
            })),
            ferramentas_necessarias: processo.ferramentas,
            ferramentas_disponiveis: Array.from(ferramentasDisponiveis),
            cobertura_ferramentas: Math.round(cobertura_ferramentas),
            automacao_potencial: processo.automacao_potencial,
            kpis: processo.kpis,
            viabilidade: this.calcularViabilidadeProcesso(personasAplicaveis.length, cobertura_ferramentas),
            custos_estimados: this.estimarCustosProcesso(processo),
            tempo_implementacao: this.estimarTempoImplementacao(processo)
        };
    }

    /**
     * Verifica compatibilidade de persona com processo
     */
    verificarCompatibilidadeProcesso(persona, processo) {
        // Verificar se persona tem competências relacionadas
        const competenciasRelevantes = [
            ...persona.competencias.tecnicas,
            ...persona.competencias.comportamentais
        ];

        return competenciasRelevantes.some(comp => 
            processo.etapas.some(etapa => 
                etapa.toLowerCase().includes(comp.nome.toLowerCase()) ||
                comp.nome.toLowerCase().includes(etapa.toLowerCase())
            )
        );
    }

    /**
     * Calcula nível de competência da persona para o processo
     */
    calcularNivelCompetenciaProcesso(persona, processo) {
        let pontuacao = 0;
        let total = 0;

        // Pontuação por ferramentas conhecidas
        processo.ferramentas.forEach(ferramenta => {
            const ferramentaPersona = persona.ferramentas.find(f => 
                f.nome.includes(ferramenta) || ferramenta.includes(f.nome)
            );
            if (ferramentaPersona) {
                const nivelPontos = { "básico": 1, "intermediário": 2, "avançado": 3, "expert": 4 };
                pontuacao += nivelPontos[ferramentaPersona.nivel_proficiencia] || 1;
                total += 4;
            }
        });

        // Pontuação por competências relevantes
        const competenciasRelevantes = [...persona.competencias.tecnicas, ...persona.competencias.comportamentais]
            .filter(comp => processo.etapas.some(etapa => 
                etapa.toLowerCase().includes(comp.nome.toLowerCase())
            ));

        competenciasRelevantes.forEach(comp => {
            const nivelPontos = { "básico": 1, "intermediário": 2, "avançado": 3, "expert": 4 };
            pontuacao += nivelPontos[comp.nivel] || 1;
            total += 4;
        });

        if (total === 0) return "básico";

        const percentual = (pontuacao / total) * 100;
        if (percentual >= 75) return "expert";
        if (percentual >= 50) return "avançado";
        if (percentual >= 25) return "intermediário";
        return "básico";
    }

    /**
     * Calcula viabilidade do processo
     */
    calcularViabilidadeProcesso(numPersonas, coberturaFerramentas) {
        let pontuacao = 0;

        // Pontuação por pessoas disponíveis
        if (numPersonas >= 3) pontuacao += 40;
        else if (numPersonas >= 2) pontuacao += 30;
        else if (numPersonas >= 1) pontuacao += 20;

        // Pontuação por cobertura de ferramentas
        if (coberturaFerramentas >= 80) pontuacao += 40;
        else if (coberturaFerramentas >= 60) pontuacao += 30;
        else if (coberturaFerramentas >= 40) pontuacao += 20;
        else pontuacao += 10;

        // Pontuação base
        pontuacao += 20;

        if (pontuacao >= 80) return "alta";
        if (pontuacao >= 60) return "média";
        if (pontuacao >= 40) return "baixa";
        return "crítica";
    }

    /**
     * Estima custos do processo
     */
    estimarCustosProcesso(processo) {
        const custosBase = {
            "Recrutamento e Seleção": { setup: 5000, mensal: 2000 },
            "Onboarding de Funcionários": { setup: 3000, mensal: 1000 },
            "Criação de Campanha Digital": { setup: 8000, mensal: 4000 },
            "Gestão de Conteúdo": { setup: 4000, mensal: 2500 },
            "Deploy de Aplicação": { setup: 15000, mensal: 3000 },
            "Produção de Vídeo": { setup: 12000, mensal: 5000 }
        };

        return custosBase[processo.nome] || { setup: 5000, mensal: 2000 };
    }

    /**
     * Estima tempo de implementação
     */
    estimarTempoImplementacao(processo) {
        const temposBase = {
            baixo: "1-2 semanas",
            medio: "3-6 semanas", 
            alto: "2-3 meses",
            critico: "3-6 meses"
        };

        const nivel = this.automacaoMetrics.niveis;
        if (processo.automacao_potencial >= nivel.critico.min) return temposBase.critico;
        if (processo.automacao_potencial >= nivel.alto.min) return temposBase.alto;
        if (processo.automacao_potencial >= nivel.medio.min) return temposBase.medio;
        return temposBase.baixo;
    }

    /**
     * Analisa colaboração entre especialidades
     */
    analisarColaboracao(especialidade1, especialidade2, personas) {
        const chave1 = `${especialidade1}_${especialidade2}`;
        const chave2 = `${especialidade2}_${especialidade1}`;
        
        const colaboracaoTemplate = this.colaboracaoPatterns[chave1] || this.colaboracaoPatterns[chave2];
        
        if (!colaboracaoTemplate) return null;

        const personas1 = personas.filter(p => p.especialidade === especialidade1 || p.categoria === especialidade1);
        const personas2 = personas.filter(p => p.especialidade === especialidade2 || p.categoria === especialidade2);

        // Encontrar ferramentas comuns
        const ferramentas1 = new Set();
        const ferramentas2 = new Set();
        
        personas1.forEach(p => p.ferramentas.forEach(f => ferramentas1.add(f.nome)));
        personas2.forEach(p => p.ferramentas.forEach(f => ferramentas2.add(f.nome)));
        
        const ferramentasComuns = Array.from(ferramentas1).filter(f => ferramentas2.has(f));

        return {
            especialidades: [especialidade1, especialidade2],
            personas_envolvidas: {
                [especialidade1]: personas1.map(p => ({ id: p.id, nome: p.nome_completo })),
                [especialidade2]: personas2.map(p => ({ id: p.id, nome: p.nome_completo }))
            },
            processos_compartilhados: colaboracaoTemplate.processos_compartilhados,
            sinergias_identificadas: colaboracaoTemplate.sinergias,
            pontos_friccao: colaboracaoTemplate.pontos_friccao,
            ferramentas_comuns: ferramentasComuns,
            potencial_colaboracao: this.calcularPotencialColaboracao(personas1, personas2, ferramentasComuns)
        };
    }

    /**
     * Calcula potencial de colaboração
     */
    calcularPotencialColaboracao(personas1, personas2, ferramentasComuns) {
        let pontuacao = 0;

        // Pontuação por número de pessoas
        const totalPersonas = personas1.length + personas2.length;
        if (totalPersonas >= 4) pontuacao += 30;
        else if (totalPersonas >= 2) pontuacao += 20;
        else pontuacao += 10;

        // Pontuação por ferramentas comuns
        if (ferramentasComuns.length >= 3) pontuacao += 40;
        else if (ferramentasComuns.length >= 2) pontuacao += 30;
        else if (ferramentasComuns.length >= 1) pontuacao += 20;
        else pontuacao += 5;

        // Pontuação base
        pontuacao += 30;

        if (pontuacao >= 80) return "alto";
        if (pontuacao >= 60) return "médio";
        if (pontuacao >= 40) return "baixo";
        return "mínimo";
    }

    /**
     * Identifica gargalos no sistema
     */
    identificarGargalos(ragData) {
        const gargalos = [];

        // Analisar concentração de ferramentas
        const usoFerramentas = {};
        ragData.personas.forEach(persona => {
            persona.ferramentas.forEach(ferramenta => {
                if (!usoFerramentas[ferramenta.nome]) {
                    usoFerramentas[ferramenta.nome] = { usuarios: [], especialidades: new Set() };
                }
                usoFerramentas[ferramenta.nome].usuarios.push(persona.nome_completo);
                usoFerramentas[ferramenta.nome].especialidades.add(persona.especialidade || persona.categoria);
            });
        });

        // Identificar ferramentas com alta concentração
        Object.entries(usoFerramentas).forEach(([ferramenta, dados]) => {
            if (dados.usuarios.length >= ragData.personas.length * 0.7) { // 70% ou mais usam
                gargalos.push({
                    tipo: "ferramenta_critica",
                    recurso: ferramenta,
                    descricao: `${ferramenta} é usada por ${dados.usuarios.length} personas (${Math.round(dados.usuarios.length/ragData.personas.length*100)}%)`,
                    impacto: "alto",
                    usuarios_afetados: dados.usuarios,
                    especialidades_afetadas: Array.from(dados.especialidades),
                    recomendacao: "Considerar redundância ou alternativas para esta ferramenta crítica"
                });
            }
        });

        // Analisar especialidades com poucas pessoas
        const especialidadeCount = {};
        ragData.personas.forEach(persona => {
            const esp = persona.especialidade || persona.categoria;
            especialidadeCount[esp] = (especialidadeCount[esp] || 0) + 1;
        });

        Object.entries(especialidadeCount).forEach(([especialidade, count]) => {
            if (count === 1) {
                gargalos.push({
                    tipo: "especialidade_critica",
                    recurso: especialidade,
                    descricao: `Apenas 1 pessoa com especialidade em ${especialidade}`,
                    impacto: "crítico",
                    usuarios_afetados: ragData.personas.filter(p => 
                        (p.especialidade || p.categoria) === especialidade
                    ).map(p => p.nome_completo),
                    recomendacao: "Priorizar contratação ou desenvolvimento de backup para esta especialidade"
                });
            }
        });

        return gargalos;
    }

    /**
     * Gera recomendações de otimização
     */
    gerarRecomendacoesOtimizacao(analiseProcessos) {
        const recomendacoes = [];

        // Recomendações baseadas em automação
        const altaAutomacao = analiseProcessos.automacao_oportunidades
            .filter(oport => oport.potencial >= 70)
            .sort((a, b) => b.potencial - a.potencial);

        altaAutomacao.slice(0, 3).forEach(oport => {
            recomendacoes.push({
                categoria: "automacao_prioritaria",
                titulo: `Automatizar ${oport.processo}`,
                descricao: `Processo com ${oport.potencial}% de potencial de automação`,
                impacto: "alto",
                prazo: "2-3 meses",
                roi_estimado: oport.roi_estimado,
                recursos_necessarios: oport.ferramentas_necessarias
            });
        });

        // Recomendações baseadas em colaborações
        const colaboracoesAltas = analiseProcessos.colaboracoes_mapeadas
            .filter(colab => colab.potencial_colaboracao === "alto");

        colaboracoesAltas.forEach(colab => {
            recomendacoes.push({
                categoria: "melhoria_colaboracao",
                titulo: `Otimizar colaboração ${colab.especialidades.join(' + ')}`,
                descricao: `Alta sinergia identificada entre ${colab.especialidades.join(' e ')}`,
                impacto: "médio",
                prazo: "1-2 meses",
                beneficios: colab.sinergias_identificadas,
                ferramentas_comuns: colab.ferramentas_comuns
            });
        });

        // Recomendações baseadas em gargalos
        const gargalosCriticos = analiseProcessos.gargalos_identificados
            .filter(gargalo => gargalo.impacto === "crítico");

        gargalosCriticos.forEach(gargalo => {
            recomendacoes.push({
                categoria: "resolucao_gargalo",
                titulo: `Resolver gargalo: ${gargalo.recurso}`,
                descricao: gargalo.descricao,
                impacto: "crítico",
                prazo: "imediato",
                acao_recomendada: gargalo.recomendacao
            });
        });

        return recomendacoes.sort((a, b) => {
            const prioridades = { "crítico": 3, "alto": 2, "médio": 1, "baixo": 0 };
            return prioridades[b.impacto] - prioridades[a.impacto];
        });
    }

    /**
     * Identifica ferramentas necessárias para automação
     */
    identificarFerramentasAutomacao(processo) {
        const ferramentasAutomacao = {
            "Recrutamento e Seleção": ["ATS API", "Email automation", "Calendar API", "Assessment tools"],
            "Lead Nurturing": ["Marketing automation", "CRM API", "Email platform", "Analytics API"],
            "Deploy de Aplicação": ["CI/CD pipeline", "Container orchestration", "Monitoring", "Notification system"],
            "Controle de Despesas": ["ERP API", "Approval workflow", "Payment gateway", "Reporting tools"],
            "Gestão de Conteúdo": ["CMS API", "Social media API", "Scheduling tools", "Analytics integration"]
        };

        return ferramentasAutomacao[processo.nome] || ["Workflow automation", "API integration", "Notification system"];
    }

    /**
     * Calcula ROI estimado da automação
     */
    calcularROIAutomacao(processo) {
        const custosHora = 50; // Custo médio por hora
        const horasProcessoManual = {
            "Recrutamento e Seleção": 40,
            "Lead Nurturing": 20,
            "Deploy de Aplicação": 8,
            "Controle de Despesas": 16,
            "Gestão de Conteúdo": 12
        };

        const horas = horasProcessoManual[processo.nome] || 20;
        const economiaHoras = horas * (processo.automacao_potencial / 100);
        const economiaMensal = economiaHoras * custosHora * 4; // 4 semanas
        const custoImplementacao = 10000; // Custo base

        const mesesPayback = Math.ceil(custoImplementacao / economiaMensal);
        const roiAnual = ((economiaMensal * 12 - custoImplementacao) / custoImplementacao) * 100;

        return {
            economia_mensal: Math.round(economiaMensal),
            custo_implementacao: custoImplementacao,
            payback_meses: mesesPayback,
            roi_anual_percent: Math.round(roiAnual)
        };
    }

    /**
     * Processa análise de fluxos completa
     */
    async processarFluxosAnalise(empresaCodigo, inputPath = null, outputPath = null) {
        try {
            // Usar pasta AUTOMACAO como base
            const baseDir = path.join(__dirname, '..'); // AUTOMACAO/
            
            console.log(`🔍 Iniciando análise de fluxos para ${empresaCodigo.toUpperCase()}`);

            // Carregar dados RAG
            const ragPath = path.join(baseDir, 'rag_knowledge_base.json');
            
            try {
                await fs.access(ragPath);
            } catch (error) {
                throw new Error(`Database RAG não encontrado: ${ragPath}. Execute o Script 3 primeiro.`);
            }

            const ragData = JSON.parse(await fs.readFile(ragPath, 'utf8'));

            console.log(`📊 Analisando fluxos baseados em ${ragData.personas.length} personas`);

            // Executar análise de processos
            const analiseProcessos = this.analisarProcessosRAG(ragData);
            
            if (!analiseProcessos) {
                throw new Error('Falha na análise de processos');
            }

            // Criar resultado consolidado
            const fluxosAnalise = {
                empresa_codigo: empresaCodigo,
                versao_analise: "1.0.0",
                data_analise: new Date().toISOString(),
                
                // Resultados da análise
                processos: analiseProcessos.processos_identificados,
                colaboracoes: analiseProcessos.colaboracoes_mapeadas,
                automacao_oportunidades: analiseProcessos.automacao_oportunidades,
                gargalos: analiseProcessos.gargalos_identificados,
                recomendacoes: analiseProcessos.otimizacao_recomendacoes,
                
                // Estatísticas resumidas
                estatisticas: {
                    total_processos: analiseProcessos.processos_identificados.length,
                    processos_alta_viabilidade: analiseProcessos.processos_identificados.filter(p => p.viabilidade === "alta").length,
                    oportunidades_automacao: analiseProcessos.automacao_oportunidades.filter(o => o.potencial >= 70).length,
                    colaboracoes_identificadas: analiseProcessos.colaboracoes_mapeadas.length,
                    gargalos_criticos: analiseProcessos.gargalos_identificados.filter(g => g.impacto === "crítico").length
                },
                
                // Metadados para próximo script
                preparacao_n8n: {
                    processos_automatizaveis: analiseProcessos.automacao_oportunidades
                        .filter(o => o.potencial >= 60)
                        .map(o => ({
                            processo: o.processo,
                            especialidade: o.especialidade,
                            potencial: o.potencial,
                            ferramentas: o.ferramentas_necessarias
                        })),
                    workflows_prioritarios: analiseProcessos.processos_identificados
                        .filter(p => p.viabilidade === "alta" && p.automacao_potencial >= 50)
                        .map(p => ({
                            nome: p.nome,
                            etapas: p.etapas,
                            ferramentas: p.ferramentas_necessarias,
                            kpis: p.kpis
                        }))
                }
            };

            console.log(`✅ Análise concluída:`);
            console.log(`   - ${fluxosAnalise.estatisticas.total_processos} processos identificados`);
            console.log(`   - ${fluxosAnalise.estatisticas.processos_alta_viabilidade} processos de alta viabilidade`);
            console.log(`   - ${fluxosAnalise.estatisticas.oportunidades_automacao} oportunidades de automação`);
            console.log(`   - ${fluxosAnalise.estatisticas.colaboracoes_identificadas} colaborações mapeadas`);

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

                    // Encontrar persona nos dados RAG
                    const personaRAG = ragData.personas.find(p => p.persona_key === personaFolder);
                    
                    if (!personaRAG) continue;

                    // Criar pasta script4_fluxos
                    const script4Dir = path.join(personaPath, 'script4_fluxos');
                    await fs.mkdir(script4Dir, { recursive: true });

                    // Gerar análise específica da persona
                    const fluxosPersona = {
                        persona: {
                            id: personaRAG.id,
                            nome: personaRAG.nome_completo,
                            categoria: personaRAG.categoria,
                            especialidade: personaRAG.especialidade
                        },
                        processos_aplicaveis: fluxosAnalise.processos.filter(processo => 
                            processo.personas_disponiveis.some(p => p.id === personaRAG.id)
                        ),
                        colaboracoes_envolvidas: fluxosAnalise.colaboracoes.filter(colab => 
                            colab.personas_envolvidas[personaRAG.especialidade] || 
                            colab.personas_envolvidas[personaRAG.categoria]
                        ),
                        automacao_participacao: fluxosAnalise.automacao_oportunidades.filter(oport =>
                            oport.especialidade === personaRAG.especialidade
                        ),
                        recomendacoes_especificas: fluxosAnalise.recomendacoes.filter(rec =>
                            rec.titulo.toLowerCase().includes(personaRAG.especialidade?.toLowerCase() || '') ||
                            rec.titulo.toLowerCase().includes(personaRAG.categoria.toLowerCase())
                        ),
                        data_processamento: new Date().toISOString()
                    };

                    // Salvar análise de fluxos da persona
                    const fluxosPersonaPath = path.join(script4Dir, 'fluxos_analise.json');
                    await fs.writeFile(fluxosPersonaPath, JSON.stringify(fluxosPersona, null, 2), 'utf8');

                    console.log(`✅ Fluxos analisados: ${personaRAG.nome_completo} (${categoria})`);
                }
            }

            // Salvar análise consolidada
            const fluxosAnalisePath = path.join(baseDir, 'fluxos_analise_completa.json');
            await fs.writeFile(fluxosAnalisePath, JSON.stringify(fluxosAnalise, null, 2), 'utf8');

            console.log(`\n✅ SCRIPT 4 - ANÁLISE DE FLUXOS FINALIZADO`);
            console.log(`📁 Análise completa salva: ${fluxosAnalisePath}`);
            console.log(`🚀 Pronto para Script 5 (N8N Workflows)`);

            return {
                success: true,
                total_processos: fluxosAnalise.estatisticas.total_processos,
                automacao_oportunidades: fluxosAnalise.estatisticas.oportunidades_automacao,
                colaboracoes: fluxosAnalise.estatisticas.colaboracoes_identificadas,
                output_path: fluxosAnalisePath,
                data: fluxosAnalise
            };

        } catch (error) {
            console.error(`❌ Erro no Script 4 - Análise de Fluxos: ${error.message}`);
            throw error;
        }
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
        console.log('Uso: node 04_generate_fluxos_analise.js --empresa-codigo CODIGO_EMPRESA [--input-path PATH] [--output-path PATH]');
        process.exit(1);
    }

    try {
        const generator = new FluxosAnaliseGenerator();
        const result = await generator.processarFluxosAnalise(empresaCodigo, inputPath, outputPath);
        
        console.log('\n🎉 Script 4 executado com sucesso!');
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
module.exports = { FluxosAnaliseGenerator };