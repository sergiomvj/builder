#!/usr/bin/env node
/**
 * 🌉 VCM Dashboard API Bridge (Node.js/Express)
 * =============================================
 * 
 * API Express.js que faz a ponte entre o Dashboard React e os scripts Node.js.
 * Migrado de FastAPI/Python para Express/Node.js mantendo funcionalidade idêntica.
 * 
 * Funcionalidades:
 * - Executar scripts de geração de biografias
 * - Executar cascata de scripts (1-5) 
 * - Verificar status dos scripts
 * - Sincronizar dados com Supabase
 * - Ingestão RAG no Supabase
 * 
 * @author Sergio Castro
 * @version 1.0.0 (Node.js/Express)
 * @date 2024-12-19
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// Import do gerador de biografias
const { AutoBiografiaGenerator } = require('./AUTOMACAO/01_SETUP_E_CRIACAO/05_auto_biografia_generator.js');

// Configurar aplicação Express
const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());

// Configurar CORS
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000', 
    'http://localhost:3001',
    'http://localhost:5173', // Vite dev
];

// Em produção, permitir origens específicas ou todas
if (process.env.VCM_ENVIRONMENT === 'production') {
    allowedOrigins.push('*'); // Configurar com domínios específicos em produção
}

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configurações
const AUTOMACAO_DIR = path.join(__dirname, 'AUTOMACAO');
const SCRIPT_PATHS = {
    biografia: path.join(AUTOMACAO_DIR, '01_SETUP_E_CRIACAO', '05_auto_biografia_generator.js'),
    competencias: path.join(AUTOMACAO_DIR, '02_PROCESSAMENTO_PERSONAS', '01_generate_competencias.js'),
    tech_specs: path.join(AUTOMACAO_DIR, '02_PROCESSAMENTO_PERSONAS', '02_generate_tech_specs.js'),
    rag: path.join(AUTOMACAO_DIR, '02_PROCESSAMENTO_PERSONAS', '03_generate_rag.js'),
    fluxos: path.join(AUTOMACAO_DIR, '02_PROCESSAMENTO_PERSONAS', '04_generate_fluxos_analise.js'),
    workflows: path.join(AUTOMACAO_DIR, '02_PROCESSAMENTO_PERSONAS', '05_generate_workflows_n8n.js')
};

// ========================================
// 🏥 HEALTH CHECK ENDPOINTS
// ========================================

/**
 * Health check básico
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'VCM API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * Endpoint raiz com informações da API
 */
app.get('/', (req, res) => {
    res.json({
        message: 'VCM Dashboard API Bridge (Node.js)',
        version: '1.0.0',
        docs: '/docs',
        health: '/health',
        available_scripts: Object.keys(SCRIPT_PATHS)
    });
});

// ========================================
// 🛠️ UTILITY FUNCTIONS  
// ========================================

/**
 * Executa script Node.js e retorna resultado
 * @param {string} scriptPath - Caminho para o script
 * @param {Array} args - Argumentos para o script
 * @param {number} timeout - Timeout em ms (default: 300000 = 5min)
 * @returns {Promise<Object>} Resultado da execução
 */
function runNodeScript(scriptPath, args = [], timeout = 300000) {
    return new Promise((resolve, reject) => {
        try {
            // Verificar se script existe
            if (!require('fs').existsSync(scriptPath)) {
                return resolve({
                    success: false,
                    error: `Script não encontrado: ${scriptPath}`
                });
            }

            console.log(`🚀 Executando: node ${scriptPath} ${args.join(' ')}`);

            const child = spawn('node', [scriptPath, ...args], {
                cwd: path.dirname(scriptPath),
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Timeout handling
            const timeoutId = setTimeout(() => {
                child.kill('SIGTERM');
                resolve({
                    success: false,
                    error: 'Script timeout (5 minutos)',
                    output: stdout,
                    stderr: stderr
                });
            }, timeout);

            child.on('close', (code) => {
                clearTimeout(timeoutId);
                
                resolve({
                    success: code === 0,
                    output: stdout,
                    error: code !== 0 ? stderr : null,
                    return_code: code,
                    stderr: stderr
                });
            });

            child.on('error', (error) => {
                clearTimeout(timeoutId);
                resolve({
                    success: false,
                    error: `Erro ao executar script: ${error.message}`
                });
            });

        } catch (error) {
            reject({
                success: false,
                error: `Erro ao executar script: ${error.message}`
            });
        }
    });
}

/**
 * Valida requisição de geração de biografia
 */
function validateBiografiaRequest(reqBody) {
    const { empresa_codigo, empresa_nome } = reqBody;
    
    if (!empresa_codigo || typeof empresa_codigo !== 'string') {
        return { valid: false, error: 'empresa_codigo é obrigatório e deve ser string' };
    }
    
    if (!empresa_nome || typeof empresa_nome !== 'string') {
        return { valid: false, error: 'empresa_nome é obrigatório e deve ser string' };
    }
    
    return { valid: true };
}

// ========================================
// 📝 BIOGRAFIA ENDPOINTS
// ========================================

/**
 * Gera biografias para uma empresa usando o gerador Node.js
 */
app.post('/generate-biografias', async (req, res) => {
    try {
        // Validar requisição
        const validation = validateBiografiaRequest(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }

        const {
            empresa_codigo,
            empresa_nome,
            total_personas = 20,
            idiomas = ['pt', 'en'],
            pais = 'BR'
        } = req.body;

        console.log(`📝 Gerando biografias para empresa: ${empresa_nome} (${empresa_codigo})`);

        // Criar instância do gerador
        const bioGenerator = new AutoBiografiaGenerator();

        // Configuração da empresa (simulando dados completos)
        const companyConfig = {
            name: empresa_nome,
            codigo: empresa_codigo,
            industry: 'tecnologia', // Default, pode ser passado no request
            nacionalidade: 'latinos', // Default baseado no país
            ceo_genero: 'masculino', // Default, pode ser passado no request
            executivos_homens: 2,
            executivos_mulheres: 2, 
            assistentes_homens: 2,
            assistentes_mulheres: 6,
            especialistas_homens: 3,
            especialistas_mulheres: 3,
            idiomas_extras: []
        };

        // Gerar personas
        const personasConfig = bioGenerator.generatePersonasConfig(companyConfig);

        // Definir pasta de output
        const outputPath = path.join(__dirname, 'output', `EMPRESA_${empresa_codigo.toUpperCase()}`);
        await fs.mkdir(outputPath, { recursive: true });

        // Salvar biografias
        const saveResult = await bioGenerator.savePersonasBiografias(personasConfig, outputPath);

        res.json({
            success: true,
            message: `Biografias geradas com sucesso para ${empresa_nome}`,
            data: {
                empresa_codigo,
                empresa_nome,
                total_personas: saveResult.totalArquivos,
                output_path: outputPath,
                config_path: saveResult.configPath
            }
        });

    } catch (error) {
        console.error('❌ Erro ao gerar biografias:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro interno do servidor ao gerar biografias'
        });
    }
});

// ========================================
// 🔄 CASCADE EXECUTION ENDPOINTS
// ========================================

/**
 * Executa cascata de Scripts 1-5 sequencialmente
 */
app.post('/run-cascade', async (req, res) => {
    try {
        const {
            empresa_codigo,
            force_regenerate = false
        } = req.body;

        if (!empresa_codigo) {
            return res.status(400).json({
                success: false,
                error: 'empresa_codigo é obrigatório'
            });
        }

        console.log(`⚡ Iniciando cascata de scripts para empresa: ${empresa_codigo}`);

        const results = {
            empresa_codigo,
            scripts_executed: [],
            total_duration: 0,
            success: true,
            errors: []
        };

        const startTime = Date.now();

        // Definir scripts da cascata
        const cascadeScripts = [
            { name: 'competencias', path: SCRIPT_PATHS.competencias, description: 'Script 1 - Competências' },
            { name: 'tech_specs', path: SCRIPT_PATHS.tech_specs, description: 'Script 2 - Tech Specs' },
            { name: 'rag', path: SCRIPT_PATHS.rag, description: 'Script 3 - RAG Knowledge Base' },
            { name: 'fluxos', path: SCRIPT_PATHS.fluxos, description: 'Script 4 - TaskTodo Analysis' },
            { name: 'workflows', path: SCRIPT_PATHS.workflows, description: 'Script 5 - N8N Workflows' }
        ];

        // Executar scripts sequencialmente
        for (const script of cascadeScripts) {
            const scriptStartTime = Date.now();
            
            console.log(`🔄 Executando ${script.description}...`);
            
            const args = [
                '--empresa-codigo', empresa_codigo,
                ...(force_regenerate ? ['--force'] : [])
            ];

            const result = await runNodeScript(script.path, args);
            const scriptDuration = Date.now() - scriptStartTime;

            const scriptResult = {
                name: script.name,
                description: script.description,
                success: result.success,
                duration_ms: scriptDuration,
                output: result.output,
                error: result.error
            };

            results.scripts_executed.push(scriptResult);

            if (!result.success) {
                results.success = false;
                results.errors.push(`${script.description}: ${result.error}`);
                console.error(`❌ Erro em ${script.description}: ${result.error}`);
                
                // Parar execução em caso de erro (pode ser configurável)
                break;
            } else {
                console.log(`✅ ${script.description} executado com sucesso`);
            }
        }

        results.total_duration = Date.now() - startTime;

        // Resposta final
        const statusCode = results.success ? 200 : 500;
        const message = results.success 
            ? `Cascata executada com sucesso em ${Math.round(results.total_duration / 1000)}s`
            : `Cascata falhou após ${Math.round(results.total_duration / 1000)}s`;

        res.status(statusCode).json({
            success: results.success,
            message,
            data: results
        });

    } catch (error) {
        console.error('❌ Erro na execução da cascata:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Erro interno do servidor na execução da cascata'
        });
    }
});

// ========================================
// 📊 STATUS E MONITORING ENDPOINTS
// ========================================

/**
 * Verifica status de scripts para uma empresa
 */
app.get('/status/:empresa_codigo', async (req, res) => {
    try {
        const { empresa_codigo } = req.params;
        
        const outputPath = path.join(__dirname, 'output', `EMPRESA_${empresa_codigo.toUpperCase()}`);
        const personasPath = path.join(outputPath, '04_PERSONAS_SCRIPTS_1_2_3');
        
        // Verificar se empresa existe
        const empresaExists = await fs.access(outputPath).then(() => true).catch(() => false);
        
        if (!empresaExists) {
            return res.json({
                success: true,
                empresa_codigo,
                exists: false,
                message: 'Empresa não encontrada'
            });
        }

        // Verificar status dos scripts
        const status = {
            empresa_codigo,
            exists: true,
            biografias_generated: false,
            scripts_status: {
                script1_competencias: false,
                script2_tech_specs: false,
                script3_rag: false,
                script4_tasktodo: false,
                script5_workflows: false
            },
            total_personas: 0
        };

        // Verificar biografias
        const biografiasExists = await fs.access(personasPath).then(() => true).catch(() => false);
        status.biografias_generated = biografiasExists;

        if (biografiasExists) {
            // Contar personas
            const categorias = await fs.readdir(personasPath);
            let totalPersonas = 0;
            
            for (const categoria of categorias) {
                const categoriaPath = path.join(personasPath, categoria);
                const stat = await fs.stat(categoriaPath);
                
                if (stat.isDirectory()) {
                    const personas = await fs.readdir(categoriaPath);
                    totalPersonas += personas.filter(async (persona) => {
                        const personaPath = path.join(categoriaPath, persona);
                        const personaStat = await fs.stat(personaPath);
                        return personaStat.isDirectory();
                    }).length;
                }
            }
            
            status.total_personas = totalPersonas;
        }

        res.json({
            success: true,
            data: status
        });

    } catch (error) {
        console.error('❌ Erro ao verificar status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ========================================
// 🚀 START SERVER
// ========================================

/**
 * Inicializar servidor
 */
app.listen(PORT, () => {
    console.log('\n🌉 VCM Dashboard API Bridge (Node.js/Express)');
    console.log('='.repeat(50));
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📖 Documentação: http://localhost:${PORT}/`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`⚡ Scripts disponíveis: ${Object.keys(SCRIPT_PATHS).length}`);
    console.log('='.repeat(50));
    console.log('✅ API Bridge pronta para receber requisições!');
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Rejeição não tratada:', reason);
});

// Exportar app para testes
module.exports = { app };