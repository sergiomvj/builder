-- =====================================================
-- SCRIPT DE EXECUÇÃO: Todas as Migrações V5.0
-- DESCRIÇÃO: Executa todos os schemas de supervisão e comunicações
-- VERSÃO: 1.0
-- DATA: 07/12/2025
-- =====================================================

-- Este script deve ser executado contra o banco Supabase
-- Conexão: fzyokrvdyeczhfqlwxzb.supabase.co

\echo '========================================='
\echo 'VCM V5.0 - Migrations: Sistema de Comunicações e Supervisão'
\echo '========================================='
\echo ''

-- =====================================================
-- 1. COMUNICAÇÕES INTER-PERSONAS
-- =====================================================
\echo '1/3 Criando tabela personas_communications...'
\i create_personas_communications.sql
\echo '✓ Tabela personas_communications criada'
\echo ''

-- =====================================================
-- 2. SUPERVISÃO HIERÁRQUICA
-- =====================================================
\echo '2/3 Criando tabelas task_supervision_chains e task_supervision_logs...'
\i create_task_supervision.sql
\echo '✓ Tabelas de supervisão criadas'
\echo ''

-- =====================================================
-- 3. INTERVENÇÕES DE USUÁRIO
-- =====================================================
\echo '3/3 Criando tabela user_interventions...'
\i create_user_interventions.sql
\echo '✓ Tabela user_interventions criada'
\echo ''

-- =====================================================
-- VALIDAÇÃO
-- =====================================================
\echo '========================================='
\echo 'Validando estrutura criada...'
\echo '========================================='

-- Verifica tabelas criadas
SELECT 
  tablename,
  CASE 
    WHEN tablename IN ('personas_communications', 'task_supervision_chains', 'task_supervision_logs', 'user_interventions') 
    THEN '✓ OK'
    ELSE '✗ ERRO'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('personas_communications', 'task_supervision_chains', 'task_supervision_logs', 'user_interventions')
ORDER BY tablename;

-- Conta views criadas
SELECT 'Views criadas: ' || COUNT(*) as info
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname LIKE 'v_%communication%' OR viewname LIKE 'v_%supervision%' OR viewname LIKE 'v_%intervention%';

-- Conta funções criadas
SELECT 'Funções criadas: ' || COUNT(*) as info
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'create_communication',
    'create_supervision_log',
    'process_supervision_escalations',
    'create_user_intervention',
    'update_intervention_status',
    'confirm_intervention_metrics'
  );

\echo ''
\echo '========================================='
\echo 'Migrações V5.0 concluídas com sucesso!'
\echo '========================================='
\echo ''
\echo 'Próximos passos:'
\echo '1. Executar Scripts 04-05 V5.0 (competências + avatares)'
\echo '2. Executar Script 06.5 (matriz de comunicação)'
\echo '3. Executar Script 07.5 (cadeias de supervisão)'
\echo ''

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
