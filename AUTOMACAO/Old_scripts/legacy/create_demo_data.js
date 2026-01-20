#!/usr/bin/env node

/**
 * CRIADOR DE DADOS DEMO PARA SISTEMA AUTÔNOMO VCM
 * 
 * Cria dados de exemplo para demonstrar o sistema autônomo funcionando
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class DemoDataCreator {
    constructor() {
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.log('🧪 Criador de Dados Demo VCM inicializado');
    }
    
    log(message, level = 'info') {
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        console.log(`${emoji[level]} ${message}`);
    }
    
    async createDemoCompany() {
        try {
            this.log('🏢 Criando empresa demo...');
            
            const company = {
                id: '550e8400-e29b-41d4-a716-446655440000', // UUID fixo para demo
                nome_empresa: 'TechCorp Virtual Demo',
                setor: 'Tecnologia',
                descricao: 'Empresa virtual criada para demonstração do sistema autônomo VCM',
                criada_em: new Date().toISOString(),
                ativa: true
            };
            
            const { data, error } = await this.supabase
                .from('empresas')
                .upsert([company], { onConflict: 'id' });
                
            if (error) {
                this.log(`Aviso ao criar empresa: ${error.message}`, 'warning');
                // Tentar sem coluna 'ativa'
                const { data: data2, error: error2 } = await this.supabase
                    .from('empresas')
                    .upsert([{
                        id: company.id,
                        nome_empresa: company.nome_empresa,
                        setor: company.setor,
                        descricao: company.descricao,
                        criada_em: company.criada_em
                    }], { onConflict: 'id' });
                    
                if (error2) {
                    throw error2;
                }
            }
            
            this.log('✅ Empresa demo criada: TechCorp Virtual Demo');
            return company.id;
            
        } catch (error) {
            this.log(`Erro ao criar empresa demo: ${error.message}`, 'error');
            return null;
        }
    }
    
    async createDemoPersonas(companyId) {
        try {
            this.log('👥 Criando personas demo...');
            
            const personas = [
                {
                    id: '550e8400-e29b-41d4-a716-446655440001',
                    empresa_id: companyId,
                    nome: 'João Silva',
                    cargo: 'CEO',
                    departamento: 'Executivo',
                    email: 'ceo@techcorp-demo.com',
                    competencias: 'Liderança estratégica, Gestão executiva, Visão de negócios',
                    criado_em: new Date().toISOString(),
                    ativa: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440002',
                    empresa_id: companyId,
                    nome: 'Maria Santos',
                    cargo: 'CTO',
                    departamento: 'Tecnologia',
                    email: 'cto@techcorp-demo.com',
                    competencias: 'Arquitetura de sistemas, Gestão de tecnologia, DevOps',
                    criado_em: new Date().toISOString(),
                    ativa: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440003',
                    empresa_id: companyId,
                    nome: 'Carlos Oliveira',
                    cargo: 'CFO',
                    departamento: 'Financeiro',
                    email: 'cfo@techcorp-demo.com',
                    competencias: 'Gestão financeira, Análise de investimentos, Controles internos',
                    criado_em: new Date().toISOString(),
                    ativa: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440004',
                    empresa_id: companyId,
                    nome: 'Ana Costa',
                    cargo: 'Marketing Manager',
                    departamento: 'Marketing',
                    email: 'marketing@techcorp-demo.com',
                    competencias: 'Marketing digital, Gestão de campanhas, Analytics',
                    criado_em: new Date().toISOString(),
                    ativa: true
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440005',
                    empresa_id: companyId,
                    nome: 'Pedro Ferreira',
                    cargo: 'Sales Manager',
                    departamento: 'Vendas',
                    email: 'sales@techcorp-demo.com',
                    competencias: 'Gestão de vendas, CRM, Negociação',
                    criado_em: new Date().toISOString(),
                    ativa: true
                }
            ];
            
            for (const persona of personas) {
                try {
                    const { data, error } = await this.supabase
                        .from('personas')
                        .upsert([persona], { onConflict: 'id' });
                        
                    if (error) {
                        // Tentar sem coluna 'ativa'
                        const personaSimple = { ...persona };
                        delete personaSimple.ativa;
                        
                        const { data: data2, error: error2 } = await this.supabase
                            .from('personas')
                            .upsert([personaSimple], { onConflict: 'id' });
                            
                        if (error2) {
                            this.log(`Erro ao criar persona ${persona.nome}: ${error2.message}`, 'warning');
                        } else {
                            this.log(`✅ Persona criada: ${persona.nome} (${persona.cargo})`);
                        }
                    } else {
                        this.log(`✅ Persona criada: ${persona.nome} (${persona.cargo})`);
                    }
                } catch (error) {
                    this.log(`Erro ao criar persona ${persona.nome}: ${error.message}`, 'warning');
                }
            }
            
            this.log(`✅ ${personas.length} personas demo criadas`);
            return personas.length;
            
        } catch (error) {
            this.log(`Erro ao criar personas demo: ${error.message}`, 'error');
            return 0;
        }
    }
    
    async createDemoTaskTemplates() {
        try {
            this.log('📋 Criando templates de tarefas demo...');
            
            const templates = [
                {
                    id: '550e8400-e29b-41d4-a716-446655440010',
                    position_type: 'CEO',
                    task_type: 'daily',
                    template_name: 'Tarefas Diárias CEO - Demo',
                    template_data: JSON.stringify({
                        tasks: [
                            {
                                title: 'Revisar métricas estratégicas',
                                description: 'Analisar KPIs de vendas, marketing e operações',
                                priority: 'high',
                                estimated_duration: 45,
                                required_subsystems: ['analytics', 'financial'],
                                inputs_from: ['CFO', 'CTO'],
                                outputs_to: ['Board de Diretores']
                            }
                        ]
                    }),
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440011',
                    position_type: 'Generic',
                    task_type: 'daily',
                    template_name: 'Tarefas Genéricas - Demo',
                    template_data: JSON.stringify({
                        tasks: [
                            {
                                title: 'Tarefa diária demo',
                                description: 'Tarefa de exemplo criada pelo sistema demo',
                                priority: 'medium',
                                estimated_duration: 30,
                                required_subsystems: ['email'],
                                inputs_from: ['Equipe'],
                                outputs_to: ['Supervisor']
                            }
                        ]
                    }),
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            ];
            
            for (const template of templates) {
                try {
                    const { data, error } = await this.supabase
                        .from('task_templates')
                        .upsert([template], { onConflict: 'id' });
                        
                    if (error) {
                        this.log(`Aviso template ${template.template_name}: ${error.message}`, 'warning');
                    } else {
                        this.log(`✅ Template criado: ${template.template_name}`);
                    }
                } catch (error) {
                    this.log(`Erro template ${template.template_name}: ${error.message}`, 'warning');
                }
            }
            
            this.log(`✅ ${templates.length} templates de tarefa criados`);
            return templates.length;
            
        } catch (error) {
            this.log(`Erro ao criar templates: ${error.message}`, 'error');
            return 0;
        }
    }
    
    async cleanupOldDemoData() {
        try {
            this.log('🧹 Limpando dados demo antigos...');
            
            // Limpar tarefas antigas
            try {
                await this.supabase
                    .from('personas_tasks')
                    .delete()
                    .like('task_id', 'demo_%');
                    
                this.log('✅ Tarefas demo antigas removidas');
            } catch (error) {
                this.log(`Aviso ao limpar tarefas: ${error.message}`, 'warning');
            }
            
        } catch (error) {
            this.log(`Erro na limpeza: ${error.message}`, 'error');
        }
    }
    
    async createAllDemoData() {
        this.log('🚀 CRIANDO DADOS DEMO PARA SISTEMA AUTÔNOMO VCM');
        this.log('===============================================');
        
        try {
            // Limpar dados antigos
            await this.cleanupOldDemoData();
            
            // Criar empresa
            const companyId = await this.createDemoCompany();
            if (!companyId) {
                this.log('❌ Falha ao criar empresa demo', 'error');
                return false;
            }
            
            // Criar personas
            const personasCreated = await this.createDemoPersonas(companyId);
            
            // Criar templates
            const templatesCreated = await this.createDemoTaskTemplates();
            
            this.log('===============================================');
            this.log('📊 RESUMO DOS DADOS DEMO CRIADOS');
            this.log('===============================================');
            this.log(`🏢 Empresas: 1 (TechCorp Virtual Demo)`);
            this.log(`👥 Personas: ${personasCreated}`);
            this.log(`📋 Templates: ${templatesCreated}`);
            
            if (personasCreated >= 3) {
                this.log('\n🎉 DADOS DEMO CRIADOS COM SUCESSO!');
                this.log('\n🚀 Agora você pode testar o sistema autônomo:');
                this.log('   node autonomous_task_arbitrator_demo.js --manual');
                this.log('   ou');
                this.log('   node autonomous_task_arbitrator_demo.js');
                
                return true;
            } else {
                this.log('\n⚠️ Dados demo parcialmente criados', 'warning');
                this.log('Algumas personas podem não ter sido criadas corretamente');
                return false;
            }
            
        } catch (error) {
            this.log(`❌ Erro geral na criação dos dados: ${error.message}`, 'error');
            return false;
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const creator = new DemoDataCreator();
    creator.createAllDemoData().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = DemoDataCreator;