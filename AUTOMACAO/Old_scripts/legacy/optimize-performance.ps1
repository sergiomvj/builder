# Script para otimizar performance do Next.js
# Identifica e move componentes não utilizados

# Criar pasta de backup
$backupPath = "src/components/_backup_unused"
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
}

# Lista de componentes potencialmente não utilizados
$unusedComponents = @(
    "src/components/diversidade-simple-test.tsx",
    "src/components/diagnostic-diversity.tsx", 
    "src/components/equipe-diversa-generator-fixed.tsx",
    "src/components/equipe-diversa-generator-safe-new.tsx",
    "src/app/personas/page_old.tsx",
    "src/app/personas/PersonasFixed.tsx",
    "src/app/personas/PersonasSimple.tsx",
    "src/components/select-safe.tsx"
)

Write-Host "🧹 LIMPEZA DE COMPONENTES NÃO UTILIZADOS" -ForegroundColor Yellow
Write-Host ""

$moved = 0
foreach ($component in $unusedComponents) {
    if (Test-Path $component) {
        $fileName = Split-Path $component -Leaf
        $targetPath = Join-Path $backupPath $fileName
        
        Move-Item -Path $component -Destination $targetPath -Force
        Write-Host "✅ Movido: $component → backup" -ForegroundColor Green
        $moved++
    } else {
        Write-Host "⚠️ Não encontrado: $component" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📊 RESULTADO:" -ForegroundColor Cyan
Write-Host "   Componentes movidos: $moved" -ForegroundColor White
Write-Host "   Backup em: $backupPath" -ForegroundColor White

# Analisar imports lucide-react
Write-Host ""
Write-Host "🔍 ANÁLISE DE IMPORTS LUCIDE-REACT" -ForegroundColor Yellow

$lucideFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" | Select-String "from 'lucide-react'" | Group-Object Path
Write-Host "   Arquivos usando Lucide: $($lucideFiles.Count)" -ForegroundColor White

# Verificar tamanho dos sub-sistemas
Write-Host ""
Write-Host "📁 ANÁLISE SUB-SISTEMAS" -ForegroundColor Yellow

$subsystemPath = "src/components/sub-sistemas"
if (Test-Path $subsystemPath) {
    $subsystems = Get-ChildItem -Path $subsystemPath -Filter "*.tsx"
    $totalSize = ($subsystems | Measure-Object -Property Length -Sum).Sum
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    
    Write-Host "   Total sub-sistemas: $($subsystems.Count)" -ForegroundColor White
    Write-Host "   Tamanho total: $totalSizeMB MB" -ForegroundColor White
    
    # Mostrar maiores arquivos
    Write-Host ""
    Write-Host "📊 MAIORES SUB-SISTEMAS:" -ForegroundColor Cyan
    $subsystems | Sort-Object Length -Descending | Select-Object -First 5 | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "   $($_.Name): $sizeMB MB" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "🚀 RECOMENDAÇÕES:" -ForegroundColor Green
Write-Host "   1. Reiniciar servidor Next.js" -ForegroundColor White
Write-Host "   2. Limpar cache: npm run dev (nova configuração)" -ForegroundColor White
Write-Host "   3. Considerar lazy loading para sub-sistemas" -ForegroundColor White
Write-Host "   4. Usar imports específicos do Lucide" -ForegroundColor White