-- Função PostgreSQL para busca vetorial de conhecimento usando pgvector
-- Retorna chunks mais similares à query_embedding ordenados por cosine similarity

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_persona_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  persona_id UUID,
  topic TEXT,
  content TEXT,
  source TEXT,
  chunk_index INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.persona_id,
    kc.topic,
    kc.content,
    kc.source,
    kc.chunk_index,
    kc.metadata,
    kc.created_at,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE 
    (filter_persona_id IS NULL OR kc.persona_id = filter_persona_id)
    AND (1 - (kc.embedding <=> query_embedding)) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Comentários
COMMENT ON FUNCTION match_knowledge_chunks IS 'Busca vetorial de chunks usando cosine similarity. Retorna top-k chunks acima do threshold.';

-- Exemplo de uso:
-- SELECT * FROM match_knowledge_chunks(
--   query_embedding := (SELECT embedding FROM knowledge_chunks LIMIT 1),
--   match_threshold := 0.7,
--   match_count := 5,
--   filter_persona_id := '123e4567-e89b-12d3-a456-426614174000'
-- );
