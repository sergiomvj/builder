#!/usr/bin/env powershell
# Script para testar o dashboard VCM com Scripts Node.js

Write-Host "🚀 Iniciando Dashboard VCM - Scripts Node.js" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan

# Verificar se estamos no diretório correto
$currentDir = Get-Location
if (!(Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script na raiz do projeto VCM" -ForegroundColor Red
    exit 1
}

# Verificar dependências
Write-Host "📦 Verificando dependências..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "📥 Instalando dependências..." -ForegroundColor Blue
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro na instalação de dependências" -ForegroundColor Red
        exit 1
    }
}

# Verificar scripts Node.js
Write-Host "🔍 Verificando scripts Node.js..." -ForegroundColor Yellow
$scriptsDir = "AUTOMACAO\02_PROCESSAMENTO_PERSONAS"
$requiredScripts = @(
    "01_generate_competencias.js",
    "02_generate_tech_specs.js", 
    "03_generate_rag.js",
    "04_generate_fluxos_analise.js",
    "05_generate_workflows_n8n.js"
)

$missingScripts = @()
foreach ($script in $requiredScripts) {
    $scriptPath = Join-Path $scriptsDir $script
    if (!(Test-Path $scriptPath)) {
        $missingScripts += $script
    }
}

if ($missingScripts.Count -gt 0) {
    Write-Host "⚠️  Scripts Node.js ausentes:" -ForegroundColor Yellow
    foreach ($script in $missingScripts) {
        Write-Host "   - $script" -ForegroundColor Red
    }
    Write-Host "📝 Estes scripts foram convertidos do Python. Verifique a conversão." -ForegroundColor Cyan
} else {
    Write-Host "✅ Todos os scripts Node.js encontrados!" -ForegroundColor Green
}

# Verificar script de biografia
$biografiaScript = "AUTOMACAO\01_SETUP_E_CRIACAO\05_auto_biografia_generator.js"
if (Test-Path $biografiaScript) {
    Write-Host "✅ Script de biografia encontrado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Script de biografia ausente: $biografiaScript" -ForegroundColor Yellow
}

# Verificar API Bridge
$apiBridge = "api_bridge.js"
if (Test-Path $apiBridge) {
    Write-Host "✅ API Bridge encontrada" -ForegroundColor Green
} else {
    Write-Host "⚠️  API Bridge ausente: $apiBridge" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 Iniciando servidor de desenvolvimento..." -ForegroundColor Cyan
Write-Host "Dashboard será executado em: http://localhost:3000" -ForegroundColor Blue
Write-Host "Nova aba 'Scripts Node.js' disponível para execução" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Recursos disponíveis no dashboard:" -ForegroundColor Cyan
Write-Host "   • Execução individual de scripts Node.js" -ForegroundColor White
Write-Host "   • Cascata automática completa (Scripts 1-5)" -ForegroundColor White  
Write-Host "   • Monitor de status em tempo real" -ForegroundColor White
Write-Host "   • Visualização de outputs e arquivos gerados" -ForegroundColor White
Write-Host "   • Interface web para todos os scripts convertidos" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray

# Iniciar servidor de desenvolvimento
npm run dev