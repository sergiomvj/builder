#!/usr/bin/env node

/**
 * FORÇADOR DE TABELAS ML VCM
 * 
 * Executa comandos SQL individuais para forçar criação
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

class MLTableForcer {
    constructor() {
        this.supabase = createClient(
            process.env.VCM_SUPABASE_URL,
            process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
        );
    }
    
    async force() {
        console.log('🔥 FORÇADOR DE TABELAS ML');
        console.log('='.repeat(30));
        
        const tables = this.getTableDefinitions();
        
        for (const [name, sql] of Object.entries(tables)) {
            try {
                console.log(`\n📋 Criando: ${name}`);
                
                // Tentar via RPC se existir
                try {
                    const { error } = await this.supabase.rpc('exec_sql', { 
                        sql_command: sql 
                    });
                    
                    if (error) throw error;
                    console.log(`✅ ${name} - SUCESSO`);
                    
                } catch (rpcError) {
                    // Tentar inserir dados para trigger criação
                    try {
                        await this.supabase.from(name).select('id').limit(1);
                        console.log(`✅ ${name} - JÁ EXISTE`);
                    } catch {
                        console.log(`⚠️ ${name} - MANUAL NECESSÁRIO`);
                        this.printManualSQL(name, sql);
                    }
                }
                
            } catch (error) {
                console.log(`❌ ${name} - ERRO: ${error.message}`);
            }
        }
        
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('1. Se viu "MANUAL NECESSÁRIO", execute os SQLs no Supabase');
        console.log('2. Execute: node vcm_learning_system.js');
    }
    
    printManualSQL(name, sql) {
        console.log(`\n--- SQL para ${name} ---`);
        console.log(sql.slice(0, 200) + '...');
        console.log('--- FIM ---\n');
    }
    
    getTableDefinitions() {
        return {
            'task_execution_analytics': `
                CREATE TABLE IF NOT EXISTS task_execution_analytics (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
                    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
                    task_id VARCHAR(255) REFERENCES persona_tasks(task_id) ON DELETE CASCADE,
                    execution_start TIMESTAMPTZ NOT NULL,
                    execution_end TIMESTAMPTZ,
                    planned_duration INTEGER,
                    actual_duration INTEGER,
                    success_rate DECIMAL(5,4) CHECK (success_rate >= 0 AND success_rate <= 1),
                    performance_score INTEGER CHECK (performance_score >= 1 AND performance_score <= 100),
                    bottlenecks_detected JSONB DEFAULT '[]'::jsonb,
                    optimization_opportunities TEXT,
                    resource_usage JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_task_exec_persona ON task_execution_analytics(persona_id);
                CREATE INDEX IF NOT EXISTS idx_task_exec_date ON task_execution_analytics(execution_start);
            `,
            
            'learning_patterns': `
                CREATE TABLE IF NOT EXISTS learning_patterns (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
                    pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('performance', 'workflow', 'collaboration', 'timing')),
                    pattern_name VARCHAR(255) NOT NULL,
                    description TEXT,
                    detection_algorithm VARCHAR(100),
                    confidence_score DECIMAL(4,3) CHECK (confidence_score >= 0 AND confidence_score <= 1),
                    frequency_detected INTEGER DEFAULT 1,
                    impact_level VARCHAR(50) CHECK (impact_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
                    pattern_data JSONB NOT NULL DEFAULT '{}'::jsonb,
                    related_personas JSONB DEFAULT '[]'::jsonb,
                    recommendations JSONB DEFAULT '[]'::jsonb,
                    is_active BOOLEAN DEFAULT true,
                    first_detected TIMESTAMPTZ DEFAULT NOW(),
                    last_detected TIMESTAMPTZ DEFAULT NOW(),
                    created_at TIMESTAMPTZ DEFAULT NOW()
                );
                CREATE INDEX IF NOT EXISTS idx_patterns_type ON learning_patterns(pattern_type);
                CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON learning_patterns(confidence_score);
            `,
            
            'ml_system_config': `
                CREATE TABLE IF NOT EXISTS ml_system_config (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE UNIQUE,
                    learning_enabled BOOLEAN DEFAULT true,
                    auto_optimization_enabled BOOLEAN DEFAULT false,
                    confidence_threshold DECIMAL(4,3) DEFAULT 0.80 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
                    max_daily_optimizations INTEGER DEFAULT 5,
                    learning_algorithms JSONB DEFAULT '["pattern_detection", "workload_analysis", "performance_tracking"]'::jsonb,
                    notification_settings JSONB DEFAULT '{"email": false, "dashboard": true, "alerts": true}'::jsonb,
                    config_version VARCHAR(20) DEFAULT '1.0',
                    last_optimization_run TIMESTAMPTZ,
                    system_status VARCHAR(50) DEFAULT 'active' CHECK (system_status IN ('active', 'paused', 'maintenance')),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );
            `
        };
    }
}

// Executar
if (require.main === module) {
    const forcer = new MLTableForcer();
    forcer.force().then(() => {
        process.exit(0);
    }).catch(() => {
        process.exit(1);
    });
}

module.exports = MLTableForcer;