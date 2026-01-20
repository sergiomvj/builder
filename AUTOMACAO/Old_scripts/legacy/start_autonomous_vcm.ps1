# SISTEMA AUTÔNOMO VCM - INICIALIZAÇÃO
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
