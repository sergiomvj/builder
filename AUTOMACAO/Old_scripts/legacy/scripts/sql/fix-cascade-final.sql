-- =====================================================
-- CORREÇÃO DEFINITIVA DOS CONSTRAINTS CASCADE
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. PRIMEIRO: Remover constraint problemática
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_empresa_id_fkey;

-- 2. SEGUNDO: Recriar com CASCADE correto
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_empresa_id_fkey 
FOREIGN KEY (empresa_id) 
REFERENCES empresas(id) 
ON DELETE CASCADE;

-- 3. VERIFICAR outros constraints importantes
ALTER TABLE personas DROP CONSTRAINT IF EXISTS personas_empresa_id_fkey;
ALTER TABLE personas 
ADD CONSTRAINT personas_empresa_id_fkey 
FOREIGN KEY (empresa_id) 
REFERENCES empresas(id) 
ON DELETE CASCADE;

-- 4. VERIFICAR sync_logs se existir
ALTER TABLE sync_logs DROP CONSTRAINT IF EXISTS sync_logs_empresa_id_fkey;
ALTER TABLE sync_logs 
ADD CONSTRAINT sync_logs_empresa_id_fkey 
FOREIGN KEY (empresa_id) 
REFERENCES empresas(id) 
ON DELETE CASCADE;

-- 5. VERIFICAR auditorias se existir
ALTER TABLE auditorias DROP CONSTRAINT IF EXISTS auditorias_empresa_id_fkey;
ALTER TABLE auditorias 
ADD CONSTRAINT auditorias_empresa_id_fkey 
FOREIGN KEY (empresa_id) 
REFERENCES empresas(id) 
ON DELETE CASCADE;

-- 6. VERIFICAR metas_globais se existir
ALTER TABLE metas_globais DROP CONSTRAINT IF EXISTS metas_globais_empresa_id_fkey;
ALTER TABLE metas_globais 
ADD CONSTRAINT metas_globais_empresa_id_fkey 
FOREIGN KEY (empresa_id) 
REFERENCES empresas(id) 
ON DELETE CASCADE;

-- 7. TESTE FINAL: Verificar constraints aplicados
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name, 
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'empresa_id'
ORDER BY tc.table_name;