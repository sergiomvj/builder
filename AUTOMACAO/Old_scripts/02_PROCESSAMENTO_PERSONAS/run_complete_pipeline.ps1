# Script PowerShell para executar o pipeline completo do sistema VCM
# Executa todos os scripts em sequência para uma empresa específica

param(
    [Parameter(Mandatory=$true)]
    [string]$EmpresaId
)

# Função para log com cores
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Level) {
        "ERROR" { Write-Host "[$timestamp] [ERROR] $Message" -ForegroundColor Red }
        "SUCCESS" { Write-Host "[$timestamp] [SUCCESS] $Message" -ForegroundColor Green }
        "WARNING" { Write-Host "[$timestamp] [WARNING] $Message" -ForegroundColor Yellow }
        "INFO" { Write-Host "[$timestamp] [INFO] $Message" -ForegroundColor Blue }
        "STEP" { Write-Host "[$timestamp] [STEP] $Message" -ForegroundColor Magenta }
        default { Write-Host "[$timestamp] $Message" -ForegroundColor White }
    }
}

Write-Log "🚀 Iniciando Pipeline Completo VCM para empresa: $EmpresaId" "STEP"

# Diretório dos scripts
$ScriptDir = ".\AUTOMACAO\02_PROCESSAMENTO_PERSONAS"

if (!(Test-Path $ScriptDir)) {
    Write-Log "Diretório de scripts não encontrado: $ScriptDir" "ERROR"
    exit 1
}

Set-Location $ScriptDir

# Lista de scripts na ordem correta de execução
$Scripts = @(
    "generate_rag_database.js",
    "generate_workflows_database.js", 
    "generate_objectives_database.js",
    "generate_auditing_system_database.js"
)

# Contador de sucessos
$SuccessCount = 0
$TotalScripts = $Scripts.Count

Write-Host "`n" -NoNewline
Write-Host "=== PIPELINE VCM COMPLETO ===" -ForegroundColor Magenta
Write-Host "📋 Empresa ID: $EmpresaId"
Write-Host "📊 Total de scripts: $TotalScripts"
Write-Host "📁 Diretório: $(Get-Location)"
Write-Host "`n" -NoNewline
Write-Host "Iniciando execução sequencial..." -ForegroundColor Cyan
Write-Host ""

# Executar cada script
for ($i = 0; $i -lt $Scripts.Count; $i++) {
    $script = $Scripts[$i]
    $step = $i + 1
    
    Write-Host "`n" -NoNewline
    Write-Host "=== PASSO $step/$TotalScripts : $script ===" -ForegroundColor Magenta
    Write-Log "Executando: node $script --empresaId $EmpresaId"
    
    # Executar o script
    $process = Start-Process -FilePath "node" -ArgumentList "$script", "--empresaId", "$EmpresaId" -Wait -PassThru -NoNewWindow
    
    if ($process.ExitCode -eq 0) {
        Write-Log "✅ $script concluído com sucesso!" "SUCCESS"
        $SuccessCount++
    }
    else {
        Write-Log "❌ Falha na execução de $script" "ERROR"
        Write-Log "Pipeline interrompido no passo $step/$TotalScripts" "WARNING"
        break
    }
    
    # Pequena pausa entre scripts
    Start-Sleep -Seconds 2
}

Write-Host "`n" -NoNewline
Write-Host "=== RESULTADO FINAL ===" -ForegroundColor Magenta

if ($SuccessCount -eq $TotalScripts) {
    Write-Log "🎉 PIPELINE COMPLETO EXECUTADO COM SUCESSO!" "SUCCESS"
    Write-Host "✅ Todos os $TotalScripts scripts foram executados"
    Write-Host "📋 RAG Knowledge Base: ✅ Criado"
    Write-Host "⚙️ N8N Workflows: ✅ Criados"
    Write-Host "🎯 Objectives: ✅ Criados"
    Write-Host "🔍 Auditing System: ✅ Criado"
    
    Write-Host "`n" -NoNewline
    Write-Host "Sistema VCM completamente configurado para empresa $EmpresaId" -ForegroundColor Green
    exit 0
}
else {
    Write-Log "❌ PIPELINE INCOMPLETO" "ERROR"
    Write-Host "⚠️ $SuccessCount/$TotalScripts scripts executados com sucesso"
    Write-Host "💡 Execute os scripts restantes manualmente ou corrija os erros"
    exit 1
}