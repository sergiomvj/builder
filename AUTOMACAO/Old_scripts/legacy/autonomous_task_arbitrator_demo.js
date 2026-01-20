#!/usr/bin/env node

/**
 * SISTEMA AUTÔNOMO VCM - VERSÃO DEMO
 * 
 * Versão de demonstração que funciona sem chave OpenAI
 * Usa templates inteligentes pré-definidos para arbitragem
 */

const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class AutonomousTaskArbitratorDemo {
    constructor() {
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.subsystems = this.initializeSubsystems();
        this.taskTemplates = this.initializeTaskTemplates();
        this.isRunning = false;
        this.debugMode = true; // Always debug for demo
        
        this.log('🚀 Sistema Autônomo VCM - VERSÃO DEMO inicializado');
    }
    
    initializeSubsystems() {
        return {
            email: {
                name: 'Email Marketing',
                capabilities: ['campanhas', 'automação', 'segmentação'],
                personas: ['Marketing Manager', 'Sales Manager']
            },
            crm: {
                name: 'CRM',
                capabilities: ['leads', 'pipeline', 'vendas'],
                personas: ['Sales Manager', 'Customer Success']
            },
            social: {
                name: 'Redes Sociais', 
                capabilities: ['posts', 'engagement', 'monitoramento'],
                personas: ['Social Media Manager']
            },
            analytics: {
                name: 'Analytics',
                capabilities: ['dashboards', 'relatórios', 'KPIs'],
                personas: ['Data Analyst', 'CEO', 'CTO']
            },
            financial: {
                name: 'Financeiro',
                capabilities: ['faturamento', 'cobrança', 'relatórios'],
                personas: ['CFO', 'Financial Analyst']
            }
        };
    }
    
    initializeTaskTemplates() {
        return {
            'CEO': [
                {
                    title: 'Revisar métricas estratégicas',
                    description: 'Analisar KPIs de vendas, marketing e operações para tomada de decisões estratégicas',
                    priority: 'high',
                    estimated_duration: 45,
                    required_subsystems: ['analytics', 'financial'],
                    inputs_from: ['CFO', 'Head of Operations'],
                    outputs_to: ['Board de Diretores'],
                    success_criteria: 'Decisões estratégicas documentadas e comunicadas'
                },
                {
                    title: 'Reunião de alinhamento executivo',
                    description: 'Reunião com equipe C-level para alinhamento de objetivos e prioridades',
                    priority: 'high',
                    estimated_duration: 60,
                    required_subsystems: ['email', 'analytics'],
                    inputs_from: ['CTO', 'CFO', 'CMO'],
                    outputs_to: ['Equipe Executiva'],
                    success_criteria: 'Objetivos alinhados e próximos passos definidos'
                }
            ],
            'CTO': [
                {
                    title: 'Revisão de arquitetura técnica',
                    description: 'Avaliar performance da infraestrutura e identificar pontos de melhoria',
                    priority: 'high',
                    estimated_duration: 90,
                    required_subsystems: ['analytics'],
                    inputs_from: ['Dev Team', 'DevOps'],
                    outputs_to: ['CEO', 'Dev Team'],
                    success_criteria: 'Roadmap técnico atualizado'
                },
                {
                    title: 'Planejamento de sprint técnico',
                    description: 'Definir prioridades técnicas para o próximo sprint de desenvolvimento',
                    priority: 'medium',
                    estimated_duration: 60,
                    required_subsystems: ['analytics'],
                    inputs_from: ['Product Manager', 'Dev Team'],
                    outputs_to: ['Dev Team'],
                    success_criteria: 'Sprint backlog definido'
                }
            ],
            'CFO': [
                {
                    title: 'Análise financeira mensal',
                    description: 'Revisar resultados financeiros do mês e projeções',
                    priority: 'high',
                    estimated_duration: 75,
                    required_subsystems: ['financial', 'analytics'],
                    inputs_from: ['Accounting Team'],
                    outputs_to: ['CEO', 'Board'],
                    success_criteria: 'Relatório financeiro completo entregue'
                }
            ],
            'Marketing Manager': [
                {
                    title: 'Análise de campanhas ativas',
                    description: 'Revisar performance das campanhas de marketing em andamento',
                    priority: 'medium',
                    estimated_duration: 45,
                    required_subsystems: ['email', 'social', 'analytics'],
                    inputs_from: ['Marketing Team'],
                    outputs_to: ['CMO', 'Sales Team'],
                    success_criteria: 'Relatório de performance e otimizações identificadas'
                },
                {
                    title: 'Planejamento de conteúdo semanal',
                    description: 'Definir calendário editorial e temas para a semana',
                    priority: 'medium',
                    estimated_duration: 30,
                    required_subsystems: ['social', 'email'],
                    inputs_from: ['Content Team'],
                    outputs_to: ['Content Team', 'Social Media'],
                    success_criteria: 'Calendário editorial aprovado'
                }
            ],
            'Sales Manager': [
                {
                    title: 'Revisão de pipeline de vendas',
                    description: 'Analisar oportunidades em andamento e estratégias de fechamento',
                    priority: 'high',
                    estimated_duration: 60,
                    required_subsystems: ['crm', 'analytics'],
                    inputs_from: ['Sales Team'],
                    outputs_to: ['CEO', 'Sales Team'],
                    success_criteria: 'Plano de ação para principais oportunidades'
                }
            ]
        };
    }
    
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleString('pt-BR');
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            debug: '🔍'
        };
        
        console.log(`${emoji[level]} [${timestamp}] ${message}`);
    }
    
    async getActiveCompanies() {
        try {
            let companies = [];
            
            try {
                const { data, error } = await this.supabase
                    .from('empresas')
                    .select('*')
                    .eq('ativa', true);
                    
                if (!error && data) {
                    companies = data;
                }
            } catch (error) {
                const { data, error: err2 } = await this.supabase
                    .from('empresas')
                    .select('*')
                    .limit(5);
                    
                if (!err2 && data) {
                    companies = data;
                }
            }
                
            this.log(`🏢 Encontradas ${companies.length} empresas para processar`);
            return companies;
            
        } catch (error) {
            this.log(`Erro ao buscar empresas: ${error.message}`, 'error');
            return [];
        }
    }
    
    async getCompanyPersonas(companyId) {
        try {
            let personas = [];
            
            try {
                const { data, error } = await this.supabase
                    .from('personas')
                    .select('*')
                    .eq('empresa_id', companyId)
                    .eq('ativa', true);
                    
                if (!error && data) {
                    personas = data;
                }
            } catch (error) {
                const { data, error: err2 } = await this.supabase
                    .from('personas')
                    .select('*')
                    .eq('empresa_id', companyId);
                    
                if (!err2 && data) {
                    personas = data;
                }
            }
            
            return personas;
            
        } catch (error) {
            this.log(`Erro ao buscar personas da empresa ${companyId}: ${error.message}`, 'error');
            return [];
        }
    }
    
    analyzeCompanyContextDemo(company, personas) {
        // Análise inteligente baseada em regras
        const currentHour = new Date().getHours();
        const dayOfWeek = new Date().getDay(); // 0 = domingo, 1 = segunda
        
        let priorities = [];
        let urgencyLevel = 'medium';
        let focusSubsystems = [];
        
        // Lógica temporal
        if (dayOfWeek === 1) { // Segunda-feira
            priorities = ['planejamento', 'estratégia', 'alinhamento'];
            urgencyLevel = 'high';
            focusSubsystems = ['analytics', 'email'];
        } else if (dayOfWeek === 5) { // Sexta-feira
            priorities = ['revisão', 'fechamento', 'relatórios'];
            urgencyLevel = 'medium';
            focusSubsystems = ['analytics', 'financial'];
        } else if (currentHour >= 9 && currentHour <= 11) { // Manhã
            priorities = ['operações', 'vendas', 'marketing'];
            urgencyLevel = 'high';
            focusSubsystems = ['crm', 'email', 'social'];
        } else { // Tarde
            priorities = ['análise', 'planejamento', 'relatórios'];
            urgencyLevel = 'medium';
            focusSubsystems = ['analytics', 'financial'];
        }
        
        // Análise baseada no número de personas
        const executiveCount = personas.filter(p => 
            p.cargo && (p.cargo.includes('CEO') || p.cargo.includes('CTO') || p.cargo.includes('CFO'))
        ).length;
        
        if (executiveCount >= 3) {
            priorities.unshift('coordenação');
            urgencyLevel = 'high';
        }
        
        const analysis = {
            priorities: priorities.slice(0, 3),
            focus_subsystems: focusSubsystems.slice(0, 3),
            key_personas: personas.slice(0, 2).map(p => p.cargo || p.nome),
            task_types: ['análise', 'planejamento', 'execução'],
            urgency_level: urgencyLevel,
            reasoning: `Análise baseada em ${dayOfWeek === 1 ? 'início de semana' : dayOfWeek === 5 ? 'fim de semana' : 'meio de semana'} e horário ${currentHour}h`
        };
        
        this.log(`🧠 Análise contextual concluída para ${company.nome_empresa || 'Empresa'}: ${analysis.urgency_level} urgency`);
        return analysis;
    }
    
    generateTasksDemo(persona, analysis) {
        const cargo = persona.cargo || 'Manager';
        const templateKey = Object.keys(this.taskTemplates).find(key => 
            cargo.includes(key) || key.includes(cargo.split(' ')[0])
        ) || 'Marketing Manager';
        
        const availableTasks = this.taskTemplates[templateKey] || this.taskTemplates['Marketing Manager'];
        
        // Selecionar 1-2 tarefas baseado na urgência
        const numTasks = analysis.urgency_level === 'high' ? 2 : 1;
        const selectedTasks = availableTasks.slice(0, numTasks);
        
        // Ajustar prioridade baseado na análise
        const adjustedTasks = selectedTasks.map(task => ({
            ...task,
            priority: analysis.urgency_level === 'high' ? 'high' : task.priority,
            description: `${task.description} [Contexto: ${analysis.reasoning}]`
        }));
        
        this.log(`📋 Geradas ${adjustedTasks.length} tarefas para ${persona.nome || 'Persona'} (${cargo})`);
        return adjustedTasks;
    }
    
    async saveTasksToDatabase(tasks, persona, companyId) {
        try {
            const tasksToInsert = tasks.map(task => ({
                empresa_id: companyId,
                persona_id: persona.id,
                task_id: `demo_${(persona.cargo || 'manager').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                title: task.title,
                description: task.description,
                task_type: 'daily',
                priority: task.priority,
                status: 'pending',
                estimated_duration: task.estimated_duration,
                required_subsystems: JSON.stringify(task.required_subsystems),
                inputs_from: JSON.stringify(task.inputs_from),
                outputs_to: JSON.stringify(task.outputs_to),
                success_criteria: task.success_criteria,
                due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                created_by: 'autonomous_system_demo',
                created_at: new Date().toISOString()
            }));
            
            const { data, error } = await this.supabase
                .from('personas_tasks')
                .insert(tasksToInsert);
                
            if (error) {
                this.log(`⚠️ Erro ao salvar no banco (normal em demo): ${error.message}`, 'warning');
                // Em modo demo, simular sucesso
                this.log(`💾 SIMULADO: ${tasksToInsert.length} tarefas para ${persona.nome || 'Persona'}`, 'success');
                return true;
            }
            
            this.log(`💾 Salvadas ${tasksToInsert.length} tarefas para ${persona.nome || 'Persona'}`, 'success');
            return true;
            
        } catch (error) {
            this.log(`⚠️ Erro ao salvar (modo demo): ${error.message}`, 'warning');
            this.log(`💾 SIMULADO: ${tasks.length} tarefas para ${persona.nome || 'Persona'}`, 'success');
            return true; // Simular sucesso em demo
        }
    }
    
    async processCompany(company) {
        try {
            this.log(`🏢 Processando empresa: ${company.nome_empresa || company.nome || 'Empresa Sem Nome'}`);
            
            const personas = await this.getCompanyPersonas(company.id);
            if (personas.length === 0) {
                this.log(`Nenhuma persona encontrada para ${company.nome_empresa || 'empresa'}`, 'warning');
                return;
            }
            
            const analysis = this.analyzeCompanyContextDemo(company, personas);
            
            let totalTasksCreated = 0;
            
            for (const persona of personas) {
                try {
                    const tasks = this.generateTasksDemo(persona, analysis);
                    const saved = await this.saveTasksToDatabase(tasks, persona, company.id);
                    
                    if (saved) {
                        totalTasksCreated += tasks.length;
                    }
                    
                } catch (error) {
                    this.log(`Erro ao processar persona ${persona.nome}: ${error.message}`, 'error');
                    continue;
                }
            }
            
            this.log(`✅ Empresa ${company.nome_empresa || 'processada'}: ${totalTasksCreated} tarefas criadas`, 'success');
            
        } catch (error) {
            this.log(`Erro ao processar empresa: ${error.message}`, 'error');
        }
    }
    
    async runAutonomousArbitration() {
        if (this.isRunning) {
            this.log('Arbitragem já está em execução, pulando...', 'warning');
            return;
        }
        
        this.isRunning = true;
        
        try {
            this.log('🚀 Iniciando arbitragem autônoma DEMO', 'info');
            
            const companies = await this.getActiveCompanies();
            
            if (companies.length === 0) {
                this.log('Nenhuma empresa encontrada para processar', 'warning');
                return;
            }
            
            for (const company of companies) {
                await this.processCompany(company);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay entre empresas
            }
            
            this.log('🎉 Arbitragem autônoma DEMO concluída com sucesso!', 'success');
            
        } catch (error) {
            this.log(`Erro na arbitragem autônoma: ${error.message}`, 'error');
        } finally {
            this.isRunning = false;
        }
    }
    
    setupAutonomousScheduler() {
        // Scheduler simplificado para demo - a cada 30 minutos
        cron.schedule('*/30 * * * *', async () => {
            this.log('⏰ Scheduler DEMO ativado - Executando arbitragem');
            await this.runAutonomousArbitration();
        });
        
        this.log('⏲️ Scheduler automático DEMO configurado (a cada 30 min)', 'success');
    }
    
    async startAutonomousMode() {
        this.log('🤖 Iniciando modo autônomo DEMO do Sistema VCM', 'success');
        
        await this.runAutonomousArbitration();
        this.setupAutonomousScheduler();
        
        this.log('✅ Sistema autônomo DEMO ativo - Pressione Ctrl+C para parar', 'success');
        
        process.on('SIGINT', () => {
            this.log('⏹️ Parando sistema autônomo DEMO...', 'info');
            process.exit(0);
        });
    }
    
    async runManualArbitration() {
        this.log('🎯 Executando arbitragem manual DEMO');
        await this.runAutonomousArbitration();
        this.log('✅ Arbitragem manual DEMO concluída');
        process.exit(0);
    }
}

async function main() {
    const arbitrator = new AutonomousTaskArbitratorDemo();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--manual') || args.includes('-m')) {
        await arbitrator.runManualArbitration();
    } else {
        await arbitrator.startAutonomousMode();
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = AutonomousTaskArbitratorDemo;