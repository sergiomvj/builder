@echo off
echo 🧠 INICIANDO SISTEMA VCM MACHINE LEARNING COMPLETO
echo =====================================================

echo.
echo 📋 Verificando dependências...
call npm list @supabase/supabase-js >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Instalando dependências necessárias...
    call npm install @supabase/supabase-js node-cron express
)

echo.
echo 🔧 Configurando sistema de Machine Learning...
node vcm_setup_ml.js

if %errorlevel% neq 0 (
    echo ❌ Erro na configuração. Verifique as mensagens acima.
    pause
    exit /b 1
)

echo.
echo 🚀 Iniciando sistema de aprendizado contínuo...
start "VCM Learning System" cmd /k "node vcm_learning_system.js scheduler"

echo.
echo 📊 Iniciando dashboard de monitoramento...
start "VCM Dashboard" cmd /k "node vcm_learning_dashboard.js"

echo.
echo 🌐 Abrindo dashboard no navegador...
timeout /t 3 >nul
start http://localhost:3001

echo.
echo ✅ SISTEMA VCM MACHINE LEARNING INICIADO!
echo =====================================================
echo 📊 Dashboard: http://localhost:3001
echo 🧠 Sistema de aprendizado: Executando em background
echo 📈 Monitoramento: Ativo e coletando dados
echo.
echo Pressione qualquer tecla para ver os logs...
pause

echo.
echo 📋 Mostrando logs do sistema de aprendizado...
start "Logs Learning" cmd /k "Get-Content -Path logs\vcm_autonomous_*.log -Wait"

echo.
echo 🎯 Sistema funcionando! Verifique o dashboard para monitorar.
echo Para parar o sistema, feche as janelas do terminal.
pause