const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class N8NWorkflowGenerator {
    constructor() {
        this.workflowTemplates = {
            'Chief Executive Officer': [
                {
                    workflow_name: 'Executive Dashboard Automation',
                    workflow_type: 'reporting',
                    nodes: [
                        {
                            id: 'trigger',
                            type: 'Schedule Trigger',
                            parameters: { 
                                cron: '0 8 * * MON', 
                                timezone: 'America/New_York' 
                            }
                        },
                        {
                            id: 'gather-metrics',
                            type: 'Supabase',
                            parameters: {
                                operation: 'select',
                                table: 'personas',
                                filters: { empresa_id: '${empresa_id}' }
                            }
                        },
                        {
                            id: 'generate-report',
                            type: 'Code',
                            parameters: {
                                jsCode: 'return { executiveSummary: "Weekly KPI Report Generated" };'
                            }
                        },
                        {
                            id: 'send-email',
                            type: 'Email',
                            parameters: {
                                to: '${persona_email}',
                                subject: 'Weekly Executive Report',
                                body: 'Executive dashboard report attached'
                            }
                        }
                    ],
                    connections: {
                        'trigger': ['gather-metrics'],
                        'gather-metrics': ['generate-report'],
                        'generate-report': ['send-email']
                    }
                },
                {
                    workflow_name: 'Strategic Alert System',
                    workflow_type: 'monitoring',
                    nodes: [
                        {
                            id: 'webhook',
                            type: 'Webhook',
                            parameters: { 
                                httpMethod: 'POST',
                                path: '/strategic-alert'
                            }
                        },
                        {
                            id: 'analyze-alert',
                            type: 'Code',
                            parameters: {
                                jsCode: 'return { alertLevel: data.severity, requiresAction: data.severity > 7 };'
                            }
                        },
                        {
                            id: 'notify-ceo',
                            type: 'Slack',
                            parameters: {
                                channel: '#executive-alerts',
                                message: 'Strategic alert requires immediate attention'
                            }
                        }
                    ],
                    connections: {
                        'webhook': ['analyze-alert'],
                        'analyze-alert': ['notify-ceo']
                    }
                }
            ],
            'Chief Technology Officer': [
                {
                    workflow_name: 'System Health Monitor',
                    workflow_type: 'monitoring',
                    nodes: [
                        {
                            id: 'schedule',
                            type: 'Schedule Trigger',
                            parameters: { 
                                cron: '*/15 * * * *',
                                timezone: 'America/New_York'
                            }
                        },
                        {
                            id: 'check-systems',
                            type: 'HTTP Request',
                            parameters: {
                                url: '${system_health_endpoint}',
                                method: 'GET'
                            }
                        },
                        {
                            id: 'evaluate-health',
                            type: 'Code',
                            parameters: {
                                jsCode: 'return { healthy: data.status === "ok", needsAttention: data.cpu > 80 };'
                            }
                        },
                        {
                            id: 'alert-if-needed',
                            type: 'IF',
                            parameters: {
                                condition: '{{ $json.needsAttention }}'
                            }
                        },
                        {
                            id: 'send-alert',
                            type: 'PagerDuty',
                            parameters: {
                                severity: 'warning',
                                summary: 'System health degraded'
                            }
                        }
                    ],
                    connections: {
                        'schedule': ['check-systems'],
                        'check-systems': ['evaluate-health'],
                        'evaluate-health': ['alert-if-needed'],
                        'alert-if-needed': ['send-alert']
                    }
                },
                {
                    workflow_name: 'Deployment Pipeline',
                    workflow_type: 'automation',
                    nodes: [
                        {
                            id: 'git-webhook',
                            type: 'Webhook',
                            parameters: {
                                httpMethod: 'POST',
                                path: '/deploy'
                            }
                        },
                        {
                            id: 'run-tests',
                            type: 'SSH',
                            parameters: {
                                command: 'npm test',
                                host: '${test_server}'
                            }
                        },
                        {
                            id: 'deploy-if-passed',
                            type: 'IF',
                            parameters: {
                                condition: '{{ $json.exitCode === 0 }}'
                            }
                        },
                        {
                            id: 'deploy',
                            type: 'Docker',
                            parameters: {
                                operation: 'deploy',
                                image: '${docker_image}'
                            }
                        }
                    ],
                    connections: {
                        'git-webhook': ['run-tests'],
                        'run-tests': ['deploy-if-passed'],
                        'deploy-if-passed': ['deploy']
                    }
                }
            ],
            'Chief Financial Officer': [
                {
                    workflow_name: 'Financial Report Generator',
                    workflow_type: 'reporting',
                    nodes: [
                        {
                            id: 'monthly-trigger',
                            type: 'Schedule Trigger',
                            parameters: {
                                cron: '0 9 1 * *',
                                timezone: 'America/New_York'
                            }
                        },
                        {
                            id: 'gather-financial-data',
                            type: 'Database',
                            parameters: {
                                operation: 'select',
                                query: 'SELECT * FROM financial_transactions WHERE month = current_month'
                            }
                        },
                        {
                            id: 'calculate-metrics',
                            type: 'Code',
                            parameters: {
                                jsCode: 'return { revenue: sum(data.income), expenses: sum(data.costs) };'
                            }
                        },
                        {
                            id: 'generate-pdf-report',
                            type: 'PDF Generator',
                            parameters: {
                                template: 'financial-report-template',
                                data: '{{ $json }}'
                            }
                        }
                    ],
                    connections: {
                        'monthly-trigger': ['gather-financial-data'],
                        'gather-financial-data': ['calculate-metrics'],
                        'calculate-metrics': ['generate-pdf-report']
                    }
                }
            ],
            'Chief Operating Officer': [
                {
                    workflow_name: 'Operations Dashboard Update',
                    workflow_type: 'data-sync',
                    nodes: [
                        {
                            id: 'hourly-trigger',
                            type: 'Schedule Trigger',
                            parameters: {
                                cron: '0 * * * *',
                                timezone: 'America/New_York'
                            }
                        },
                        {
                            id: 'collect-ops-data',
                            type: 'Multiple HTTP Requests',
                            parameters: {
                                requests: [
                                    { url: '${inventory_api}', method: 'GET' },
                                    { url: '${shipping_api}', method: 'GET' },
                                    { url: '${quality_api}', method: 'GET' }
                                ]
                            }
                        },
                        {
                            id: 'update-dashboard',
                            type: 'Database',
                            parameters: {
                                operation: 'upsert',
                                table: 'ops_dashboard',
                                data: '{{ $json }}'
                            }
                        }
                    ],
                    connections: {
                        'hourly-trigger': ['collect-ops-data'],
                        'collect-ops-data': ['update-dashboard']
                    }
                }
            ]
        };

        this.defaultWorkflows = [
            {
                workflow_name: 'Employee Onboarding Automation',
                workflow_type: 'hr-automation',
                nodes: [
                    {
                        id: 'new-hire-webhook',
                        type: 'Webhook',
                        parameters: {
                            httpMethod: 'POST',
                            path: '/new-hire'
                        }
                    },
                    {
                        id: 'create-accounts',
                        type: 'Multiple Actions',
                        parameters: {
                            actions: ['create-email', 'setup-slack', 'assign-equipment']
                        }
                    },
                    {
                        id: 'send-welcome-email',
                        type: 'Email',
                        parameters: {
                            template: 'welcome-template',
                            to: '{{ $json.email }}'
                        }
                    }
                ],
                connections: {
                    'new-hire-webhook': ['create-accounts'],
                    'create-accounts': ['send-welcome-email']
                }
            },
            {
                workflow_name: 'Weekly Team Sync',
                workflow_type: 'communication',
                nodes: [
                    {
                        id: 'weekly-trigger',
                        type: 'Schedule Trigger',
                        parameters: {
                            cron: '0 10 * * FRI',
                            timezone: 'America/New_York'
                        }
                    },
                    {
                        id: 'gather-updates',
                        type: 'Slack',
                        parameters: {
                            action: 'get-messages',
                            channel: '#team-updates',
                            since: 'last-week'
                        }
                    },
                    {
                        id: 'summarize',
                        type: 'AI Summarizer',
                        parameters: {
                            model: 'gpt-4',
                            prompt: 'Summarize the team updates from this week'
                        }
                    },
                    {
                        id: 'post-summary',
                        type: 'Slack',
                        parameters: {
                            channel: '#general',
                            message: 'Weekly team summary: {{ $json.summary }}'
                        }
                    }
                ],
                connections: {
                    'weekly-trigger': ['gather-updates'],
                    'gather-updates': ['summarize'],
                    'summarize': ['post-summary']
                }
            }
        ];
    }

    async gerarWorkflowsParaEmpresa(empresaId) {
        try {
            console.log('🚀 Iniciando geração de N8N Workflows...');
            console.log(`⚡ Gerando workflows para empresa: ${empresaId}`);

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

            // Limpar workflows existentes
            await this.limparWorkflowsExistentes(empresaId);

            const workflows = [];

            // Workflows específicos por role
            for (const persona of personas) {
                console.log(`⚙️ Processando: ${persona.full_name} (${persona.role})`);
                
                const roleWorkflows = this.workflowTemplates[persona.role] || [];
                
                for (const workflow of roleWorkflows) {
                    const workflowEntry = {
                        empresa_id: empresaId,
                        workflow_name: `${workflow.workflow_name} - ${persona.full_name}`,
                        workflow_type: workflow.workflow_type,
                        nodes: workflow.nodes.map(node => ({
                            ...node,
                            parameters: {
                                ...node.parameters,
                                empresa_id: empresaId,
                                persona_id: persona.id,
                                persona_email: persona.email
                            }
                        })),
                        connections: workflow.connections,
                        metadata: {
                            persona_id: persona.id,
                            persona_name: persona.full_name,
                            persona_role: persona.role,
                            department: persona.department,
                            generated_at: new Date().toISOString(),
                            is_active: true
                        }
                    };
                    
                    workflows.push(workflowEntry);
                }
            }

            // Workflows gerais da empresa
            for (const workflow of this.defaultWorkflows) {
                const workflowEntry = {
                    empresa_id: empresaId,
                    workflow_name: `${workflow.workflow_name} - ${empresa.nome}`,
                    workflow_type: workflow.workflow_type,
                    nodes: workflow.nodes.map(node => ({
                        ...node,
                        parameters: {
                            ...node.parameters,
                            empresa_id: empresaId
                        }
                    })),
                    connections: workflow.connections,
                    metadata: {
                        empresa_nome: empresa.nome,
                        empresa_codigo: empresa.codigo,
                        generated_at: new Date().toISOString(),
                        is_general: true,
                        is_active: true
                    }
                };
                
                workflows.push(workflowEntry);
            }

            // Inserir no banco
            const { data: insertedWorkflows, error: insertError } = await supabase
                .from('n8n_workflows')
                .insert(workflows)
                .select();

            if (insertError) {
                throw new Error(`Erro ao inserir workflows: ${insertError.message}`);
            }

            console.log(`✅ N8N Workflows inseridos no banco com sucesso!`);
            console.log(`📊 Total: ${insertedWorkflows.length} workflows para ${personas.length} personas`);

            const workflowsByType = insertedWorkflows.reduce((acc, wf) => {
                acc[wf.workflow_type] = (acc[wf.workflow_type] || 0) + 1;
                return acc;
            }, {});

            console.log('\n📈 Workflows por tipo:');
            Object.entries(workflowsByType).forEach(([type, count]) => {
                console.log(`   ${type}: ${count}`);
            });

            return {
                personas_processadas: personas.length,
                workflows_criados: insertedWorkflows.length,
                empresa_codigo: empresa.codigo,
                tipos_workflow: Object.keys(workflowsByType)
            };

        } catch (error) {
            console.error('❌ Erro ao gerar workflows:', error.message);
            throw error;
        }
    }

    async limparWorkflowsExistentes(empresaId) {
        console.log('🗑️ Limpando workflows existentes...');
        
        const { error: deleteError } = await supabase
            .from('n8n_workflows')
            .delete()
            .eq('empresa_id', empresaId);

        if (deleteError) {
            console.warn('⚠️ Aviso ao limpar workflows:', deleteError.message);
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
        console.log('Uso: node generate_workflows_database.js --empresaId UUID_DA_EMPRESA');
        process.exit(1);
    }

    try {
        console.log('🚀 Iniciando geração de N8N Workflows no banco...');
        
        const generator = new N8NWorkflowGenerator();
        const result = await generator.gerarWorkflowsParaEmpresa(empresaId);
        
        console.log(`🎉 Processo concluído com sucesso!`);
        console.log(`📊 ${result.personas_processadas} personas processadas`);
        console.log(`⚡ ${result.workflows_criados} workflows criados`);
        
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

module.exports = { N8NWorkflowGenerator };