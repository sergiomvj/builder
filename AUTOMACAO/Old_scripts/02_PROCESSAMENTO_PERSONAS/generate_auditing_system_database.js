const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class AuditingSystemGenerator {
    constructor() {
        this.auditTemplates = {
            'security': {
                frequency: 'quarterly',
                scope: 'security_controls',
                standards: ['ISO 27001', 'SOC2 Type II'],
                checkpoints: [
                    'Access control reviews',
                    'Vulnerability assessments',
                    'Security incident analysis',
                    'Compliance verification'
                ]
            },
            'financial': {
                frequency: 'monthly',
                scope: 'financial_processes',
                standards: ['GAAP', 'SOX'],
                checkpoints: [
                    'Financial reporting accuracy',
                    'Internal controls testing',
                    'Expense verification',
                    'Revenue recognition review'
                ]
            },
            'operational': {
                frequency: 'monthly',
                scope: 'business_operations',
                standards: ['ISO 9001', 'ITIL'],
                checkpoints: [
                    'Process adherence',
                    'Quality metrics review',
                    'Performance indicators',
                    'Customer satisfaction'
                ]
            },
            'compliance': {
                frequency: 'quarterly',
                scope: 'regulatory_compliance',
                standards: ['GDPR', 'CCPA', 'Industry Standards'],
                checkpoints: [
                    'Data protection compliance',
                    'Privacy policy adherence',
                    'Regulatory requirements',
                    'Legal obligations'
                ]
            },
            'hr': {
                frequency: 'semi-annual',
                scope: 'human_resources',
                standards: ['Employment Law', 'Company Policies'],
                checkpoints: [
                    'Performance management',
                    'Policy compliance',
                    'Training completion',
                    'Employee satisfaction'
                ]
            }
        };

        this.personaSpecificAudits = {
            'Chief Executive Officer': [
                {
                    audit_name: 'Strategic Decision Review',
                    audit_type: 'governance',
                    scope: 'Strategic planning and execution oversight',
                    frequency: 'quarterly',
                    checkpoints: [
                        'Strategic goal achievement',
                        'Board communication effectiveness',
                        'Stakeholder engagement quality',
                        'Risk management decisions'
                    ],
                    compliance_standards: ['Corporate Governance', 'Fiduciary Responsibilities'],
                    risk_level: 'high'
                },
                {
                    audit_name: 'Executive Performance Audit',
                    audit_type: 'performance',
                    scope: 'CEO performance against company objectives',
                    frequency: 'annual',
                    checkpoints: [
                        'Financial performance metrics',
                        'Leadership effectiveness',
                        'Cultural development',
                        'Innovation initiatives'
                    ],
                    compliance_standards: ['Board Charter', 'Performance Standards'],
                    risk_level: 'medium'
                }
            ],
            'Chief Technology Officer': [
                {
                    audit_name: 'Technology Security Audit',
                    audit_type: 'security',
                    scope: 'IT infrastructure and cybersecurity controls',
                    frequency: 'quarterly',
                    checkpoints: [
                        'Security vulnerability assessments',
                        'Access control reviews',
                        'Data encryption standards',
                        'Incident response procedures'
                    ],
                    compliance_standards: ['ISO 27001', 'SOC2 Type II', 'NIST Framework'],
                    risk_level: 'high'
                },
                {
                    audit_name: 'Technology Architecture Review',
                    audit_type: 'technical',
                    scope: 'System architecture and development practices',
                    frequency: 'semi-annual',
                    checkpoints: [
                        'Code quality standards',
                        'Architecture documentation',
                        'Performance benchmarks',
                        'Scalability assessments'
                    ],
                    compliance_standards: ['Software Development Standards', 'Technical Best Practices'],
                    risk_level: 'medium'
                }
            ],
            'Chief Financial Officer': [
                {
                    audit_name: 'Financial Controls Audit',
                    audit_type: 'financial',
                    scope: 'Financial reporting and internal controls',
                    frequency: 'monthly',
                    checkpoints: [
                        'Financial statement accuracy',
                        'Internal control effectiveness',
                        'Cash flow management',
                        'Budget variance analysis'
                    ],
                    compliance_standards: ['GAAP', 'SOX', 'Financial Reporting Standards'],
                    risk_level: 'high'
                },
                {
                    audit_name: 'Compliance and Risk Audit',
                    audit_type: 'compliance',
                    scope: 'Regulatory compliance and risk management',
                    frequency: 'quarterly',
                    checkpoints: [
                        'Regulatory filing accuracy',
                        'Risk assessment procedures',
                        'Vendor management',
                        'Investment oversight'
                    ],
                    compliance_standards: ['SEC Regulations', 'Risk Management Framework'],
                    risk_level: 'high'
                }
            ],
            'Chief Operating Officer': [
                {
                    audit_name: 'Operational Excellence Audit',
                    audit_type: 'operational',
                    scope: 'Business operations and process efficiency',
                    frequency: 'monthly',
                    checkpoints: [
                        'Process efficiency metrics',
                        'Quality control measures',
                        'Supply chain management',
                        'Customer service standards'
                    ],
                    compliance_standards: ['ISO 9001', 'Operational Standards'],
                    risk_level: 'medium'
                },
                {
                    audit_name: 'Quality Management Audit',
                    audit_type: 'quality',
                    scope: 'Quality management systems and procedures',
                    frequency: 'quarterly',
                    checkpoints: [
                        'Quality metrics achievement',
                        'Customer satisfaction scores',
                        'Product defect rates',
                        'Continuous improvement initiatives'
                    ],
                    compliance_standards: ['Quality Management System', 'Customer Standards'],
                    risk_level: 'medium'
                }
            ]
        };

        this.auditScheduleTemplates = {
            'daily': ['Security monitoring', 'System health checks', 'Financial transaction reviews'],
            'weekly': ['Process adherence', 'Team performance', 'Customer feedback'],
            'monthly': ['Financial controls', 'Operational metrics', 'Compliance checkpoints'],
            'quarterly': ['Strategic reviews', 'Security audits', 'Regulatory compliance'],
            'semi-annual': ['HR audits', 'Architecture reviews', 'Policy updates'],
            'annual': ['Comprehensive audits', 'Strategic planning', 'Executive performance']
        };
    }

    async gerarSistemaAuditoriaParaEmpresa(empresaId) {
        try {
            console.log('🔍 Iniciando geração do Sistema de Auditoria...');
            console.log(`⚡ Gerando auditorias para empresa: ${empresaId}`);

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

            // Limpar auditorias existentes
            await this.limparAuditoriasExistentes(empresaId);

            const auditEntries = [];

            // Auditorias específicas por persona
            for (const persona of personas) {
                console.log(`🔍 Processando auditorias: ${persona.full_name} (${persona.role})`);
                
                const personaAudits = this.personaSpecificAudits[persona.role] || [];
                
                for (const audit of personaAudits) {
                    const auditEntry = {
                        empresa_id: empresaId,
                        persona_id: persona.id,
                        audit_name: audit.audit_name,
                        audit_type: audit.audit_type,
                        scope: audit.scope,
                        frequency: audit.frequency,
                        checkpoints: audit.checkpoints,
                        compliance_standards: audit.compliance_standards,
                        risk_level: audit.risk_level,
                        status: 'scheduled',
                        last_audit_date: null,
                        next_audit_date: this.calculateNextAuditDate(audit.frequency),
                        findings: [],
                        recommendations: [],
                        metadata: {
                            persona_name: persona.full_name,
                            persona_role: persona.role,
                            department: persona.department,
                            created_at: new Date().toISOString(),
                            assigned_auditor: this.assignAuditor(audit.audit_type),
                            estimated_hours: this.estimateAuditHours(audit.audit_type, audit.scope),
                            priority: this.getAuditPriority(audit.risk_level, audit.frequency)
                        }
                    };
                    
                    auditEntries.push(auditEntry);
                }

                // Auditorias gerais por departamento
                const deptAudits = this.getDepartmentalAudits(persona.department);
                for (const deptAudit of deptAudits) {
                    const auditEntry = {
                        empresa_id: empresaId,
                        persona_id: persona.id,
                        audit_name: `${deptAudit.name} - ${persona.department}`,
                        audit_type: deptAudit.type,
                        scope: `${persona.department} departmental ${deptAudit.type}`,
                        frequency: deptAudit.frequency,
                        checkpoints: deptAudit.checkpoints,
                        compliance_standards: deptAudit.standards,
                        risk_level: 'medium',
                        status: 'scheduled',
                        last_audit_date: null,
                        next_audit_date: this.calculateNextAuditDate(deptAudit.frequency),
                        findings: [],
                        recommendations: [],
                        metadata: {
                            persona_name: persona.full_name,
                            persona_role: persona.role,
                            department: persona.department,
                            is_departmental: true,
                            created_at: new Date().toISOString(),
                            assigned_auditor: this.assignAuditor(deptAudit.type),
                            estimated_hours: this.estimateAuditHours(deptAudit.type, 'department'),
                            priority: this.getAuditPriority('medium', deptAudit.frequency)
                        }
                    };
                    
                    auditEntries.push(auditEntry);
                }
            }

            // Auditorias de empresa (não específicas de persona)
            const companyAudits = [
                {
                    audit_name: 'Corporate Governance Audit',
                    audit_type: 'governance',
                    scope: 'Company-wide governance and compliance',
                    frequency: 'annual',
                    checkpoints: [
                        'Board effectiveness',
                        'Policy compliance',
                        'Ethical standards',
                        'Transparency measures'
                    ],
                    compliance_standards: ['Corporate Governance Code', 'Ethics Standards'],
                    risk_level: 'high'
                },
                {
                    audit_name: 'Data Privacy and Security Audit',
                    audit_type: 'security',
                    scope: 'Company-wide data protection and cybersecurity',
                    frequency: 'semi-annual',
                    checkpoints: [
                        'Data protection measures',
                        'Privacy policy compliance',
                        'Security incident response',
                        'Employee training effectiveness'
                    ],
                    compliance_standards: ['GDPR', 'CCPA', 'ISO 27001'],
                    risk_level: 'high'
                },
                {
                    audit_name: 'Environmental and Sustainability Audit',
                    audit_type: 'sustainability',
                    scope: 'Environmental impact and sustainability practices',
                    frequency: 'annual',
                    checkpoints: [
                        'Environmental impact assessment',
                        'Sustainability initiatives',
                        'Carbon footprint analysis',
                        'Waste management practices'
                    ],
                    compliance_standards: ['Environmental Regulations', 'Sustainability Standards'],
                    risk_level: 'medium'
                }
            ];

            for (const audit of companyAudits) {
                const auditEntry = {
                    empresa_id: empresaId,
                    persona_id: null, // Company-wide audits
                    audit_name: audit.audit_name,
                    audit_type: audit.audit_type,
                    scope: audit.scope,
                    frequency: audit.frequency,
                    checkpoints: audit.checkpoints,
                    compliance_standards: audit.compliance_standards,
                    risk_level: audit.risk_level,
                    status: 'scheduled',
                    last_audit_date: null,
                    next_audit_date: this.calculateNextAuditDate(audit.frequency),
                    findings: [],
                    recommendations: [],
                    metadata: {
                        empresa_nome: empresa.nome,
                        is_company_wide: true,
                        created_at: new Date().toISOString(),
                        assigned_auditor: this.assignAuditor(audit.audit_type),
                        estimated_hours: this.estimateAuditHours(audit.audit_type, 'company'),
                        priority: this.getAuditPriority(audit.risk_level, audit.frequency)
                    }
                };
                
                auditEntries.push(auditEntry);
            }

            // Inserir no banco
            const { data: insertedAudits, error: insertError } = await supabase
                .from('audit_system')
                .insert(auditEntries)
                .select();

            if (insertError) {
                throw new Error(`Erro ao inserir auditorias: ${insertError.message}`);
            }

            console.log(`✅ Sistema de Auditoria inserido no banco com sucesso!`);
            console.log(`📊 Total: ${insertedAudits.length} auditorias para ${personas.length} personas`);

            const auditsByType = insertedAudits.reduce((acc, audit) => {
                acc[audit.audit_type] = (acc[audit.audit_type] || 0) + 1;
                return acc;
            }, {});

            const auditsByFrequency = insertedAudits.reduce((acc, audit) => {
                acc[audit.frequency] = (acc[audit.frequency] || 0) + 1;
                return acc;
            }, {});

            const auditsByRisk = insertedAudits.reduce((acc, audit) => {
                acc[audit.risk_level] = (acc[audit.risk_level] || 0) + 1;
                return acc;
            }, {});

            console.log('\n📈 Auditorias por tipo:');
            Object.entries(auditsByType).forEach(([type, count]) => {
                console.log(`   ${type}: ${count}`);
            });

            console.log('\n⏰ Auditorias por frequência:');
            Object.entries(auditsByFrequency).forEach(([frequency, count]) => {
                console.log(`   ${frequency}: ${count}`);
            });

            console.log('\n🚨 Auditorias por nível de risco:');
            Object.entries(auditsByRisk).forEach(([risk, count]) => {
                console.log(`   ${risk}: ${count}`);
            });

            return {
                personas_processadas: personas.length,
                auditorias_criadas: insertedAudits.length,
                empresa_codigo: empresa.codigo,
                tipos_auditoria: Object.keys(auditsByType),
                frequencias: Object.keys(auditsByFrequency),
                niveis_risco: Object.keys(auditsByRisk)
            };

        } catch (error) {
            console.error('❌ Erro ao gerar sistema de auditoria:', error.message);
            throw error;
        }
    }

    async limparAuditoriasExistentes(empresaId) {
        console.log('🗑️ Limpando auditorias existentes...');
        
        const { error: deleteError } = await supabase
            .from('audit_system')
            .delete()
            .eq('empresa_id', empresaId);

        if (deleteError) {
            console.warn('⚠️ Aviso ao limpar auditorias:', deleteError.message);
        }
    }

    calculateNextAuditDate(frequency) {
        const now = new Date();
        const frequencyDays = {
            'daily': 1,
            'weekly': 7,
            'monthly': 30,
            'quarterly': 90,
            'semi-annual': 180,
            'annual': 365
        };

        const days = frequencyDays[frequency] || 30;
        return new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    }

    assignAuditor(auditType) {
        const auditorByType = {
            'security': 'Security Audit Specialist',
            'financial': 'Financial Audit Specialist',
            'operational': 'Operations Audit Specialist',
            'compliance': 'Compliance Audit Specialist',
            'governance': 'Governance Audit Specialist',
            'technical': 'Technical Audit Specialist',
            'performance': 'Performance Audit Specialist',
            'quality': 'Quality Audit Specialist',
            'sustainability': 'Sustainability Audit Specialist'
        };

        return auditorByType[auditType] || 'General Audit Specialist';
    }

    estimateAuditHours(auditType, scope) {
        const baseHours = {
            'security': 20,
            'financial': 16,
            'operational': 12,
            'compliance': 14,
            'governance': 18,
            'technical': 16,
            'performance': 10,
            'quality': 12,
            'sustainability': 14
        };

        const scopeMultiplier = {
            'department': 1.2,
            'company': 2.5,
            'individual': 0.8
        };

        const base = baseHours[auditType] || 12;
        const multiplier = scopeMultiplier[scope] || 1;
        
        return Math.round(base * multiplier);
    }

    getAuditPriority(riskLevel, frequency) {
        if (riskLevel === 'high') {
            return frequency === 'monthly' || frequency === 'quarterly' ? 'critical' : 'high';
        }
        if (riskLevel === 'medium') {
            return frequency === 'monthly' ? 'high' : 'medium';
        }
        return 'low';
    }

    getDepartmentalAudits(department) {
        const departmentalAudits = {
            'Engineering': [
                {
                    name: 'Code Quality Review',
                    type: 'technical',
                    frequency: 'monthly',
                    checkpoints: ['Code review coverage', 'Testing standards', 'Documentation quality'],
                    standards: ['Coding Standards', 'Technical Guidelines']
                }
            ],
            'Sales': [
                {
                    name: 'Sales Process Audit',
                    type: 'operational',
                    frequency: 'quarterly',
                    checkpoints: ['Sales methodology', 'CRM usage', 'Pipeline accuracy'],
                    standards: ['Sales Standards', 'CRM Guidelines']
                }
            ],
            'Marketing': [
                {
                    name: 'Marketing Compliance Review',
                    type: 'compliance',
                    frequency: 'quarterly',
                    checkpoints: ['Content compliance', 'Data usage', 'Campaign effectiveness'],
                    standards: ['Marketing Standards', 'Data Protection']
                }
            ],
            'Human Resources': [
                {
                    name: 'HR Policy Compliance',
                    type: 'compliance',
                    frequency: 'semi-annual',
                    checkpoints: ['Policy adherence', 'Training completion', 'Employee relations'],
                    standards: ['HR Policies', 'Employment Law']
                }
            ]
        };

        return departmentalAudits[department] || [
            {
                name: 'General Process Review',
                type: 'operational',
                frequency: 'quarterly',
                checkpoints: ['Process efficiency', 'Quality standards', 'Team performance'],
                standards: ['Operational Standards', 'Quality Guidelines']
            }
        ];
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
        console.log('Uso: node generate_auditing_system_database.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🔍 Iniciando geração do Sistema de Auditoria no banco...');
        
        const generator = new AuditingSystemGenerator();
        const result = await generator.gerarSistemaAuditoriaParaEmpresa(empresaId);
        
        console.log(`🎉 Processo concluído com sucesso!`);
        console.log(`📊 ${result.personas_processadas} personas processadas`);
        console.log(`🔍 ${result.auditorias_criadas} auditorias criadas`);
        
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

module.exports = { AuditingSystemGenerator };