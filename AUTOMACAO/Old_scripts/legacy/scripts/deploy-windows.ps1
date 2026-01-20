# Script de Deploy para VPS - Windows PowerShell
# VCM Dashboard - Virtual Company Manager
# Execute: .\scripts\deploy-windows.ps1

param(
    [switch]$Production,
    [switch]$Build,
    [switch]$Start,
    [switch]$Stop,
    [switch]$Logs,
    [switch]$Status,
    [switch]$Clean,
    [string]$Command = "deploy"
)

# Configurações
$ErrorActionPreference = "Stop"
$ComposeFile = "docker-compose.prod.yml"
$EnvFile = ".env.production"

# Cores para output
function Write-ColoredText {
    param(
        [string]$Text,
        [ConsoleColor]$Color = [ConsoleColor]::White
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColoredText "✅ $Message" -Color Green
}

function Write-Warning {
    param([string]$Message)
    Write-ColoredText "⚠️ $Message" -Color Yellow
}

function Write-Error {
    param([string]$Message)
    Write-ColoredText "❌ $Message" -Color Red
}

function Write-Info {
    param([string]$Message)
    Write-ColoredText "ℹ️ $Message" -Color Cyan
}

# Header
Write-ColoredText "`n🚀 VCM Dashboard - Deploy Script" -Color Magenta
Write-ColoredText "================================`n" -Color Magenta

# Verificar se está no diretório correto
if (!(Test-Path "package.json")) {
    Write-Error "Execute este script do diretório raiz do projeto!"
    exit 1
}

# Verificar dependências
Write-Info "Verificando dependências..."
try {
    docker --version | Out-Null
    Write-Success "Docker encontrado"
} catch {
    Write-Error "Docker não está instalado ou não está no PATH!"
    exit 1
}

try {
    docker-compose --version | Out-Null
    Write-Success "Docker Compose encontrado"
} catch {
    Write-Error "Docker Compose não está instalado!"
    exit 1
}

# Funções específicas
function Deploy-Application {
    Write-Info "Iniciando deploy completo..."
    
    # Verificar arquivo de ambiente
    if (!(Test-Path $EnvFile)) {
        if (Test-Path ".env.vps") {
            Write-Info "Copiando .env.vps para $EnvFile..."
            Copy-Item ".env.vps" $EnvFile
        } else {
            Write-Error "Arquivo $EnvFile não encontrado!"
            Write-Warning "Crie o arquivo baseado em .env.vps"
            exit 1
        }
    }

    # Criar diretório de backup
    if (!(Test-Path "backups")) {
        New-Item -ItemType Directory -Name "backups" | Out-Null
        Write-Info "Diretório de backups criado"
    }

    # Parar containers existentes
    Write-Info "Parando containers existentes..."
    try {
        docker-compose -f $ComposeFile down --remove-orphans
        Write-Success "Containers parados"
    } catch {
        Write-Warning "Nenhum container para parar"
    }

    # Build da aplicação
    Write-Info "Construindo nova imagem..."
    docker-compose -f $ComposeFile build --no-cache
    Write-Success "Imagem construída"

    # Iniciar serviços
    Write-Info "Iniciando serviços..."
    docker-compose -f $ComposeFile up -d
    Write-Success "Serviços iniciados"

    # Aguardar inicialização
    Write-Info "Aguardando inicialização (30s)..."
    Start-Sleep -Seconds 30

    # Health check
    Write-Info "Verificando saúde da aplicação..."
    $maxAttempts = 10
    $attempt = 1
    $healthy = $false

    while ($attempt -le $maxAttempts -and !$healthy) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                $healthy = $true
                Write-Success "Aplicação respondendo corretamente!"
            }
        } catch {
            Write-Warning "Tentativa $attempt/$maxAttempts - Aguardando aplicação..."
            Start-Sleep -Seconds 10
            $attempt++
        }
    }

    if (!$healthy) {
        Write-Error "Aplicação não respondeu após $maxAttempts tentativas"
        docker-compose -f $ComposeFile logs vcm-dashboard --tail=50
        exit 1
    }

    # Informações finais
    Write-ColoredText "`n🎉 Deploy concluído com sucesso!" -Color Green
    Write-ColoredText "`n=== INFORMAÇÕES DE ACESSO ===" -Color Blue
    Write-Host "🌐 URL Local: http://localhost"
    Write-Host "📊 Health Check: http://localhost/api/health"
    Write-Host "📖 Manual: http://localhost/manual-instrucoes.html"
    Write-ColoredText "`n=== COMANDOS ÚTEIS ===" -Color Blue
    Write-Host "📋 Status: docker-compose -f $ComposeFile ps"
    Write-Host "📜 Logs: docker-compose -f $ComposeFile logs -f"
    Write-Host "🔄 Restart: docker-compose -f $ComposeFile restart"
    Write-Host "🛑 Stop: docker-compose -f $ComposeFile down"
}

function Show-Status {
    Write-Info "Status dos containers:"
    docker-compose -f $ComposeFile ps
}

function Show-Logs {
    Write-Info "Exibindo logs (Ctrl+C para sair):"
    docker-compose -f $ComposeFile logs -f
}

function Stop-Application {
    Write-Info "Parando aplicação..."
    docker-compose -f $ComposeFile down
    Write-Success "Aplicação parada"
}

function Start-Application {
    Write-Info "Iniciando aplicação..."
    docker-compose -f $ComposeFile up -d
    Write-Success "Aplicação iniciada"
}

function Build-Application {
    Write-Info "Construindo aplicação..."
    docker-compose -f $ComposeFile build
    Write-Success "Build concluído"
}

function Clean-Docker {
    Write-Info "Limpando recursos Docker..."
    docker system prune -f
    docker image prune -f
    Write-Success "Limpeza concluída"
}

# Executar comando baseado nos parâmetros
switch ($Command.ToLower()) {
    "deploy" { Deploy-Application }
    "status" { Show-Status }
    "logs" { Show-Logs }
    "stop" { Stop-Application }
    "start" { Start-Application }
    "build" { Build-Application }
    "clean" { Clean-Docker }
    default {
        if ($Production) { Deploy-Application }
        elseif ($Status) { Show-Status }
        elseif ($Logs) { Show-Logs }
        elseif ($Stop) { Stop-Application }
        elseif ($Start) { Start-Application }
        elseif ($Build) { Build-Application }
        elseif ($Clean) { Clean-Docker }
        else {
            Write-ColoredText "`nUso do script:" -Color Yellow
            Write-Host "  .\scripts\deploy-windows.ps1                    # Deploy completo"
            Write-Host "  .\scripts\deploy-windows.ps1 -Status            # Ver status"
            Write-Host "  .\scripts\deploy-windows.ps1 -Logs              # Ver logs"
            Write-Host "  .\scripts\deploy-windows.ps1 -Stop              # Parar"
            Write-Host "  .\scripts\deploy-windows.ps1 -Start             # Iniciar"
            Write-Host "  .\scripts\deploy-windows.ps1 -Build             # Build"
            Write-Host "  .\scripts\deploy-windows.ps1 -Clean             # Limpar"
        }
    }
}