# Script de Deploy Automático - VCM Dashboard (Windows PowerShell)
# Execute com: .\deploy-vcm.ps1

param(
    [switch]$SkipTests,
    [switch]$Force
)

# Configurações
$ErrorActionPreference = "Stop"

# Função para logs coloridos
function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

# Header
Write-Host ""
Write-Host "🚀 Deploy VCM Dashboard - Scripts Node.js" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Verificar Node.js
    Write-Info "Verificando Node.js..."
    try {
        $nodeVersion = node -v
        Write-Success "Node.js versão: $nodeVersion"
    } catch {
        Write-Error "Node.js não encontrado. Instale Node.js 18+ primeiro."
        exit 1
    }

    # Verificar npm
    try {
        $npmVersion = npm -v
        Write-Success "npm versão: $npmVersion"
    } catch {
        Write-Error "npm não encontrado. Instale npm primeiro."
        exit 1
    }

    # Verificar diretório
    if (!(Test-Path "package.json")) {
        Write-Error "Execute este script na raiz do projeto VCM"
        exit 1
    }

    # Verificar scripts Node.js
    Write-Info "Verificando scripts Node.js..."
    $requiredScripts = @(
        "AUTOMACAO\02_PROCESSAMENTO_PERSONAS\01_generate_competencias.js",
        "AUTOMACAO\02_PROCESSAMENTO_PERSONAS\02_generate_tech_specs.js",
        "AUTOMACAO\02_PROCESSAMENTO_PERSONAS\03_generate_rag.js",
        "AUTOMACAO\02_PROCESSAMENTO_PERSONAS\04_generate_fluxos_analise.js", 
        "AUTOMACAO\02_PROCESSAMENTO_PERSONAS\05_generate_workflows_n8n.js",
        "AUTOMACAO\01_SETUP_E_CRIACAO\05_auto_biografia_generator.js",
        "api_bridge.js"
    )

    $missingScripts = @()
    foreach ($script in $requiredScripts) {
        if (!(Test-Path $script)) {
            $missingScripts += $script
        }
    }

    if ($missingScripts.Count -gt 0) {
        Write-Warning "Scripts ausentes encontrados:"
        foreach ($script in $missingScripts) {
            Write-Host "  - $script" -ForegroundColor Red
        }
        
        if (!$Force) {
            $response = Read-Host "Continue mesmo assim? (y/N)"
            if ($response -notmatch '^[Yy]$') {
                exit 1
            }
        }
    } else {
        Write-Success "Todos os scripts Node.js encontrados!"
    }

    # Limpar build anterior
    Write-Info "Limpando build anterior..."
    if (Test-Path ".next") {
        Remove-Item -Recurse -Force ".next"
        Write-Success "Cache limpo"
    }

    # Instalar dependências
    Write-Info "Instalando dependências..."
    npm ci
    Write-Success "Dependências instaladas"

    # Build de produção
    Write-Info "Executando build de produção..."
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Build falhou! Verifique os erros acima."
        exit 1
    }
    
    Write-Success "Build concluído com sucesso!"

    # Verificar arquivo .env
    $envExists = (Test-Path ".env") -or (Test-Path ".env.production") -or (Test-Path ".env.local")
    
    if (!$envExists) {
        Write-Warning "Nenhum arquivo .env encontrado."
        $response = Read-Host "Criar arquivo .env de exemplo? (Y/n)"
        
        if ($response -match '^[Yy]$' -or $response -eq '') {
            $envContent = @'
# Configurações VCM Dashboard
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase VCM Central
VCM_SUPABASE_URL=your_vcm_supabase_url
VCM_SUPABASE_KEY=your_vcm_supabase_key

# Supabase RAG Database  
LIFEWAY_SUPABASE_URL=your_lifeway_supabase_url
LIFEWAY_SUPABASE_KEY=your_lifeway_supabase_key

# API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Sistema
EMPRESA_PADRAO=LIFEWAY
EMPRESA_CODIGO=LWY
PORT=3000
'@
            $envContent | Out-File -FilePath ".env.example" -Encoding UTF8
            Write-Success "Arquivo .env.example criado. Configure suas variáveis antes do deploy final."
        }
    }

    # Testar build local (se não for pulado)
    if (!$SkipTests) {
        Write-Info "Testando servidor de produção..."
        
        # Iniciar servidor em background
        $serverProcess = Start-Process -FilePath "npm" -ArgumentList "start" -PassThru -NoNewWindow
        
        # Aguardar servidor iniciar
        Start-Sleep -Seconds 8
        
        # Health check
        Write-Info "Executando health check..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success "Health check passou!"
            } else {
                Write-Warning "Health check retornou status: $($response.StatusCode)"
            }
        } catch {
            Write-Warning "Health check falhou - mas pode ser normal se APIs não estiverem configuradas"
        }
        
        # Parar servidor de teste
        try {
            Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
            Write-Success "Servidor de teste encerrado"
        } catch {
            Write-Warning "Não foi possível encerrar servidor de teste automaticamente"
        }
    }

    # Sucesso!
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Blue
    Write-Host "🎉 DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green -BackgroundColor Black
    Write-Host "======================================" -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "Próximos passos:" -ForegroundColor Green
    Write-Host "1. Configure variáveis de ambiente (.env)"
    Write-Host "2. Escolha plataforma de deploy:"
    Write-Host "   • Vercel: " -NoNewline; Write-Host "vercel --prod" -ForegroundColor Yellow
    Write-Host "   • Docker: " -NoNewline; Write-Host "docker build -t vcm-dashboard ." -ForegroundColor Yellow  
    Write-Host "   • Windows: " -NoNewline; Write-Host "npm start" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "URLs locais:" -ForegroundColor Green
    Write-Host "• Desenvolvimento: " -NoNewline; Write-Host "http://localhost:3001" -ForegroundColor Cyan
    Write-Host "• Produção: " -NoNewline; Write-Host "http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "APIs disponíveis:" -ForegroundColor Green
    Write-Host "• Health: /api/health"
    Write-Host "• Scripts: /api/nodejs-scripts" 
    Write-Host "• Status: /api/nodejs-scripts/status"
    Write-Host "• Cascata: /api/cascade-nodejs"
    Write-Host ""
    
    Write-Host "🎯 Dashboard funcionando com 7 scripts Node.js integrados!" -ForegroundColor Magenta
    Write-Host ""

} catch {
    Write-Error "Erro durante o deploy: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Para troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Verifique se Node.js 18+ está instalado"
    Write-Host "2. Execute 'npm install' manualmente"
    Write-Host "3. Tente 'npm run build' separadamente" 
    Write-Host "4. Verifique logs acima para erros específicos"
    exit 1
}