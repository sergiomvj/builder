-- ==============================================================================
-- 🚀 BUILDER MVP - RECREAÇÃO COMPLETA DO BANCO DE DADOS
-- DATA: 15/05/2026
-- VERSÃO: 5.0.0 (Consolidada)
-- ==============================================================================
-- ⚠️ AVISO: Este script EXCLUIRÁ todas as tabelas existentes (DROP).
-- Use com cautela se houver dados importantes no banco atual.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSÕES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ------------------------------------------------------------------------------
-- 2. ENUMS E TIPOS CUSTOMIZADOS
-- ------------------------------------------------------------------------------

-- Comunicações
DROP TYPE IF EXISTS communication_type CASCADE;
CREATE TYPE communication_type AS ENUM ('handoff', 'notification', 'approval_request', 'question');

DROP TYPE IF EXISTS communication_priority CASCADE;
CREATE TYPE communication_priority AS ENUM ('low', 'normal', 'high', 'urgent');

DROP TYPE IF EXISTS communication_status CASCADE;
CREATE TYPE communication_status AS ENUM ('pending', 'read', 'acted_upon', 'archived');

-- Supervisão
DROP TYPE IF EXISTS hierarchy_level CASCADE;
CREATE TYPE hierarchy_level AS ENUM ('execution', 'operational', 'tactical', 'strategic');

DROP TYPE IF EXISTS supervision_type CASCADE;
CREATE TYPE supervision_type AS ENUM ('approval', 'notification', 'escalation', 'audit');

DROP TYPE IF EXISTS trigger_criteria CASCADE;
CREATE TYPE trigger_criteria AS ENUM ('value_threshold', 'risk_level', 'always', 'never', 'custom');

DROP TYPE IF EXISTS supervision_decision CASCADE;
CREATE TYPE supervision_decision AS ENUM ('approved', 'approved_with_modifications', 'rejected', 'escalated', 'pending');

-- Intervenções
DROP TYPE IF EXISTS intervention_type CASCADE;
CREATE TYPE intervention_type AS ENUM ('create_task', 'modify_task', 'cancel_task', 'approve_supervision', 'reject_supervision', 'confirm_metric', 'adjust_parameter', 'escalate_manually', 'provide_feedback');

DROP TYPE IF EXISTS intervention_status CASCADE;
CREATE TYPE intervention_status AS ENUM ('received', 'validating', 'processing', 'completed', 'failed', 'cancelled');

-- ------------------------------------------------------------------------------
-- 3. TABELAS DE NEGÓCIO (NÍVEL SUPERIOR)
-- ------------------------------------------------------------------------------

DROP TABLE IF EXISTS public.ideas CASCADE;
CREATE TABLE public.ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'processing', 'approved', 'rejected', 'project_created')),
    analysis_result JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS public.projects CASCADE;
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID REFERENCES public.ideas(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    mission TEXT,
    vision TEXT,
    values TEXT[],
    objectives TEXT[],
    target_audience TEXT,
    revenue_streams TEXT[],
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'building', 'active', 'archived')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 4. CORE VCM (EMPRESAS E PERSONAS)
-- ------------------------------------------------------------------------------

DROP TABLE IF EXISTS public.empresas CASCADE;
CREATE TABLE public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    nome VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    industria VARCHAR(100),
    setor VARCHAR(100), -- Compatibilidade legado
    dominio TEXT,
    descricao TEXT,
    pais VARCHAR(10) DEFAULT 'BR',
    status VARCHAR(20) DEFAULT 'ativa',
    owner_id UUID REFERENCES auth.users(id),
    
    -- Diversidade da equipe
    ceo_gender VARCHAR(20),
    executives_male INT DEFAULT 2,
    executives_female INT DEFAULT 2,
    assistants_male INT DEFAULT 2,
    assistants_female INT DEFAULT 3,
    specialists_male INT DEFAULT 3,
    specialists_female INT DEFAULT 3,
    
    -- Metadados Adicionais
    nationalities JSONB DEFAULT '[]',
    idiomas TEXT[] DEFAULT '{}',
    scripts_status JSONB DEFAULT '{"rag": false, "fluxos": false, "workflows": false, "biografias": false, "tech_specs": false, "competencias": false}',
    configuracoes JSONB DEFAULT '{}'::jsonb,
    total_personas INT DEFAULT 15,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS public.personas CASCADE;
CREATE TABLE public.personas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE NOT NULL,
    
    -- Dados básicos
    full_name VARCHAR(255) NOT NULL,
    nome VARCHAR(255), -- Alias para full_name (legado)
    email VARCHAR(255),
    role VARCHAR(100),
    cargo VARCHAR(100), -- Alias para role (legado)
    department VARCHAR(100),
    departamento VARCHAR(100), -- Alias para department (legado)
    seniority_level VARCHAR(50),
    nivel_senioridade VARCHAR(50), -- Alias para seniority_level (legado)
    
    -- Características
    gender VARCHAR(20),
    nationality VARCHAR(50),
    age_range VARCHAR(20),
    descricao_funcao TEXT,
    tracos_personalidade TEXT[],
    objetivos TEXT[],
    
    -- Hierarquia e Status
    reports_to UUID REFERENCES public.personas(id) ON DELETE SET NULL,
    nivel_hierarquico hierarchy_level DEFAULT 'execution',
    tipo VARCHAR(50) DEFAULT 'virtual_assistant',
    status VARCHAR(50) DEFAULT 'active',
    
    -- Metadados e Arquivos
    avatar_url TEXT,
    competencias_file_path TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS public.personas_avatares CASCADE;
CREATE TABLE public.personas_avatares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
    
    -- Biografia e Aparência
    biografia_completa TEXT,
    biografia_resumida TEXT,
    physical_appearance JSONB,
    personality_traits JSONB,
    
    -- Metadados visuais
    ethnicity VARCHAR(50),
    age_range VARCHAR(20),
    gender VARCHAR(20),
    body_type VARCHAR(50),
    
    -- Prompts e Localização
    prompt_image TEXT,
    prompt_usado TEXT,
    avatar_url TEXT,
    avatar_local_path TEXT,
    avatar_thumb_path TEXT,
    avatar_service VARCHAR(50),
    avatar_seed BIGINT,
    
    generation_service VARCHAR(50) DEFAULT 'gemini',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS public.avatares_multimedia CASCADE;
CREATE TABLE public.avatares_multimedia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    avatar_type VARCHAR(50) CHECK (avatar_type IN ('photo', 'video', 'animated_gif', '3d_render', 'illustration')),
    avatar_category VARCHAR(100) DEFAULT 'profile',
    personas_ids UUID[] NOT NULL,
    file_url TEXT NOT NULL,
    file_thumbnail_url TEXT,
    title VARCHAR(255),
    description TEXT,
    prompt_used TEXT,
    style VARCHAR(100) DEFAULT 'professional',
    status VARCHAR(50) DEFAULT 'completed',
    generation_service VARCHAR(50) DEFAULT 'fal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS public.competencias CASCADE;
CREATE TABLE public.competencias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('principal', 'tecnica', 'soft_skill')),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    nivel VARCHAR(50) DEFAULT 'avancado',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS public.tasks CASCADE;
CREATE TABLE public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES public.personas(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.personas(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 5. COMUNICAÇÕES E SUPERVISÃO (V5.0)
-- ------------------------------------------------------------------------------

DROP TABLE IF EXISTS public.personas_communications CASCADE;
CREATE TABLE public.personas_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  receiver_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  communication_type communication_type NOT NULL,
  priority communication_priority DEFAULT 'normal',
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  context_data JSONB,
  related_task_id UUID,
  requires_action BOOLEAN DEFAULT false,
  action_taken TEXT,
  action_taken_at TIMESTAMPTZ,
  status communication_status DEFAULT 'pending',
  read_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_personas CHECK (sender_persona_id != receiver_persona_id)
);

DROP TABLE IF EXISTS public.task_supervision_chains CASCADE;
CREATE TABLE public.task_supervision_chains (
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
  CONSTRAINT valid_hierarchy CHECK (supervisor_level > executor_level)
);

DROP TABLE IF EXISTS public.task_supervision_logs CASCADE;
CREATE TABLE public.task_supervision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervision_chain_id UUID REFERENCES task_supervision_chains(id) ON DELETE SET NULL,
  task_id VARCHAR(255) NOT NULL,
  communication_id UUID REFERENCES personas_communications(id) ON DELETE SET NULL,
  executor_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  supervisor_persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  task_template_code VARCHAR(100) NOT NULL,
  task_title VARCHAR(255) NOT NULL,
  task_value DECIMAL(15,2),
  task_risk_level VARCHAR(20),
  supervision_type supervision_type NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  deadline TIMESTAMPTZ,
  decision supervision_decision DEFAULT 'pending',
  decision_notes TEXT,
  decided_at TIMESTAMPTZ,
  was_escalated BOOLEAN DEFAULT false,
  escalated_to_persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  response_time_hours DECIMAL(10,2),
  exceeded_sla BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS public.user_interventions CASCADE;
CREATE TABLE public.user_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  intervention_type intervention_type NOT NULL,
  command_template VARCHAR(100),
  command_parameters JSONB NOT NULL,
  target_task_id VARCHAR(255),
  target_persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  related_supervision_log_id UUID REFERENCES task_supervision_logs(id) ON DELETE SET NULL,
  status intervention_status DEFAULT 'received',
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  result_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. AUTOMAÇÃO E AUDITORIA
-- ------------------------------------------------------------------------------

DROP TABLE IF EXISTS public.subsistemas CASCADE;
CREATE TABLE public.subsistemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  funcionalidades TEXT[],
  metricas_principais TEXT[],
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'em_desenvolvimento')),
  ordem_exibicao INTEGER DEFAULT 0,
  icone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TABLE IF EXISTS public.automation_opportunities CASCADE;
CREATE TABLE public.automation_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES public.personas(id) ON DELETE CASCADE,
    task_title TEXT NOT NULL,
    automation_score INTEGER CHECK (automation_score BETWEEN 0 AND 100),
    workflow_type VARCHAR(50),
    n8n_workflow_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'identified',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS public.auditorias CASCADE;
CREATE TABLE public.auditorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    auditoria_tipo VARCHAR(100) NOT NULL,
    titulo TEXT NOT NULL,
    resultados JSONB DEFAULT '{}'::jsonb,
    score NUMERIC,
    status VARCHAR(50) DEFAULT 'concluida',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS public.llm_usage_logs CASCADE;
CREATE TABLE public.llm_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_tokens INTEGER,
    cost DECIMAL(10,6),
    latency_ms INTEGER,
    script_name VARCHAR(255),
    empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. FUNÇÕES E TRIGGERS
-- ------------------------------------------------------------------------------

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar Trigger de updated_at em tabelas principais
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON empresas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_personas_updated_at BEFORE UPDATE ON personas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_personas_avatares_updated_at BEFORE UPDATE ON personas_avatares FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_communications_updated_at BEFORE UPDATE ON personas_communications FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Função para calcular tempo de resposta em supervisão
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

CREATE TRIGGER supervision_logs_response_time BEFORE UPDATE ON task_supervision_logs FOR EACH ROW EXECUTE FUNCTION calculate_supervision_response_time();

-- ------------------------------------------------------------------------------
-- 8. DADOS INICIAIS (SEEDING) - 12 SUBSISTEMAS VCM
-- ------------------------------------------------------------------------------

INSERT INTO subsistemas (nome, codigo, descricao, categoria, funcionalidades, metricas_principais, ordem_exibicao, icone) VALUES
('Gestão Empresarial', 'gestao_empresarial', 'Gestão estratégica, governança e tomada de decisões.', 'core', ARRAY['Planejamento', 'OKRs', 'BI'], ARRAY['ROI', 'NPS'], 1, 'building-office'),
('Produção', 'producao', 'Controle de processos produtivos e eficiência.', 'core', ARRAY['PCP', 'Qualidade', 'OEE'], ARRAY['OEE', 'Produtividade'], 2, 'cog'),
('Financeiro', 'financeiro', 'Gestão financeira, fluxo de caixa e DRE.', 'core', ARRAY['Contas Pagar/Receber', 'DRE', 'Balanço'], ARRAY['Margem', 'Cash Flow'], 3, 'currency-dollar'),
('Recursos Humanos', 'recursos_humanos', 'Gestão de pessoas e talentos.', 'suporte', ARRAY['Recrutamento', 'Folha', 'Performance'], ARRAY['Turnover', 'Satisfação'], 4, 'users'),
('Vendas', 'vendas', 'Gestão de vendas, CRM e pipeline.', 'core', ARRAY['CRM', 'Pipeline', 'Negociação'], ARRAY['Conversão', 'CAC'], 5, 'chart-bar'),
('Marketing', 'marketing', 'Campanhas, geração de leads e growth.', 'core', ARRAY['SEO/SEM', 'Social Media', 'Leads'], ARRAY['CPL', 'ROI Mkt'], 6, 'megaphone'),
('Atendimento', 'atendimento', 'Suporte ao cliente e sucesso.', 'suporte', ARRAY['Tickets', 'CSAT', 'SLA'], ARRAY['CSAT', 'NPS'], 7, 'chat-bubble-left-right'),
('Compras', 'compras', 'Gestão de fornecedores e suprimentos.', 'operacional', ARRAY['Cotação', 'Pedidos', 'Supply'], ARRAY['Saving', 'Lead Time'], 8, 'shopping-cart'),
('Estoque', 'estoque', 'Controle de inventário e armazenagem.', 'operacional', ARRAY['FIFO/LIFO', 'Inventário', 'ABC'], ARRAY['Giro', 'Acurácia'], 9, 'archive-box'),
('Logística', 'logistica', 'Transporte e distribuição.', 'operacional', ARRAY['Rotas', 'Frete', 'Last Mile'], ARRAY['OTD', 'Custo Frete'], 10, 'truck'),
('Qualidade', 'qualidade', 'Melhoria contínua e conformidade.', 'suporte', ARRAY['ISO', 'Auditoria', 'NPs'], ARRAY['Não Conformidade', 'SLA'], 11, 'shield-check'),
('Projetos', 'projetos', 'Gestão de projetos e portfólio.', 'suporte', ARRAY['Agile', 'Gantt', 'PMO'], ARRAY['Prazo', 'Custo'], 12, 'briefcase');

-- ------------------------------------------------------------------------------
-- 9. SEGURANÇA (RLS) - POLÍTICAS BÁSICAS
-- ------------------------------------------------------------------------------

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para leitura no MVP (Ajustar em PROD)
CREATE POLICY "Allow public read" ON ideas FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON empresas FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON personas FOR SELECT USING (true);

-- Permissões totais para o usuário autenticado (simplificado para MVP)
CREATE POLICY "Full access for authenticated" ON ideas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for authenticated" ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for authenticated" ON empresas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full access for authenticated" ON personas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- ✅ FIM DO SCRIPT
-- ==============================================================================
