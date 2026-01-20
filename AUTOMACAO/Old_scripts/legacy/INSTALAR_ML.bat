@echo off
echo.
echo ===========================================
echo    INSTALACAO ML VCM - METODO FORCADO
echo ===========================================
echo.

echo [1/3] Testando conexao...
node force_ml_tables.js

echo.
echo [2/3] Configurando sistema...
node install_ml_simple.js

echo.
echo [3/3] Verificando instalacao...
echo.

echo ============== SISTEMA PRONTO ==============
echo.
echo Para executar o Sistema ML:
echo   node vcm_learning_system.js
echo.
echo Para abrir Dashboard:
echo   node vcm_learning_dashboard.js
echo.
echo ============================================
echo.

pause