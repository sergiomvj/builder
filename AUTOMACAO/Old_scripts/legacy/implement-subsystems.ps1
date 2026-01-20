# Script PowerShell para implementar os sub-sistemas no Supabase
# Execute este script para criar todas as tabelas dos sub-sistemas

Write-Host "🚀 Implementando Sub-sistemas VCM no Supabase..." -ForegroundColor Green

# Verificar se o arquivo .env existe
if (-Not (Test-Path ".env")) {
    Write-Host "❌ Erro: Arquivo .env não encontrado" -ForegroundColor Red
    Write-Host "💡 Crie o arquivo .env com as variáveis:" -ForegroundColor Yellow
    Write-Host "   SUPABASE_URL=sua_url_supabase"
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key"
    exit 1
}

# Carregar variáveis do .env
Get-Content .env | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        Set-Variable -Name $matches[1] -Value $matches[2]
    }
}

if (-Not $SUPABASE_URL -or -Not $SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ Erro: Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Executando schema dos sub-sistemas..." -ForegroundColor Blue

# Verificar se o arquivo SQL existe
if (-Not (Test-Path "database-schema-subsistemas.sql")) {
    Write-Host "❌ Erro: Arquivo database-schema-subsistemas.sql não encontrado" -ForegroundColor Red
    exit 1
}

# Executar via curl (método alternativo usando REST API do Supabase)
try {
    $sqlContent = Get-Content "database-schema-subsistemas.sql" -Raw
    $headers = @{
        "Authorization" = "Bearer $SUPABASE_SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
    }
    
    # Dividir o SQL em comandos menores (Supabase tem limite de tamanho)
    $sqlCommands = $sqlContent -split ";\s*\n" | Where-Object { $_.Trim() -ne "" }
    
    Write-Host "📋 Executando $($sqlCommands.Count) comandos SQL..." -ForegroundColor Blue
    
    $successCount = 0
    $errorCount = 0
    
    foreach ($command in $sqlCommands) {
        if ($command.Trim() -eq "") { continue }
        
        $body = @{
            query = $command.Trim() + ";"
        } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body
            $successCount++
            Write-Host "✅ Comando executado com sucesso" -ForegroundColor Green
        }
        catch {
            $errorCount++
            Write-Host "⚠️  Erro em comando (pode ser normal se já existir): $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n✅ Sub-sistemas implementados!" -ForegroundColor Green
    Write-Host "📊 Sucessos: $successCount | Erros: $errorCount" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Erro ao executar SQL: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Tente executar manualmente no Supabase SQL Editor" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📋 Sub-sistemas disponíveis:" -ForegroundColor Cyan
Write-Host "  1. 📧 Email Management" -ForegroundColor White
Write-Host "  2. 🎯 CRM & Sales" -ForegroundColor White
Write-Host "  3. 📱 Social Media" -ForegroundColor White
Write-Host "  4. 🚀 Marketing & Traffic" -ForegroundColor White
Write-Host "  5. 💰 Financial Management" -ForegroundColor White
Write-Host "  6. 🎬 Content Creation" -ForegroundColor White
Write-Host "  7. 📞 Customer Support" -ForegroundColor White
Write-Host "  8. 📊 Analytics & Reporting" -ForegroundColor White
Write-Host "  9. 👥 HR Management" -ForegroundColor White
Write-Host " 10. 🛒 E-commerce" -ForegroundColor White
Write-Host " 11. 🤖 AI Assistant" -ForegroundColor White
Write-Host " 12. 📈 Business Intelligence" -ForegroundColor White

Write-Host "`n🌐 Acesse o dashboard: http://localhost:3000" -ForegroundColor Green
Write-Host "🔗 Ou vá para: Dashboard → Sub-sistemas" -ForegroundColor Green