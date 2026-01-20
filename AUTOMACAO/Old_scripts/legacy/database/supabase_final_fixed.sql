-- =====================================================
-- VCM DASHBOARD - IMPLEMENTAÇÃO SUPABASE (FINAL CORRIGIDO)
-- =====================================================
-- Execute este arquivo APÓS supabase_step1.sql e supabase_step2.sql

-- =====================================================
-- 5. SISTEMA CRM COMPLETO
-- =====================================================

-- 5.1. Pipelines de CRM
CREATE TABLE IF NOT EXISTS public.crm_pipelines (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid,
  name character varying NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_pipelines_pkey PRIMARY KEY (id),
  CONSTRAINT crm_pipelines_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

-- 5.2. Estágios dos pipelines
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pipeline_id uuid,
  name character varying NOT NULL,
  description text,
  sort_order integer NOT NULL,
  probability numeric DEFAULT 0.00,
  is_closed boolean DEFAULT false,
  stage_type character varying CHECK (stage_type IN ('open', 'won', 'lost')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_pipeline_stages_pkey PRIMARY KEY (id),
  CONSTRAINT crm_pipeline_stages_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.crm_pipelines(id)
);

-- 5.3. Leads
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid,
  owner_persona_id uuid,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  full_name character varying NOT NULL,
  email character varying,
  phone character varying,
  company character varying,
  position character varying,
  industry character varying,
  website character varying,
  linkedin_url character varying,
  source character varying,
  status character varying DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'nurturing')),
  lead_score integer DEFAULT 0,
  estimated_value numeric,
  probability numeric DEFAULT 0.00,
  expected_close_date date,
  stage character varying,
  tags jsonb DEFAULT '[]',
  notes text,
  custom_fields jsonb DEFAULT '{}',
  last_contact_date timestamp with time zone,
  next_follow_up timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_leads_pkey PRIMARY KEY (id),
  CONSTRAINT crm_leads_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT crm_leads_owner_persona_id_fkey FOREIGN KEY (owner_persona_id) REFERENCES public.personas(id)
);

-- 5.4. Oportunidades
CREATE TABLE IF NOT EXISTS public.crm_opportunities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid,
  lead_id uuid,
  pipeline_id uuid,
  stage_id uuid,
  owner_persona_id uuid,
  name character varying NOT NULL,
  description text,
  value numeric DEFAULT 0.00,
  probability numeric DEFAULT 0.00,
  expected_close_date date,
  actual_close_date date,
  source character varying,
  status character varying DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  tags jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_opportunities_pkey PRIMARY KEY (id),
  CONSTRAINT crm_opportunities_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT crm_opportunities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id),
  CONSTRAINT crm_opportunities_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES public.crm_pipelines(id),
  CONSTRAINT crm_opportunities_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.crm_pipeline_stages(id),
  CONSTRAINT crm_opportunities_owner_persona_id_fkey FOREIGN KEY (owner_persona_id) REFERENCES public.personas(id)
);

-- 5.5. Atividades CRM
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  empresa_id uuid,
  lead_id uuid,
  opportunity_id uuid,
  persona_id uuid,
  type character varying CHECK (type IN ('call', 'email', 'meeting', 'task', 'note', 'demo')),
  subject character varying NOT NULL,
  description text,
  status character varying DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  priority character varying DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  duration_minutes integer,
  outcome character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_activities_pkey PRIMARY KEY (id),
  CONSTRAINT crm_activities_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT crm_activities_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id),
  CONSTRAINT crm_activities_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.crm_opportunities(id),
  CONSTRAINT crm_activities_persona_id_fkey FOREIGN KEY (persona_id) REFERENCES public.personas(id)
);

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- CRM Índices
CREATE INDEX IF NOT EXISTS idx_crm_leads_empresa_id ON public.crm_leads(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_empresa_id ON public.crm_opportunities(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_empresa_id ON public.crm_activities(empresa_id);

-- Auditoria Índices (apenas se as tabelas existirem)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_id ON public.audit_logs(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_executed_at ON public.audit_logs(executed_at);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON public.audit_logs(risk_level);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_audit_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_empresa_id ON public.security_audit_logs(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_timestamp ON public.security_audit_logs(event_timestamp);
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_security_level ON public.security_audit_logs(security_level);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_sync_logs_empresa_id ON public.sync_logs(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.sync_logs(started_at);
        CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.sync_logs(status);
    END IF;
END $$;

-- =====================================================
-- 7. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas CRM
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento
DO $$
BEGIN
    -- CRM Policies
    DROP POLICY IF EXISTS "Allow all operations" ON public.crm_pipelines;
    CREATE POLICY "Allow all operations" ON public.crm_pipelines FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Allow all operations" ON public.crm_pipeline_stages;
    CREATE POLICY "Allow all operations" ON public.crm_pipeline_stages FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Allow all operations" ON public.crm_leads;
    CREATE POLICY "Allow all operations" ON public.crm_leads FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Allow all operations" ON public.crm_opportunities;
    CREATE POLICY "Allow all operations" ON public.crm_opportunities FOR ALL USING (true);
    
    DROP POLICY IF EXISTS "Allow all operations" ON public.crm_activities;
    CREATE POLICY "Allow all operations" ON public.crm_activities FOR ALL USING (true);

    -- Audit tables policies (if they exist)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.audit_logs;
        CREATE POLICY "Allow all operations" ON public.audit_logs FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_reports') THEN
        ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.audit_reports;
        CREATE POLICY "Allow all operations" ON public.audit_reports FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_audit_logs') THEN
        ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.security_audit_logs;
        CREATE POLICY "Allow all operations" ON public.security_audit_logs FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'configuration_audit') THEN
        ALTER TABLE public.configuration_audit ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.configuration_audit;
        CREATE POLICY "Allow all operations" ON public.configuration_audit FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'data_audit_logs') THEN
        ALTER TABLE public.data_audit_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.data_audit_logs;
        CREATE POLICY "Allow all operations" ON public.data_audit_logs FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'compliance_audit') THEN
        ALTER TABLE public.compliance_audit ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.compliance_audit;
        CREATE POLICY "Allow all operations" ON public.compliance_audit FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_logs') THEN
        ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.sync_logs;
        CREATE POLICY "Allow all operations" ON public.sync_logs FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_alerts') THEN
        ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.system_alerts;
        CREATE POLICY "Allow all operations" ON public.system_alerts FOR ALL USING (true);
    END IF;
END $$;

-- =====================================================
-- 8. DADOS INICIAIS DE TESTE
-- =====================================================

-- Pipeline padrão para CRM
INSERT INTO public.crm_pipelines (id, empresa_id, name, description, is_default, is_active)
VALUES 
  (uuid_generate_v4(), null, 'Pipeline Padrão', 'Pipeline de vendas padrão do sistema', true, true)
ON CONFLICT DO NOTHING;

-- Estágios padrão
DO $$
DECLARE
    default_pipeline_id uuid;
BEGIN
    SELECT id INTO default_pipeline_id FROM public.crm_pipelines WHERE is_default = true LIMIT 1;
    
    IF default_pipeline_id IS NOT NULL THEN
        INSERT INTO public.crm_pipeline_stages (pipeline_id, name, description, sort_order, probability, stage_type) VALUES
        (default_pipeline_id, 'Lead Qualificado', 'Lead inicial identificado', 1, 10.00, 'open'),
        (default_pipeline_id, 'Proposta Enviada', 'Proposta comercial enviada', 2, 30.00, 'open'),
        (default_pipeline_id, 'Negociação', 'Em processo de negociação', 3, 60.00, 'open'),
        (default_pipeline_id, 'Fechado - Ganho', 'Venda realizada com sucesso', 4, 100.00, 'won'),
        (default_pipeline_id, 'Fechado - Perdido', 'Oportunidade perdida', 5, 0.00, 'lost')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 9. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar tabelas CRM criadas
SELECT 
  'CRM Tables Created' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('crm_pipelines', 'crm_pipeline_stages', 'crm_leads', 'crm_opportunities', 'crm_activities');

-- Lista detalhada das tabelas
SELECT 
  table_name as "Table Name",
  'OK' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE 'crm_%' 
    OR table_name LIKE 'audit_%' 
    OR table_name LIKE 'security_%'
    OR table_name IN ('sync_logs', 'system_alerts', 'configuration_audit', 'data_audit_logs', 'compliance_audit')
  )
ORDER BY table_name;

-- Verificar dados iniciais do CRM
SELECT 'CRM Pipeline criado' as info, COUNT(*) as total FROM public.crm_pipelines;
SELECT 'CRM Stages criados' as info, COUNT(*) as total FROM public.crm_pipeline_stages;

-- Mensagem final
SELECT 'IMPLEMENTACAO SUPABASE CONCLUIDA COM SUCESSO!' as resultado;