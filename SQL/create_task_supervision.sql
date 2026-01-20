-- =====================================================
-- TABELAS: task_supervision_chains & task_supervision_logs
-- DESCRIÇÃO: Sistema de supervisão hierárquica de tarefas
-- VERSÃO: 1.0
-- DATA: 07/12/2025
-- =====================================================

-- Cria ENUM para níveis hierárquicos
DROP TYPE IF EXISTS hierarchy_level CASCADE;
CREATE TYPE hierarchy_level AS ENUM (
  'execution',    -- Nível de execução (analistas, assistentes)
  'operational',  -- Nível operacional (coordenadores, managers)
  'tactical',     -- Nível tático (directors, VPs)
  'strategic'     -- Nível estratégico (C-level, CEO)
);

-- Cria ENUM para tipos de supervisão
DROP TYPE IF EXISTS supervision_type CASCADE;
CREATE TYPE supervision_type AS ENUM (
  'approval',           -- Aprovação obrigatória
  'notification',       -- Notificação (FYI)
  'escalation',         -- Escalação por timeout/problema
  'audit'              -- Auditoria pós-execução
);

-- Cria ENUM para critérios de trigger
DROP TYPE IF EXISTS trigger_criteria CASCADE;
CREATE TYPE trigger_criteria AS ENUM (
  'value_threshold',    -- Valor monetário acima de X
  'risk_level',         -- Nível de risco alto
  'always',            -- Sempre requer supervisão
  'never',             -- Nunca requer supervisão
  'custom'             -- Critério customizado (ver rules_json)
);

-- Cria ENUM para decisões de supervisão
DROP TYPE IF EXISTS supervision_decision CASCADE;
CREATE TYPE supervision_decision AS ENUM (
  'approved',                    -- Aprovado sem modificações
  'approved_with_modifications', -- Aprovado com ajustes
  'rejected',                    -- Rejeitado
  'escalated',                   -- Escalado para nível superior
  'pending'                      -- Aguardando decisão
);

-- Remove tabelas antigas se existirem (para recriar com novos ENUMs)
DROP TABLE IF EXISTS task_supervision_logs CASCADE;
DROP TABLE IF EXISTS task_supervision_chains CASCADE;

-- =====================================================
-- TABELA 1: task_supervision_chains
-- Define as regras de supervisão para cada tipo de tarefa
-- =====================================================
CREATE TABLE task_supervision_chains (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Definição da Tarefa
  task_template_code VARCHAR(100) NOT NULL, -- Ex: 'fechar_venda', 'processar_pedido'
  functional_area VARCHAR(50), -- Ex: 'Marketing', 'Vendas', 'Financeiro'
  
  -- Executor e Supervisor
  executor_role VARCHAR(100) NOT NULL, -- Ex: 'Analista de Vendas'
  supervisor_role VARCHAR(100) NOT NULL, -- Ex: 'Sales Manager'
  executor_level hierarchy_level NOT NULL,
  supervisor_level hierarchy_level NOT NULL,
  
  -- Regras de Supervisão
  supervision_type supervision_type NOT NULL,
  trigger_criteria trigger_criteria NOT NULL,
  trigger_rules JSONB, -- Regras detalhadas em JSON
  
  -- Thresholds
  value_threshold_min DECIMAL(15,2), -- Valor mínimo para trigger (ex: R$ 10.000)
  value_threshold_max DECIMAL(15,2), -- Valor máximo (acima = escala para próximo nível)
  
  -- SLA e Timeouts
  response_time_hours INTEGER DEFAULT 24, -- Tempo máximo para resposta
  escalation_enabled BOOLEAN DEFAULT true,
  escalation_to_role VARCHAR(100), -- Para quem escalar se timeout
  escalation_to_level hierarchy_level,
  
  -- Metadados
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1, -- Ordem de aplicação (1 = primeira)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_hierarchy CHECK (supervisor_level > executor_level),
  CONSTRAINT valid_threshold CHECK (value_threshold_max IS NULL OR value_threshold_max >= value_threshold_min)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_supervision_chains_template ON task_supervision_chains(task_template_code);
CREATE INDEX IF NOT EXISTS idx_supervision_chains_executor ON task_supervision_chains(executor_role);
CREATE INDEX IF NOT EXISTS idx_supervision_chains_supervisor ON task_supervision_chains(supervisor_role);
CREATE INDEX IF NOT EXISTS idx_supervision_chains_active ON task_supervision_chains(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_supervision_chains_area ON task_supervision_chains(functional_area);

-- =====================================================
-- TABELA 2: task_supervision_logs
-- Registra todas as supervisões executadas
-- =====================================================
CREATE TABLE task_supervision_logs (
  -- Identificação
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referências
  supervision_chain_id UUID REFERENCES task_supervision_chains(id),
  task_id VARCHAR(255) NOT NULL, -- ID da tarefa sendo supervisionada
  communication_id UUID REFERENCES personas_communications(id), -- Comunicação relacionada
  
  -- Personas Envolvidas
  executor_persona_id UUID NOT NULL REFERENCES personas(id),
  supervisor_persona_id UUID NOT NULL REFERENCES personas(id),
  
  -- Contexto da Tarefa
  task_template_code VARCHAR(100) NOT NULL,
  task_title VARCHAR(255) NOT NULL,
  task_value DECIMAL(15,2), -- Valor monetário (se aplicável)
  task_risk_level VARCHAR(20), -- Ex: 'low', 'medium', 'high'
  task_context JSONB, -- Contexto completo da tarefa
  
  -- Solicitação de Supervisão
  supervision_type supervision_type NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ, -- Prazo para resposta
  
  -- Decisão e Resposta
  decision supervision_decision DEFAULT 'pending',
  decision_notes TEXT, -- Justificativa da decisão
  modifications_requested JSONB, -- Modificações solicitadas (se houver)
  decided_at TIMESTAMPTZ,
  
  -- Escalação
  was_escalated BOOLEAN DEFAULT false,
  escalated_to_persona_id UUID REFERENCES personas(id),
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,
  
  -- Métricas de Tempo
  response_time_hours DECIMAL(10,2), -- Tempo real de resposta
  exceeded_sla BOOLEAN DEFAULT false,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_supervision_logs_task ON task_supervision_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_supervision_logs_executor ON task_supervision_logs(executor_persona_id);
CREATE INDEX IF NOT EXISTS idx_supervision_logs_supervisor ON task_supervision_logs(supervisor_persona_id);
CREATE INDEX IF NOT EXISTS idx_supervision_logs_decision ON task_supervision_logs(decision);
CREATE INDEX IF NOT EXISTS idx_supervision_logs_pending ON task_supervision_logs(decision) WHERE decision = 'pending';
CREATE INDEX IF NOT EXISTS idx_supervision_logs_escalated ON task_supervision_logs(was_escalated) WHERE was_escalated = true;
CREATE INDEX IF NOT EXISTS idx_supervision_logs_sla ON task_supervision_logs(exceeded_sla) WHERE exceeded_sla = true;
CREATE INDEX IF NOT EXISTS idx_supervision_logs_requested_at ON task_supervision_logs(requested_at DESC);

-- Índice composto para queries de supervisão pendente
CREATE INDEX IF NOT EXISTS idx_supervision_logs_pending_supervisor 
  ON task_supervision_logs(supervisor_persona_id, decision, requested_at DESC) 
  WHERE decision = 'pending';

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_supervision_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supervision_chains_updated_at
  BEFORE UPDATE ON task_supervision_chains
  FOR EACH ROW
  EXECUTE FUNCTION update_supervision_updated_at();

CREATE TRIGGER supervision_logs_updated_at
  BEFORE UPDATE ON task_supervision_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_supervision_updated_at();

-- Trigger para calcular response_time_hours automaticamente
CREATE OR REPLACE FUNCTION calculate_supervision_response_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.decided_at IS NOT NULL AND OLD.decided_at IS NULL THEN
    NEW.response_time_hours = EXTRACT(EPOCH FROM (NEW.decided_at - NEW.requested_at)) / 3600;
    
    -- Verifica se excedeu SLA
    IF NEW.deadline IS NOT NULL AND NEW.decided_at > NEW.deadline THEN
      NEW.exceeded_sla = TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supervision_logs_response_time
  BEFORE UPDATE ON task_supervision_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_supervision_response_time();

-- View para supervisões pendentes com informações completas
CREATE OR REPLACE VIEW v_supervision_pending AS
SELECT 
  sl.*,
  ep.full_name as executor_name,
  ep.role as executor_cargo,
  sp.full_name as supervisor_name,
  sp.role as supervisor_cargo,
  EXTRACT(EPOCH FROM (NOW() - sl.requested_at))/3600 AS hours_waiting,
  CASE 
    WHEN sl.deadline IS NOT NULL THEN EXTRACT(EPOCH FROM (sl.deadline - NOW()))/3600
    ELSE NULL
  END AS hours_until_deadline,
  CASE 
    WHEN sl.deadline IS NOT NULL AND NOW() > sl.deadline THEN TRUE
    ELSE FALSE
  END AS is_overdue
FROM task_supervision_logs sl
JOIN personas ep ON sl.executor_persona_id = ep.id
JOIN personas sp ON sl.supervisor_persona_id = sp.id
WHERE sl.decision = 'pending'
ORDER BY 
  CASE WHEN sl.deadline IS NOT NULL AND NOW() > sl.deadline THEN 0 ELSE 1 END,
  sl.deadline ASC NULLS LAST,
  sl.requested_at ASC;

-- View para métricas de supervisão por persona
CREATE OR REPLACE VIEW v_supervision_metrics AS
SELECT 
  p.id as persona_id,
  p.full_name,
  p.role,
  p.nivel_hierarquico,
  
  -- Como Executor
  COUNT(*) FILTER (WHERE sl.executor_persona_id = p.id) as tasks_submitted,
  COUNT(*) FILTER (WHERE sl.executor_persona_id = p.id AND sl.decision = 'approved') as tasks_approved,
  COUNT(*) FILTER (WHERE sl.executor_persona_id = p.id AND sl.decision = 'rejected') as tasks_rejected,
  
  -- Como Supervisor
  COUNT(*) FILTER (WHERE sl.supervisor_persona_id = p.id) as supervisions_received,
  COUNT(*) FILTER (WHERE sl.supervisor_persona_id = p.id AND sl.decision = 'pending') as supervisions_pending,
  AVG(sl.response_time_hours) FILTER (WHERE sl.supervisor_persona_id = p.id AND sl.decided_at IS NOT NULL) as avg_response_hours,
  COUNT(*) FILTER (WHERE sl.supervisor_persona_id = p.id AND sl.exceeded_sla = true) as sla_violations,
  
  -- Escalações
  COUNT(*) FILTER (WHERE sl.executor_persona_id = p.id AND sl.was_escalated = true) as tasks_escalated_from_me,
  COUNT(*) FILTER (WHERE sl.escalated_to_persona_id = p.id) as escalations_received
  
FROM personas p
LEFT JOIN task_supervision_logs sl ON p.id IN (sl.executor_persona_id, sl.supervisor_persona_id, sl.escalated_to_persona_id)
GROUP BY p.id, p.full_name, p.role, p.nivel_hierarquico;

-- Função auxiliar para criar log de supervisão
CREATE OR REPLACE FUNCTION create_supervision_log(
  p_task_id VARCHAR,
  p_task_template_code VARCHAR,
  p_task_title VARCHAR,
  p_executor_persona_id UUID,
  p_supervisor_persona_id UUID,
  p_task_value DECIMAL DEFAULT NULL,
  p_task_context JSONB DEFAULT NULL,
  p_response_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_deadline TIMESTAMPTZ;
BEGIN
  -- Calcula deadline
  v_deadline := NOW() + (p_response_hours || ' hours')::INTERVAL;
  
  -- Cria log
  INSERT INTO task_supervision_logs (
    task_id,
    task_template_code,
    task_title,
    executor_persona_id,
    supervisor_persona_id,
    task_value,
    task_context,
    supervision_type,
    deadline
  ) VALUES (
    p_task_id,
    p_task_template_code,
    p_task_title,
    p_executor_persona_id,
    p_supervisor_persona_id,
    p_task_value,
    p_task_context,
    'approval',
    v_deadline
  )
  RETURNING id INTO v_log_id;
  
  -- Cria comunicação automaticamente
  PERFORM create_communication(
    p_executor_persona_id,
    p_supervisor_persona_id,
    'approval_request',
    'Aprovação necessária: ' || p_task_title,
    'Solicitação de aprovação para tarefa: ' || p_task_title,
    jsonb_build_object('supervision_log_id', v_log_id, 'task_id', p_task_id),
    'high',
    true,
    v_deadline
  );
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Função para processar escalação automática (executar via cron/scheduler)
CREATE OR REPLACE FUNCTION process_supervision_escalations()
RETURNS TABLE (escalated_log_id UUID, escalated_to VARCHAR) AS $$
DECLARE
  v_log RECORD;
  v_escalation_target UUID;
  v_escalation_role VARCHAR;
BEGIN
  -- Busca supervisões pendentes que excederam deadline
  FOR v_log IN 
    SELECT sl.*, sc.escalation_to_role, sc.escalation_to_level
    FROM task_supervision_logs sl
    JOIN task_supervision_chains sc ON sl.supervision_chain_id = sc.id
    WHERE sl.decision = 'pending'
      AND sl.deadline < NOW()
      AND sl.was_escalated = false
      AND sc.escalation_enabled = true
  LOOP
    -- Busca persona do nível de escalação
    SELECT id, role INTO v_escalation_target, v_escalation_role
    FROM personas
    WHERE role = v_log.escalation_to_role
    LIMIT 1;
    
    IF v_escalation_target IS NOT NULL THEN
      -- Atualiza log com escalação
      UPDATE task_supervision_logs
      SET 
        was_escalated = true,
        escalated_to_persona_id = v_escalation_target,
        escalated_at = NOW(),
        escalation_reason = 'Timeout: supervisor não respondeu em ' || v_log.response_time_hours || ' horas'
      WHERE id = v_log.id;
      
      -- Cria nova comunicação para o escalado
      PERFORM create_communication(
        v_log.executor_persona_id,
        v_escalation_target,
        'approval_request',
        'ESCALADO: ' || v_log.task_title,
        'Supervisão escalada devido a timeout. Original supervisor: ' || v_log.supervisor_persona_id,
        jsonb_build_object('supervision_log_id', v_log.id, 'original_supervisor', v_log.supervisor_persona_id),
        'urgent',
        true,
        NOW() + INTERVAL '12 hours'
      );
      
      RETURN QUERY SELECT v_log.id, v_escalation_role;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE task_supervision_chains IS 'Define regras de supervisão hierárquica para cada tipo de tarefa';
COMMENT ON TABLE task_supervision_logs IS 'Registra todas as supervisões executadas, decisões e métricas de tempo';
COMMENT ON COLUMN task_supervision_chains.trigger_rules IS 'Regras customizadas em JSON (ex: {"min_discount": 10, "max_discount": 25})';
COMMENT ON COLUMN task_supervision_logs.modifications_requested IS 'Modificações solicitadas pelo supervisor em JSON';

-- Exemplo de inserção de regra de supervisão:
-- INSERT INTO task_supervision_chains (
--   task_template_code, functional_area,
--   executor_role, supervisor_role,
--   executor_level, supervisor_level,
--   supervision_type, trigger_criteria,
--   value_threshold_min, value_threshold_max,
--   response_time_hours, escalation_to_role, escalation_to_level
-- ) VALUES (
--   'fechar_venda', 'Vendas',
--   'Analista de Vendas', 'Sales Manager',
--   'execution', 'operational',
--   'approval', 'value_threshold',
--   10000, 50000,
--   24, 'VP de Vendas', 'tactical'
-- );

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
