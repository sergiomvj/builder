-- Função SQL para exclusão forçada de empresa
-- Esta função bypass triggers de auditoria
CREATE OR REPLACE FUNCTION force_delete_empresa(empresa_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    resultado BOOLEAN := FALSE;
BEGIN
    -- Primeiro, desativar triggers temporariamente (se temos permissão)
    BEGIN
        -- Excluir audit_logs relacionados primeiro
        DELETE FROM audit_logs WHERE empresa_id = empresa_uuid;
        
        -- Excluir outras tabelas relacionadas
        DELETE FROM sync_logs WHERE empresa_id = empresa_uuid;
        DELETE FROM metas_globais WHERE empresa_id = empresa_uuid;
        DELETE FROM auditorias_compatibilidade WHERE empresa_id = empresa_uuid;
        
        -- Excluir personas relacionadas
        DELETE FROM personas WHERE empresa_id = empresa_uuid;
        
        -- Por último, excluir a empresa
        DELETE FROM empresas WHERE id = empresa_uuid;
        
        -- Se chegou até aqui, sucesso
        resultado := TRUE;
        
    EXCEPTION WHEN OTHERS THEN
        -- Se deu erro, retornar false
        RAISE NOTICE 'Erro na exclusão: %', SQLERRM;
        resultado := FALSE;
    END;
    
    RETURN resultado;
END;
$$ LANGUAGE plpgsql;