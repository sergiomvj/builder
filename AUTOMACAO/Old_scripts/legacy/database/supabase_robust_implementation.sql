-- =====================================================
-- VCM DASHBOARD - IMPLEMENTAÇÃO SUPABASE COMPLETA (VERSÃO ROBUSTA)
-- =====================================================
-- Execute este arquivo completo no Supabase SQL Editor
-- Versão com melhor tratamento de erros

-- =====================================================
-- 1. VERIFICAR TABELAS EXISTENTES
-- =====================================================
SELECT 'Verificando tabelas existentes...' as info;

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'audit_logs', 'audit_reports', 'security_audit_logs', 
    'configuration_audit', 'data_audit_logs', 'compliance_audit',
    'sync_logs', 'system_alerts',
    'crm_pipelines', 'crm_pipeline_stages', 'crm_leads', 
    'crm_opportunities', 'crm_activities'
  )
ORDER BY table_name;

-- =====================================================
-- 2. CRIAR TABELAS DE AUDITORIA
-- =====================================================
SELECT 'Criando tabelas de auditoria...' as info;

-- 2.1. Tabela principal de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  action_type character varying NOT NULL,
  entity_type character varying NOT NULL,
  entity_id uuid,
  entity_name character varying,
  actor_type character varying NOT NULL,
  actor_id uuid,
  actor_name character varying,
  actor_ip_address inet,
  user_agent text,
  action_description text NOT NULL,
  before_state jsonb,
  after_state jsonb,
  changes_summary jsonb,
  session_id character varying,
  request_id character varying,
  business_context character varying,
  automated boolean DEFAULT false,
  risk_level character varying CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  compliance_flags jsonb,
  retention_period interval DEFAULT interval '7 years',
  archived boolean DEFAULT false,
  executed_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- 2.2. Relatórios de auditoria
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  report_type character varying NOT NULL,
  title character varying NOT NULL,
  description text,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  generated_by_user_id uuid,
  generated_by_system boolean DEFAULT false,
  status character varying DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed', 'cancelled')),
  total_records integer DEFAULT 0,
  summary_data jsonb,
  findings jsonb,
  recommendations jsonb,
  compliance_score numeric,
  risk_assessment jsonb,
  file_path character varying,
  file_size bigint,
  file_format character varying,
  download_count integer DEFAULT 0,
  last_downloaded_at timestamp with time zone,
  retention_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT audit_reports_pkey PRIMARY KEY (id)
);

-- 2.3. Logs de segurança específicos
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  event_type character varying NOT NULL,
  event_category character varying NOT NULL,
  security_level character varying NOT NULL CHECK (security_level IN ('info', 'warning', 'critical', 'emergency')),
  source_system character varying,
  source_ip inet,
  target_resource character varying,
  user_id uuid,
  username character varying,
  session_id character varying,
  event_description text NOT NULL,
  event_details jsonb,
  threat_indicators jsonb,
  response_actions jsonb,
  investigation_status character varying DEFAULT 'new' CHECK (investigation_status IN ('new', 'investigating', 'resolved', 'false_positive')),
  assigned_to_user_id uuid,
  resolution_notes text,
  resolved_at timestamp with time zone,
  compliance_impact boolean DEFAULT false,
  requires_notification boolean DEFAULT false,
  notified_at timestamp with time zone,
  event_timestamp timestamp with time zone DEFAULT now(),
  CONSTRAINT security_audit_logs_pkey PRIMARY KEY (id)
);

-- 2.4. Auditoria de configuração
CREATE TABLE IF NOT EXISTS public.configuration_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  config_type character varying NOT NULL,
  config_key character varying NOT NULL,
  old_value jsonb,
  new_value jsonb,
  change_reason text,
  changed_by_user_id uuid,
  changed_by_system boolean DEFAULT false,
  validation_status character varying DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected', 'reverted')),
  impact_assessment text,
  approval_required boolean DEFAULT false,
  approved_by_user_id uuid,
  approved_at timestamp with time zone,
  effective_from timestamp with time zone DEFAULT now(),
  reverted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT configuration_audit_pkey PRIMARY KEY (id)
);

-- 2.5. Auditoria de dados
CREATE TABLE IF NOT EXISTS public.data_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  table_name character varying NOT NULL,
  operation character varying NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')),
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  changed_columns text[],
  transaction_id bigint,
  user_id uuid,
  application_name character varying,
  query_text text,
  execution_time_ms numeric,
  affected_rows integer DEFAULT 1,
  data_classification character varying CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted')),
  compliance_tags text[],
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT data_audit_logs_pkey PRIMARY KEY (id)
);

-- 2.6. Auditoria de compliance
CREATE TABLE IF NOT EXISTS public.compliance_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  regulation_type character varying NOT NULL,
  compliance_check character varying NOT NULL,
  check_description text,
  status character varying NOT NULL CHECK (status IN ('compliant', 'non_compliant', 'partial', 'not_applicable', 'pending_review')),
  evidence_data jsonb,
  risk_level character varying CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  remediation_required boolean DEFAULT false,
  remediation_plan text,
  responsible_user_id uuid,
  due_date date,
  last_checked_at timestamp with time zone DEFAULT now(),
  next_check_due timestamp with time zone,
  automated_check boolean DEFAULT false,
  external_auditor_notes text,
  certification_impact boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT compliance_audit_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 3. CRIAR TABELAS DE SINCRONIZAÇÃO
-- =====================================================
SELECT 'Criando tabelas de sincronização...' as info;

-- 3.1. Logs de sincronização
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  sync_type character varying NOT NULL,
  direction character varying NOT NULL CHECK (direction IN ('import', 'export', 'bidirectional')),
  source_system character varying NOT NULL,
  target_system character varying NOT NULL,
  status character varying DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'cancelled', 'partial')),
  total_records integer DEFAULT 0,
  processed_records integer DEFAULT 0,
  success_records integer DEFAULT 0,
  error_records integer DEFAULT 0,
  skipped_records integer DEFAULT 0,
  error_details jsonb,
  sync_config jsonb,
  data_filters jsonb,
  mapping_rules jsonb,
  validation_rules jsonb,
  performance_metrics jsonb,
  file_paths text[],
  batch_size integer DEFAULT 1000,
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  next_retry_at timestamp with time zone,
  CONSTRAINT sync_logs_pkey PRIMARY KEY (id)
);

-- 3.2. Alertas do sistema
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  alert_type character varying NOT NULL,
  severity character varying NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title character varying NOT NULL,
  message text NOT NULL,
  source_system character varying,
  source_component character varying,
  error_code character varying,
  context_data jsonb,
  affected_users uuid[],
  affected_systems text[],
  resolution_steps text[],
  status character varying DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'closed')),
  acknowledged_by_user_id uuid,
  acknowledged_at timestamp with time zone,
  resolved_by_user_id uuid,
  resolved_at timestamp with time zone,
  resolution_notes text,
  escalation_level integer DEFAULT 0,
  escalated_to_user_id uuid,
  escalated_at timestamp with time zone,
  auto_resolve boolean DEFAULT false,
  auto_resolve_at timestamp with time zone,
  notification_sent boolean DEFAULT false,
  notification_channels text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_alerts_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 4. CRIAR TABELAS CRM
-- =====================================================
SELECT 'Criando tabelas CRM...' as info;

-- 4.1. Pipelines de CRM
CREATE TABLE IF NOT EXISTS public.crm_pipelines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  name character varying NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_pipelines_pkey PRIMARY KEY (id)
);

-- 4.2. Estágios dos pipelines
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pipeline_id uuid,
  name character varying NOT NULL,
  description text,
  sort_order integer NOT NULL,
  probability numeric DEFAULT 0.00,
  is_closed boolean DEFAULT false,
  stage_type character varying CHECK (stage_type IN ('open', 'won', 'lost')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT crm_pipeline_stages_pkey PRIMARY KEY (id)
);

-- 4.3. Leads
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
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
  CONSTRAINT crm_leads_pkey PRIMARY KEY (id)
);

-- 4.4. Oportunidades
CREATE TABLE IF NOT EXISTS public.crm_opportunities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
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
  CONSTRAINT crm_opportunities_pkey PRIMARY KEY (id)
);

-- 4.5. Atividades CRM
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
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
  CONSTRAINT crm_activities_pkey PRIMARY KEY (id)
);

-- =====================================================
-- 5. VERIFICAR CRIAÇÃO DAS TABELAS
-- =====================================================
SELECT 'Verificando criação das tabelas...' as info;

DO $$
BEGIN
    -- Verificar se todas as tabelas foram criadas
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        RAISE NOTICE 'ERRO: Tabela audit_logs não foi criada!';
    ELSE
        RAISE NOTICE 'OK: Tabela audit_logs criada com sucesso';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_reports') THEN
        RAISE NOTICE 'ERRO: Tabela audit_reports não foi criada!';
    ELSE
        RAISE NOTICE 'OK: Tabela audit_reports criada com sucesso';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_audit_logs') THEN
        RAISE NOTICE 'ERRO: Tabela security_audit_logs não foi criada!';
    ELSE
        RAISE NOTICE 'OK: Tabela security_audit_logs criada com sucesso';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_logs') THEN
        RAISE NOTICE 'ERRO: Tabela sync_logs não foi criada!';
    ELSE
        RAISE NOTICE 'OK: Tabela sync_logs criada com sucesso';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_alerts') THEN
        RAISE NOTICE 'ERRO: Tabela system_alerts não foi criada!';
    ELSE
        RAISE NOTICE 'OK: Tabela system_alerts criada com sucesso';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_leads') THEN
        RAISE NOTICE 'ERRO: Tabela crm_leads não foi criada!';
    ELSE
        RAISE NOTICE 'OK: Tabela crm_leads criada com sucesso';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_opportunities') THEN
        RAISE NOTICE 'ERRO: Tabela crm_opportunities não foi criada!';
    ELSE
        RAISE NOTICE 'OK: Tabela crm_opportunities criada com sucesso';
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_activities') THEN
        RAISE NOTICE 'ERRO: Tabela crm_activities não foi criada!';
    ELSE
        RAISE NOTICE 'OK: Tabela crm_activities criada com sucesso';
    END IF;
END $$;

-- =====================================================
-- 6. VERIFICAR COLUNAS STATUS
-- =====================================================
SELECT 'Verificando colunas de status...' as info;

DO $$
BEGIN
    -- Verificar se as colunas status existem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_reports' AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'ERRO: Coluna status não encontrada em audit_reports!';
    ELSE
        RAISE NOTICE 'OK: Coluna status encontrada em audit_reports';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sync_logs' AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'ERRO: Coluna status não encontrada em sync_logs!';
    ELSE
        RAISE NOTICE 'OK: Coluna status encontrada em sync_logs';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_alerts' AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'ERRO: Coluna status não encontrada em system_alerts!';
    ELSE
        RAISE NOTICE 'OK: Coluna status encontrada em system_alerts';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_leads' AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'ERRO: Coluna status não encontrada em crm_leads!';
    ELSE
        RAISE NOTICE 'OK: Coluna status encontrada em crm_leads';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_opportunities' AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'ERRO: Coluna status não encontrada em crm_opportunities!';
    ELSE
        RAISE NOTICE 'OK: Coluna status encontrada em crm_opportunities';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_activities' AND column_name = 'status'
    ) THEN
        RAISE NOTICE 'ERRO: Coluna status não encontrada em crm_activities!';
    ELSE
        RAISE NOTICE 'OK: Coluna status encontrada em crm_activities';
    END IF;
END $$;

-- =====================================================
-- 7. CRIAR ÍNDICES (APENAS SE AS TABELAS E COLUNAS EXISTIREM)
-- =====================================================
SELECT 'Criando índices...' as info;

DO $$
BEGIN
    -- Criar índices para audit_logs
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_id ON public.audit_logs(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_executed_at ON public.audit_logs(executed_at);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON public.audit_logs(risk_level);
        RAISE NOTICE 'Índices criados para audit_logs';
    END IF;

    -- Criar índices para audit_reports
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_reports') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_reports' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_audit_reports_empresa_id ON public.audit_reports(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_audit_reports_status ON public.audit_reports(status);
        RAISE NOTICE 'Índices criados para audit_reports';
    END IF;

    -- Criar índices para security_audit_logs
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'security_audit_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_empresa_id ON public.security_audit_logs(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_timestamp ON public.security_audit_logs(event_timestamp);
        CREATE INDEX IF NOT EXISTS idx_security_audit_logs_security_level ON public.security_audit_logs(security_level);
        RAISE NOTICE 'Índices criados para security_audit_logs';
    END IF;

    -- Criar índices para outras tabelas de auditoria
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'configuration_audit') THEN
        CREATE INDEX IF NOT EXISTS idx_configuration_audit_empresa_id ON public.configuration_audit(empresa_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'data_audit_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_data_audit_logs_empresa_id ON public.data_audit_logs(empresa_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'compliance_audit') THEN
        CREATE INDEX IF NOT EXISTS idx_compliance_audit_empresa_id ON public.compliance_audit(empresa_id);
    END IF;

    -- Criar índices para sync_logs
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sync_logs') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sync_logs' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_sync_logs_empresa_id ON public.sync_logs(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.sync_logs(started_at);
        CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.sync_logs(status);
        RAISE NOTICE 'Índices criados para sync_logs';
    END IF;

    -- Criar índices para system_alerts
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'system_alerts') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'system_alerts' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_system_alerts_empresa_id ON public.system_alerts(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON public.system_alerts(status);
        CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON public.system_alerts(severity);
        RAISE NOTICE 'Índices criados para system_alerts';
    END IF;

    -- Criar índices para CRM
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_pipelines') THEN
        CREATE INDEX IF NOT EXISTS idx_crm_pipelines_empresa_id ON public.crm_pipelines(empresa_id);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_leads') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_crm_leads_empresa_id ON public.crm_leads(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);
        CREATE INDEX IF NOT EXISTS idx_crm_leads_owner_persona_id ON public.crm_leads(owner_persona_id);
        RAISE NOTICE 'Índices criados para crm_leads';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_opportunities') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_crm_opportunities_empresa_id ON public.crm_opportunities(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_crm_opportunities_status ON public.crm_opportunities(status);
        CREATE INDEX IF NOT EXISTS idx_crm_opportunities_pipeline_id ON public.crm_opportunities(pipeline_id);
        RAISE NOTICE 'Índices criados para crm_opportunities';
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_activities') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'crm_activities' AND column_name = 'status') THEN
        CREATE INDEX IF NOT EXISTS idx_crm_activities_empresa_id ON public.crm_activities(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_crm_activities_status ON public.crm_activities(status);
        CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON public.crm_activities(type);
        RAISE NOTICE 'Índices criados para crm_activities';
    END IF;
    
    RAISE NOTICE 'Criação de índices concluída!';
END $$;

-- =====================================================
-- 8. CONFIGURAR RLS (Row Level Security)
-- =====================================================
SELECT 'Configurando RLS...' as info;

DO $$
BEGIN
    -- Habilitar RLS e criar políticas apenas se as tabelas existirem
    
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

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_pipelines') THEN
        ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.crm_pipelines;
        CREATE POLICY "Allow all operations" ON public.crm_pipelines FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_pipeline_stages') THEN
        ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.crm_pipeline_stages;
        CREATE POLICY "Allow all operations" ON public.crm_pipeline_stages FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_leads') THEN
        ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.crm_leads;
        CREATE POLICY "Allow all operations" ON public.crm_leads FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_opportunities') THEN
        ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.crm_opportunities;
        CREATE POLICY "Allow all operations" ON public.crm_opportunities FOR ALL USING (true);
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_activities') THEN
        ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Allow all operations" ON public.crm_activities;
        CREATE POLICY "Allow all operations" ON public.crm_activities FOR ALL USING (true);
    END IF;

    RAISE NOTICE 'RLS configurado para todas as tabelas!';
END $$;

-- =====================================================
-- 9. DADOS INICIAIS PARA CRM
-- =====================================================
SELECT 'Inserindo dados iniciais...' as info;

DO $$
BEGIN
    -- Pipeline padrão para CRM
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_pipelines') THEN
        INSERT INTO public.crm_pipelines (id, empresa_id, name, description, is_default, is_active)
        VALUES (gen_random_uuid(), null, 'Pipeline Padrão', 'Pipeline de vendas padrão do sistema', true, true)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Pipeline padrão criado';
    END IF;
END $$;

DO $$
DECLARE
    default_pipeline_id uuid;
BEGIN
    -- Estágios padrão
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crm_pipeline_stages') THEN
        SELECT id INTO default_pipeline_id FROM public.crm_pipelines WHERE is_default = true LIMIT 1;
        
        IF default_pipeline_id IS NOT NULL THEN
            INSERT INTO public.crm_pipeline_stages (pipeline_id, name, description, sort_order, probability, stage_type) VALUES
            (default_pipeline_id, 'Lead Qualificado', 'Lead inicial identificado', 1, 10.00, 'open'),
            (default_pipeline_id, 'Proposta Enviada', 'Proposta comercial enviada', 2, 30.00, 'open'),
            (default_pipeline_id, 'Negociação', 'Em processo de negociação', 3, 60.00, 'open'),
            (default_pipeline_id, 'Fechado - Ganho', 'Venda realizada com sucesso', 4, 100.00, 'won'),
            (default_pipeline_id, 'Fechado - Perdido', 'Oportunidade perdida', 5, 0.00, 'lost')
            ON CONFLICT DO NOTHING;
            
            RAISE NOTICE 'Estágios do pipeline criados';
        END IF;
    END IF;
END $$;

-- =====================================================
-- 10. VERIFICAÇÃO FINAL
-- =====================================================
SELECT 'Realizando verificação final...' as info;

-- Listar tabelas criadas
SELECT 
  table_name as "Tabela",
  'Criada com sucesso' as "Status"
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE 'audit_%' 
    OR table_name LIKE 'security_%'
    OR table_name LIKE 'configuration_%'
    OR table_name LIKE 'data_%'
    OR table_name LIKE 'compliance_%'
    OR table_name LIKE 'sync_%'
    OR table_name LIKE 'system_%'
    OR table_name LIKE 'crm_%'
  )
ORDER BY table_name;

-- Contar por categoria
SELECT 
  CASE 
    WHEN table_name LIKE 'audit_%' THEN 'Sistema de Auditoria'
    WHEN table_name LIKE 'security_%' THEN 'Segurança'
    WHEN table_name LIKE 'sync_%' THEN 'Sincronização'
    WHEN table_name LIKE 'system_%' THEN 'Alertas do Sistema'
    WHEN table_name LIKE 'crm_%' THEN 'Sistema CRM'
    ELSE 'Outros'
  END as "Categoria",
  COUNT(*) as "Total de Tabelas"
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE 'audit_%' 
    OR table_name LIKE 'security_%'
    OR table_name LIKE 'sync_%'
    OR table_name LIKE 'system_%'
    OR table_name LIKE 'crm_%'
  )
GROUP BY 1
ORDER BY 1;

-- Verificar dados iniciais
SELECT 'Pipeline CRM criado' as "Info", COUNT(*) as "Total" FROM public.crm_pipelines;
SELECT 'Estágios CRM criados' as "Info", COUNT(*) as "Total" FROM public.crm_pipeline_stages;

-- =====================================================
-- 11. ADICIONAR FOREIGN KEY CONSTRAINTS (OPCIONAL)
-- =====================================================
-- Execute este bloco apenas se as tabelas empresas e personas existirem

/*
-- Uncomment and run this section if you have empresas and personas tables

-- Add foreign keys for audit tables
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.audit_reports ADD CONSTRAINT audit_reports_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.security_audit_logs ADD CONSTRAINT security_audit_logs_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.security_audit_logs ADD CONSTRAINT security_audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.personas(id);

-- Add foreign keys for sync tables
ALTER TABLE public.sync_logs ADD CONSTRAINT sync_logs_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.system_alerts ADD CONSTRAINT system_alerts_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

-- Add foreign keys for CRM tables
ALTER TABLE public.crm_pipelines ADD CONSTRAINT crm_pipelines_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.crm_pipeline_stages ADD CONSTRAINT crm_pipeline_stages_pipeline_id_fkey 
FOREIGN KEY (pipeline_id) REFERENCES public.crm_pipelines(id);

ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_owner_persona_id_fkey 
FOREIGN KEY (owner_persona_id) REFERENCES public.personas(id);

ALTER TABLE public.crm_opportunities ADD CONSTRAINT crm_opportunities_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.crm_opportunities ADD CONSTRAINT crm_opportunities_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id);

ALTER TABLE public.crm_opportunities ADD CONSTRAINT crm_opportunities_pipeline_id_fkey 
FOREIGN KEY (pipeline_id) REFERENCES public.crm_pipelines(id);

ALTER TABLE public.crm_opportunities ADD CONSTRAINT crm_opportunities_stage_id_fkey 
FOREIGN KEY (stage_id) REFERENCES public.crm_pipeline_stages(id);

ALTER TABLE public.crm_opportunities ADD CONSTRAINT crm_opportunities_owner_persona_id_fkey 
FOREIGN KEY (owner_persona_id) REFERENCES public.personas(id);

ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);

ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_lead_id_fkey 
FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id);

ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_opportunity_id_fkey 
FOREIGN KEY (opportunity_id) REFERENCES public.crm_opportunities(id);

ALTER TABLE public.crm_activities ADD CONSTRAINT crm_activities_persona_id_fkey 
FOREIGN KEY (persona_id) REFERENCES public.personas(id);
*/

SELECT 'Foreign key constraints comentados para execução posterior' as "Info";

-- Status final
SELECT 
  '🎉 IMPLEMENTAÇÃO SUPABASE CONCLUÍDA COM SUCESSO!' as "RESULTADO",
  COUNT(*) || ' tabelas criadas' as "DETALHES"
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE 'audit_%' 
    OR table_name LIKE 'security_%'
    OR table_name LIKE 'sync_%'
    OR table_name LIKE 'system_%'
    OR table_name LIKE 'crm_%'
  );