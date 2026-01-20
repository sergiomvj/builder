-- Adicionar coluna estrutura_organizacional à tabela empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS estrutura_organizacional JSONB;

-- Comentário na coluna
COMMENT ON COLUMN empresas.estrutura_organizacional IS 'Estrutura organizacional completa gerada por LLM';