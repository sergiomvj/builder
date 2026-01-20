-- ============================================================================
-- POLÍTICAS RLS PARA TABELA personas_machine_learning
-- ============================================================================
-- Execute no Supabase SQL Editor
-- Data: 3 de Dezembro de 2025
-- ============================================================================

-- 1. Habilitar RLS na tabela (caso não esteja)
ALTER TABLE personas_machine_learning ENABLE ROW LEVEL SECURITY;

-- 2. Política de SELECT (permite ler todos os registros autenticados)
CREATE POLICY "Allow authenticated users to read ML models" 
ON personas_machine_learning
FOR SELECT 
TO authenticated
USING (true);

-- 3. Política de INSERT (permite inserir para usuários autenticados)
CREATE POLICY "Allow authenticated users to insert ML models" 
ON personas_machine_learning
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- 4. Política de UPDATE (permite atualizar para usuários autenticados)
CREATE POLICY "Allow authenticated users to update ML models" 
ON personas_machine_learning
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Política de DELETE (permite deletar para usuários autenticados)
CREATE POLICY "Allow authenticated users to delete ML models" 
ON personas_machine_learning
FOR DELETE 
TO authenticated
USING (true);

-- 6. Política de acesso para service_role (usado pelos scripts Node.js)
CREATE POLICY "Allow service_role full access to ML models" 
ON personas_machine_learning
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Política de acesso para anon (chave anônima usada pelos scripts)
CREATE POLICY "Allow anon full access to ML models" 
ON personas_machine_learning
FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

-- ============================================================================
-- VERIFICAR POLÍTICAS CRIADAS
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
-- RESULTADO ESPERADO (6 políticas)
-- ============================================================================
-- Allow authenticated users to delete ML models    | PERMISSIVE | {authenticated} | DELETE
-- Allow authenticated users to insert ML models    | PERMISSIVE | {authenticated} | INSERT
-- Allow authenticated users to read ML models      | PERMISSIVE | {authenticated} | SELECT
-- Allow authenticated users to update ML models    | PERMISSIVE | {authenticated} | UPDATE
-- Allow service_role full access to ML models      | PERMISSIVE | {service_role}  | ALL
