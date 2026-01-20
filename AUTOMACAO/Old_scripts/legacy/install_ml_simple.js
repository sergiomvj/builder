#!/usr/bin/env node

/**
 * INSTALADOR SIMPLES DE TABELAS ML VCM
 * 
 * Executa apenas a criação das tabelas principais sem complexidade
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class SimpleMLInstaller {
    constructor() {
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
    }
    
    async install() {
        console.log('🧠 Instalação Simples do Sistema ML VCM');
        console.log('='.repeat(45));
        
        try {
            // Testar conexão
            console.log('📡 Testando conexão...');
            await this.testConnection();
            
            // Criar tabelas básicas
            console.log('📋 Criando tabelas básicas...');
            await this.createBasicTables();
            
            // Configurar empresas
            console.log('⚙️ Configurando empresas...');
            await this.setupCompanies();
            
            console.log('\n✅ Instalação concluída!');
            console.log('🚀 Execute: node vcm_learning_system.js');
            console.log('📊 Execute: node vcm_learning_dashboard.js');
            
        } catch (error) {
            console.error('\n❌ Erro na instalação:', error.message);
            console.log('\n💡 Solução alternativa:');
            console.log('1. Abra Supabase Dashboard → SQL Editor');
            console.log('2. Execute o arquivo: database/machine_learning_system.sql');
            console.log('3. Execute novamente este script');
        }
    }
    
    async testConnection() {
        const { data, error } = await this.supabase
            .from('empresas')
            .select('id')
            .limit(1);
            
        if (error) throw new Error(`Conexão falhou: ${error.message}`);
        console.log('✅ Conexão OK');
    }
    
    async createBasicTables() {
        // Criar tabela persona_tasks se não existir
        await this.createTableIfNotExists('persona_tasks', `
            CREATE TABLE persona_tasks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
                persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
                task_id VARCHAR(255) NOT NULL UNIQUE,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                task_type VARCHAR(50) CHECK (task_type IN ('daily', 'weekly', 'monthly', 'ad_hoc')),
                priority VARCHAR(50) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
                status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
                estimated_duration INTEGER,
                actual_duration INTEGER,
                due_date TIMESTAMPTZ,
                completed_at TIMESTAMPTZ,
                required_subsystems JSONB DEFAULT '[]'::jsonb,
                inputs_from JSONB DEFAULT '[]'::jsonb,
                outputs_to JSONB DEFAULT '[]'::jsonb,
                success_criteria TEXT,
                complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
                ai_generated BOOLEAN DEFAULT true,
                generation_context JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        
        // Criar tabela ml_system_config
        await this.createTableIfNotExists('ml_system_config', `
            CREATE TABLE ml_system_config (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
                learning_enabled BOOLEAN DEFAULT true,
                auto_optimization_enabled BOOLEAN DEFAULT false,
                confidence_threshold DECIMAL(4,3) DEFAULT 0.80,
                config_version VARCHAR(20) DEFAULT '1.0',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
    }
    
    async createTableIfNotExists(tableName, sql) {
        try {
            // Verificar se tabela existe
            const { data, error } = await this.supabase
                .from(tableName)
                .select('id')
                .limit(1);
                
            if (!error) {
                console.log(`✅ Tabela ${tableName} já existe`);
                return;
            }
            
            // Tentar criar via RPC exec_sql (se disponível)
            try {
                const { error: rpcError } = await this.supabase.rpc('exec_sql', { 
                    sql_command: sql 
                });
                
                if (rpcError) throw rpcError;
                console.log(`✅ Tabela ${tableName} criada`);
                
            } catch (rpcError) {
                console.log(`⚠️ Tabela ${tableName} precisa ser criada manualmente`);
            }
            
        } catch (error) {
            console.log(`⚠️ ${tableName}: ${error.message}`);
        }
    }
    
    async setupCompanies() {
        try {
            const { data: companies } = await this.supabase
                .from('empresas')
                .select('id');
                
            if (!companies || companies.length === 0) {
                console.log('⚠️ Nenhuma empresa encontrada');
                return;
            }
            
            const configs = companies.map(company => ({
                empresa_id: company.id,
                learning_enabled: true,
                auto_optimization_enabled: false,
                confidence_threshold: 0.80,
                config_version: '1.0'
            }));
            
            const { error } = await this.supabase
                .from('ml_system_config')
                .upsert(configs, { onConflict: 'empresa_id' });
                
            if (!error) {
                console.log(`✅ ${companies.length} empresas configuradas`);
            } else {
                console.log(`⚠️ Configuração será aplicada após criação das tabelas`);
            }
            
        } catch (error) {
            console.log(`⚠️ Configuração pendente: ${error.message}`);
        }
    }
}

// Executar instalação
if (require.main === module) {
    const installer = new SimpleMLInstaller();
    installer.install().then(() => {
        process.exit(0);
    }).catch(() => {
        process.exit(1);
    });
}

module.exports = SimpleMLInstaller;