#!/usr/bin/env node

/**
 * CRIADOR DE TABELA DE TAREFAS SIMPLES
 * 
 * Cria uma versão simplificada da tabela de tarefas se não existir
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class SimpleTaskTableCreator {
    constructor() {
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
        
        this.log('🔧 Criador de Tabela Simples VCM');
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
    
    async createSimpleTaskTable() {
        try {
            this.log('📋 Tentando criar tabela simples personas_tasks...');
            
            // SQL para criar tabela básica
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS personas_tasks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    empresa_id UUID,
                    persona_id UUID,
                    task_id VARCHAR(255) UNIQUE,
                    title VARCHAR(500),
                    description TEXT,
                    task_type VARCHAR(50) DEFAULT 'daily',
                    priority VARCHAR(50) DEFAULT 'medium',
                    status VARCHAR(50) DEFAULT 'pending',
                    estimated_duration INTEGER,
                    required_subsystems JSONB,
                    inputs_from JSONB,
                    outputs_to JSONB,
                    success_criteria TEXT,
                    due_date TIMESTAMP WITH TIME ZONE,
                    created_by VARCHAR(100) DEFAULT 'autonomous_system',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `;
            
            const { data, error } = await this.supabase.rpc('exec_sql', {
                sql: createTableSQL
            });
            
            if (error) {
                this.log(`Erro ao criar tabela: ${error.message}`, 'warning');
                this.log('💡 Execute o SQL manualmente no Supabase SQL Editor');
                return false;
            }
            
            this.log('✅ Tabela personas_tasks criada com sucesso!', 'success');
            return true;
            
        } catch (error) {
            this.log(`Erro: ${error.message}`, 'error');
            this.log('💡 Tabela pode já existir ou precisar ser criada manualmente');
            return false;
        }
    }
    
    async testTableAccess() {
        try {
            this.log('🧪 Testando acesso à tabela...');
            
            const { data, error } = await this.supabase
                .from('personas_tasks')
                .select('*')
                .limit(1);
                
            if (error) {
                this.log(`Tabela não acessível: ${error.message}`, 'warning');
                return false;
            }
            
            this.log('✅ Tabela acessível!', 'success');
            return true;
            
        } catch (error) {
            this.log(`Erro no teste: ${error.message}`, 'error');
            return false;
        }
    }
    
    async runSetup() {
        this.log('🚀 CONFIGURANDO TABELA PARA SISTEMA AUTÔNOMO');
        this.log('===============================================');
        
        // Testar se tabela já existe
        const tableExists = await this.testTableAccess();
        
        if (tableExists) {
            this.log('✅ Tabela personas_tasks já existe e está funcionando!', 'success');
            this.log('\n🎯 Sistema pronto para uso:');
            this.log('   node autonomous_task_arbitrator.js --manual');
            return true;
        }
        
        // Tentar criar tabela
        const tableCreated = await this.createSimpleTaskTable();
        
        if (tableCreated) {
            const finalTest = await this.testTableAccess();
            if (finalTest) {
                this.log('\n🎉 SETUP CONCLUÍDO COM SUCESSO!', 'success');
                this.log('\n🎯 Sistema pronto para uso:');
                this.log('   node autonomous_task_arbitrator.js --manual');
                return true;
            }
        }
        
        this.log('\n⚠️ SETUP MANUAL NECESSÁRIO', 'warning');
        this.log('Execute este SQL no Supabase SQL Editor:');
        this.log('');
    this.log('CREATE TABLE personas_tasks (');
        this.log('    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),');
        this.log('    empresa_id UUID,');
        this.log('    persona_id UUID,');
        this.log('    task_id VARCHAR(255) UNIQUE,');
        this.log('    title VARCHAR(500),');
        this.log('    description TEXT,');
        this.log('    task_type VARCHAR(50) DEFAULT \'daily\',');
        this.log('    priority VARCHAR(50) DEFAULT \'medium\',');
        this.log('    status VARCHAR(50) DEFAULT \'pending\',');
        this.log('    estimated_duration INTEGER,');
        this.log('    required_subsystems JSONB,');
        this.log('    inputs_from JSONB,');
        this.log('    outputs_to JSONB,');
        this.log('    success_criteria TEXT,');
        this.log('    due_date TIMESTAMP WITH TIME ZONE,');
        this.log('    created_by VARCHAR(100) DEFAULT \'autonomous_system\',');
        this.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        this.log(');');
        
        return false;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const creator = new SimpleTaskTableCreator();
    creator.runSetup().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = SimpleTaskTableCreator;