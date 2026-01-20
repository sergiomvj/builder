-- ===============================================
-- VCM RAG Database Schema
-- Sistema de Knowledge Base para Empresas Virtuais
-- ===============================================

-- Extensão para vetores (se disponível no Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela principal de documentos/conhecimento
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'biografia', 'competencia', 'workflow', 'policy'
    source_id UUID, -- ID da fonte original (persona_id, workflow_id, etc)
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536), -- Embedding do OpenAI ada-002
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices
    CONSTRAINT fk_rag_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Índice para busca vetorial
CREATE INDEX IF NOT EXISTS idx_rag_embedding ON rag_documents 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Índices adicionais
CREATE INDEX IF NOT EXISTS idx_rag_empresa ON rag_documents(empresa_id);
CREATE INDEX IF NOT EXISTS idx_rag_type ON rag_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_rag_source ON rag_documents(source_id);
CREATE INDEX IF NOT EXISTS idx_rag_created ON rag_documents(created_at);

-- Tabela de chunks (fragmentos de documentos)
CREATE TABLE IF NOT EXISTS rag_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_chunk_document FOREIGN KEY (document_id) REFERENCES rag_documents(id) ON DELETE CASCADE
);

-- Índice para chunks
CREATE INDEX IF NOT EXISTS idx_chunks_document ON rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON rag_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Tabela de consultas/queries para analytics
CREATE TABLE IF NOT EXISTS rag_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL,
    query_text TEXT NOT NULL,
    query_embedding VECTOR(1536),
    results JSONB DEFAULT '[]',
    response_time_ms INTEGER,
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_query_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Índice para queries
CREATE INDEX IF NOT EXISTS idx_queries_empresa ON rag_queries(empresa_id);
CREATE INDEX IF NOT EXISTS idx_queries_created ON rag_queries(created_at);

-- Tabela de configurações RAG por empresa
CREATE TABLE IF NOT EXISTS rag_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID NOT NULL UNIQUE,
    chunk_size INTEGER DEFAULT 1000,
    chunk_overlap INTEGER DEFAULT 200,
    embedding_model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
    similarity_threshold DECIMAL(3,2) DEFAULT 0.7,
    max_results INTEGER DEFAULT 5,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_rag_config_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Função para busca semântica
CREATE OR REPLACE FUNCTION search_rag_documents(
    target_empresa_id UUID,
    query_embedding VECTOR(1536),
    similarity_threshold DECIMAL DEFAULT 0.7,
    max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    content TEXT,
    document_type VARCHAR(50),
    similarity DECIMAL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        d.id,
        d.title,
        d.content,
        d.document_type,
        (1 - (d.embedding <=> query_embedding))::DECIMAL as similarity,
        d.metadata,
        d.created_at
    FROM rag_documents d
    WHERE d.empresa_id = target_empresa_id
    AND (1 - (d.embedding <=> query_embedding)) > similarity_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT max_results;
$$;

-- Função para busca em chunks
CREATE OR REPLACE FUNCTION search_rag_chunks(
    target_empresa_id UUID,
    query_embedding VECTOR(1536),
    similarity_threshold DECIMAL DEFAULT 0.7,
    max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    document_id UUID,
    document_title VARCHAR(255),
    content TEXT,
    similarity DECIMAL,
    metadata JSONB
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        c.id as chunk_id,
        c.document_id,
        d.title as document_title,
        c.content,
        (1 - (c.embedding <=> query_embedding))::DECIMAL as similarity,
        c.metadata
    FROM rag_chunks c
    JOIN rag_documents d ON c.document_id = d.id
    WHERE d.empresa_id = target_empresa_id
    AND (1 - (c.embedding <=> query_embedding)) > similarity_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT max_results;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_rag_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_rag_documents_updated_at
    BEFORE UPDATE ON rag_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_rag_updated_at();

CREATE TRIGGER trigger_rag_config_updated_at
    BEFORE UPDATE ON rag_config
    FOR EACH ROW
    EXECUTE FUNCTION update_rag_updated_at();

-- Views úteis
CREATE OR REPLACE VIEW rag_stats AS
SELECT 
    e.nome as empresa_nome,
    e.id as empresa_id,
    COUNT(d.id) as total_documents,
    COUNT(CASE WHEN d.document_type = 'biografia' THEN 1 END) as biografias,
    COUNT(CASE WHEN d.document_type = 'competencia' THEN 1 END) as competencias,
    COUNT(CASE WHEN d.document_type = 'workflow' THEN 1 END) as workflows,
    COUNT(CASE WHEN d.document_type = 'policy' THEN 1 END) as policies,
    AVG(LENGTH(d.content)) as avg_content_length,
    MAX(d.updated_at) as last_updated
FROM empresas e
LEFT JOIN rag_documents d ON e.id = d.empresa_id
GROUP BY e.id, e.nome;

-- Comentários das tabelas
COMMENT ON TABLE rag_documents IS 'Documentos principais do sistema RAG';
COMMENT ON TABLE rag_chunks IS 'Fragmentos de documentos para busca granular';
COMMENT ON TABLE rag_queries IS 'Log de consultas para analytics';
COMMENT ON TABLE rag_config IS 'Configurações RAG por empresa';

COMMENT ON COLUMN rag_documents.embedding IS 'Vetor embedding do documento completo';
COMMENT ON COLUMN rag_chunks.embedding IS 'Vetor embedding do fragmento';
COMMENT ON COLUMN rag_documents.metadata IS 'Metadados adicionais (tags, categorias, etc)';

-- Índices GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS idx_rag_metadata_gin ON rag_documents USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_rag_queries_results_gin ON rag_queries USING gin(results);

-- Grants (ajustar conforme necessário)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON rag_documents TO service_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON rag_chunks TO service_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON rag_queries TO service_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON rag_config TO service_role;