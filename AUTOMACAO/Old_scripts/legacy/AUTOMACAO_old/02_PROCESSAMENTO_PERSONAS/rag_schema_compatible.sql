-- ===============================================
-- VCM RAG Database Schema - Compatível com banco existente
-- Sistema de Knowledge Base para Empresas Virtuais
-- ===============================================

-- Verificar se a extensão vector está disponível
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Extensão vector não disponível, usando TEXT para embeddings';
END
$$;

-- Adicionar coluna embedding nas tabelas existentes se não existir
DO $$
BEGIN
    -- Adicionar embedding na tabela rag_documents se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rag_documents' AND column_name = 'embedding'
    ) THEN
        -- Tentar usar VECTOR se disponível, senão usar TEXT
        BEGIN
            ALTER TABLE rag_documents ADD COLUMN embedding VECTOR(1536);
        EXCEPTION WHEN OTHERS THEN
            ALTER TABLE rag_documents ADD COLUMN embedding TEXT;
        END;
    END IF;

    -- Adicionar embedding na tabela rag_chunks se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rag_chunks' AND column_name = 'embedding'
    ) THEN
        BEGIN
            ALTER TABLE rag_chunks ADD COLUMN embedding VECTOR(1536);
        EXCEPTION WHEN OTHERS THEN
            ALTER TABLE rag_chunks ADD COLUMN embedding TEXT;
        END;
    END IF;

    -- Adicionar colunas de controle se não existirem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rag_documents' AND column_name = 'empresa_id'
    ) THEN
        ALTER TABLE rag_documents ADD COLUMN empresa_id UUID;
        
        -- Criar índice para empresa_id
        CREATE INDEX IF NOT EXISTS idx_rag_documents_empresa ON rag_documents(empresa_id);
    END IF;

    -- Adicionar source_type para melhor organização
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rag_documents' AND column_name = 'source_type'
    ) THEN
        ALTER TABLE rag_documents ADD COLUMN source_type VARCHAR(50) DEFAULT 'manual';
    END IF;

    -- Adicionar persona_id para link direto
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rag_documents' AND column_name = 'persona_id'
    ) THEN
        ALTER TABLE rag_documents ADD COLUMN persona_id UUID;
        CREATE INDEX IF NOT EXISTS idx_rag_documents_persona ON rag_documents(persona_id);
    END IF;

END
$$;

-- Criar tabela de configuração RAG se não existir
CREATE TABLE IF NOT EXISTS rag_config_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL UNIQUE,
    chunk_size INTEGER DEFAULT 1000,
    chunk_overlap INTEGER DEFAULT 200,
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    similarity_threshold DECIMAL(3,2) DEFAULT 0.7,
    max_results INTEGER DEFAULT 5,
    auto_sync BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de ingestão de dados
CREATE TABLE IF NOT EXISTS rag_ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    job_type VARCHAR(50) NOT NULL, -- 'biografias', 'competencias', 'workflows', 'full_sync'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    total_items INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    success_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,
    error_details JSONB DEFAULT '[]',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rag_ingestion_empresa ON rag_ingestion_jobs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rag_ingestion_status ON rag_ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_rag_ingestion_type ON rag_ingestion_jobs(job_type);

-- Função para limpar dados RAG de uma empresa
CREATE OR REPLACE FUNCTION clean_empresa_rag_data(target_empresa_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER := 0;
    doc_ids UUID[];
BEGIN
    -- Buscar IDs dos documentos da empresa
    SELECT ARRAY_AGG(rd.id) INTO doc_ids
    FROM rag_documents rd
    WHERE rd.empresa_id = target_empresa_id;
    
    -- Deletar chunks primeiro (foreign key)
    IF doc_ids IS NOT NULL THEN
        DELETE FROM rag_chunks WHERE document_id = ANY(doc_ids);
    END IF;
    
    -- Deletar documentos
    DELETE FROM rag_documents WHERE empresa_id = target_empresa_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;

-- Função para buscar documentos similares (funciona com ou sem vector extension)
CREATE OR REPLACE FUNCTION search_similar_documents(
    target_empresa_id UUID,
    search_query TEXT,
    doc_type VARCHAR(50) DEFAULT NULL,
    max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content_raw TEXT,
    document_type TEXT,
    similarity_score DECIMAL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Busca simples baseada em texto se não tiver embeddings
    RETURN QUERY
    SELECT 
        rd.id,
        rd.title,
        rd.content_raw,
        rd.document_type,
        CASE 
            WHEN rd.title ILIKE '%' || search_query || '%' THEN 0.9
            WHEN rd.content_raw ILIKE '%' || search_query || '%' THEN 0.7
            ELSE 0.5
        END::DECIMAL as similarity_score,
        rd.metadata,
        rd.created_at
    FROM rag_documents rd
    WHERE rd.empresa_id = target_empresa_id
    AND (doc_type IS NULL OR rd.document_type = doc_type)
    AND (
        rd.title ILIKE '%' || search_query || '%' OR 
        rd.content_raw ILIKE '%' || search_query || '%'
    )
    ORDER BY similarity_score DESC
    LIMIT max_results;
END;
$$;

-- View para estatísticas RAG por empresa
CREATE OR REPLACE VIEW rag_empresa_stats AS
SELECT 
    e.id as empresa_id,
    e.nome as empresa_nome,
    COUNT(rd.id) as total_documentos,
    COUNT(CASE WHEN rd.document_type = 'biografia' THEN 1 END) as biografias,
    COUNT(CASE WHEN rd.document_type = 'competencia' THEN 1 END) as competencias,
    COUNT(CASE WHEN rd.document_type = 'workflow' THEN 1 END) as workflows,
    COUNT(CASE WHEN rd.document_type = 'knowledge' THEN 1 END) as knowledge_base,
    SUM(COALESCE(rd.content_length, LENGTH(rd.content_raw))) as total_content_length,
    MAX(rd.updated_at) as last_updated,
    COUNT(rc.id) as total_chunks
FROM empresas e
LEFT JOIN rag_documents rd ON e.id = rd.empresa_id
LEFT JOIN rag_chunks rc ON rd.id = rc.document_id
GROUP BY e.id, e.nome;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela de config se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_rag_config_empresa_modtime'
    ) THEN
        CREATE TRIGGER update_rag_config_empresa_modtime
            BEFORE UPDATE ON rag_config_empresa
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Inserir configuração padrão para empresas existentes
INSERT INTO rag_config_empresa (empresa_id, settings)
SELECT e.id, '{
    "auto_generate_embeddings": true,
    "include_biografias": true,
    "include_competencias": true,
    "include_workflows": true,
    "chunk_strategy": "semantic"
}'::jsonb
FROM empresas e
WHERE NOT EXISTS (
    SELECT 1 FROM rag_config_empresa rce WHERE rce.empresa_id = e.id
);

-- Comentários
COMMENT ON TABLE rag_config_empresa IS 'Configurações RAG específicas por empresa';
COMMENT ON TABLE rag_ingestion_jobs IS 'Jobs de ingestão de dados para RAG';
COMMENT ON FUNCTION clean_empresa_rag_data IS 'Remove todos os dados RAG de uma empresa';
COMMENT ON FUNCTION search_similar_documents IS 'Busca documentos similares (compatível com/sem vector)';
COMMENT ON VIEW rag_empresa_stats IS 'Estatísticas RAG por empresa';