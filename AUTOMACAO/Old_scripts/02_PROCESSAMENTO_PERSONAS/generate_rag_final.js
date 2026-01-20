#!/usr/bin/env node
/**
 * 🧠 SCRIPT 04 - GERAÇÃO DE RAG KNOWLEDGE BASE
 * ============================================
 * 
 * Geração de base de conhecimento RAG específica para cada persona
 * baseado no seu role, especialidade e contexto empresarial.
 * 
 * @version 2.0.0 - ES Modules + Campo JSON
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

console.log('🧠 SCRIPT 04 - GERAÇÃO DE RAG KNOWLEDGE BASE');
console.log('==============================================');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

class RAGGenerator {
    constructor() {
        this.knowledgeTemplates = this.initKnowledgeTemplates();
    }

    initKnowledgeTemplates() {
        return {
            'CEO': {
                categoria: "Liderança Executiva",
                knowledge_base: [
                    {
                        titulo: "Framework de Liderança Estratégica",
                        conteudo: "Metodologias avançadas para tomada de decisões estratégicas, definição de visão corporativa e liderança organizacional. Inclui frameworks como SWOT avançado, análise de cenários, e gestão de stakeholders.",
                        tipo: "framework",
                        tags: ["liderança", "estratégia", "visão", "decisão"],
                        fonte: "Strategic Leadership Institute",
                        relevancia: "crítica"
                    },
                    {
                        titulo: "Métricas Executivas e KPIs",
                        conteudo: "Dashboard executivo com KPIs críticos: receita, EBITDA, market share, customer acquisition cost, lifetime value, Net Promoter Score, employee engagement score.",
                        tipo: "métricas",
                        tags: ["kpis", "dashboard", "performance", "métricas"],
                        fonte: "Executive Analytics Framework",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Protocolos de Comunicação Executiva",
                        conteudo: "Padrões para comunicação com board, investidores, mídia e equipe executiva. Templates para quarterly reports, investor updates, e crisis communication.",
                        tipo: "protocolo",
                        tags: ["comunicação", "board", "investidores", "relatórios"],
                        fonte: "Corporate Communications Best Practices",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Gestão de Crise e Risk Management",
                        conteudo: "Protocolos para identificação, avaliação e mitigação de riscos corporativos. Procedures para crisis management e business continuity planning.",
                        tipo: "procedimento",
                        tags: ["risco", "crise", "continuidade", "gestão"],
                        fonte: "Corporate Risk Management Framework",
                        relevancia: "crítica"
                    }
                ]
            },
            'CTO': {
                categoria: "Arquitetura e Inovação Tecnológica",
                knowledge_base: [
                    {
                        titulo: "Arquitetura de Sistemas Enterprise",
                        conteudo: "Best practices para arquitetura de sistemas escaláveis, microservices, cloud-native design patterns, e technical debt management em ambientes enterprise.",
                        tipo: "guidelines",
                        tags: ["arquitetura", "escalabilidade", "microservices", "cloud"],
                        fonte: "Enterprise Architecture Institute",
                        relevancia: "crítica"
                    },
                    {
                        titulo: "DevOps e CI/CD Excellence",
                        conteudo: "Frameworks para implementação de DevOps culture, automated testing, continuous integration/deployment, infrastructure as code, e monitoring strategies.",
                        tipo: "processo",
                        tags: ["devops", "ci/cd", "automation", "monitoring"],
                        fonte: "DevOps Research and Assessment",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Technology Evaluation Matrix",
                        conteudo: "Framework para avaliação de novas tecnologias, vendor assessment, ROI analysis de tech investments, e technology roadmap planning.",
                        tipo: "framework",
                        tags: ["avaliação", "tecnologia", "roi", "roadmap"],
                        fonte: "Technology Strategy Framework",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Security & Compliance Standards",
                        conteudo: "Security frameworks, compliance requirements (SOC2, ISO27001, GDPR), secure development practices, e incident response procedures.",
                        tipo: "padrões",
                        tags: ["segurança", "compliance", "gdpr", "incidentes"],
                        fonte: "Cybersecurity Framework Institute",
                        relevancia: "crítica"
                    }
                ]
            },
            'CFO': {
                categoria: "Gestão Financeira Estratégica",
                knowledge_base: [
                    {
                        titulo: "Financial Planning & Analysis",
                        conteudo: "Metodologias para budgeting, forecasting, variance analysis, e strategic financial planning. Inclui templates para financial models e investment analysis.",
                        tipo: "metodologia",
                        tags: ["planejamento", "orçamento", "análise", "forecast"],
                        fonte: "Corporate Finance Institute",
                        relevancia: "crítica"
                    },
                    {
                        titulo: "Cash Flow Management",
                        conteudo: "Estratégias para otimização de working capital, cash flow forecasting, liquidity management, e payment optimization frameworks.",
                        tipo: "estratégia",
                        tags: ["cashflow", "liquidez", "capital", "pagamentos"],
                        fonte: "Treasury Management Association",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Financial Reporting & Compliance",
                        conteudo: "Standards para financial reporting, audit procedures, regulatory compliance, e investor relations reporting frameworks.",
                        tipo: "padrões",
                        tags: ["relatórios", "auditoria", "compliance", "investidores"],
                        fonte: "Financial Reporting Standards Board",
                        relevancia: "crítica"
                    },
                    {
                        titulo: "M&A and Investment Analysis",
                        conteudo: "Frameworks para due diligence, valuation methodologies, merger analysis, e investment decision criteria.",
                        tipo: "framework",
                        tags: ["m&a", "valuation", "investment", "due diligence"],
                        fonte: "Investment Banking Institute",
                        relevancia: "média"
                    }
                ]
            },
            'Manager': {
                categoria: "Gestão de Equipe e Performance",
                knowledge_base: [
                    {
                        titulo: "People Management Excellence",
                        conteudo: "Best practices para team leadership, performance management, feedback delivery, conflict resolution, e team development strategies.",
                        tipo: "best_practices",
                        tags: ["gestão pessoas", "performance", "feedback", "desenvolvimento"],
                        fonte: "Management Excellence Institute",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Agile Project Management",
                        conteudo: "Metodologias Agile/Scrum, sprint planning, backlog management, velocity tracking, e continuous improvement practices.",
                        tipo: "metodologia",
                        tags: ["agile", "scrum", "projetos", "velocity"],
                        fonte: "Agile Alliance",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Team Performance Metrics",
                        conteudo: "KPIs para team performance, productivity metrics, engagement scores, e performance dashboard frameworks.",
                        tipo: "métricas",
                        tags: ["métricas equipe", "produtividade", "engagement", "kpis"],
                        fonte: "Team Performance Institute",
                        relevancia: "média"
                    },
                    {
                        titulo: "Talent Development Programs",
                        conteudo: "Frameworks para skill development, career pathing, mentoring programs, e succession planning strategies.",
                        tipo: "programa",
                        tags: ["desenvolvimento", "carreira", "mentoria", "sucessão"],
                        fonte: "Talent Management Association",
                        relevancia: "média"
                    }
                ]
            },
            'Specialist': {
                categoria: "Expertise Técnica e Qualidade",
                knowledge_base: [
                    {
                        titulo: "Technical Best Practices",
                        conteudo: "Coding standards, design patterns, code review guidelines, testing strategies, e technical documentation standards.",
                        tipo: "best_practices",
                        tags: ["código", "padrões", "testes", "documentação"],
                        fonte: "Software Engineering Institute",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Quality Assurance Framework",
                        conteudo: "QA methodologies, testing frameworks, bug tracking, quality metrics, e continuous quality improvement processes.",
                        tipo: "framework",
                        tags: ["qualidade", "testes", "bugs", "métricas"],
                        fonte: "Quality Assurance Institute",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Continuous Learning Resources",
                        conteudo: "Technical learning paths, certification programs, conference materials, e skill assessment frameworks.",
                        tipo: "recursos",
                        tags: ["aprendizado", "certificações", "skills", "desenvolvimento"],
                        fonte: "Technical Education Platform",
                        relevancia: "média"
                    },
                    {
                        titulo: "Industry Standards & Compliance",
                        conteudo: "Industry-specific standards, regulatory requirements, compliance frameworks, e audit procedures.",
                        tipo: "padrões",
                        tags: ["padrões", "regulamentação", "compliance", "auditoria"],
                        fonte: "Industry Standards Organization",
                        relevancia: "média"
                    }
                ]
            },
            'Assistant': {
                categoria: "Suporte Administrativo e Eficiência",
                knowledge_base: [
                    {
                        titulo: "Executive Support Excellence",
                        conteudo: "Best practices para executive assistance, calendar management, meeting coordination, travel planning, e administrative efficiency.",
                        tipo: "best_practices",
                        tags: ["suporte executivo", "agenda", "reuniões", "viagens"],
                        fonte: "Executive Assistant Institute",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Communication & Coordination",
                        conteudo: "Protocols para internal/external communication, stakeholder management, information flow, e coordination procedures.",
                        tipo: "protocolo",
                        tags: ["comunicação", "coordenação", "stakeholders", "informação"],
                        fonte: "Professional Communication Standards",
                        relevancia: "alta"
                    },
                    {
                        titulo: "Office Management Systems",
                        conteudo: "Office organization, document management, filing systems, supplies management, e administrative process optimization.",
                        tipo: "sistema",
                        tags: ["organização", "documentos", "sistemas", "processos"],
                        fonte: "Office Management Best Practices",
                        relevancia: "média"
                    },
                    {
                        titulo: "Technology & Tools Mastery",
                        conteudo: "Proficiency em office software, productivity tools, communication platforms, e administrative technology solutions.",
                        tipo: "ferramentas",
                        tags: ["tecnologia", "ferramentas", "software", "produtividade"],
                        fonte: "Administrative Technology Guide",
                        relevancia: "média"
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
        
        return 'Specialist';
    }

    async gerarRAGParaEmpresa(empresaId) {
        try {
            console.log(`🔄 Gerando RAG Knowledge Base para empresa: ${empresaId}`);

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
            let totalKnowledgeEntries = 0;
            const resultados = [];

            // Processar cada persona
            for (const persona of personas) {
                console.log(`\n🧠 Processando: ${persona.full_name} (${persona.role})`);
                
                const templateKey = this.mapearRoleParaTemplate(persona.role);
                const template = this.knowledgeTemplates[templateKey] || this.knowledgeTemplates['Specialist'];
                
                console.log(`📚 Template: ${templateKey} - ${template.categoria}`);
                
                // Criar knowledge base personalizada
                const knowledgeBase = {
                    categoria: template.categoria,
                    persona_specialty: persona.specialty,
                    knowledge_entries: template.knowledge_base.map(entry => ({
                        ...entry,
                        id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        persona_id: persona.id,
                        created_at: new Date().toISOString(),
                        status: 'active'
                    })),
                    contextual_info: {
                        department: persona.department,
                        experience_years: persona.experiencia_anos,
                        languages: persona.idiomas || [],
                        company_context: {
                            industry: empresa.industria || empresa.industry,
                            size: empresa.total_personas,
                            location: empresa.pais
                        }
                    },
                    template_usado: templateKey,
                    generated_at: new Date().toISOString()
                };

                // Salvar no campo ia_config da persona (similar ao que fizemos com tarefas)
                const currentIaConfig = persona.ia_config || {};
                const { error: updateError } = await supabase
                    .from('personas')
                    .update({
                        ia_config: {
                            ...currentIaConfig,
                            knowledge_base: knowledgeBase
                        },
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', persona.id);

                if (updateError) {
                    console.error(`❌ Erro: ${updateError.message}`);
                } else {
                    personasProcessadas++;
                    totalKnowledgeEntries += template.knowledge_base.length;
                    
                    resultados.push({
                        persona: {
                            id: persona.id,
                            nome: persona.full_name,
                            role: persona.role,
                            template: templateKey
                        },
                        knowledge_entries: template.knowledge_base.length,
                        categoria: template.categoria
                    });
                    
                    console.log(`✅ Sucesso: ${template.knowledge_base.length} entradas de conhecimento`);
                }

                // Pausa entre personas
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Salvar backup
            const outputDir = path.join(__dirname, '..', 'rag_output');
            await fs.mkdir(outputDir, { recursive: true });
            
            const outputFile = path.join(outputDir, `rag_knowledge_${empresa.codigo || 'empresa'}_${Date.now()}.json`);
            const backupData = {
                empresa: { id: empresa.id, nome: empresa.nome },
                data_processamento: new Date().toISOString(),
                personas_processadas: personasProcessadas,
                total_knowledge_entries: totalKnowledgeEntries,
                resultados: resultados
            };
            
            await fs.writeFile(outputFile, JSON.stringify(backupData, null, 2), 'utf8');

            console.log(`\n📊 RELATÓRIO FINAL RAG`);
            console.log(`=====================`);
            console.log(`✅ Personas processadas: ${personasProcessadas}/${personas.length}`);
            console.log(`📚 Total de entradas: ${totalKnowledgeEntries}`);
            console.log(`📁 Backup: ${outputFile}`);
            console.log(`🗃️ Dados salvos no campo 'ia_config.knowledge_base' da tabela personas`);
            
            return { success: true, personasProcessadas, totalKnowledgeEntries };

        } catch (error) {
            console.error(`❌ Erro: ${error.message}`);
            throw error;
        }
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
        console.log('Uso: node generate_rag_final.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de RAG Knowledge Base...\n');
        const generator = new RAGGenerator();
        await generator.gerarRAGParaEmpresa(empresaId);
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

export { RAGGenerator };