#!/usr/bin/env node

/**
 * SETUP AUTÔNOMO DO SISTEMA VCM
 * 
 * Script para configurar e inicializar o sistema autônomo de arbitragem
 */

const fs = require('fs').promises;
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class AutonomousSystemSetup {
    constructor() {
        this.setupSteps = [
            'Verificar variáveis de ambiente',
            'Testar conexão Supabase',
            'Criar estruturas de banco necessárias',
            'Configurar diretórios de logs',
            'Configurar scheduler automático',
            'Testar integração LLM',
            'Validar sistema completo'
        ];
    }
    
    log(message, level = 'info') {
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌',
            debug: '🔍'
        };
        
        console.log(`${emoji[level]} ${message}`);
    }
    
    async checkEnvironmentVariables() {
        this.log('Verificando variáveis de ambiente...');
        
        const requiredVars = [
            'VCM_SUPABASE_URL',
            'VCM_SUPABASE_SERVICE_ROLE_KEY',
            'VCM_OPENAI_API_KEY'
        ];
        
        const missing = [];
        
        for (const varName of requiredVars) {
            if (!process.env[varName]) {
                missing.push(varName);
            }
        }
        
        if (missing.length > 0) {
            this.log(`Variáveis de ambiente faltando: ${missing.join(', ')}`, 'error');
            this.log('Configure essas variáveis no arquivo .env', 'warning');
            return false;
        }
        
        this.log('Todas as variáveis de ambiente encontradas', 'success');
        return true;
    }
    
    async testSupabaseConnection() {
        this.log('Testando conexão com Supabase...');
        
        try {
            const supabase = createClient(
                process.env.VCM_SUPABASE_URL,
                process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
            );
            
            const { data, error } = await supabase
                .from('empresas')
                .select('count')
                .limit(1);
                
            if (error) {
                this.log(`Erro na conexão Supabase: ${error.message}`, 'error');
                return false;
            }
            
            this.log('Conexão Supabase funcionando', 'success');
            return true;
            
        } catch (error) {
            this.log(`Erro ao testar Supabase: ${error.message}`, 'error');
            return false;
        }
    }
    
    async createDatabaseStructures() {
        this.log('Verificando estruturas do banco de dados...');
        
        try {
            const supabase = createClient(
                process.env.VCM_SUPABASE_URL,
                process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
            );
            
            // Verificar se tabelas existem
            const tables = ['empresas', 'personas', 'persona_tasks', 'task_templates'];
            const existingTables = [];
            
            for (const table of tables) {
                try {
                    const { data } = await supabase
                        .from(table)
                        .select('*')
                        .limit(1);
                    existingTables.push(table);
                } catch (error) {
                    this.log(`Tabela ${table} não encontrada`, 'warning');
                }
            }
            
            this.log(`Tabelas encontradas: ${existingTables.join(', ')}`, 'success');
            
            if (existingTables.length < tables.length) {
                this.log('Execute o schema de banco antes de continuar:', 'warning');
                this.log('psql -h host -U user -d db -f database-schema-tarefas.sql', 'info');
            }
            
            return existingTables.length >= 2; // Mínimo empresas e personas
            
        } catch (error) {
            this.log(`Erro ao verificar estruturas: ${error.message}`, 'error');
            return false;
        }
    }
    
    async setupLogDirectories() {
        this.log('Configurando diretórios de logs...');
        
        try {
            const logsDir = path.join(__dirname, 'logs');
            
            try {
                await fs.access(logsDir);
            } catch {
                await fs.mkdir(logsDir, { recursive: true });
                this.log('Diretório de logs criado', 'success');
            }
            
            // Criar arquivo de log inicial
            const logFile = path.join(logsDir, 'autonomous_arbitrator.log');
            const initialLog = `[SETUP] ${new Date().toISOString()}: Sistema autônomo inicializado\n`;
            await fs.appendFile(logFile, initialLog);
            
            this.log('Configuração de logs concluída', 'success');
            return true;
            
        } catch (error) {
            this.log(`Erro ao configurar logs: ${error.message}`, 'error');
            return false;
        }
    }
    
    async testLLMIntegration() {
        this.log('Testando integração com LLM...');
        
        try {
            const { OpenAI } = require('openai');
            
            const openai = new OpenAI({
                apiKey: process.env.VCM_OPENAI_API_KEY || process.env.OPENAI_API_KEY
            });
            
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: "Responda apenas 'OK' se você pode me ouvir."
                    }
                ],
                max_tokens: 10
            });
            
            const response = completion.choices[0].message.content.trim();
            
            if (response.toLowerCase().includes('ok')) {
                this.log('Integração LLM funcionando', 'success');
                return true;
            } else {
                this.log(`Resposta inesperada da LLM: ${response}`, 'warning');
                return false;
            }
            
        } catch (error) {
            this.log(`Erro na integração LLM: ${error.message}`, 'error');
            if (error.message.includes('API key')) {
                this.log('Verifique sua VCM_OPENAI_API_KEY no arquivo .env', 'warning');
            }
            return false;
        }
    }
    
    async createStartupScripts() {
        this.log('Criando scripts de inicialização...');
        
        try {
            // Script PowerShell para Windows
            const psScript = `# SISTEMA AUTÔNOMO VCM - INICIALIZAÇÃO
# Execute este script para iniciar o sistema em modo autônomo

Write-Host "🚀 Iniciando Sistema Autônomo VCM..." -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan

# Verificar Node.js
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js não encontrado. Instale Node.js 18+ primeiro." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green

# Instalar dependências se necessário
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install --package-lock-only
    Copy-Item "package-autonomous.json" "package.json" -Force
    npm install
}

# Verificar arquivo .env
if (!(Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "Crie o arquivo .env com as variáveis necessárias" -ForegroundColor Yellow
    exit 1
}

Write-Host "🤖 Iniciando modo autônomo..." -ForegroundColor Green
Write-Host "Pressione Ctrl+C para parar o sistema" -ForegroundColor Yellow

node autonomous_task_arbitrator.js
`;
            
            await fs.writeFile('start_autonomous_vcm.ps1', psScript);
            
            // Script Bash para Linux/Mac
            const bashScript = `#!/bin/bash

# SISTEMA AUTÔNOMO VCM - INICIALIZAÇÃO
# Execute este script para iniciar o sistema em modo autônomo

echo "🚀 Iniciando Sistema Autônomo VCM..."
echo "======================================"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    cp package-autonomous.json package.json
    npm install
fi

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "Crie o arquivo .env com as variáveis necessárias"
    exit 1
fi

echo "🤖 Iniciando modo autônomo..."
echo "Pressione Ctrl+C para parar o sistema"

node autonomous_task_arbitrator.js
`;
            
            await fs.writeFile('start_autonomous_vcm.sh', bashScript);
            await fs.chmod('start_autonomous_vcm.sh', '755');
            
            this.log('Scripts de inicialização criados', 'success');
            return true;
            
        } catch (error) {
            this.log(`Erro ao criar scripts: ${error.message}`, 'error');
            return false;
        }
    }
    
    async runCompleteSetup() {
        console.log('🚀 CONFIGURAÇÃO DO SISTEMA AUTÔNOMO VCM');
        console.log('==========================================');
        
        const setupResults = [];
        
        // Executar verificações
        setupResults.push(await this.checkEnvironmentVariables());
        setupResults.push(await this.testSupabaseConnection());
        setupResults.push(await this.createDatabaseStructures());
        setupResults.push(await this.setupLogDirectories());
        setupResults.push(await this.testLLMIntegration());
        setupResults.push(await this.createStartupScripts());
        
        const successCount = setupResults.filter(Boolean).length;
        const totalSteps = setupResults.length;
        
        console.log('\n==========================================');
        console.log('📊 RELATÓRIO DE CONFIGURAÇÃO');
        console.log('==========================================');
        
        this.log(`Etapas concluídas: ${successCount}/${totalSteps}`, successCount === totalSteps ? 'success' : 'warning');
        
        if (successCount === totalSteps) {
            console.log('\n🎉 SISTEMA CONFIGURADO COM SUCESSO!');
            console.log('\n🚀 Para iniciar o modo autônomo:');
            console.log('   Windows: .\\start_autonomous_vcm.ps1');
            console.log('   Linux/Mac: ./start_autonomous_vcm.sh');
            console.log('   Manual: node autonomous_task_arbitrator.js');
            console.log('\n⚡ Para execução única:');
            console.log('   node autonomous_task_arbitrator.js --manual');
        } else {
            console.log('\n⚠️ CONFIGURAÇÃO INCOMPLETA');
            console.log('Corrija os problemas acima antes de prosseguir');
        }
        
        return successCount === totalSteps;
    }
}

// Executar setup se chamado diretamente
if (require.main === module) {
    const setup = new AutonomousSystemSetup();
    setup.runCompleteSetup().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Erro no setup:', error);
        process.exit(1);
    });
}

module.exports = AutonomousSystemSetup;