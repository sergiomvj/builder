-- =====================================================
-- SCRIPT CONSOLIDADO: Todas as Migrações V5.0
-- DESCRIÇÃO: Executa todos os schemas de supervisão e comunicações
-- VERSÃO: 1.0 (Web - Para Supabase SQL Editor)
-- DATA: 07/12/2025
-- =====================================================

-- ⚠️ ATENÇÃO: Este script DROP e recria as tabelas
-- Execute apenas se estiver OK em perder dados existentes

-- =====================================================
-- 1. COMUNICAÇÕES INTER-PERSONAS
-- =====================================================

-- Cria ENUM para tipos de comunicação
DROP TYPE IF EXISTS communication_type CASCADE;
CREATE TYPE communication_type AS ENUM (
  'handoff',           -- Transferência de trabalho/informação
  'notification',      -- Notificação simples (FYI)
  'approval_request',  -- Solicitação de aprovação
  'question'          -- Pergunta que requer resposta
);

-- Cria ENUM para níveis de prioridade
DROP TYPE IF EXISTS communication_priority CASCADE;
CREATE TYPE communication_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Cria ENUM para status de comunicação
DROP TYPE IF EXISTS communication_status CASCADE;
CREATE TYPE communication_status AS ENUM (
  'pending',      -- Aguardando leitura
  'read',         -- Lida, sem ação
  'acted_upon',   -- Ação tomada
  'archived'      -- Arquivada
);

-- Remove tabela antiga se existir (para recriar com novos ENUMs)
DROP TABLE IF EXISTS personas_communications CASCADE;

-- Cria tabela principal
CREATE TABLE personas_communications (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Remetente e Destinatário
  sender_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  receiver_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Tipo e Prioridade
  communication_type communication_type NOT NULL,
  priority communication_priority DEFAULT 'normal',
  
  -- Conteúdo
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  context_data JSONB,
  
  -- Workflow e Ações
  related_task_id UUID,
  requires_action BOOLEAN DEFAULT false,
  action_taken TEXT,
  action_taken_at TIMESTAMPTZ,
  
  -- Status e Timestamps
  status communication_status DEFAULT 'pending',
  read_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_personas CHECK (sender_persona_id != receiver_persona_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_communications_receiver ON personas_communications(receiver_persona_id);
CREATE INDEX IF NOT EXISTS idx_communications_sender ON personas_communications(sender_persona_id);
CREATE INDEX IF NOT EXISTS idx_communications_status ON personas_communications(status);
CREATE INDEX IF NOT EXISTS idx_communications_type ON personas_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_communications_priority ON personas_communications(priority);
CREATE INDEX IF NOT EXISTS idx_communications_deadline ON personas_communications(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_communications_pending ON personas_communications(receiver_persona_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_communications_receiver_status_priority ON personas_communications(receiver_persona_id, status, priority, created_at DESC);

-- Trigger
CREATE OR REPLACE FUNCTION update_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS communications_updated_at ON personas_communications;
CREATE TRIGGER communications_updated_at
  BEFORE UPDATE ON personas_communications
  FOR EACH ROW
  EXECUTE FUNCTION update_communications_updated_at();

-- Views
CREATE OR REPLACE VIEW v_communications_pending AS
SELECT 
  c.*,
  sp.full_name as sender_name,
  sp.role as sender_cargo,
  rp.full_name as receiver_name,
  rp.role as receiver_cargo,
  EXTRACT(EPOCH FROM (NOW() - c.created_at))/3600 AS hours_since_created,
  CASE 
    WHEN c.deadline IS NOT NULL THEN EXTRACT(EPOCH FROM (c.deadline - NOW()))/3600
    ELSE NULL
  END AS hours_until_deadline
FROM personas_communications c
JOIN personas sp ON c.sender_persona_id = sp.id
JOIN personas rp ON c.receiver_persona_id = rp.id
WHERE c.status = 'pending'
ORDER BY c.priority DESC, c.deadline ASC NULLS LAST, c.created_at ASC;

CREATE OR REPLACE VIEW v_communication_metrics AS
SELECT 
  p.id as persona_id,
  p.full_name,
  p.role,
  COUNT(*) FILTER (WHERE c.sender_persona_id = p.id) as messages_sent,
  COUNT(*) FILTER (WHERE c.receiver_persona_id = p.id) as messages_received,
  COUNT(*) FILTER (WHERE c.receiver_persona_id = p.id AND c.status = 'pending') as pending_messages,
  AVG(EXTRACT(EPOCH FROM (c.read_at - c.created_at))/3600) 
    FILTER (WHERE c.receiver_persona_id = p.id AND c.read_at IS NOT NULL) as avg_hours_to_read,
  AVG(EXTRACT(EPOCH FROM (c.action_taken_at - c.created_at))/3600) 
    FILTER (WHERE c.receiver_persona_id = p.id AND c.action_taken_at IS NOT NULL) as avg_hours_to_action
FROM personas p
LEFT JOIN personas_communications c ON p.id IN (c.sender_persona_id, c.receiver_persona_id)
GROUP BY p.id, p.full_name, p.role;

-- Função auxiliar
CREATE OR REPLACE FUNCTION create_communication(
  p_sender_persona_id UUID,
  p_receiver_persona_id UUID,
  p_type communication_type,
  p_subject VARCHAR,
  p_message TEXT,
  p_context_data JSONB DEFAULT NULL,
  p_priority communication_priority DEFAULT 'normal',
  p_requires_action BOOLEAN DEFAULT false,
  p_deadline TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_communication_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM personas WHERE id = p_sender_persona_id) THEN
    RAISE EXCEPTION 'Sender persona % does not exist', p_sender_persona_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM personas WHERE id = p_receiver_persona_id) THEN
    RAISE EXCEPTION 'Receiver persona % does not exist', p_receiver_persona_id;
  END IF;
  
  IF p_sender_persona_id = p_receiver_persona_id THEN
    RAISE EXCEPTION 'Sender and receiver must be different personas';
  END IF;
  
  INSERT INTO personas_communications (
    sender_persona_id, receiver_persona_id, communication_type,
    subject, message, context_data, priority, requires_action, deadline
  ) VALUES (
    p_sender_persona_id, p_receiver_persona_id, p_type,
    p_subject, p_message, p_context_data, p_priority, p_requires_action, p_deadline
  )
  RETURNING id INTO v_communication_id;
  
  RETURN v_communication_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. SUPERVISÃO HIERÁRQUICA
-- =====================================================

-- ENUMs
DROP TYPE IF EXISTS hierarchy_level CASCADE;
CREATE TYPE hierarchy_level AS ENUM ('execution', 'operational', 'tactical', 'strategic');

DROP TYPE IF EXISTS supervision_type CASCADE;
CREATE TYPE supervision_type AS ENUM ('approval', 'notification', 'escalation', 'audit');

DROP TYPE IF EXISTS trigger_criteria CASCADE;
CREATE TYPE trigger_criteria AS ENUM ('value_threshold', 'risk_level', 'always', 'never', 'custom');

DROP TYPE IF EXISTS supervision_decision CASCADE;
CREATE TYPE supervision_decision AS ENUM ('approved', 'approved_with_modifications', 'rejected', 'escalated', 'pending');

-- Remove tabelas antigas (ordem importante: logs antes de chains)
DROP TABLE IF EXISTS task_supervision_logs CASCADE;
DROP TABLE IF EXISTS task_supervision_chains CASCADE;

-- Tabela 1: chains
CREATE TABLE task_supervision_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_template_code VARCHAR(100) NOT NULL,
  functional_area VARCHAR(50),
  executor_role VARCHAR(100) NOT NULL,
  supervisor_role VARCHAR(100) NOT NULL,
  executor_level hierarchy_level NOT NULL,
  supervisor_level hierarchy_level NOT NULL,
  supervision_type supervision_type NOT NULL,
  trigger_criteria trigger_criteria NOT NULL,
  trigger_rules JSONB,
  value_threshold_min DECIMAL(15,2),
  value_threshold_max DECIMAL(15,2),
  response_time_hours INTEGER DEFAULT 24,
  escalation_enabled BOOLEAN DEFAULT true,
  escalation_to_role VARCHAR(100),
  escalation_to_level hierarchy_level,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_hierarchy CHECK (supervisor_level > executor_level),
  CONSTRAINT valid_threshold CHECK (value_threshold_max IS NULL OR value_threshold_max >= value_threshold_min)
);

CREATE INDEX IF NOT EXISTS idx_supervision_chains_template ON task_supervision_chains(task_template_code);
CREATE INDEX IF NOT EXISTS idx_supervision_chains_executor ON task_supervision_chains(executor_role);
CREATE INDEX IF NOT EXISTS idx_supervision_chains_supervisor ON task_supervision_chains(supervisor_role);
CREATE INDEX IF NOT EXISTS idx_supervision_chains_active ON task_supervision_chains(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_supervision_chains_area ON task_supervision_chains(functional_area);

-- Tabela 2: logs
CREATE TABLE task_supervision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_chain_id UUID REFERENCES task_supervision_chains(id),
  task_id VARCHAR(255) NOT NULL,
  communication_id UUID REFERENCES personas_communications(id),
  executor_persona_id UUID NOT NULL REFERENCES personas(id),
  supervisor_persona_id UUID NOT NULL REFERENCES personas(id),
  task_template_code VARCHAR(100) NOT NULL,
  task_title VARCHAR(255) NOT NULL,
  task_value DECIMAL(15,2),
  task_risk_level VARCHAR(20),
  task_context JSONB,
  supervision_type supervision_type NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  decision supervision_decision DEFAULT 'pending',
  decision_notes TEXT,
  modifications_requested JSONB,
  decided_at TIMESTAMPTZ,
  was_escalated BOOLEAN DEFAULT false,
  escalated_to_persona_id UUID REFERENCES personas(id),
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  response_time_hours DECIMAL(10,2),
  exceeded_sla BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supervision_logs_task ON task_supervision_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_supervision_logs_executor ON task_supervision_logs(executor_persona_id);
CREATE INDEX IF NOT EXISTS idx_supervision_logs_supervisor ON task_supervision_logs(supervisor_persona_id);
CREATE INDEX IF NOT EXISTS idx_supervision_logs_decision ON task_supervision_logs(decision);
CREATE INDEX IF NOT EXISTS idx_supervision_logs_pending ON task_supervision_logs(decision) WHERE decision = 'pending';
CREATE INDEX IF NOT EXISTS idx_supervision_logs_escalated ON task_supervision_logs(was_escalated) WHERE was_escalated = true;
CREATE INDEX IF NOT EXISTS idx_supervision_logs_sla ON task_supervision_logs(exceeded_sla) WHERE exceeded_sla = true;
CREATE INDEX IF NOT EXISTS idx_supervision_logs_requested_at ON task_supervision_logs(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_supervision_logs_pending_supervisor ON task_supervision_logs(supervisor_persona_id, decision, requested_at DESC) WHERE decision = 'pending';

-- Triggers
CREATE OR REPLACE FUNCTION update_supervision_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS supervision_chains_updated_at ON task_supervision_chains;
CREATE TRIGGER supervision_chains_updated_at BEFORE UPDATE ON task_supervision_chains FOR EACH ROW EXECUTE FUNCTION update_supervision_updated_at();

DROP TRIGGER IF EXISTS supervision_logs_updated_at ON task_supervision_logs;
CREATE TRIGGER supervision_logs_updated_at BEFORE UPDATE ON task_supervision_logs FOR EACH ROW EXECUTE FUNCTION update_supervision_updated_at();

CREATE OR REPLACE FUNCTION calculate_supervision_response_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.decided_at IS NOT NULL AND OLD.decided_at IS NULL THEN
    NEW.response_time_hours = EXTRACT(EPOCH FROM (NEW.decided_at - NEW.requested_at)) / 3600;
    IF NEW.deadline IS NOT NULL AND NEW.decided_at > NEW.deadline THEN
      NEW.exceeded_sla = TRUE;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS supervision_logs_response_time ON task_supervision_logs;
CREATE TRIGGER supervision_logs_response_time BEFORE UPDATE ON task_supervision_logs FOR EACH ROW EXECUTE FUNCTION calculate_supervision_response_time();

-- Views
CREATE OR REPLACE VIEW v_supervision_pending AS
SELECT 
  sl.*,
  ep.full_name as executor_name, ep.role as executor_cargo,
  sp.full_name as supervisor_name, sp.role as supervisor_cargo,
  EXTRACT(EPOCH FROM (NOW() - sl.requested_at))/3600 AS hours_waiting,
  CASE WHEN sl.deadline IS NOT NULL THEN EXTRACT(EPOCH FROM (sl.deadline - NOW()))/3600 ELSE NULL END AS hours_until_deadline,
  CASE WHEN sl.deadline IS NOT NULL AND NOW() > sl.deadline THEN TRUE ELSE FALSE END AS is_overdue
FROM task_supervision_logs sl
JOIN personas ep ON sl.executor_persona_id = ep.id
JOIN personas sp ON sl.supervisor_persona_id = sp.id
WHERE sl.decision = 'pending'
ORDER BY CASE WHEN sl.deadline IS NOT NULL AND NOW() > sl.deadline THEN 0 ELSE 1 END, sl.deadline ASC NULLS LAST, sl.requested_at ASC;

CREATE OR REPLACE VIEW v_supervision_metrics AS
SELECT 
  p.id as persona_id, p.full_name, p.role, p.nivel_hierarquico,
  COUNT(*) FILTER (WHERE sl.executor_persona_id = p.id) as tasks_submitted,
  COUNT(*) FILTER (WHERE sl.executor_persona_id = p.id AND sl.decision = 'approved') as tasks_approved,
  COUNT(*) FILTER (WHERE sl.executor_persona_id = p.id AND sl.decision = 'rejected') as tasks_rejected,
  COUNT(*) FILTER (WHERE sl.supervisor_persona_id = p.id) as supervisions_received,
  COUNT(*) FILTER (WHERE sl.supervisor_persona_id = p.id AND sl.decision = 'pending') as supervisions_pending,
  AVG(sl.response_time_hours) FILTER (WHERE sl.supervisor_persona_id = p.id AND sl.decided_at IS NOT NULL) as avg_response_hours,
  COUNT(*) FILTER (WHERE sl.supervisor_persona_id = p.id AND sl.exceeded_sla = true) as sla_violations,
  COUNT(*) FILTER (WHERE sl.executor_persona_id = p.id AND sl.was_escalated = true) as tasks_escalated_from_me,
  COUNT(*) FILTER (WHERE sl.escalated_to_persona_id = p.id) as escalations_received
FROM personas p
LEFT JOIN task_supervision_logs sl ON p.id IN (sl.executor_persona_id, sl.supervisor_persona_id, sl.escalated_to_persona_id)
GROUP BY p.id, p.full_name, p.role, p.nivel_hierarquico;

-- Funções auxiliares (continuação na próxima parte devido ao limite de caracteres)

-- =====================================================
-- 3. INTERVENÇÕES DE USUÁRIO
-- =====================================================

DROP TYPE IF EXISTS intervention_type CASCADE;
CREATE TYPE intervention_type AS ENUM ('create_task', 'modify_task', 'cancel_task', 'approve_supervision', 'reject_supervision', 'confirm_metric', 'adjust_parameter', 'escalate_manually', 'provide_feedback');

DROP TYPE IF EXISTS intervention_status CASCADE;
CREATE TYPE intervention_status AS ENUM ('received', 'validating', 'processing', 'completed', 'failed', 'cancelled');

DROP TABLE IF EXISTS user_interventions CASCADE;

CREATE TABLE user_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  intervention_type intervention_type NOT NULL,
  command_template VARCHAR(100),
  command_parameters JSONB NOT NULL,
  target_task_id VARCHAR(255),
  target_persona_id UUID REFERENCES personas(id),
  related_supervision_log_id UUID REFERENCES task_supervision_logs(id),
  is_valid BOOLEAN DEFAULT false,
  validation_errors JSONB,
  status intervention_status DEFAULT 'received',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  result_data JSONB,
  success_message TEXT,
  error_message TEXT,
  expected_metrics JSONB,
  metrics_confirmed BOOLEAN DEFAULT false,
  metrics_confirmed_at TIMESTAMPTZ,
  actual_metrics JSONB,
  n8n_workflow_id VARCHAR(255),
  n8n_execution_id VARCHAR(255),
  n8n_status VARCHAR(50),
  source VARCHAR(50) DEFAULT 'web_ui',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_command_params CHECK (jsonb_typeof(command_parameters) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_interventions_user ON user_interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_type ON user_interventions(intervention_type);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON user_interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_task ON user_interventions(target_task_id) WHERE target_task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_persona ON user_interventions(target_persona_id) WHERE target_persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_created ON user_interventions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_pending ON user_interventions(status) WHERE status IN ('received', 'validating', 'processing');
CREATE INDEX IF NOT EXISTS idx_interventions_user_status_created ON user_interventions(user_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION update_interventions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS interventions_updated_at ON user_interventions;
CREATE TRIGGER interventions_updated_at BEFORE UPDATE ON user_interventions FOR EACH ROW EXECUTE FUNCTION update_interventions_updated_at();

CREATE OR REPLACE VIEW v_interventions_recent AS
SELECT 
  ui.*,
  p.full_name as persona_name, p.role as persona_cargo,
  EXTRACT(EPOCH FROM (NOW() - ui.created_at))/3600 AS hours_since_created,
  CASE WHEN ui.processing_completed_at IS NOT NULL THEN EXTRACT(EPOCH FROM (ui.processing_completed_at - ui.created_at))/60 ELSE NULL END AS processing_minutes
FROM user_interventions ui
LEFT JOIN personas p ON ui.target_persona_id = p.id
ORDER BY ui.created_at DESC
LIMIT 100;

CREATE OR REPLACE VIEW v_intervention_metrics_by_user AS
SELECT 
  user_id, user_email,
  COUNT(*) as total_interventions,
  COUNT(*) FILTER (WHERE status = 'completed') as successful_interventions,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_interventions,
  COUNT(*) FILTER (WHERE status IN ('received', 'validating', 'processing')) as pending_interventions,
  AVG(EXTRACT(EPOCH FROM (processing_completed_at - created_at))/60) FILTER (WHERE processing_completed_at IS NOT NULL) as avg_processing_minutes,
  COUNT(*) FILTER (WHERE intervention_type = 'create_task') as tasks_created,
  COUNT(*) FILTER (WHERE intervention_type = 'confirm_metric') as metrics_confirmed
FROM user_interventions
GROUP BY user_id, user_email;

-- =====================================================
-- VALIDAÇÃO FINAL
-- =====================================================

SELECT '✅ Migrations V5.0 concluídas!' as status;

SELECT tablename, 'OK' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('personas_communications', 'task_supervision_chains', 'task_supervision_logs', 'user_interventions')
ORDER BY tablename;
