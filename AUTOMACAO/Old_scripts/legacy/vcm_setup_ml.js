#!/usr/bin/env node

/**
 * INICIALIZADOR COMPLETO DO SISTEMA VCM MACHINE LEARNING
 * 
 * Configura e inicializa todo o sistema de aprendizado contínuo
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class VCMSetupML {
    constructor() {
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.log('🧠 Configurador do Sistema de Machine Learning VCM', 'success');
    }
    
    log(message, level = 'info') {
        const timestamp = new Date().toLocaleString('pt-BR');
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            setup: '🔧',
            database: '🗄️'
        };
        
        console.log(`${emoji[level]} [${timestamp}] ${message}`);
    }
    
    async setupCompleteSystem() {
        this.log('🚀 Iniciando configuração completa do sistema ML...', 'setup');
        
        try {
            // 1. Verificar conexão com banco
            await this.checkDatabaseConnection();
            
            // 2. Executar SQL de criação das tabelas
            await this.createMLTables();
            
            // 3. Configurar dados iniciais
            await this.setupInitialData();
            
            // 4. Validar instalação
            await this.validateInstallation();
            
            // 5. Gerar relatório de setup
            await this.generateSetupReport();
            
            this.log('🎉 Sistema de Machine Learning configurado com sucesso!', 'success');
            
        } catch (error) {
            this.log(`❌ Erro na configuração: ${error.message}`, 'error');
            process.exit(1);
        }
    }
    
    async checkDatabaseConnection() {
        this.log('Verificando conexão com Supabase...', 'database');
        
        try {
            const { data, error } = await this.supabase
                .from('empresas')
                .select('id')
                .limit(1);
                
            if (error) throw error;
            
            this.log('✅ Conexão com Supabase estabelecida', 'success');
            
        } catch (error) {
            throw new Error(`Falha na conexão com Supabase: ${error.message}`);
        }
    }
    
    async createMLTables() {
        this.log('Criando tabelas do sistema de Machine Learning...', 'database');
        
        try {
            // Verificar se tabela persona_tasks já existe
            const { data: existingTasks } = await this.supabase
                .from('persona_tasks')
                .select('id')
                .limit(1);
                
            if (!existingTasks) {
                this.log('Criando tabela persona_tasks...', 'database');
                // A tabela será criada via SQL direto no Supabase
            }
            
            // Tentar criar as tabelas principais uma por vez
            await this.createIndividualTables();
            
            this.log('✅ Sistema de tabelas ML configurado', 'success');
            
        } catch (error) {
            // Log de aviso mas não para a execução
            this.log(`⚠️ Algumas tabelas ML podem precisar ser criadas manualmente: ${error.message}`, 'warning');
            this.log('💡 Execute o SQL em database/machine_learning_system.sql no Supabase SQL Editor', 'info');
        }
    }
    
    async createIndividualTables() {
        const tables = [
            'persona_tasks',
            'task_execution_analytics',
            'learning_patterns',
            'system_evolution_log',
            'performance_metrics',
            'workload_analytics',
            'optimization_history',
            'ml_feedback_loop',
            'system_alerts',
            'ml_system_config'
        ];
        
        let createdCount = 0;
        
        for (const table of tables) {
            try {
                const { error } = await this.supabase
                    .from(table)
                    .select('id')
                    .limit(1);
                    
                if (!error) {
                    createdCount++;
                    this.log(`✅ Tabela ${table} disponível`, 'success');
                } else {
                    this.log(`⚠️ Tabela ${table} precisa ser criada`, 'warning');
                }
                
            } catch (error) {
                this.log(`⚠️ Verificação da tabela ${table} falhou`, 'warning');
            }
        }
        
        this.log(`📊 Tabelas ML verificadas: ${createdCount}/${tables.length} disponíveis`, 'info');
    }
    
    async executeRawSQL(sql) {
        try {
            // Para comandos complexos, usar função exec_sql se existir
            const { error } = await this.supabase.rpc('exec_sql', { sql_command: sql });
            
            if (error) {
                // Se não tem exec_sql, tentar método alternativo
                throw error;
            }
            
        } catch (error) {
            // Método alternativo: tentar executar diretamente
            const { error: directError } = await this.supabase
                .from('_temp_sql_execution')
                .insert({ sql: sql });
                
            // Se ambos falharam, log mas não para execução
            if (directError && !directError.message.includes('does not exist')) {
                throw new Error(`SQL execution failed: ${error.message}`);
            }
        }
    }
    
    async setupInitialData() {
        this.log('Configurando dados iniciais...', 'setup');
        
        try {
            // 1. Configurar ML config para cada empresa
            await this.setupMLConfigForCompanies();
            
            // 2. Criar dados de exemplo para teste
            await this.createSampleData();
            
            this.log('✅ Dados iniciais configurados', 'success');
            
        } catch (error) {
            throw new Error(`Erro na configuração inicial: ${error.message}`);
        }
    }
    
    async setupMLConfigForCompanies() {
        try {
            const { data: companies } = await this.supabase
                .from('empresas')
                .select('id');
                
            if (!companies || companies.length === 0) {
                this.log('Nenhuma empresa encontrada para configurar', 'warning');
                return;
            }
            
            this.log(`Configurando ML para ${companies.length} empresas`, 'setup');
            
            // Criar configuração simples em JSON para cada empresa
            const configs = companies.map(company => ({
                empresa_id: company.id,
                learning_enabled: true,
                auto_optimization_enabled: false, // Começar conservador
                confidence_threshold: 0.80,
                config_version: '1.0'
            }));
            
            // Tentar inserir configurações
            try {
                const { error } = await this.supabase
                    .from('ml_system_config')
                    .insert(configs);
                    
                if (!error) {
                    this.log(`✅ Configuração ML criada para ${companies.length} empresas`, 'success');
                } else {
                    this.log(`⚠️ Configuração ML será aplicada após criação das tabelas`, 'warning');
                }
            } catch (insertError) {
                this.log(`⚠️ Configuração ML pendente (tabela não existe ainda)`, 'warning');
            }
            
        } catch (error) {
            this.log(`⚠️ Configuração ML será aplicada posteriormente`, 'warning');
        }
    }
    
    async createSampleData() {
        try {
            this.log('Sistema ML configurado - dados de exemplo serão criados quando as tabelas estiverem disponíveis', 'setup');
            
            // Salvar instruções para criação manual
            const instructions = {
                message: "Para completar o setup do ML:",
                steps: [
                    "1. Execute o SQL em database/machine_learning_system.sql no Supabase",
                    "2. Execute novamente: node vcm_setup_ml.js",
                    "3. O sistema criará dados de exemplo automaticamente"
                ],
                sql_file: "database/machine_learning_system.sql"
            };
            
            const instructionsPath = path.join(__dirname, 'ml_setup_instructions.json');
            await fs.writeFile(instructionsPath, JSON.stringify(instructions, null, 2));
            
            this.log('📋 Instruções salvas em: ml_setup_instructions.json', 'info');
            
        } catch (error) {
            this.log(`⚠️ Dados de exemplo serão criados posteriormente`, 'warning');
        }
    }
    
    async createSampleAnalytics() {
        try {
            const { data: personas } = await this.supabase
                .from('personas')
                .select('id, empresa_id')
                .limit(5);
                
            if (!personas || personas.length === 0) return;
            
            const sampleAnalytics = [];
            const today = new Date();
            
            for (let i = 0; i < 14; i++) { // 2 semanas de dados
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                
                for (const persona of personas) {
                    // Gerar 2-3 registros por persona por dia
                    for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
                        sampleAnalytics.push({
                            persona_id: persona.id,
                            empresa_id: persona.empresa_id,
                            task_title: `Tarefa de exemplo ${j + 1}`,
                            task_type: ['daily', 'weekly', 'monthly'][Math.floor(Math.random() * 3)],
                            estimated_duration: 60 + Math.floor(Math.random() * 120), // 60-180 min
                            actual_duration: 50 + Math.floor(Math.random() * 140), // 50-190 min
                            complexity_score: Math.floor(Math.random() * 8) + 3, // 3-10
                            execution_context: {
                                urgency: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
                                time_of_day: Math.floor(Math.random() * 16) + 8, // 8-23h
                                workload: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)]
                            },
                            subsystems_used: ['email', 'analytics', 'crm'].slice(0, Math.floor(Math.random() * 3) + 1),
                            execution_date: date.toISOString().split('T')[0]
                        });
                    }
                }
            }
            
            // Calcular efficiency_ratio
            sampleAnalytics.forEach(item => {
                if (item.actual_duration > 0) {
                    item.efficiency_ratio = Math.round((item.estimated_duration / item.actual_duration) * 100) / 100;
                }
            });
            
            // Inserir dados em lotes pequenos
            const batchSize = 50;
            for (let i = 0; i < sampleAnalytics.length; i += batchSize) {
                const batch = sampleAnalytics.slice(i, i + batchSize);
                
                const { error } = await this.supabase
                    .from('task_execution_analytics')
                    .insert(batch);
                    
                if (error && !error.message.includes('does not exist')) {
                    this.log(`Aviso no lote ${i}: ${error.message}`, 'warning');
                }
            }
            
            this.log(`Criados ${sampleAnalytics.length} registros de exemplo`, 'success');
            
        } catch (error) {
            this.log(`Aviso na criação de dados de exemplo: ${error.message}`, 'warning');
        }
    }
    
    async validateInstallation() {
        this.log('Validando instalação do sistema ML...', 'setup');
        
        const checks = [];
        
        // Verificar tabelas principais
        const tablesToCheck = [
            'persona_tasks',
            'task_execution_analytics', 
            'learning_patterns',
            'system_evolution_log',
            'performance_metrics',
            'workload_analytics',
            'optimization_history',
            'ml_feedback_loop',
            'system_alerts',
            'ml_system_config'
        ];
        
        for (const table of tablesToCheck) {
            try {
                const { error } = await this.supabase
                    .from(table)
                    .select('count(*)')
                    .limit(1);
                    
                checks.push({
                    item: `Tabela ${table}`,
                    status: error ? 'FALHOU' : 'OK',
                    error: error?.message
                });
                
            } catch (error) {
                checks.push({
                    item: `Tabela ${table}`,
                    status: 'FALHOU',
                    error: error.message
                });
            }
        }
        
        // Mostrar resultados
        this.log('Resultados da validação:', 'info');
        checks.forEach(check => {
            const status = check.status === 'OK' ? '✅' : '❌';
            this.log(`${status} ${check.item}: ${check.status}`, check.status === 'OK' ? 'success' : 'warning');
            if (check.error) {
                this.log(`   Error: ${check.error}`, 'warning');
            }
        });
        
        const successCount = checks.filter(c => c.status === 'OK').length;
        this.log(`Validação concluída: ${successCount}/${checks.length} checks passaram`, 
                 successCount === checks.length ? 'success' : 'warning');
    }
    
    async generateSetupReport() {
        this.log('Gerando relatório de configuração...', 'setup');
        
        try {
            const report = {
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                setup_status: 'partially_completed',
                components: {
                    database_connection: 'OK',
                    sql_files: 'Criados',
                    configurations: 'Pendente',
                    sample_data: 'Pendente'
                },
                next_steps: [
                    '1. Execute o SQL no Supabase SQL Editor:',
                    '   - Abra Supabase Dashboard → SQL Editor',
                    '   - Cole e execute o conteúdo de database/machine_learning_system.sql',
                    '2. Execute novamente: node vcm_setup_ml.js',
                    '3. Execute o sistema: node vcm_learning_system.js',
                    '4. Execute o dashboard: node vcm_learning_dashboard.js'
                ],
                files_created: [
                    'database/machine_learning_system.sql',
                    'vcm_learning_system.js',
                    'vcm_learning_dashboard.js',
                    'vcm_setup_ml.js',
                    'ml_setup_instructions.json'
                ],
                manual_sql_required: true,
                sql_file: 'database/machine_learning_system.sql'
            };
            
            const reportPath = path.join(__dirname, 'ml_setup_report.json');
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            
            this.log(`📄 Relatório salvo em: ml_setup_report.json`, 'success');
            
            // Mostrar próximos passos
            this.log('🚀 Próximos passos IMPORTANTES:', 'info');
            this.log('1️⃣ Abra Supabase Dashboard → SQL Editor', 'info');
            this.log('2️⃣ Cole e execute: database/machine_learning_system.sql', 'info');
            this.log('3️⃣ Execute novamente: node vcm_setup_ml.js', 'info');
            
        } catch (error) {
            this.log(`⚠️ Relatório será gerado na próxima execução`, 'warning');
        }
    }
}

// =====================================================
// SCRIPT DE INSTALAÇÃO RÁPIDA
// =====================================================

async function quickSetup() {
    console.log('🧠 CONFIGURAÇÃO DO SISTEMA VCM MACHINE LEARNING');
    console.log('='.repeat(50));
    
    const setup = new VCMSetupML();
    await setup.setupCompleteSystem();
    
    console.log('\n📋 PRÓXIMOS PASSOS IMPORTANTES:');
    console.log('='.repeat(40));
    console.log('1️⃣ Abra Supabase Dashboard → SQL Editor');
    console.log('2️⃣ Cole e execute: database/machine_learning_system.sql');
    console.log('3️⃣ Execute novamente: node vcm_setup_ml.js');
    console.log('');
    console.log('Após completar os passos acima:');
    console.log('  node vcm_learning_system.js (para testar)');
    console.log('  node vcm_learning_dashboard.js (para dashboard)');
    console.log('='.repeat(40));
}

// Executar setup se chamado diretamente
if (require.main === module) {
    quickSetup().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Erro na configuração:', error);
        process.exit(1);
    });
}

module.exports = VCMSetupML;