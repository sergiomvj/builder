@echo off
echo.
echo ================================================
echo    SISTEMA COMPLETO VCM - ML + AUDITORIA
echo ================================================
echo.

:menu
echo [1] Instalar Sistema ML (Primeira vez)
echo [2] Executar Sistema ML Basico
echo [3] Executar Sistema de Auditoria
echo [4] Executar Sistema Integrado ML + Auditoria
echo [5] Dashboard ML (http://localhost:3001)
echo [6] Dashboard Auditoria (http://localhost:3002)  
echo [7] Gerar Relatorio Integrado
echo [8] Corrigir Sistema ML (se houver erros)
echo [9] Sair
echo.

set /p choice="Escolha uma opcao (1-9): "

if "%choice%"=="1" goto install_ml
if "%choice%"=="2" goto run_ml
if "%choice%"=="3" goto run_audit
if "%choice%"=="4" goto run_integrated
if "%choice%"=="5" goto dashboard_ml
if "%choice%"=="6" goto dashboard_audit
if "%choice%"=="7" goto generate_report
if "%choice%"=="8" goto fix_ml
if "%choice%"=="9" goto end

echo Opcao invalida!
goto menu

:install_ml
echo.
echo ========== INSTALANDO SISTEMA ML ==========
echo.
echo [1/3] Executando force_ml_tables.js...
node force_ml_tables.js
echo.
echo [2/3] Executando install_ml_simple.js...
node install_ml_simple.js
echo.
echo [3/3] Testando sistema...
node vcm_learning_system.js
echo.
echo ========== INSTALACAO CONCLUIDA ==========
echo.
pause
goto menu

:run_ml
echo.
echo ========== EXECUTANDO SISTEMA ML ==========
echo.
node vcm_learning_system.js
echo.
echo ========== EXECUCAO CONCLUIDA ==========
echo.
pause
goto menu

:run_audit
echo.
echo ========== EXECUTANDO SISTEMA DE AUDITORIA ==========
echo.
node vcm_audit_system.js
echo.
echo ========== EXECUCAO CONCLUIDA ==========
echo.
pause
goto menu

:run_integrated
echo.
echo ========== EXECUTANDO SISTEMA INTEGRADO ==========
echo.
echo Executando ML + Auditoria com rastreamento completo...
node vcm_integrated_system.js cycle
echo.
echo ========== EXECUCAO CONCLUIDA ==========
echo.
pause
goto menu

:dashboard_ml
echo.
echo ========== INICIANDO DASHBOARD ML ==========
echo.
echo Dashboard sera aberto em: http://localhost:3001
echo Pressione Ctrl+C para parar o dashboard
echo.
start http://localhost:3001
node vcm_learning_dashboard.js
goto menu

:dashboard_audit
echo.
echo ========== INICIANDO DASHBOARD AUDITORIA ==========
echo.
echo Dashboard sera aberto em: http://localhost:3002
echo Pressione Ctrl+C para parar o dashboard
echo.
start http://localhost:3002
node vcm_audit_dashboard.js
goto menu

:generate_report
echo.
echo ========== GERANDO RELATORIO INTEGRADO ==========
echo.
node vcm_integrated_system.js report
echo.
echo ========== RELATORIO GERADO ==========
echo.
pause
goto menu

:fix_ml
echo.
echo ========== CORRIGINDO SISTEMA ML ==========
echo.
echo Executando correcoes automaticas...
node force_ml_tables.js
echo.
echo Reinstalando configuracoes...
node install_ml_simple.js
echo.
echo Testando sistema corrigido...
node vcm_learning_system.js
echo.
echo ========== CORRECOES CONCLUIDAS ==========
echo.
pause
goto menu

:end
echo.
echo ========== SISTEMA VCM FINALIZADO ==========
echo.
echo Obrigado por usar o Sistema VCM!
echo.
pause