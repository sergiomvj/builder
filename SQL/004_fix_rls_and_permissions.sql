-- 004_fix_rls_and_permissions.sql
-- Objetivo: Garantir que o acesso aos projetos funcione tanto local quanto online (Anon/Service Role).

-- 1. Habilitar RLS nas tabelas (já deve estar, mas garantindo)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- 2. Garantir permissões básicas para roles do Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Recriar Politicas de "Permitir Tudo" (Modo MVP/Dev) para evitar bloqueios silenciosos
-- Remove políticas antigas (se existirem) para evitar conflitos
DROP POLICY IF EXISTS "Allow all access to projects" ON projects;
DROP POLICY IF EXISTS "Enable read access for all users" ON projects;
DROP POLICY IF EXISTS "Enable insert for all users" ON projects;
DROP POLICY IF EXISTS "Enable update for all users" ON projects;

DROP POLICY IF EXISTS "Allow all access to ideas" ON ideas;
DROP POLICY IF EXISTS "Allow all access to personas" ON personas;
DROP POLICY IF EXISTS "Allow all access to chat_logs" ON chat_logs;

-- Cria políticas permissivas (CRUD total para public)
-- IMPORTANTE: Em produção real, você restringiria por user_id, mas para este MVP estamos liberando o acesso.
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to ideas" ON ideas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to personas" ON personas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to chat_logs" ON chat_logs FOR ALL USING (true) WITH CHECK (true);

-- 4. Garantir que o Service Role (Backend) tenha acesso irrestrito (bypass RLS)
ALTER TABLE projects FORCE ROW LEVEL SECURITY; -- Opcional, mas força o check.
-- Service Role por padrão ignora RLS, então, apenas garantir que ele tenha GRANT ALL acima é suficiente.
