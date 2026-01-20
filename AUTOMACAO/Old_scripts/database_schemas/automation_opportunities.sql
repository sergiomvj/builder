-- ============================================================================
-- TABELA: automation_opportunities
-- ============================================================================
-- Armazena análises LLM de tarefas para identificar oportunidades de automação
-- Gerada pelo script 02.5_analyze_tasks_for_automation.js
--
-- Relacionamentos:
--   - empresa_id → empresas(id)
--   - persona_id → personas(id)
--   - task_id → personas_tasks(id)
--   - workflow_id → personas_workflows(id) [após workflow criado]
--
-- Data: 28/11/2025
-- Autor: VCM Auto-Generator
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_opportunities (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES personas_tasks(id) ON DELETE CASCADE,
    
    -- Análise LLM (gerado por GPT-4 ou Gemini)
    automation_score INTEGER CHECK (automation_score >= 0 AND automation_score <= 100),
    automation_feasibility TEXT CHECK (automation_feasibility IN ('high', 'medium', 'low', 'none')),
    workflow_type TEXT CHECK (workflow_type IN ('webhook', 'cron', 'event', 'manual')),
    
    -- Configuração do Workflow
    required_integrations TEXT[], -- Ex: ['slack', 'gmail', 'supabase', 'hubspot']
    workflow_steps JSONB, -- Array de passos: [{ step: 1, action: 'Trigger', type: 'cron', config: {...} }]
    dependencies UUID[], -- Array de task_ids que precisam ser completadas antes
    
    -- Métricas e ROI
    estimated_time_saved_per_execution INTERVAL, -- Ex: '30 minutes', '2 hours'
    roi_potential TEXT CHECK (roi_potential IN ('high', 'medium', 'low')),
    complexity TEXT CHECK (complexity IN ('simple', 'medium', 'complex')),
    
    -- Análise e Raciocínio
    reasoning TEXT, -- Explicação do LLM sobre por que é/não é automatizável
    llm_prompt_used TEXT, -- Prompt enviado ao LLM (para debugging)
    llm_response_raw JSONB, -- Resposta completa do LLM (para análise)
    
    -- Status e Workflow Vinculado
    status TEXT DEFAULT 'analyzed' CHECK (status IN ('analyzed', 'workflow_created', 'active', 'paused', 'rejected', 'archived')),
    workflow_id UUID, -- Link para workflow gerado (FK adicionada depois)
    rejection_reason TEXT, -- Se status = 'rejected', motivo da rejeição
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analyzed_by TEXT DEFAULT 'LLM', -- 'GPT-4', 'Gemini-Pro', 'Manual'
    analyzed_version TEXT, -- Versão do modelo usado (ex: 'gpt-4-0125-preview')
    
    -- Constraints
    UNIQUE(task_id) -- Uma tarefa só pode ter uma análise ativa
);

-- ============================================================================
-- ÍNDICES para Performance
-- ============================================================================

-- Buscar oportunidades por persona
CREATE INDEX idx_automation_opportunities_persona 
ON automation_opportunities(persona_id) 
WHERE status NOT IN ('rejected', 'archived');

-- Buscar oportunidades por score (mais automatizáveis primeiro)
CREATE INDEX idx_automation_opportunities_score 
ON automation_opportunities(automation_score DESC)
WHERE automation_score > 60 AND status = 'analyzed';

-- Buscar oportunidades por empresa
CREATE INDEX idx_automation_opportunities_empresa 
ON automation_opportunities(empresa_id)
WHERE status NOT IN ('archived');

-- Buscar oportunidades por status
CREATE INDEX idx_automation_opportunities_status 
ON automation_opportunities(status);

-- Buscar oportunidades por tipo de workflow
CREATE INDEX idx_automation_opportunities_workflow_type 
ON automation_opportunities(workflow_type)
WHERE status IN ('analyzed', 'workflow_created', 'active');

-- Buscar oportunidades por feasibility
CREATE INDEX idx_automation_opportunities_feasibility 
ON automation_opportunities(automation_feasibility)
WHERE automation_feasibility IN ('high', 'medium');

-- ============================================================================
-- TRIGGER para atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_automation_opportunities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_automation_opportunities_updated_at
    BEFORE UPDATE ON automation_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_opportunities_updated_at();

-- ============================================================================
-- VIEW: Oportunidades Prioritárias (High Score + High Feasibility)
-- ============================================================================

CREATE OR REPLACE VIEW automation_opportunities_priority AS
SELECT 
    ao.*,
    p.full_name AS persona_nome,
    p.role AS persona_cargo,
    pt.title AS task_title,
    pt.task_type AS task_type,
    pt.priority AS task_priority,
    e.nome AS empresa_nome,
    CASE 
        WHEN ao.automation_score >= 80 AND ao.automation_feasibility = 'high' THEN 'critical'
        WHEN ao.automation_score >= 60 AND ao.automation_feasibility IN ('high', 'medium') THEN 'high'
        WHEN ao.automation_score >= 40 THEN 'medium'
        ELSE 'low'
    END AS priority_level
FROM automation_opportunities ao
JOIN personas p ON ao.persona_id = p.id
JOIN personas_tasks pt ON ao.task_id = pt.id
JOIN empresas e ON ao.empresa_id = e.id
WHERE ao.status = 'analyzed'
ORDER BY 
    ao.automation_score DESC,
    CASE ao.automation_feasibility 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
        ELSE 4 
    END;

-- ============================================================================
-- VIEW: ROI Analysis (tempo economizado total por empresa)
-- ============================================================================

CREATE OR REPLACE VIEW automation_roi_by_empresa AS
SELECT 
    e.id AS empresa_id,
    e.nome AS empresa_nome,
    COUNT(ao.id) AS total_opportunities,
    COUNT(ao.id) FILTER (WHERE ao.automation_score >= 60) AS high_score_opportunities,
    SUM(EXTRACT(EPOCH FROM ao.estimated_time_saved_per_execution)) / 3600 AS total_hours_saveable,
    AVG(ao.automation_score) AS avg_automation_score,
    COUNT(DISTINCT ao.persona_id) AS personas_affected
FROM empresas e
LEFT JOIN automation_opportunities ao ON e.id = ao.empresa_id
WHERE ao.status IN ('analyzed', 'workflow_created', 'active')
GROUP BY e.id, e.nome
ORDER BY total_hours_saveable DESC NULLS LAST;

-- ============================================================================
-- FUNÇÃO: Marcar oportunidade como workflow criado
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_opportunity_workflow_created(
    p_opportunity_id UUID,
    p_workflow_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE automation_opportunities
    SET 
        status = 'workflow_created',
        workflow_id = p_workflow_id,
        updated_at = NOW()
    WHERE id = p_opportunity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO: Rejeitar oportunidade com motivo
-- ============================================================================

CREATE OR REPLACE FUNCTION reject_automation_opportunity(
    p_opportunity_id UUID,
    p_reason TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE automation_opportunities
    SET 
        status = 'rejected',
        rejection_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_opportunity_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS nas Colunas (Documentação)
-- ============================================================================

COMMENT ON TABLE automation_opportunities IS 'Análises LLM de tarefas para identificar oportunidades de automação via N8N workflows';

COMMENT ON COLUMN automation_opportunities.automation_score IS 'Score 0-100 da automatizabilidade (0-30: humano, 31-60: parcial, 61-100: total)';
COMMENT ON COLUMN automation_opportunities.automation_feasibility IS 'Viabilidade: high (fácil implementar), medium (requer esforço), low (complexo)';
COMMENT ON COLUMN automation_opportunities.workflow_type IS 'Tipo de trigger: webhook (evento externo), cron (agendado), event (mudança no sistema), manual';
COMMENT ON COLUMN automation_opportunities.required_integrations IS 'Array de integrações necessárias: slack, gmail, supabase, hubspot, etc.';
COMMENT ON COLUMN automation_opportunities.workflow_steps IS 'Array JSON de passos do workflow: [{ step: 1, action: "Trigger", type: "cron", config: {...} }]';
COMMENT ON COLUMN automation_opportunities.dependencies IS 'Array de UUIDs de outras tarefas que precisam ser completadas antes';
COMMENT ON COLUMN automation_opportunities.estimated_time_saved_per_execution IS 'Tempo economizado por execução do workflow (ex: 30 minutes)';
COMMENT ON COLUMN automation_opportunities.roi_potential IS 'Potencial de ROI: high (> 10h/mês), medium (5-10h/mês), low (< 5h/mês)';
COMMENT ON COLUMN automation_opportunities.complexity IS 'Complexidade de implementação: simple (< 5 nós), medium (5-10 nós), complex (> 10 nós)';
COMMENT ON COLUMN automation_opportunities.reasoning IS 'Explicação do LLM sobre a análise de automatizabilidade';
COMMENT ON COLUMN automation_opportunities.workflow_id IS 'UUID do workflow N8N gerado a partir desta oportunidade (se já criado)';

-- ============================================================================
-- DADOS DE EXEMPLO (para testes)
-- ============================================================================

-- Exemplo será inserido pelo script 02.5_analyze_tasks_for_automation.js
-- após análise real de tarefas com LLM

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security) - Opcional
-- ============================================================================

-- Habilitar RLS na tabela
-- ALTER TABLE automation_opportunities ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem oportunidades da sua empresa
-- CREATE POLICY automation_opportunities_empresa_policy ON automation_opportunities
--     FOR SELECT
--     USING (empresa_id = current_setting('app.current_empresa_id')::UUID);

-- ============================================================================
-- GRANTS (Permissões)
-- ============================================================================

-- Garantir que service role tem acesso total
GRANT ALL ON automation_opportunities TO service_role;
GRANT ALL ON automation_opportunities TO postgres;

-- Anon key tem acesso read/write (para scripts Node.js)
GRANT SELECT, INSERT, UPDATE ON automation_opportunities TO anon;
GRANT SELECT, INSERT, UPDATE ON automation_opportunities TO authenticated;

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
