-- =====================================================
-- TABELA: personas_communications
-- DESCRIÇÃO: Sistema de comunicações inter-personas
-- VERSÃO: 1.0
-- DATA: 07/12/2025
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
  context_data JSONB, -- Dados estruturados adicionais (ex: task_id, valores, documentos)
  
  -- Workflow e Ações
  related_task_id UUID, -- ID da tarefa relacionada (se houver)
  requires_action BOOLEAN DEFAULT false,
  action_taken TEXT, -- Descrição da ação tomada (se houver)
  action_taken_at TIMESTAMPTZ,
  
  -- Status e Timestamps
  status communication_status DEFAULT 'pending',
  read_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ, -- Prazo para resposta/ação
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT different_personas CHECK (sender_persona_id != receiver_persona_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_communications_receiver ON personas_communications(receiver_persona_id);
CREATE INDEX IF NOT EXISTS idx_communications_sender ON personas_communications(sender_persona_id);
CREATE INDEX IF NOT EXISTS idx_communications_status ON personas_communications(status);
CREATE INDEX IF NOT EXISTS idx_communications_type ON personas_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_communications_priority ON personas_communications(priority);
CREATE INDEX IF NOT EXISTS idx_communications_deadline ON personas_communications(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_communications_pending ON personas_communications(receiver_persona_id, status) WHERE status = 'pending';

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_communications_receiver_status_priority 
  ON personas_communications(receiver_persona_id, status, priority, created_at DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER communications_updated_at
  BEFORE UPDATE ON personas_communications
  FOR EACH ROW
  EXECUTE FUNCTION update_communications_updated_at();

-- View para comunicações pendentes com informações das personas
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
ORDER BY 
  c.priority DESC,
  c.deadline ASC NULLS LAST,
  c.created_at ASC;

-- View para métricas de comunicação por persona
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

-- Comentários para documentação
COMMENT ON TABLE personas_communications IS 'Sistema de comunicações entre personas para handoffs, notificações, aprovações e perguntas';
COMMENT ON COLUMN personas_communications.context_data IS 'Dados estruturados em JSON (ex: {"task_id": "123", "amount": 5000, "discount_percentage": 20})';
COMMENT ON COLUMN personas_communications.requires_action IS 'TRUE se a comunicação requer uma ação do destinatário (ex: aprovação, resposta)';
COMMENT ON COLUMN personas_communications.deadline IS 'Prazo limite para resposta/ação. NULL = sem prazo definido';

-- Função auxiliar para criar comunicação com validações
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
  -- Valida que sender e receiver existem
  IF NOT EXISTS (SELECT 1 FROM personas WHERE id = p_sender_persona_id) THEN
    RAISE EXCEPTION 'Sender persona % does not exist', p_sender_persona_id;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM personas WHERE id = p_receiver_persona_id) THEN
    RAISE EXCEPTION 'Receiver persona % does not exist', p_receiver_persona_id;
  END IF;
  
  -- Valida que são personas diferentes
  IF p_sender_persona_id = p_receiver_persona_id THEN
    RAISE EXCEPTION 'Sender and receiver must be different personas';
  END IF;
  
  -- Cria comunicação
  INSERT INTO personas_communications (
    sender_persona_id,
    receiver_persona_id,
    communication_type,
    subject,
    message,
    context_data,
    priority,
    requires_action,
    deadline
  ) VALUES (
    p_sender_persona_id,
    p_receiver_persona_id,
    p_type,
    p_subject,
    p_message,
    p_context_data,
    p_priority,
    p_requires_action,
    p_deadline
  )
  RETURNING id INTO v_communication_id;
  
  RETURN v_communication_id;
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso:
-- SELECT create_communication(
--   'uuid-marketing-manager',
--   'uuid-sales-manager',
--   'handoff',
--   'Handoff de 100 leads qualificados',
--   'Segue lista de 100 leads prontos para contato...',
--   '{"campaign_id": "ABC123", "lead_source": "LinkedIn Ads", "total_leads": 100}'::jsonb,
--   'high',
--   true,
--   NOW() + INTERVAL '3 days'
-- );

-- Grants (ajustar conforme suas roles)
-- GRANT SELECT, INSERT, UPDATE ON personas_communications TO authenticated;
-- GRANT SELECT ON v_communications_pending TO authenticated;
-- GRANT SELECT ON v_communication_metrics TO authenticated;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
