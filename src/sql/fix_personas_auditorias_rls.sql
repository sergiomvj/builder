-- Políticas RLS para tabela personas_auditorias
-- Execute este SQL no Supabase SQL Editor

-- Habilitar RLS na tabela
ALTER TABLE personas_auditorias ENABLE ROW LEVEL SECURITY;

-- Política: Permitir INSERT para usuários autenticados (service role)
CREATE POLICY "Allow insert for service role"
ON personas_auditorias
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Política: Permitir SELECT para todos
CREATE POLICY "Allow select for all"
ON personas_auditorias
FOR SELECT
TO authenticated, anon
USING (true);

-- Política: Permitir UPDATE para service role
CREATE POLICY "Allow update for service role"
ON personas_auditorias
FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Política: Permitir DELETE para service role
CREATE POLICY "Allow delete for service role"
ON personas_auditorias
FOR DELETE
TO authenticated, anon
USING (true);
