-- =====================================================
-- PROCEDIMENTO PADRÃO PARA EXCLUSÃO DE EMPRESAS
-- Use este template para excluir qualquer empresa
-- =====================================================

-- TEMPLATE PARA EXCLUSÃO SEGURA DE EMPRESAS
-- Substitua 'EMPRESA_ID_AQUI' pelo ID da empresa a ser excluída

-- 1. Desabilitar triggers de auditoria
ALTER TABLE empresas DISABLE TRIGGER USER;

-- 2. Excluir empresa (SUBSTITUA O ID)
DELETE FROM empresas WHERE id = 'EMPRESA_ID_AQUI';

-- 3. Reabilitar triggers
ALTER TABLE empresas ENABLE TRIGGER USER;

-- 4. Verificar resultado
SELECT COUNT(*) as empresas_restantes FROM empresas;
SELECT id, nome FROM empresas;

-- =====================================================
-- EXEMPLO DE USO:
-- Para excluir empresa com ID "123e4567-e89b-12d3-a456-426614174000":
-- DELETE FROM empresas WHERE id = '123e4567-e89b-12d3-a456-426614174000';
-- =====================================================