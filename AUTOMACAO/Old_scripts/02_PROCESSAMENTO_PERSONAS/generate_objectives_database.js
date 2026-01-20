const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class ObjectivesGenerator {
    constructor() {
        this.objectiveTemplates = {
            'Chief Executive Officer': [
                {
                    category: 'strategic',
                    title: 'Increase Company Revenue by 25%',
                    description: 'Develop and implement strategic initiatives to achieve 25% revenue growth within 12 months',
                    priority: 'high',
                    deadline_months: 12,
                    success_metrics: ['Monthly revenue tracking', 'Market share analysis', 'Customer acquisition rates'],
                    dependencies: ['Market analysis completion', 'Sales team expansion', 'Product roadmap alignment'],
                    status: 'active'
                },
                {
                    category: 'leadership',
                    title: 'Build High-Performance Executive Team',
                    description: 'Recruit and develop C-level executives to support company growth',
                    priority: 'high',
                    deadline_months: 6,
                    success_metrics: ['Executive team completion rate', 'Leadership assessment scores', 'Team collaboration metrics'],
                    dependencies: ['Role definitions', 'Compensation benchmarking', 'Cultural fit assessment'],
                    status: 'active'
                },
                {
                    category: 'governance',
                    title: 'Establish Corporate Governance Framework',
                    description: 'Implement comprehensive governance policies and board oversight mechanisms',
                    priority: 'medium',
                    deadline_months: 9,
                    success_metrics: ['Policy implementation rate', 'Board meeting effectiveness', 'Compliance audit results'],
                    dependencies: ['Legal review', 'Board formation', 'Policy documentation'],
                    status: 'planning'
                }
            ],
            'Chief Technology Officer': [
                {
                    category: 'technical',
                    title: 'Implement Cloud-First Architecture',
                    description: 'Migrate core systems to cloud infrastructure with 99.9% uptime guarantee',
                    priority: 'high',
                    deadline_months: 8,
                    success_metrics: ['System uptime percentage', 'Migration completion rate', 'Performance benchmarks'],
                    dependencies: ['Cloud provider selection', 'Security assessment', 'Team training'],
                    status: 'active'
                },
                {
                    category: 'security',
                    title: 'Achieve SOC2 Type II Compliance',
                    description: 'Implement security controls and processes to achieve SOC2 Type II certification',
                    priority: 'high',
                    deadline_months: 10,
                    success_metrics: ['Audit completion', 'Control implementation rate', 'Security incident reduction'],
                    dependencies: ['Security framework selection', 'Internal audit', 'Documentation'],
                    status: 'active'
                },
                {
                    category: 'innovation',
                    title: 'Establish AI/ML Development Pipeline',
                    description: 'Build capabilities for AI-driven product features and automation',
                    priority: 'medium',
                    deadline_months: 12,
                    success_metrics: ['ML models in production', 'AI feature adoption rate', 'Development velocity'],
                    dependencies: ['Data infrastructure', 'ML team hiring', 'Model training platform'],
                    status: 'planning'
                }
            ],
            'Chief Financial Officer': [
                {
                    category: 'financial',
                    title: 'Optimize Cash Flow Management',
                    description: 'Implement automated financial processes to improve cash flow by 30%',
                    priority: 'high',
                    deadline_months: 6,
                    success_metrics: ['Cash flow improvement percentage', 'Process automation rate', 'Forecast accuracy'],
                    dependencies: ['Financial system implementation', 'Process mapping', 'Team training'],
                    status: 'active'
                },
                {
                    category: 'compliance',
                    title: 'Prepare for Series A Fundraising',
                    description: 'Establish financial controls and reporting for investor due diligence',
                    priority: 'high',
                    deadline_months: 9,
                    success_metrics: ['Audit completion', 'Financial reporting accuracy', 'Investor readiness score'],
                    dependencies: ['External audit', 'Financial system upgrade', 'Board reporting'],
                    status: 'planning'
                },
                {
                    category: 'cost-management',
                    title: 'Reduce Operating Expenses by 15%',
                    description: 'Identify and implement cost reduction initiatives without impacting growth',
                    priority: 'medium',
                    deadline_months: 8,
                    success_metrics: ['Cost reduction percentage', 'Efficiency metrics', 'Quality maintenance'],
                    dependencies: ['Cost analysis', 'Vendor negotiations', 'Process optimization'],
                    status: 'active'
                }
            ],
            'Chief Operating Officer': [
                {
                    category: 'operations',
                    title: 'Scale Operations to Support 3x Growth',
                    description: 'Build operational infrastructure to support 300% business growth',
                    priority: 'high',
                    deadline_months: 10,
                    success_metrics: ['Capacity utilization', 'Process scalability metrics', 'Quality maintenance'],
                    dependencies: ['Process documentation', 'System automation', 'Team expansion'],
                    status: 'active'
                },
                {
                    category: 'quality',
                    title: 'Implement Quality Management System',
                    description: 'Establish ISO 9001 quality management processes across all operations',
                    priority: 'medium',
                    deadline_months: 12,
                    success_metrics: ['ISO certification', 'Quality metrics improvement', 'Customer satisfaction'],
                    dependencies: ['Process mapping', 'Training programs', 'Documentation'],
                    status: 'planning'
                }
            ],
            'Head of Sales': [
                {
                    category: 'sales',
                    title: 'Achieve $2M Annual Recurring Revenue',
                    description: 'Build sales pipeline and close deals to reach $2M ARR milestone',
                    priority: 'high',
                    deadline_months: 12,
                    success_metrics: ['Monthly ARR growth', 'Pipeline conversion rate', 'Customer acquisition cost'],
                    dependencies: ['Sales team hiring', 'CRM implementation', 'Sales process optimization'],
                    status: 'active'
                },
                {
                    category: 'team-building',
                    title: 'Build World-Class Sales Team',
                    description: 'Recruit and train 10 sales professionals with proven track records',
                    priority: 'high',
                    deadline_months: 6,
                    success_metrics: ['Team headcount', 'Ramp-up time', 'Performance metrics'],
                    dependencies: ['Role definitions', 'Compensation design', 'Training program'],
                    status: 'active'
                }
            ],
            'Head of Marketing': [
                {
                    category: 'marketing',
                    title: 'Generate 500 Qualified Leads Monthly',
                    description: 'Implement integrated marketing campaigns to generate consistent lead flow',
                    priority: 'high',
                    deadline_months: 8,
                    success_metrics: ['Monthly lead count', 'Lead quality score', 'Cost per acquisition'],
                    dependencies: ['Marketing automation setup', 'Content strategy', 'Channel optimization'],
                    status: 'active'
                },
                {
                    category: 'brand',
                    title: 'Establish Market Brand Recognition',
                    description: 'Build brand awareness and thought leadership in target market',
                    priority: 'medium',
                    deadline_months: 10,
                    success_metrics: ['Brand awareness surveys', 'Media mentions', 'Thought leadership metrics'],
                    dependencies: ['Brand strategy', 'Content creation', 'PR campaign'],
                    status: 'planning'
                }
            ],
            'Head of Human Resources': [
                {
                    category: 'talent',
                    title: 'Scale Team from 20 to 50 Employees',
                    description: 'Build recruitment and onboarding processes for rapid team growth',
                    priority: 'high',
                    deadline_months: 8,
                    success_metrics: ['Hiring velocity', 'Employee satisfaction', 'Retention rate'],
                    dependencies: ['Recruitment process', 'Employer branding', 'Onboarding program'],
                    status: 'active'
                },
                {
                    category: 'culture',
                    title: 'Implement Performance Management System',
                    description: 'Establish fair and transparent performance evaluation and development processes',
                    priority: 'medium',
                    deadline_months: 6,
                    success_metrics: ['Performance review completion', 'Employee development plans', 'Promotion rates'],
                    dependencies: ['Framework design', 'Manager training', 'System implementation'],
                    status: 'active'
                }
            ]
        };

        this.departmentObjectives = {
            'Engineering': [
                {
                    category: 'development',
                    title: 'Achieve 95% Test Coverage',
                    description: 'Implement comprehensive testing across all codebases',
                    priority: 'medium',
                    deadline_months: 6
                },
                {
                    category: 'performance',
                    title: 'Reduce Page Load Time by 50%',
                    description: 'Optimize application performance for better user experience',
                    priority: 'high',
                    deadline_months: 4
                }
            ],
            'Product': [
                {
                    category: 'user-experience',
                    title: 'Improve User Satisfaction Score to 4.5/5',
                    description: 'Enhance product usability and feature completeness',
                    priority: 'high',
                    deadline_months: 8
                }
            ],
            'Customer Success': [
                {
                    category: 'retention',
                    title: 'Achieve 95% Customer Retention Rate',
                    description: 'Implement proactive customer success programs',
                    priority: 'high',
                    deadline_months: 10
                }
            ]
        };
    }

    async gerarObjetivosParaEmpresa(empresaId) {
        try {
            console.log('🎯 Iniciando geração de Objetivos...');
            console.log(`⚡ Gerando objetivos para empresa: ${empresaId}`);

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

            // Limpar objetivos existentes
            await this.limparObjetivosExistentes(empresaId);

            const objectives = [];

            // Objetivos específicos por role/persona
            for (const persona of personas) {
                console.log(`🎯 Processando objetivos: ${persona.full_name} (${persona.role})`);
                
                const roleObjectives = this.objectiveTemplates[persona.role] || [];
                
                for (const objective of roleObjectives) {
                    const objectiveEntry = {
                        empresa_id: empresaId,
                        persona_id: persona.id,
                        category: objective.category,
                        title: objective.title,
                        description: objective.description,
                        priority: objective.priority,
                        deadline: new Date(Date.now() + (objective.deadline_months * 30 * 24 * 60 * 60 * 1000)),
                        success_metrics: objective.success_metrics,
                        dependencies: objective.dependencies,
                        status: objective.status || 'planning',
                        progress_percentage: 0,
                        metadata: {
                            persona_name: persona.full_name,
                            persona_role: persona.role,
                            department: persona.department,
                            assigned_date: new Date().toISOString(),
                            estimated_hours: this.estimateHours(objective.category),
                            complexity_level: this.getComplexityLevel(objective.priority, objective.deadline_months)
                        }
                    };
                    
                    objectives.push(objectiveEntry);
                }

                // Objetivos departamentais
                const deptObjectives = this.departmentObjectives[persona.department] || [];
                for (const deptObjective of deptObjectives) {
                    const objectiveEntry = {
                        empresa_id: empresaId,
                        persona_id: persona.id,
                        category: deptObjective.category,
                        title: `${deptObjective.title} (Department)`,
                        description: deptObjective.description,
                        priority: deptObjective.priority,
                        deadline: new Date(Date.now() + (deptObjective.deadline_months * 30 * 24 * 60 * 60 * 1000)),
                        success_metrics: deptObjective.success_metrics || ['Department performance metrics'],
                        dependencies: deptObjective.dependencies || ['Team coordination', 'Resource allocation'],
                        status: 'active',
                        progress_percentage: 0,
                        metadata: {
                            persona_name: persona.full_name,
                            persona_role: persona.role,
                            department: persona.department,
                            is_departmental: true,
                            assigned_date: new Date().toISOString(),
                            estimated_hours: this.estimateHours(deptObjective.category),
                            complexity_level: this.getComplexityLevel(deptObjective.priority, deptObjective.deadline_months)
                        }
                    };
                    
                    objectives.push(objectiveEntry);
                }
            }

            // Objetivos estratégicos da empresa (não vinculados a persona específica)
            const companyObjectives = [
                {
                    category: 'company-wide',
                    title: 'Establish Market Leadership Position',
                    description: 'Become recognized leader in the target market segment',
                    priority: 'high',
                    deadline_months: 18,
                    success_metrics: ['Market share percentage', 'Industry recognition', 'Competitive analysis'],
                    dependencies: ['Market analysis', 'Competitive research', 'Brand positioning'],
                    status: 'active'
                },
                {
                    category: 'sustainability',
                    title: 'Achieve Carbon Neutral Operations',
                    description: 'Implement sustainable practices across all business operations',
                    priority: 'medium',
                    deadline_months: 24,
                    success_metrics: ['Carbon footprint reduction', 'Sustainable practices adoption', 'Environmental certifications'],
                    dependencies: ['Environmental audit', 'Sustainability plan', 'Green initiatives'],
                    status: 'planning'
                }
            ];

            for (const objective of companyObjectives) {
                const objectiveEntry = {
                    empresa_id: empresaId,
                    persona_id: null, // Company-wide objectives
                    category: objective.category,
                    title: objective.title,
                    description: objective.description,
                    priority: objective.priority,
                    deadline: new Date(Date.now() + (objective.deadline_months * 30 * 24 * 60 * 60 * 1000)),
                    success_metrics: objective.success_metrics,
                    dependencies: objective.dependencies,
                    status: objective.status,
                    progress_percentage: 0,
                    metadata: {
                        empresa_nome: empresa.nome,
                        is_company_wide: true,
                        assigned_date: new Date().toISOString(),
                        estimated_hours: this.estimateHours(objective.category),
                        complexity_level: this.getComplexityLevel(objective.priority, objective.deadline_months)
                    }
                };
                
                objectives.push(objectiveEntry);
            }

            // Inserir no banco
            const { data: insertedObjectives, error: insertError } = await supabase
                .from('objectives')
                .insert(objectives)
                .select();

            if (insertError) {
                throw new Error(`Erro ao inserir objetivos: ${insertError.message}`);
            }

            console.log(`✅ Objetivos inseridos no banco com sucesso!`);
            console.log(`📊 Total: ${insertedObjectives.length} objetivos para ${personas.length} personas`);

            const objectivesByCategory = insertedObjectives.reduce((acc, obj) => {
                acc[obj.category] = (acc[obj.category] || 0) + 1;
                return acc;
            }, {});

            const objectivesByPriority = insertedObjectives.reduce((acc, obj) => {
                acc[obj.priority] = (acc[obj.priority] || 0) + 1;
                return acc;
            }, {});

            console.log('\n📈 Objetivos por categoria:');
            Object.entries(objectivesByCategory).forEach(([category, count]) => {
                console.log(`   ${category}: ${count}`);
            });

            console.log('\n🎯 Objetivos por prioridade:');
            Object.entries(objectivesByPriority).forEach(([priority, count]) => {
                console.log(`   ${priority}: ${count}`);
            });

            return {
                personas_processadas: personas.length,
                objetivos_criados: insertedObjectives.length,
                empresa_codigo: empresa.codigo,
                categorias: Object.keys(objectivesByCategory),
                prioridades: Object.keys(objectivesByPriority)
            };

        } catch (error) {
            console.error('❌ Erro ao gerar objetivos:', error.message);
            throw error;
        }
    }

    async limparObjetivosExistentes(empresaId) {
        console.log('🗑️ Limpando objetivos existentes...');
        
        const { error: deleteError } = await supabase
            .from('objectives')
            .delete()
            .eq('empresa_id', empresaId);

        if (deleteError) {
            console.warn('⚠️ Aviso ao limpar objetivos:', deleteError.message);
        }
    }

    estimateHours(category) {
        const hoursByCategory = {
            'strategic': 120,
            'leadership': 80,
            'governance': 100,
            'technical': 160,
            'security': 140,
            'innovation': 180,
            'financial': 60,
            'compliance': 80,
            'cost-management': 40,
            'operations': 100,
            'quality': 120,
            'sales': 80,
            'team-building': 60,
            'marketing': 70,
            'brand': 90,
            'talent': 50,
            'culture': 40,
            'development': 100,
            'performance': 80,
            'user-experience': 90,
            'retention': 60,
            'company-wide': 200,
            'sustainability': 150
        };

        return hoursByCategory[category] || 80;
    }

    getComplexityLevel(priority, deadlineMonths) {
        if (priority === 'high' && deadlineMonths <= 6) return 'high';
        if (priority === 'high' && deadlineMonths <= 12) return 'medium-high';
        if (priority === 'medium' && deadlineMonths <= 6) return 'medium-high';
        if (priority === 'medium' && deadlineMonths <= 12) return 'medium';
        return 'low-medium';
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
        console.log('Uso: node generate_objectives_database.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🎯 Iniciando geração de Objetivos no banco...');
        
        const generator = new ObjectivesGenerator();
        const result = await generator.gerarObjetivosParaEmpresa(empresaId);
        
        console.log(`🎉 Processo concluído com sucesso!`);
        console.log(`📊 ${result.personas_processadas} personas processadas`);
        console.log(`🎯 ${result.objetivos_criados} objetivos criados`);
        
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

module.exports = { ObjectivesGenerator };