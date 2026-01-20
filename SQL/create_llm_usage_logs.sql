-- ============================================================================
-- TABELA: llm_usage_logs
-- ============================================================================
-- Armazena logs de uso e custos de LLMs
-- Usado pelo sistema de tracking de custos (llm_cost_tracker.js)

CREATE TABLE IF NOT EXISTS llm_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  script_name VARCHAR(100),
  
  -- Dados do LLM
  llm_name VARCHAR(100) NOT NULL,
  provider VARCHAR(50),
  
  -- Tokens
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  
  -- Custos (USD)
  input_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  output_cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) GENERATED ALWAYS AS (input_cost_usd + output_cost_usd) STORED,
  
  -- Performance
  duration_ms INTEGER,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_llm_usage_empresa ON llm_usage_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_script ON llm_usage_logs(script_name);
CREATE INDEX IF NOT EXISTS idx_llm_usage_llm ON llm_usage_logs(llm_name);
CREATE INDEX IF NOT EXISTS idx_llm_usage_timestamp ON llm_usage_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_llm_usage_cost ON llm_usage_logs(total_cost_usd DESC);

-- Índice composto para análise temporal
CREATE INDEX IF NOT EXISTS idx_llm_usage_date_empresa 
  ON llm_usage_logs(DATE(timestamp), empresa_id);

-- View: Custos agregados por empresa
CREATE OR REPLACE VIEW v_llm_costs_by_empresa AS
SELECT 
  empresa_id,
  e.nome AS empresa_nome,
  COUNT(*) AS total_calls,
  SUM(total_tokens) AS total_tokens,
  SUM(total_cost_usd) AS total_cost_usd,
  AVG(total_cost_usd) AS avg_cost_per_call,
  MIN(timestamp) AS first_usage,
  MAX(timestamp) AS last_usage
FROM llm_usage_logs l
LEFT JOIN empresas e ON l.empresa_id = e.id
WHERE empresa_id IS NOT NULL
GROUP BY empresa_id, e.nome
ORDER BY total_cost_usd DESC;

-- View: Custos agregados por LLM
CREATE OR REPLACE VIEW v_llm_costs_by_model AS
SELECT 
  llm_name,
  provider,
  COUNT(*) AS total_calls,
  SUM(total_tokens) AS total_tokens,
  SUM(total_cost_usd) AS total_cost_usd,
  AVG(total_cost_usd) AS avg_cost_per_call,
  AVG(duration_ms) AS avg_duration_ms,
  MIN(timestamp) AS first_usage,
  MAX(timestamp) AS last_usage
FROM llm_usage_logs
GROUP BY llm_name, provider
ORDER BY total_cost_usd DESC;

-- View: Custos diários
CREATE OR REPLACE VIEW v_llm_costs_daily AS
SELECT 
  DATE(timestamp) AS date,
  COUNT(*) AS total_calls,
  SUM(total_tokens) AS total_tokens,
  SUM(total_cost_usd) AS total_cost_usd,
  COUNT(DISTINCT empresa_id) AS unique_empresas,
  COUNT(DISTINCT llm_name) AS unique_llms
FROM llm_usage_logs
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- View: Top 10 chamadas mais caras
CREATE OR REPLACE VIEW v_llm_top_expensive_calls AS
SELECT 
  l.id,
  l.timestamp,
  l.empresa_id,
  e.nome AS empresa_nome,
  l.script_name,
  l.llm_name,
  l.total_tokens,
  l.total_cost_usd,
  l.duration_ms
FROM llm_usage_logs l
LEFT JOIN empresas e ON l.empresa_id = e.id
ORDER BY l.total_cost_usd DESC
LIMIT 10;

-- Comentários
COMMENT ON TABLE llm_usage_logs IS 'Logs de uso e custos de LLMs para tracking financeiro';
COMMENT ON COLUMN llm_usage_logs.input_tokens IS 'Tokens de entrada (prompt)';
COMMENT ON COLUMN llm_usage_logs.output_tokens IS 'Tokens de saída (resposta)';
COMMENT ON COLUMN llm_usage_logs.total_cost_usd IS 'Custo total em USD (calculado)';
COMMENT ON COLUMN llm_usage_logs.duration_ms IS 'Duração da chamada em milissegundos';

-- Grants (ajuste conforme necessário)
-- GRANT SELECT ON llm_usage_logs TO authenticated;
-- GRANT INSERT ON llm_usage_logs TO authenticated;
