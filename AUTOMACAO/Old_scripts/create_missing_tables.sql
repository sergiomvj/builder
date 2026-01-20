-- ============================================================================
-- SQL PARA CRIAR TABELAS FALTANTES - Scripts 08 e 09
-- ============================================================================
-- Execute este arquivo no Supabase SQL Editor
-- Data: 2 de Dezembro de 2025
-- ============================================================================

-- ============================================================================
-- TABELA 1: personas_ml_models (Script 08 - Machine Learning)
-- ============================================================================

CREATE TABLE IF NOT EXISTS personas_ml_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL DEFAULT 'behavior_prediction',
  training_data JSONB NOT NULL,
  model_parameters JSONB NOT NULL,
  performance_metrics JSONB NOT NULL,
  predictions JSONB,
  optimization_suggestions JSONB,
  last_trained_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(persona_id, model_type)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ml_models_persona ON personas_ml_models(persona_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_type ON personas_ml_models(model_type);
CREATE INDEX IF NOT EXISTS idx_ml_models_trained_at ON personas_ml_models(last_trained_at DESC);

-- Comentários
COMMENT ON TABLE personas_ml_models IS 'Modelos de Machine Learning para predição de comportamento das personas';
COMMENT ON COLUMN personas_ml_models.training_data IS 'Dados históricos usados no treinamento';
COMMENT ON COLUMN personas_ml_models.model_parameters IS 'Hiperparâmetros e configuração do modelo';
COMMENT ON COLUMN personas_ml_models.performance_metrics IS 'Métricas: accuracy, precision, recall, F1, MAE, RMSE';
COMMENT ON COLUMN personas_ml_models.predictions IS 'Predições específicas: task_completion_time, automation_impact, productivity_trend';
COMMENT ON COLUMN personas_ml_models.optimization_suggestions IS 'Sugestões de otimização baseadas em ML';

-- ============================================================================
-- TABELA 2: personas_audit_logs (Script 09 - Auditoria)
-- ============================================================================

CREATE TABLE IF NOT EXISTS personas_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL DEFAULT 'completeness_check',
  quality_score INT NOT NULL,
  phase_scores JSONB NOT NULL,
  missing_data JSONB,
  inconsistencies JSONB,
  warnings JSONB,
  recommendations JSONB,
  audit_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_persona ON personas_audit_logs(persona_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON personas_audit_logs(audit_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_score ON personas_audit_logs(quality_score);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON personas_audit_logs(audit_type);

-- Comentários
COMMENT ON TABLE personas_audit_logs IS 'Logs de auditoria de qualidade e completude das personas';
COMMENT ON COLUMN personas_audit_logs.quality_score IS 'Score geral de qualidade (0-100)';
COMMENT ON COLUMN personas_audit_logs.phase_scores IS 'Scores individuais das 8 fases (01-08)';
COMMENT ON COLUMN personas_audit_logs.missing_data IS 'Lista de dados faltantes identificados';
COMMENT ON COLUMN personas_audit_logs.inconsistencies IS 'Inconsistências detectadas entre fases';
COMMENT ON COLUMN personas_audit_logs.warnings IS 'Avisos de completude média ou baixa';
COMMENT ON COLUMN personas_audit_logs.recommendations IS 'Recomendações de correção com scripts sugeridos';

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Verificar se tabelas foram criadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('personas_ml_models', 'personas_audit_logs')
ORDER BY table_name;

-- ============================================================================
-- PERMISSÕES (Ajustar conforme necessário)
-- ============================================================================

-- Garantir que service_role pode inserir
ALTER TABLE personas_ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas_audit_logs ENABLE ROW LEVEL SECURITY;

-- Dropar policies existentes se houver conflito
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON personas_ml_models;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON personas_ml_models;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON personas_ml_models;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON personas_ml_models;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON personas_audit_logs;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON personas_audit_logs;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON personas_audit_logs;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON personas_audit_logs;

-- Criar policies novas
CREATE POLICY "Enable insert for authenticated users" ON personas_ml_models
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON personas_ml_models
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable update for authenticated users" ON personas_ml_models
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users" ON personas_ml_models
  FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON personas_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON personas_audit_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable update for authenticated users" ON personas_audit_logs
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users" ON personas_audit_logs
  FOR DELETE TO authenticated
  USING (true);

-- ============================================================================
-- CONCLUÍDO
-- ============================================================================

SELECT 'Tabelas personas_ml_models e personas_audit_logs criadas com sucesso!' as message;
