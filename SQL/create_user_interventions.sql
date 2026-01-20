-- =====================================================
-- TABELA: user_interventions
-- DESCRIÇÃO: Sistema de comandos estruturados usuário → sistema
-- VERSÃO: 1.0
-- DATA: 07/12/2025
-- =====================================================

-- Cria ENUM para tipos de intervenção
DROP TYPE IF EXISTS intervention_type CASCADE;
CREATE TYPE intervention_type AS ENUM (
  'create_task',          -- Criar nova tarefa via template
  'modify_task',          -- Modificar tarefa existente
  'cancel_task',          -- Cancelar tarefa
  'approve_supervision',  -- Aprovar supervisão manualmente
  'reject_supervision',   -- Rejeitar supervisão manualmente
  'confirm_metric',       -- Confirmar métrica do mundo real
  'adjust_parameter',     -- Ajustar parâmetro de tarefa em execução
  'escalate_manually',    -- Escalar manualmente para outro nível
  'provide_feedback'      -- Fornecer feedback sobre resultado
);

-- Cria ENUM para status de intervenção
DROP TYPE IF EXISTS intervention_status CASCADE;
CREATE TYPE intervention_status AS ENUM (
  'received',      -- Recebida, aguardando processamento
  'validating',    -- Validando parâmetros
  'processing',    -- Processando comando
  'completed',     -- Concluída com sucesso
  'failed',        -- Falhou (ver error_message)
  'cancelled'      -- Cancelada pelo usuário
);

-- Remove tabela antiga se existir (para recriar com novos ENUMs)
DROP TABLE IF EXISTS user_interventions CASCADE;

-- =====================================================
-- TABELA PRINCIPAL: user_interventions
-- =====================================================
CREATE TABLE user_interventions (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário (assumindo que existe uma tabela de usuários)
  user_id VARCHAR(255), -- ID do usuário que fez a intervenção
  user_email VARCHAR(255), -- Email do usuário
  
  -- Tipo de Intervenção
  intervention_type intervention_type NOT NULL,
  
  -- Comando Estruturado
  command_template VARCHAR(100), -- Ex: 'gerar_leads', 'fechar_venda'
  command_parameters JSONB NOT NULL, -- Parâmetros do comando em JSON
  
  -- Contexto
  target_task_id VARCHAR(255), -- ID da tarefa alvo (se aplicável)
  target_persona_id UUID REFERENCES personas(id), -- Persona destinatária
  related_supervision_log_id UUID REFERENCES task_supervision_logs(id), -- Log de supervisão relacionado
  
  -- Validação
  is_valid BOOLEAN DEFAULT false,
  validation_errors JSONB, -- Erros de validação (se houver)
  
  -- Execução
  status intervention_status DEFAULT 'received',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  
  -- Resultado
  result_data JSONB, -- Resultado da execução (ex: task_id criado, valores finais)
  success_message TEXT,
  error_message TEXT,
  
  -- Métricas Esperadas (para create_task)
  expected_metrics JSONB, -- Métricas tangíveis esperadas
  metrics_confirmed BOOLEAN DEFAULT false,
  metrics_confirmed_at TIMESTAMPTZ,
  actual_metrics JSONB, -- Métricas reais coletadas
  
  -- Workflow e N8N
  n8n_workflow_id VARCHAR(255), -- ID do workflow N8N iniciado
  n8n_execution_id VARCHAR(255), -- ID da execução N8N
  n8n_status VARCHAR(50), -- Status retornado pelo N8N
  
  -- Metadados
  source VARCHAR(50) DEFAULT 'web_ui', -- Origem (web_ui, api, mobile)
  ip_address INET, -- IP do usuário
  user_agent TEXT, -- User agent do navegador
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_command_params CHECK (jsonb_typeof(command_parameters) = 'object')
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_interventions_user ON user_interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_type ON user_interventions(intervention_type);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON user_interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_task ON user_interventions(target_task_id) WHERE target_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_persona ON user_interventions(target_persona_id) WHERE target_persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_created ON user_interventions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_pending ON user_interventions(status) WHERE status IN ('received', 'validating', 'processing');

-- Índice composto para queries do usuário
CREATE INDEX IF NOT EXISTS idx_interventions_user_status_created 
  ON user_interventions(user_id, status, created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_interventions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interventions_updated_at
  BEFORE UPDATE ON user_interventions
  FOR EACH ROW
  EXECUTE FUNCTION update_interventions_updated_at();

-- View para intervenções recentes com detalhes
CREATE OR REPLACE VIEW v_interventions_recent AS
SELECT 
  ui.*,
  p.full_name as persona_name,
  p.role as persona_cargo,
  EXTRACT(EPOCH FROM (NOW() - ui.created_at))/3600 AS hours_since_created,
  CASE 
    WHEN ui.processing_completed_at IS NOT NULL THEN 
      EXTRACT(EPOCH FROM (ui.processing_completed_at - ui.created_at))/60
    ELSE NULL
  END AS processing_minutes
FROM user_interventions ui
LEFT JOIN personas p ON ui.target_persona_id = p.id
ORDER BY ui.created_at DESC
LIMIT 100;

-- View para métricas de intervenções por usuário
CREATE OR REPLACE VIEW v_intervention_metrics_by_user AS
SELECT 
  user_id,
  user_email,
  COUNT(*) as total_interventions,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_interventions,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_interventions,
  COUNT(*) FILTER (WHERE status IN ('received', 'validating', 'processing')) as pending_interventions,
  AVG(EXTRACT(EPOCH FROM (processing_completed_at - created_at))/60) 
    FILTER (WHERE processing_completed_at IS NOT NULL) as avg_processing_minutes,
  COUNT(*) FILTER (WHERE intervention_type = 'create_task') as tasks_created,
  COUNT(*) FILTER (WHERE intervention_type = 'confirm_metric') as metrics_confirmed
FROM user_interventions
GROUP BY user_id, user_email;

-- Função auxiliar para criar intervenção com validação
CREATE OR REPLACE FUNCTION create_user_intervention(
  p_user_id VARCHAR,
  p_user_email VARCHAR,
  p_intervention_type intervention_type,
  p_command_template VARCHAR,
  p_command_parameters JSONB,
  p_target_persona_id UUID DEFAULT NULL,
  p_expected_metrics JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_intervention_id UUID;
  v_is_valid BOOLEAN := true;
  v_validation_errors JSONB := '[]'::jsonb;
  v_persona_exists BOOLEAN;
BEGIN
  -- Valida que persona existe (se fornecida)
  IF p_target_persona_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM personas WHERE id = p_target_persona_id) INTO v_persona_exists;
    IF NOT v_persona_exists THEN
      v_is_valid := false;
      v_validation_errors := v_validation_errors || jsonb_build_object('field', 'target_persona_id', 'error', 'Persona not found');
    END IF;
  END IF;
  
  -- Valida que command_parameters não está vazio
  IF jsonb_typeof(p_command_parameters) != 'object' OR p_command_parameters = '{}'::jsonb THEN
    v_is_valid := false;
    v_validation_errors := v_validation_errors || jsonb_build_object('field', 'command_parameters', 'error', 'Parameters cannot be empty');
  END IF;
  
  -- Cria intervenção
  INSERT INTO user_interventions (
    user_id,
    user_email,
    intervention_type,
    command_template,
    command_parameters,
    target_persona_id,
    expected_metrics,
    is_valid,
    validation_errors,
    status
  ) VALUES (
    p_user_id,
    p_user_email,
    p_intervention_type,
    p_command_template,
    p_command_parameters,
    p_target_persona_id,
    p_expected_metrics,
    v_is_valid,
    CASE WHEN v_is_valid THEN NULL ELSE v_validation_errors END,
    CASE WHEN v_is_valid THEN 'received' ELSE 'failed' END
  )
  RETURNING id INTO v_intervention_id;
  
  RETURN v_intervention_id;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar status da intervenção
CREATE OR REPLACE FUNCTION update_intervention_status(
  p_intervention_id UUID,
  p_new_status intervention_status,
  p_result_data JSONB DEFAULT NULL,
  p_success_message TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_n8n_workflow_id VARCHAR DEFAULT NULL,
  p_n8n_execution_id VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
BEGIN
  UPDATE user_interventions
  SET 
    status = p_new_status,
    result_data = COALESCE(p_result_data, result_data),
    success_message = COALESCE(p_success_message, success_message),
    error_message = COALESCE(p_error_message, error_message),
    n8n_workflow_id = COALESCE(p_n8n_workflow_id, n8n_workflow_id),
    n8n_execution_id = COALESCE(p_n8n_execution_id, n8n_execution_id),
    processing_started_at = CASE 
      WHEN p_new_status = 'processing' AND processing_started_at IS NULL THEN v_now 
      ELSE processing_started_at 
    END,
    processing_completed_at = CASE 
      WHEN p_new_status IN ('completed', 'failed', 'cancelled') THEN v_now 
      ELSE processing_completed_at 
    END
  WHERE id = p_intervention_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para confirmar métricas do mundo real
CREATE OR REPLACE FUNCTION confirm_intervention_metrics(
  p_intervention_id UUID,
  p_actual_metrics JSONB,
  p_user_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_interventions
  SET 
    actual_metrics = p_actual_metrics,
    metrics_confirmed = true,
    metrics_confirmed_at = NOW(),
    success_message = COALESCE(success_message, '') || ' | User confirmed metrics: ' || COALESCE(p_user_notes, 'No notes')
  WHERE id = p_intervention_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE user_interventions IS 'Registra todos os comandos estruturados do usuário para o sistema VCM';
COMMENT ON COLUMN user_interventions.command_parameters IS 'Parâmetros do comando em JSON, validados contra o template';
COMMENT ON COLUMN user_interventions.expected_metrics IS 'Métricas esperadas definidas no template (ex: {"leads_generated": {"target": 100}})';
COMMENT ON COLUMN user_interventions.actual_metrics IS 'Métricas reais coletadas após execução (ex: {"leads_generated": {"actual": 95}})';
COMMENT ON COLUMN user_interventions.validation_errors IS 'Array de erros de validação (ex: [{"field": "quantity", "error": "Must be > 0"}])';

-- Exemplo de uso:
-- SELECT create_user_intervention(
--   'user123',
--   'user@example.com',
--   'create_task',
--   'gerar_leads',
--   '{"quantity": 50, "timeframe_days": 15, "quality_filter": "high", "channels": ["linkedin", "google_ads"]}'::jsonb,
--   'uuid-marketing-analyst',
--   '{"leads_generated": {"target": 50, "measurement": "CRM_external"}}'::jsonb
-- );

-- Grants (ajustar conforme suas roles)
-- GRANT SELECT, INSERT, UPDATE ON user_interventions TO authenticated;
-- GRANT SELECT ON v_interventions_recent TO authenticated;
-- GRANT SELECT ON v_intervention_metrics_by_user TO authenticated;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
