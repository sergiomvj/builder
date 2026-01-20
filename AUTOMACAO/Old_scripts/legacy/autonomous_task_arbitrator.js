#!/usr/bin/env node

/**
 * SISTEMA AUTÔNOMO DE ARBITRAGEM DE TAREFAS VCM
 * 
 * Sistema que usa LLM para atribuir tarefas inteligentemente baseado em:
 * - Análise das personas e suas competências
 * - Estado atual dos 12 subsistemas
 * - Prioridades da empresa virtual
 * - Contexto temporal e sazonal
 * 
 * Executa de forma completamente autônoma com scheduler integrado
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class AutonomousTaskArbitrator {
    constructor() {
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.openai = new OpenAI({
            apiKey: process.env.VCM_OPENAI_API_KEY || process.env.OPENAI_API_KEY
        });
        
        this.subsystems = this.initializeSubsystems();
        this.isRunning = false;
        this.debugMode = process.env.NODE_ENV === 'development';
        
        this.log('🚀 Sistema Autônomo de Arbitragem VCM inicializado');
    }
    
    /**
     * Inicializar definições dos 12 subsistemas VCM
     */
    initializeSubsystems() {
        return {
            email: {
                name: 'Sistema de Email Marketing',
                capabilities: ['campanhas', 'automação', 'segmentação', 'análise'],
                dependencies: ['crm', 'analytics'],
                personas: ['Marketing Manager', 'Sales Manager']
            },
            crm: {
                name: 'CRM e Gestão de Clientes',
                capabilities: ['leads', 'pipeline', 'relacionamento', 'vendas'],
                dependencies: ['email', 'analytics'],
                personas: ['Sales Manager', 'Customer Success']
            },
            social: {
                name: 'Gestão de Redes Sociais',
                capabilities: ['posts', 'engagement', 'monitoramento', 'influenciadores'],
                dependencies: ['content', 'analytics'],
                personas: ['Social Media Manager', 'Content Creator']
            },
            marketing: {
                name: 'Automação de Marketing',
                capabilities: ['campanhas', 'nurturing', 'scoring', 'conversão'],
                dependencies: ['email', 'crm', 'analytics'],
                personas: ['Marketing Manager', 'Growth Hacker']
            },
            financial: {
                name: 'Gestão Financeira',
                capabilities: ['faturamento', 'cobrança', 'relatórios', 'impostos'],
                dependencies: ['crm', 'analytics'],
                personas: ['CFO', 'Financial Analyst']
            },
            content: {
                name: 'Gestão de Conteúdo',
                capabilities: ['criação', 'edição', 'publicação', 'SEO'],
                dependencies: ['social', 'marketing'],
                personas: ['Content Creator', 'SEO Specialist']
            },
            support: {
                name: 'Atendimento ao Cliente',
                capabilities: ['tickets', 'chat', 'knowledge base', 'satisfação'],
                dependencies: ['crm', 'analytics'],
                personas: ['Support Manager', 'Customer Success']
            },
            analytics: {
                name: 'Analytics e Métricas',
                capabilities: ['dashboards', 'relatórios', 'KPIs', 'insights'],
                dependencies: [],
                personas: ['Data Analyst', 'Business Analyst']
            },
            hr: {
                name: 'Recursos Humanos',
                capabilities: ['recrutamento', 'treinamento', 'avaliação', 'cultura'],
                dependencies: ['analytics'],
                personas: ['HR Manager', 'Recruiter']
            },
            ecommerce: {
                name: 'E-commerce',
                capabilities: ['catalogo', 'vendas', 'estoque', 'logística'],
                dependencies: ['crm', 'financial', 'analytics'],
                personas: ['E-commerce Manager', 'Product Manager']
            },
            ai: {
                name: 'Inteligência Artificial',
                capabilities: ['automação', 'predição', 'personalização', 'otimização'],
                dependencies: ['analytics', 'crm'],
                personas: ['AI Specialist', 'Data Scientist']
            },
            bi: {
                name: 'Business Intelligence',
                capabilities: ['dashboards', 'relatórios executivos', 'predições', 'alertas'],
                dependencies: ['analytics', 'financial'],
                personas: ['BI Analyst', 'CEO', 'CTO']
            }
        };
    }
    
    /**
     * Logging inteligente
     */
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
        
        // Log para arquivo em produção
        if (!this.debugMode) {
            this.writeLogToFile(`[${level.toUpperCase()}] ${timestamp}: ${message}`);
        }
    }
    
    /**
     * Escrever logs para arquivo
     */
    async writeLogToFile(message) {
        try {
            const logFile = path.join(__dirname, 'logs', 'autonomous_arbitrator.log');
            await fs.appendFile(logFile, message + '\n');
        } catch (error) {
            console.error('Erro ao escrever log:', error);
        }
    }
    
    /**
     * Buscar todas as empresas ativas
     */
    async getActiveCompanies() {
        try {
            // Tentar diferentes colunas possíveis para status ativo
            let companies = [];
            
            // Primeira tentativa: com coluna 'ativa'
            try {
                const { data, error } = await this.supabase
                    .from('empresas')
                    .select('*')
                    .eq('ativa', true);
                    
                if (!error && data) {
                    companies = data;
                }
            } catch (error) {
                this.log('Coluna "ativa" não existe, tentando alternativas...', 'debug');
            }
            
            // Segunda tentativa: buscar todas empresas
            if (companies.length === 0) {
                const { data, error } = await this.supabase
                    .from('empresas')
                    .select('*')
                    .limit(10); // Limitar para não sobrecarregar
                    
                if (error) throw error;
                companies = data || [];
            }
                
            this.log(`🏢 Encontradas ${companies.length} empresas para processar`);
            return companies;
            
        } catch (error) {
            this.log(`Erro ao buscar empresas: ${error.message}`, 'error');
            return [];
        }
    }
    
    /**
     * Buscar personas de uma empresa
     */
    async getCompanyPersonas(companyId) {
        try {
            // Tentar diferentes colunas possíveis para status ativo
            let personas = [];
            
            // Primeira tentativa: com coluna 'ativa'
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
                this.log('Coluna "ativa" não existe para personas, buscando todas...', 'debug');
            }
            
            // Segunda tentativa: buscar todas personas da empresa
            if (personas.length === 0) {
                const { data, error } = await this.supabase
                    .from('personas')
                    .select('*')
                    .eq('empresa_id', companyId);
                    
                if (error) throw error;
                personas = data || [];
            }
            
            return personas;
            
        } catch (error) {
            this.log(`Erro ao buscar personas da empresa ${companyId}: ${error.message}`, 'error');
            return [];
        }
    }
    
    /**
     * Analisar contexto da empresa com LLM
     */
    async analyzeCompanyContext(company, personas) {
        try {
            const prompt = `
Analise o contexto desta empresa virtual e suas personas para determinar prioridades de tarefas:

EMPRESA: ${company.nome_empresa}
SETOR: ${company.setor || 'Não especificado'}
TAMANHO: ${personas.length} personas
CRIADA EM: ${company.criada_em}

PERSONAS ATIVAS:
${personas.map(p => `- ${p.nome}: ${p.cargo} (${p.departamento || 'Geral'})`).join('\n')}

SUBSISTEMAS DISPONÍVEIS:
${Object.keys(this.subsystems).map(key => `- ${key}: ${this.subsystems[key].name}`).join('\n')}

CONTEXTO TEMPORAL:
- Data atual: ${new Date().toLocaleDateString('pt-BR')}
- Dia da semana: ${new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}
- Hora: ${new Date().toLocaleTimeString('pt-BR')}

Baseado nessas informações, determine:
1. Quais são as 3 principais prioridades da empresa hoje?
2. Que subsistemas devem ser mais utilizados?
3. Quais personas devem receber mais tarefas?
4. Que tipo de tarefas são mais urgentes?

IMPORTANTE: Responda APENAS com JSON válido, sem texto adicional. Use esta estrutura exata:
{
  "priorities": ["prioridade1", "prioridade2", "prioridade3"],
  "focus_subsystems": ["subsistema1", "subsistema2", "subsistema3"],
  "key_personas": ["persona1", "persona2"],
  "task_types": ["tipo1", "tipo2", "tipo3"],
  "urgency_level": "high",
  "reasoning": "Explicação da análise"
}`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "Você é um especialista em gestão empresarial e arbitragem de tarefas. Analise o contexto e forneça insights estratégicos precisos. SEMPRE responda apenas com JSON válido, sem texto adicional."
                    },
                    {
                        role: "user", 
                        content: prompt
                    }
                ],
                temperature: 0.3
            });
            
            let responseText = completion.choices[0].message.content.trim();
            
            // Limpar resposta se não for JSON puro
            if (!responseText.startsWith('{')) {
                const jsonStart = responseText.indexOf('{');
                const jsonEnd = responseText.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    responseText = responseText.substring(jsonStart, jsonEnd + 1);
                }
            }
            
            const analysis = JSON.parse(responseText);
            this.log(`🧠 Análise LLM concluída para ${company.nome_empresa || company.nome || 'empresa'}: ${analysis.urgency_level} urgency`);
            
            return analysis;
            
        } catch (error) {
            this.log(`Erro na análise LLM: ${error.message}`, 'error');
            return this.getFallbackAnalysis();
        }
    }
    
    /**
     * Análise de fallback caso a LLM falhe
     */
    getFallbackAnalysis() {
        return {
            priorities: ["operações", "vendas", "atendimento"],
            focus_subsystems: ["crm", "email", "analytics"],
            key_personas: ["CEO", "Sales Manager"],
            task_types: ["análise", "comunicação", "planejamento"],
            urgency_level: "medium",
            reasoning: "Análise padrão aplicada devido a erro na LLM"
        };
    }
    
    /**
     * Gerar tarefas específicas com LLM
     */
    async generateTasksWithLLM(persona, analysis, subsystems) {
        try {
            const prompt = `
Gere tarefas específicas para esta persona baseado na análise contextual:

PERSONA: ${persona.nome}
CARGO: ${persona.cargo}
DEPARTAMENTO: ${persona.departamento || 'Geral'}
COMPETÊNCIAS: ${persona.competencias || 'Não especificado'}

ANÁLISE CONTEXTUAL:
- Prioridades: ${analysis.priorities.join(', ')}
- Subsistemas em foco: ${analysis.focus_subsystems.join(', ')}
- Nível de urgência: ${analysis.urgency_level}
- Raciocínio: ${analysis.reasoning}

SUBSISTEMAS DISPONÍVEIS PARA ESTA PERSONA:
${subsystems.map(s => `- ${s}: ${this.subsystems[s].name} - ${this.subsystems[s].capabilities.join(', ')}`).join('\n')}

Gere 2-4 tarefas específicas e acionáveis para hoje, considerando:
- O cargo e responsabilidades da persona
- As prioridades identificadas
- Os subsistemas que devem ser utilizados
- O nível de urgência atual

IMPORTANTE: Responda APENAS com JSON válido, sem texto adicional. Use esta estrutura exata:
{
  "tasks": [
    {
      "title": "Título da tarefa",
      "description": "Descrição detalhada da tarefa",
      "priority": "high",
      "estimated_duration": 30,
      "required_subsystems": ["subsistema1", "subsistema2"],
      "inputs_from": ["fonte1", "fonte2"],
      "outputs_to": ["destino1", "destino2"],
      "success_criteria": "Critério de sucesso"
    }
  ]
}`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "Você é um especialista em gestão de tarefas e produtividade empresarial. Gere tarefas específicas, acionáveis e alinhadas com as responsabilidades de cada cargo. SEMPRE responda apenas com JSON válido, sem texto adicional."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3
            });
            
            let responseText = completion.choices[0].message.content.trim();
            
            // Limpar resposta se não for JSON puro
            if (!responseText.startsWith('{')) {
                const jsonStart = responseText.indexOf('{');
                const jsonEnd = responseText.lastIndexOf('}');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    responseText = responseText.substring(jsonStart, jsonEnd + 1);
                }
            }
            
            const taskData = JSON.parse(responseText);
            this.log(`📋 Geradas ${taskData.tasks.length} tarefas para ${persona.nome || 'persona'}`);
            
            return taskData.tasks;
            
        } catch (error) {
            this.log(`Erro ao gerar tarefas para ${persona.nome}: ${error.message}`, 'error');
            return this.getFallbackTasks(persona);
        }
    }
    
    /**
     * Tarefas de fallback
     */
    getFallbackTasks(persona) {
        const fallbackTasks = {
            'CEO': [
                {
                    title: "Revisão de métricas estratégicas",
                    description: "Analisar KPIs principais e tomar decisões estratégicas",
                    priority: "high",
                    estimated_duration: 45,
                    required_subsystems: ["analytics", "bi"],
                    inputs_from: ["Equipe de Analytics"],
                    outputs_to: ["Board de Diretores"],
                    success_criteria: "Decisões tomadas baseadas em dados"
                }
            ],
            'default': [
                {
                    title: "Tarefa diária padrão",
                    description: "Executar atividades rotineiras do cargo",
                    priority: "medium",
                    estimated_duration: 60,
                    required_subsystems: ["email"],
                    inputs_from: ["Equipe"],
                    outputs_to: ["Supervisor"],
                    success_criteria: "Atividades concluídas conforme planejado"
                }
            ]
        };
        
        const cargo = persona.cargo?.toUpperCase() || 'DEFAULT';
        return fallbackTasks[cargo] || fallbackTasks['default'];
    }
    
    /**
     * Determinar subsistemas relevantes para uma persona
     */
    getPersonaSubsystems(persona) {
        const cargo = persona.cargo?.toLowerCase() || '';
        const relevantSubsystems = [];
        
        // Mapear cargos para subsistemas
        for (const [key, subsystem] of Object.entries(this.subsystems)) {
            if (subsystem.personas.some(p => 
                cargo.includes(p.toLowerCase().split(' ')[0]) || 
                p.toLowerCase().includes(cargo.split(' ')[0])
            )) {
                relevantSubsystems.push(key);
            }
        }
        
        // Se não encontrou nenhum, adicionar subsistemas básicos
        if (relevantSubsystems.length === 0) {
            relevantSubsystems.push('email', 'analytics');
        }
        
        return relevantSubsystems;
    }
    
    /**
     * Salvar tarefas no banco de dados
     */
    async saveTasksToDatabase(tasks, persona, companyId) {
        try {
            const tasksToInsert = tasks.map(task => ({
                empresa_id: companyId,
                persona_id: persona.id,
                task_id: `auto_${(persona.cargo || persona.role || 'manager').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                title: task.title,
                description: task.description,
                task_type: 'daily',
                priority: task.priority,
                status: 'pending',
                estimated_duration: task.estimated_duration,
                required_subsystems: task.required_subsystems,
                inputs_from: task.inputs_from,
                outputs_to: task.outputs_to,
                success_criteria: task.success_criteria,
                due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
                created_by: 'autonomous_system',
                created_at: new Date().toISOString()
            }));
            
            const { data, error } = await this.supabase
                .from('personas_tasks')
                .insert(tasksToInsert);
                
            if (error) throw error;
            
            this.log(`💾 Salvadas ${tasksToInsert.length} tarefas para ${persona.nome}`, 'success');
            return true;
            
        } catch (error) {
            this.log(`Erro ao salvar tarefas: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * Processar uma empresa completa
     */
    async processCompany(company) {
        try {
            this.log(`🏢 Processando empresa: ${company.nome_empresa || company.nome || 'Empresa ID: ' + company.id}`);
            
            // Buscar personas
            const personas = await this.getCompanyPersonas(company.id);
            if (personas.length === 0) {
                this.log(`Nenhuma persona ativa encontrada para ${company.nome_empresa}`, 'warning');
                return;
            }
            
            // Analisar contexto com LLM
            const analysis = await this.analyzeCompanyContext(company, personas);
            
            // Processar cada persona
            let totalTasksCreated = 0;
            
            for (const persona of personas) {
                try {
                    // Determinar subsistemas relevantes
                    const relevantSubsystems = this.getPersonaSubsystems(persona);
                    
                    // Gerar tarefas com LLM
                    const tasks = await this.generateTasksWithLLM(persona, analysis, relevantSubsystems);
                    
                    // Salvar no banco
                    const saved = await this.saveTasksToDatabase(tasks, persona, company.id);
                    
                    if (saved) {
                        totalTasksCreated += tasks.length;
                    }
                    
                    // Delay entre personas para não sobrecarregar a API
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    this.log(`Erro ao processar persona ${persona.nome}: ${error.message}`, 'error');
                    continue;
                }
            }
            
            this.log(`✅ Empresa ${company.nome_empresa} processada: ${totalTasksCreated} tarefas criadas`, 'success');
            
        } catch (error) {
            this.log(`Erro ao processar empresa ${company.nome_empresa}: ${error.message}`, 'error');
        }
    }
    
    /**
     * Executar arbitragem para todas as empresas
     */
    async runAutonomousArbitration() {
        if (this.isRunning) {
            this.log('Arbitragem já está em execução, pulando...', 'warning');
            return;
        }
        
        this.isRunning = true;
        
        try {
            this.log('🚀 Iniciando arbitragem autônoma de tarefas', 'info');
            
            const companies = await this.getActiveCompanies();
            
            if (companies.length === 0) {
                this.log('Nenhuma empresa ativa encontrada', 'warning');
                return;
            }
            
            // Processar empresas em paralelo (limitado)
            const batchSize = 3; // Processar 3 empresas por vez
            
            for (let i = 0; i < companies.length; i += batchSize) {
                const batch = companies.slice(i, i + batchSize);
                
                await Promise.allSettled(
                    batch.map(company => this.processCompany(company))
                );
                
                // Delay entre batches
                if (i + batchSize < companies.length) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            this.log('🎉 Arbitragem autônoma concluída com sucesso!', 'success');
            
        } catch (error) {
            this.log(`Erro na arbitragem autônoma: ${error.message}`, 'error');
        } finally {
            this.isRunning = false;
        }
    }
    
    /**
     * Configurar scheduler automático
     */
    setupAutonomousScheduler() {
        // Executar a cada 2 horas durante horário comercial (8h-18h)
        cron.schedule('0 8,10,12,14,16,18 * * *', async () => {
            this.log('⏰ Scheduler automático ativado - Executando arbitragem');
            await this.runAutonomousArbitration();
        });
        
        // Arbitragem especial na segunda-feira (planejamento semanal)
        cron.schedule('0 7 * * 1', async () => {
            this.log('📅 Arbitragem semanal de segunda-feira');
            await this.runAutonomousArbitration();
        });
        
        // Limpeza de tarefas antigas (diário às 23h)
        cron.schedule('0 23 * * *', async () => {
            this.log('🧹 Executando limpeza de tarefas antigas');
            await this.cleanOldTasks();
        });
        
        this.log('⏲️ Scheduler automático configurado', 'success');
    }
    
    /**
     * Limpar tarefas antigas
     */
    async cleanOldTasks() {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            
            const { error } = await this.supabase
                .from('personas_tasks')
                .delete()
                .lt('created_at', thirtyDaysAgo.toISOString())
                .eq('status', 'completed');
                
            if (error) throw error;
            
            this.log('🧹 Tarefas antigas removidas com sucesso');
            
        } catch (error) {
            this.log(`Erro ao limpar tarefas antigas: ${error.message}`, 'error');
        }
    }
    
    /**
     * Iniciar modo autônomo
     */
    async startAutonomousMode() {
        this.log('🤖 Iniciando modo autônomo do Sistema VCM', 'success');
        
        // Executar primeira arbitragem imediatamente
        await this.runAutonomousArbitration();
        
        // Configurar scheduler
        this.setupAutonomousScheduler();
        
        // Manter processo vivo
        this.log('✅ Sistema autônomo ativo - Pressione Ctrl+C para parar', 'success');
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            this.log('⏹️ Parando sistema autônomo...', 'info');
            process.exit(0);
        });
    }
    
    /**
     * Executar arbitragem manual (comando único)
     */
    async runManualArbitration() {
        this.log('🎯 Executando arbitragem manual única');
        await this.runAutonomousArbitration();
        this.log('✅ Arbitragem manual concluída');
        process.exit(0);
    }
}

// =====================================================
// EXECUÇÃO PRINCIPAL
// =====================================================

async function main() {
    const arbitrator = new AutonomousTaskArbitrator();
    
    // Verificar argumentos da linha de comando
    const args = process.argv.slice(2);
    
    if (args.includes('--manual') || args.includes('-m')) {
        // Executar apenas uma vez
        await arbitrator.runManualArbitration();
    } else {
        // Modo autônomo contínuo
        await arbitrator.startAutonomousMode();
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = AutonomousTaskArbitrator;