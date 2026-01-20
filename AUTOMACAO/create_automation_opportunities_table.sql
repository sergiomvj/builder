-- ============================================================================
-- CRIAR TABELA: automation_opportunities (Script 06)
-- ============================================================================
-- Tabela para armazenar análises de oportunidades de automação de tarefas
-- Data: 8 de Dezembro de 2025
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  
  -- Identificação da tarefa (task_id OPCIONAL)
  task_id UUID,
  task_title TEXT NOT NULL,
  task_description TEXT,
  task_frequency TEXT,
  
  -- Análise de automação
  automation_score INT NOT NULL CHECK (automation_score >= 0 AND automation_score <= 100),
  automation_feasibility TEXT CHECK (automation_feasibility IN ('low', 'medium', 'high')),
  workflow_type TEXT CHECK (workflow_type IN ('webhook', 'cron', 'event', 'manual')),
  
  -- Integrações e workflow
  required_integrations TEXT[] DEFAULT '{}',
  workflow_steps JSONB DEFAULT '[]',
  dependencies UUID[] DEFAULT '{}',
  
  -- Estimativas
  estimated_time_saved_per_execution INTERVAL,
  roi_potential TEXT CHECK (roi_potential IN ('low', 'medium', 'high')),
  complexity TEXT CHECK (complexity IN ('simple', 'medium', 'complex')),
  
  -- Análise detalhada
  reasoning TEXT,
  llm_prompt_used TEXT,
  llm_response_raw JSONB,
  
  -- Metadados
  analyzed_by TEXT,
  analyzed_version TEXT,
  status TEXT DEFAULT 'analyzed',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_automation_opportunities_empresa 
ON automation_opportunities(empresa_id);

CREATE INDEX IF NOT EXISTS idx_automation_opportunities_persona 
ON automation_opportunities(persona_id);

CREATE INDEX IF NOT EXISTS idx_automation_opportunities_score 
ON automation_opportunities(automation_score DESC);

CREATE INDEX IF NOT EXISTS idx_automation_opportunities_feasibility 
ON automation_opportunities(automation_feasibility);

CREATE INDEX IF NOT EXISTS idx_automation_opportunities_task_unique 
ON automation_opportunities(persona_id, task_title);

CREATE INDEX IF NOT EXISTS idx_automation_opportunities_created 
ON automation_opportunities(created_at DESC);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE automation_opportunities IS 
'Análises de oportunidades de automação de tarefas das personas (Script 06)';

COMMENT ON COLUMN automation_opportunities.task_id IS 
'UUID da tarefa (OPCIONAL - usado se tarefa está em personas_tasks)';

COMMENT ON COLUMN automation_opportunities.task_title IS 
'Título da tarefa analisada';

COMMENT ON COLUMN automation_opportunities.automation_score IS 
'Score de automatizabilidade (0-100): 0-30=essencialmente humana, 31-60=parcialmente automatizável, 61-100=totalmente automatizável';

COMMENT ON COLUMN automation_opportunities.workflow_type IS 
'Tipo de workflow: webhook (evento externo), cron (agendado), event (mudança no sistema), manual (sob demanda)';

COMMENT ON COLUMN automation_opportunities.workflow_steps IS 
'Sequência de passos do workflow N8N em formato JSON';

COMMENT ON COLUMN automation_opportunities.required_integrations IS 
'APIs/serviços necessários: slack, gmail, googlesheets, supabase, hubspot, etc.';

COMMENT ON COLUMN automation_opportunities.dependencies IS 
'IDs de outras tarefas que devem ser concluídas antes';

COMMENT ON COLUMN automation_opportunities.reasoning IS 
'Explicação do LLM sobre por que a tarefa é/não é automatizável';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE automation_opportunities ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas se existirem
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON automation_opportunities;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON automation_opportunities;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON automation_opportunities;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON automation_opportunities;

-- Criar policies novas
CREATE POLICY "Enable insert for authenticated users" ON automation_opportunities
  FOR INSERT TO authenticated, anon, service_role
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON automation_opportunities
  FOR SELECT TO authenticated, anon, service_role
  USING (true);

CREATE POLICY "Enable update for authenticated users" ON automation_opportunities
  FOR UPDATE TO authenticated, anon, service_role
  USING (true);

CREATE POLICY "Enable delete for authenticated users" ON automation_opportunities
  FOR DELETE TO authenticated, anon, service_role
  USING (true);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'automation_opportunities') as column_count,
  (SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_name = 'automation_opportunities' AND constraint_type = 'PRIMARY KEY') as has_pk,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'automation_opportunities') as index_count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'automation_opportunities';

SELECT 'Tabela automation_opportunities criada com sucesso!' as message;
