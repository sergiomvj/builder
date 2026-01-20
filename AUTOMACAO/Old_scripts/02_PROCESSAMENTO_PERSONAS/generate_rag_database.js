const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class RAGKnowledgeBaseGenerator {
    constructor() {
        this.knowledgeTypes = {
            'Chief Executive Officer': [
                {
                    title: 'Strategic Leadership Framework',
                    content: 'Comprehensive guide for strategic decision-making, vision setting, and organizational leadership. Includes methodologies for revenue strategy, market analysis, and executive communication.',
                    content_type: 'framework'
                },
                {
                    title: 'Executive Dashboard Metrics',
                    content: 'Key performance indicators for executive oversight including revenue tracking, market share analysis, operational efficiency metrics, and strategic goal progress monitoring.',
                    content_type: 'metrics'
                },
                {
                    title: 'Board Communication Protocols',
                    content: 'Standard operating procedures for board meetings, investor relations, quarterly reporting, and stakeholder communication strategies.',
                    content_type: 'protocol'
                }
            ],
            'Chief Technology Officer': [
                {
                    title: 'Technical Architecture Guidelines',
                    content: 'Best practices for system architecture, technology stack decisions, scalability planning, and technical debt management in enterprise environments.',
                    content_type: 'guidelines'
                },
                {
                    title: 'Development Process Standards',
                    content: 'Standardized development workflows including code review processes, CI/CD pipeline setup, testing protocols, and deployment strategies.',
                    content_type: 'process'
                },
                {
                    title: 'Technology Evaluation Matrix',
                    content: 'Framework for evaluating new technologies, vendor selection criteria, technical risk assessment, and integration planning methodologies.',
                    content_type: 'framework'
                }
            ],
            'Chief Financial Officer': [
                {
                    title: 'Financial Analysis Framework',
                    content: 'Comprehensive financial modeling techniques, budgeting processes, cash flow management, and financial risk assessment methodologies.',
                    content_type: 'framework'
                },
                {
                    title: 'Compliance and Audit Standards',
                    content: 'Financial compliance requirements, audit preparation procedures, regulatory reporting standards, and internal control frameworks.',
                    content_type: 'compliance'
                },
                {
                    title: 'Investment Decision Criteria',
                    content: 'ROI calculation methodologies, capital allocation frameworks, cost-benefit analysis processes, and financial performance metrics.',
                    content_type: 'criteria'
                }
            ],
            'Chief Operating Officer': [
                {
                    title: 'Operations Excellence Framework',
                    content: 'Operational efficiency methodologies, process optimization techniques, quality management systems, and performance improvement strategies.',
                    content_type: 'framework'
                },
                {
                    title: 'Supply Chain Management',
                    content: 'Supply chain optimization, vendor management protocols, logistics coordination, and operational risk management procedures.',
                    content_type: 'management'
                },
                {
                    title: 'Team Performance Metrics',
                    content: 'Operational KPIs, team productivity measurements, process efficiency indicators, and operational dashboard configurations.',
                    content_type: 'metrics'
                }
            ]
        };
        
        this.defaultKnowledge = [
            {
                title: 'Company Policy Handbook',
                content: 'Standard operating procedures, HR policies, code of conduct, and general company guidelines applicable to all employees.',
                content_type: 'handbook'
            },
            {
                title: 'Communication Best Practices',
                content: 'Internal communication protocols, email etiquette, meeting management, and collaborative work standards.',
                content_type: 'best_practices'
            },
            {
                title: 'Professional Development Resources',
                content: 'Training materials, skill development programs, career progression pathways, and continuing education opportunities.',
                content_type: 'resources'
            }
        ];
    }

    async gerarRAGParaEmpresa(empresaId) {
        try {
            console.log('🚀 Iniciando geração de RAG Knowledge Base...');
            console.log(`📊 Gerando base de conhecimento para empresa: ${empresaId}`);

            // Buscar dados da empresa
            const { data: empresa, error: empresaError } = await supabase
                .from('empresas')
                .select('*')
                .eq('id', empresaId)
                .single();

            if (empresaError || !empresa) {
                throw new Error('Empresa não encontrada');
            }

            console.log(`📋 Empresa: ${empresa.nome} (${empresa.codigo})`);

            // Buscar personas
            const { data: personas, error: personasError } = await supabase
                .from('personas')
                .select('*')
                .eq('empresa_id', empresaId)
                .eq('status', 'active');

            if (personasError) {
                throw new Error(`Erro ao buscar personas: ${personasError.message}`);
            }

            console.log(`👥 Encontradas ${personas.length} personas ativas`);

            // Limpar RAG existente
            await this.limparRAGExistente(empresaId);

            const ragEntries = [];

            for (const persona of personas) {
                console.log(`⚙️ Processando: ${persona.full_name} (${persona.role})`);
                
                // Conhecimento específico por role
                const roleKnowledge = this.knowledgeTypes[persona.role] || this.defaultKnowledge;
                
                for (const knowledge of roleKnowledge) {
                    const ragEntry = {
                        empresa_id: empresaId,
                        persona_id: persona.id,
                        content_type: knowledge.content_type,
                        title: knowledge.title,
                        content: knowledge.content,
                        metadata: {
                            persona_role: persona.role,
                            persona_name: persona.full_name,
                            department: persona.department,
                            generated_at: new Date().toISOString(),
                            relevance_score: 1.0
                        }
                    };
                    
                    ragEntries.push(ragEntry);
                }

                // Conhecimento geral para todos
                for (const knowledge of this.defaultKnowledge) {
                    const ragEntry = {
                        empresa_id: empresaId,
                        persona_id: persona.id,
                        content_type: knowledge.content_type,
                        title: knowledge.title,
                        content: knowledge.content,
                        metadata: {
                            persona_role: persona.role,
                            persona_name: persona.full_name,
                            department: persona.department,
                            generated_at: new Date().toISOString(),
                            relevance_score: 0.8,
                            is_general: true
                        }
                    };
                    
                    ragEntries.push(ragEntry);
                }
            }

            // Inserir no banco
            const { data: insertedRAG, error: insertError } = await supabase
                .from('rag_knowledge_base')
                .insert(ragEntries)
                .select();

            if (insertError) {
                throw new Error(`Erro ao inserir RAG: ${insertError.message}`);
            }

            console.log(`✅ RAG Knowledge Base inserida no banco com sucesso!`);
            console.log(`📊 Total: ${insertedRAG.length} entradas de conhecimento para ${personas.length} personas`);

            return {
                personas_processadas: personas.length,
                rag_entries_criadas: insertedRAG.length,
                empresa_codigo: empresa.codigo
            };

        } catch (error) {
            console.error('❌ Erro ao gerar RAG:', error.message);
            throw error;
        }
    }

    async limparRAGExistente(empresaId) {
        console.log('🗑️ Limpando RAG Knowledge Base existente...');
        
        const { error: deleteError } = await supabase
            .from('rag_knowledge_base')
            .delete()
            .eq('empresa_id', empresaId);

        if (deleteError) {
            console.warn('⚠️ Aviso ao limpar RAG:', deleteError.message);
        }
    }
}

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
        console.log('Uso: node generate_rag_database.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de RAG Knowledge Base no banco...');
        
        const generator = new RAGKnowledgeBaseGenerator();
        const result = await generator.gerarRAGParaEmpresa(empresaId);
        
        console.log(`🎉 Processo concluído com sucesso!`);
        console.log(`📊 ${result.personas_processadas} personas processadas`);
        console.log(`📚 ${result.rag_entries_criadas} entradas de conhecimento criadas`);
        
        process.exit(0);
    } catch (error) {
        console.error(`💥 Erro na execução: ${error.message}`);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { RAGKnowledgeBaseGenerator };