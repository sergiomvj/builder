-- ============================================================================
-- PADRONIZAR NOMENCLATURA DAS TABELAS COM PREFIXO personas_
-- ============================================================================
-- Execute no Supabase SQL Editor
-- Data: 2 de Dezembro de 2025
-- ============================================================================

-- 1. Renomear automation_opportunities → personas_automation_opportunities
ALTER TABLE IF EXISTS automation_opportunities 
RENAME TO personas_automation_opportunities;

-- 2. Renomear personas_ml_models → personas_machine_learning
ALTER TABLE IF EXISTS personas_ml_models 
RENAME TO personas_machine_learning;

-- 3. Renomear personas_audit_logs → personas_auditorias
ALTER TABLE IF EXISTS personas_audit_logs 
RENAME TO personas_auditorias;

-- ============================================================================
-- VERIFICAR TABELAS RENOMEADAS
-- ============================================================================

SELECT 
  table_name,
  CASE 
    WHEN table_name LIKE 'personas_%' THEN '✅ Nomenclatura correta'
    ELSE '❌ Falta prefixo personas_'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'personas_automation_opportunities',
    'personas_workflows',
    'personas_machine_learning',
    'personas_auditorias'
  )
ORDER BY table_name;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
-- personas_auditorias                      ✅ Nomenclatura correta
-- personas_automation_opportunities        ✅ Nomenclatura correta
-- personas_machine_learning                ✅ Nomenclatura correta
-- personas_workflows                       ✅ Nomenclatura correta
