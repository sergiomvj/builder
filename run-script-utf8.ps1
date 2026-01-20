# ============================================================================
# RUN-SCRIPT-UTF8.PS1 - Executor de Scripts Node.js com Encoding UTF-8
# ============================================================================
# 
# Problema: PowerShell usa codepage 850 por padrão, causando erros de exibição
# Solução: Configurar UTF-8 antes de executar scripts
#
# Uso:
#   .\run-script-utf8.ps1 02_generate_biografias_COMPLETO.js --empresaId=UUID
#   .\run-script-utf8.ps1 03_generate_atribuicoes_contextualizadas.js --empresaId=UUID
# ============================================================================

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$ScriptName,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$ScriptArgs
)

# Configurar encoding UTF-8 para o console
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Mudar para diretório AUTOMACAO se necessário
$currentDir = Get-Location
if ($currentDir.Path -notmatch '\\AUTOMACAO$') {
    Set-Location "AUTOMACAO"
}

# Executar script
Write-Host "🚀 Executando: node $ScriptName $ScriptArgs" -ForegroundColor Cyan
Write-Host "📍 Diretório: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

node $ScriptName $ScriptArgs

# Retornar ao diretório original
Set-Location $currentDir

# Preservar exit code
exit $LASTEXITCODE
