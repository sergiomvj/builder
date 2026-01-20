-- Tabela para armazenar chunks de conhecimento com embeddings vetoriais
-- Suporta RAG (Retrieval-Augmented Generation) para personas

-- Habilitar extensão pgvector se ainda não estiver ativa
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar tabela knowledge_chunks
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  topic TEXT NOT NULL, -- Tópico principal (ex: "CRM Management", "Sales Training")
  content TEXT NOT NULL, -- Texto do chunk (300-500 tokens ideal)
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small gera 1536 dimensões
  source TEXT NOT NULL, -- Nome do arquivo original ou URL
  chunk_index INTEGER NOT NULL, -- Ordem do chunk no documento original (0, 1, 2...)
  metadata JSONB DEFAULT '{}', -- Dados extras: {file_type, page, section, author, date}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimizar queries
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_persona_id ON knowledge_chunks(persona_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_topic ON knowledge_chunks(topic);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_source ON knowledge_chunks(source);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_created_at ON knowledge_chunks(created_at DESC);

-- Índice HNSW para busca vetorial rápida (cosine similarity)
-- HNSW (Hierarchical Navigable Small World) é mais rápido que IVFFlat para a maioria dos casos
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding ON knowledge_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Comentários para documentação
COMMENT ON TABLE knowledge_chunks IS 'Armazena chunks de texto com embeddings vetoriais para RAG (Retrieval-Augmented Generation)';
COMMENT ON COLUMN knowledge_chunks.embedding IS 'Vetor 1536-dimensional gerado por OpenAI text-embedding-3-small';
COMMENT ON COLUMN knowledge_chunks.chunk_index IS 'Ordem sequencial do chunk no documento original (0-based)';
COMMENT ON COLUMN knowledge_chunks.metadata IS 'JSON com dados extras: file_type, page, section, author, tags, etc.';

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_knowledge_chunks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_knowledge_chunks_updated_at ON knowledge_chunks;
CREATE TRIGGER trigger_update_knowledge_chunks_updated_at
BEFORE UPDATE ON knowledge_chunks
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_chunks_updated_at();

-- View para estatísticas de conhecimento por persona
CREATE OR REPLACE VIEW knowledge_stats_by_persona AS
SELECT 
  p.id AS persona_id,
  p.role AS persona_role,
  pb.biografia_estruturada->>'nome_completo' AS persona_nome,
  COUNT(kc.id) AS total_chunks,
  COUNT(DISTINCT kc.source) AS total_sources,
  COUNT(DISTINCT kc.topic) AS total_topics,
  MIN(kc.created_at) AS first_upload,
  MAX(kc.created_at) AS last_upload
FROM personas p
LEFT JOIN personas_biografias pb ON pb.persona_id = p.id
LEFT JOIN knowledge_chunks kc ON kc.persona_id = p.id
GROUP BY p.id, p.role, pb.biografia_estruturada->>'nome_completo';

COMMENT ON VIEW knowledge_stats_by_persona IS 'Estatísticas agregadas de conhecimento por persona';
