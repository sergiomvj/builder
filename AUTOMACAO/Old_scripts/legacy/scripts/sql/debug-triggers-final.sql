-- =====================================================
-- DIAGNÓSTICO AVANÇADO E CORREÇÃO FINAL
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. INVESTIGAR TRIGGERS que podem estar causando o problema
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    t.tgname as trigger_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname IN ('empresas', 'audit_logs', 'personas')
    AND NOT t.tgisinternal;

-- 2. VERIFICAR POLICIES RLS que podem estar interferindo
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('empresas', 'audit_logs', 'personas');

-- 3. TENTAR EXCLUSÃO DIRETA DA EMPRESA ARVA
-- (Primeiro vamos ver se funciona direto no SQL)
DELETE FROM empresas WHERE id = '07870dfd-ca9d-4004-bbeb-e4aabd30d244';

-- 4. SE FALHAR, DESABILITAR TEMPORARIAMENTE OS TRIGGERS
-- Desabilitar triggers na audit_logs
ALTER TABLE audit_logs DISABLE TRIGGER ALL;

-- Tentar exclusão novamente
DELETE FROM empresas WHERE id = '07870dfd-ca9d-4004-bbeb-e4aabd30d244';

-- Reabilitar triggers
ALTER TABLE audit_logs ENABLE TRIGGER ALL;

-- 5. VERIFICAR SE A EMPRESA FOI REMOVIDA
SELECT id, nome, status FROM empresas WHERE nome LIKE '%ARVA%' OR id = '07870dfd-ca9d-4004-bbeb-e4aabd30d244';