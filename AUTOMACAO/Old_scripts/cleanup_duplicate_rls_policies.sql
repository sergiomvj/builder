-- ============================================================================
-- LIMPAR POLÍTICAS DUPLICADAS RLS PARA personas_machine_learning
-- ============================================================================
-- Execute no Supabase SQL Editor APÓS verificar que as novas políticas funcionam
-- Data: 3 de Dezembro de 2025
-- ============================================================================

-- Remover políticas duplicadas (as antigas "Enable *")
DROP POLICY IF EXISTS "Enable read for authenticated users" ON personas_machine_learning;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON personas_machine_learning;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON personas_machine_learning;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON personas_machine_learning;

-- ============================================================================
-- VERIFICAR POLÍTICAS APÓS LIMPEZA
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'personas_machine_learning'
ORDER BY policyname;

-- ============================================================================
-- RESULTADO ESPERADO APÓS LIMPEZA (6 políticas únicas)
-- ============================================================================
-- Allow anon full access to ML models           | PERMISSIVE | {anon}          | ALL
-- Allow authenticated users to delete ML models | PERMISSIVE | {authenticated} | DELETE
-- Allow authenticated users to insert ML models | PERMISSIVE | {authenticated} | INSERT
-- Allow authenticated users to read ML models   | PERMISSIVE | {authenticated} | SELECT
-- Allow authenticated users to update ML models | PERMISSIVE | {authenticated} | UPDATE
-- Allow service_role full access to ML models   | PERMISSIVE | {service_role}  | ALL