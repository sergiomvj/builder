-- ============================================================================
-- TABELA: personas_workflows
-- ============================================================================
-- Armazena workflows N8N gerados automaticamente a partir de tarefas
-- Gerada pelo script 03_generate_n8n_from_tasks.js
--
-- Relacionamentos:
--   - empresa_id → empresas(id)
--   - persona_id → personas(id)
--   - opportunity_id → automation_opportunities(id)
--   - linked_tasks → array de personas_tasks(id)
--
-- Data: 28/11/2025
-- Autor: VCM Auto-Generator
-- ============================================================================

CREATE TABLE IF NOT EXISTS personas_workflows (
    -- Identificadores
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    
    -- Workflow Info
    workflow_name TEXT NOT NULL,
    workflow_description TEXT,
    workflow_type TEXT CHECK (workflow_type IN ('webhook', 'cron', 'event', 'manual')),
    
    -- N8N JSON (importável diretamente no N8N)
    workflow_json JSONB NOT NULL, -- JSON completo: { name, nodes, connections, active, settings }
    n8n_workflow_id TEXT, -- ID do workflow após importação no N8N (ex: 'wf_abc123')
    n8n_url TEXT, -- URL do workflow no N8N (ex: 'https://n8n.com/workflow/123')
    
    -- Links e Origem
    linked_tasks UUID[], -- Array de task_ids que este workflow automatiza
    opportunity_id UUID, -- Link para automation_opportunities (FK adicionada depois)
    source_type TEXT DEFAULT 'task-driven' CHECK (source_type IN ('task-driven', 'template', 'manual', 'imported')),
    
    -- Status e Controle
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived', 'error', 'deleted')),
    is_active_in_n8n BOOLEAN DEFAULT FALSE, -- Se está ativo no N8N
    
    -- Métricas de Execução
    executions_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_execution_at TIMESTAMP WITH TIME ZONE,
    last_execution_status TEXT CHECK (last_execution_status IN ('success', 'error', 'running', 'waiting', 'canceled')),
    average_execution_time INTERVAL, -- Tempo médio de execução
    
    -- Performance e ROI
    total_time_saved INTERVAL, -- Tempo total economizado (executions_count * time_per_execution)
    estimated_cost_saving_monthly DECIMAL(10, 2), -- Economia em R$ por mês
    last_sync_with_n8n_at TIMESTAMP WITH TIME ZONE, -- Última sincronização com N8N
    
    -- Configuração Avançada
    schedule_config JSONB, -- Para workflows cron: { cron: '0 9 * * *', timezone: 'America/Sao_Paulo' }
    webhook_config JSONB, -- Para workflows webhook: { path: '/trigger', method: 'POST', auth: {...} }
    error_handling JSONB, -- Configuração de erro: { retry: 3, timeout: 300, errorWorkflow: 'id' }
    
    -- Tags e Categorização
    tags TEXT[], -- Ex: ['sales', 'automation', 'high-priority']
    category TEXT, -- Ex: 'lead-nurturing', 'onboarding', 'reporting'
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1 = highest, 5 = lowest
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT DEFAULT 'VCM Auto-Generator',
    last_modified_by TEXT,
    version INTEGER DEFAULT 1, -- Número da versão do workflow
    
    -- Constraints
    UNIQUE(workflow_name, empresa_id), -- Nome único por empresa
    CHECK(executions_count >= 0),
    CHECK(success_count >= 0),
    CHECK(error_count >= 0),
    CHECK(success_count + error_count <= executions_count)
);

-- ============================================================================
-- ÍNDICES para Performance
-- ============================================================================

-- Buscar workflows por persona
CREATE INDEX idx_personas_workflows_persona 
ON personas_workflows(persona_id)
WHERE status NOT IN ('deleted', 'archived');

-- Buscar workflows por empresa
CREATE INDEX idx_personas_workflows_empresa 
ON personas_workflows(empresa_id)
WHERE status NOT IN ('deleted');

-- Buscar workflows ativos
CREATE INDEX idx_personas_workflows_active 
ON personas_workflows(status)
WHERE status = 'active';

-- Buscar workflows por tipo
CREATE INDEX idx_personas_workflows_type 
ON personas_workflows(workflow_type)
WHERE status IN ('active', 'draft');

-- Buscar workflows por N8N ID (para sincronização)
CREATE INDEX idx_personas_workflows_n8n_id 
ON personas_workflows(n8n_workflow_id)
WHERE n8n_workflow_id IS NOT NULL;

-- Buscar workflows por última execução (para monitoramento)
CREATE INDEX idx_personas_workflows_last_execution 
ON personas_workflows(last_execution_at DESC)
WHERE status = 'active';

-- Buscar workflows por prioridade
CREATE INDEX idx_personas_workflows_priority 
ON personas_workflows(priority, status)
WHERE status IN ('active', 'draft');

-- GIN index para busca em workflow_json (permite queries JSON)
CREATE INDEX idx_personas_workflows_json 
ON personas_workflows USING GIN (workflow_json);

-- GIN index para busca em tags
CREATE INDEX idx_personas_workflows_tags 
ON personas_workflows USING GIN (tags);

-- ============================================================================
-- TRIGGER para atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION update_personas_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1; -- Incrementar versão a cada update
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_personas_workflows_updated_at
    BEFORE UPDATE ON personas_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_personas_workflows_updated_at();

-- ============================================================================
-- TRIGGER para atualizar automation_opportunities quando workflow criado
-- ============================================================================
-- NOTA: Este trigger será criado DEPOIS que automation_opportunities existir
-- Para criar manualmente após ambas tabelas existirem, execute:
--
-- CREATE OR REPLACE FUNCTION update_opportunity_on_workflow_create()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF NEW.opportunity_id IS NOT NULL THEN
--         UPDATE automation_opportunities
--         SET status = 'workflow_created', workflow_id = NEW.id, updated_at = NOW()
--         WHERE id = NEW.opportunity_id;
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER trigger_update_opportunity_on_workflow_create
--     AFTER INSERT ON personas_workflows
--     FOR EACH ROW
--     WHEN (NEW.opportunity_id IS NOT NULL)
--     EXECUTE FUNCTION update_opportunity_on_workflow_create();

-- ============================================================================
-- VIEW: Workflows Ativos com Métricas
-- ============================================================================

CREATE OR REPLACE VIEW workflows_active_metrics AS
SELECT 
    pw.id,
    pw.workflow_name,
    p.full_name AS persona_nome,
    p.role AS persona_cargo,
    e.nome AS empresa_nome,
    pw.workflow_type,
    pw.status,
    pw.executions_count,
    pw.success_count,
    pw.error_count,
    CASE 
        WHEN pw.executions_count > 0 
        THEN ROUND((pw.success_count::DECIMAL / pw.executions_count) * 100, 2)
        ELSE 0 
    END AS success_rate_percent,
    pw.last_execution_at,
    pw.last_execution_status,
    pw.average_execution_time,
    EXTRACT(EPOCH FROM pw.total_time_saved) / 3600 AS total_hours_saved,
    pw.estimated_cost_saving_monthly,
    pw.priority,
    pw.is_active_in_n8n,
    pw.n8n_workflow_id,
    array_length(pw.linked_tasks, 1) AS linked_tasks_count
FROM personas_workflows pw
JOIN personas p ON pw.persona_id = p.id
JOIN empresas e ON pw.empresa_id = e.id
WHERE pw.status IN ('active', 'draft')
ORDER BY pw.priority ASC, pw.executions_count DESC;

-- ============================================================================
-- VIEW: Resumo por Persona
-- ============================================================================

CREATE OR REPLACE VIEW workflows_by_persona_summary AS
SELECT 
    p.id AS persona_id,
    p.full_name AS persona_nome,
    p.role AS persona_cargo,
    e.nome AS empresa_nome,
    COUNT(pw.id) AS total_workflows,
    COUNT(pw.id) FILTER (WHERE pw.status = 'active') AS active_workflows,
    COUNT(pw.id) FILTER (WHERE pw.status = 'draft') AS draft_workflows,
    SUM(pw.executions_count) AS total_executions,
    SUM(pw.success_count) AS total_successes,
    SUM(pw.error_count) AS total_errors,
    SUM(EXTRACT(EPOCH FROM pw.total_time_saved)) / 3600 AS total_hours_saved,
    SUM(pw.estimated_cost_saving_monthly) AS total_monthly_savings,
    AVG(pw.priority) AS avg_priority
FROM personas p
JOIN empresas e ON p.empresa_id = e.id
LEFT JOIN personas_workflows pw ON p.id = pw.persona_id
WHERE pw.status NOT IN ('deleted', 'archived')
GROUP BY p.id, p.full_name, p.role, e.nome
ORDER BY total_monthly_savings DESC NULLS LAST;

-- ============================================================================
-- VIEW: Workflows que Precisam Atenção (erros recentes ou sem execução)
-- ============================================================================

CREATE OR REPLACE VIEW workflows_need_attention AS
SELECT 
    pw.id,
    pw.workflow_name,
    p.full_name AS persona_nome,
    e.nome AS empresa_nome,
    pw.status,
    pw.last_execution_status,
    pw.error_count,
    pw.last_execution_at,
    CASE 
        WHEN pw.error_count > pw.success_count AND pw.executions_count > 5 
            THEN 'high_error_rate'
        WHEN pw.last_execution_status = 'error' 
            THEN 'last_execution_failed'
        WHEN pw.status = 'active' AND pw.last_execution_at < NOW() - INTERVAL '7 days' 
            THEN 'no_recent_execution'
        WHEN pw.status = 'error' 
            THEN 'workflow_in_error_state'
        ELSE 'needs_review'
    END AS attention_reason,
    NOW() - pw.last_execution_at AS time_since_last_execution
FROM personas_workflows pw
JOIN personas p ON pw.persona_id = p.id
JOIN empresas e ON pw.empresa_id = e.id
WHERE 
    pw.status IN ('active', 'error')
    AND (
        pw.error_count > pw.success_count -- Mais erros que sucessos
        OR pw.last_execution_status = 'error' -- Última execução falhou
        OR (pw.status = 'active' AND pw.last_execution_at < NOW() - INTERVAL '7 days') -- Sem execução há 7 dias
        OR pw.status = 'error' -- Status de erro
    )
ORDER BY pw.error_count DESC, pw.last_execution_at ASC;

-- ============================================================================
-- FUNÇÕES UTILITÁRIAS
-- ============================================================================

-- Função: Registrar execução de workflow
CREATE OR REPLACE FUNCTION record_workflow_execution(
    p_workflow_id UUID,
    p_status TEXT, -- 'success' ou 'error'
    p_execution_time INTERVAL DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_current_avg_time INTERVAL;
    v_new_avg_time INTERVAL;
BEGIN
    -- Atualizar contadores
    UPDATE personas_workflows
    SET 
        executions_count = executions_count + 1,
        success_count = CASE WHEN p_status = 'success' THEN success_count + 1 ELSE success_count END,
        error_count = CASE WHEN p_status = 'error' THEN error_count + 1 ELSE error_count END,
        last_execution_at = NOW(),
        last_execution_status = p_status,
        updated_at = NOW()
    WHERE id = p_workflow_id;
    
    -- Atualizar tempo médio de execução (se fornecido)
    IF p_execution_time IS NOT NULL THEN
        SELECT average_execution_time INTO v_current_avg_time
        FROM personas_workflows
        WHERE id = p_workflow_id;
        
        -- Calcular nova média
        IF v_current_avg_time IS NULL THEN
            v_new_avg_time := p_execution_time;
        ELSE
            SELECT 
                (v_current_avg_time * (executions_count - 1) + p_execution_time) / executions_count
            INTO v_new_avg_time
            FROM personas_workflows
            WHERE id = p_workflow_id;
        END IF;
        
        UPDATE personas_workflows
        SET average_execution_time = v_new_avg_time
        WHERE id = p_workflow_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função: Ativar workflow
CREATE OR REPLACE FUNCTION activate_workflow(
    p_workflow_id UUID,
    p_n8n_workflow_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE personas_workflows
    SET 
        status = 'active',
        is_active_in_n8n = TRUE,
        n8n_workflow_id = COALESCE(p_n8n_workflow_id, n8n_workflow_id),
        updated_at = NOW()
    WHERE id = p_workflow_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Pausar workflow
CREATE OR REPLACE FUNCTION pause_workflow(
    p_workflow_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE personas_workflows
    SET 
        status = 'paused',
        is_active_in_n8n = FALSE,
        updated_at = NOW()
    WHERE id = p_workflow_id;
END;
$$ LANGUAGE plpgsql;

-- Função: Arquivar workflow
CREATE OR REPLACE FUNCTION archive_workflow(
    p_workflow_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE personas_workflows
    SET 
        status = 'archived',
        is_active_in_n8n = FALSE,
        updated_at = NOW()
    WHERE id = p_workflow_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS nas Colunas (Documentação)
-- ============================================================================

COMMENT ON TABLE personas_workflows IS 'Workflows N8N gerados automaticamente a partir de tarefas de personas';

COMMENT ON COLUMN personas_workflows.workflow_json IS 'JSON completo do workflow N8N (importável diretamente): { name, nodes, connections, active, settings }';
COMMENT ON COLUMN personas_workflows.n8n_workflow_id IS 'ID do workflow após importação no N8N (ex: wf_abc123)';
COMMENT ON COLUMN personas_workflows.linked_tasks IS 'Array de UUIDs das tarefas que este workflow automatiza';
COMMENT ON COLUMN personas_workflows.opportunity_id IS 'UUID da oportunidade de automação que originou este workflow';
COMMENT ON COLUMN personas_workflows.source_type IS 'Origem: task-driven (gerado de tarefa), template (fixo), manual (criado manualmente), imported (importado)';
COMMENT ON COLUMN personas_workflows.executions_count IS 'Total de execuções do workflow no N8N';
COMMENT ON COLUMN personas_workflows.success_count IS 'Número de execuções bem-sucedidas';
COMMENT ON COLUMN personas_workflows.error_count IS 'Número de execuções com erro';
COMMENT ON COLUMN personas_workflows.total_time_saved IS 'Tempo total economizado por todas execuções';
COMMENT ON COLUMN personas_workflows.estimated_cost_saving_monthly IS 'Economia estimada em R$ por mês';

-- ============================================================================
-- GRANTS (Permissões)
-- ============================================================================

GRANT ALL ON personas_workflows TO service_role;
GRANT ALL ON personas_workflows TO postgres;
GRANT SELECT, INSERT, UPDATE ON personas_workflows TO anon;
GRANT SELECT, INSERT, UPDATE ON personas_workflows TO authenticated;

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
