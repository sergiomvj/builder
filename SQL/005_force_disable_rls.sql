-- 005_force_disable_rls.sql
-- ATENÇÃO: Use este script APENAS se os projetos ainda não aparecerem.
-- Isso desativa a segurança linha-a-linha para liberar geral (Modo Emergência/Dev).

ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE personas DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_logs DISABLE ROW LEVEL SECURITY;

-- Se o problema for permissão de leitura:
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
