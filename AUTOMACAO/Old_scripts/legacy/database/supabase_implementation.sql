-- =====================================================
-- VCM DASHBOARD - IMPLEMENTAÇÃO SUPABASE
-- =====================================================
-- Execute este SQL no Supabase SQL Editor para implementar
-- todos os módulos que faltam no sistema

-- =====================================================
-- 1. SISTEMA DE AUDITORIA EXPANDIDO
-- =====================================================

-- Tabela principal de logs de auditoria
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
  risk_level character varying DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  sensitive_data_involved boolean DEFAULT false,
  compliance_relevant boolean DEFAULT false,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  rollback_possible boolean DEFAULT true,
  rollback_data jsonb,
  executed_at timestamp with time zone DEFAULT now(),
  duration_ms integer,
  search_text text,
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

-- Relatórios de auditoria
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  report_type character varying NOT NULL,
  report_category character varying NOT NULL,
  report_format character varying NOT NULL,
  report_period_start timestamp with time zone NOT NULL,
  report_period_end timestamp with time zone NOT NULL,
  data_cutoff_time timestamp with time zone DEFAULT now(),
  generated_by_user_id uuid,
  generated_by_system character varying,
  generation_trigger character varying,
  summary jsonb NOT NULL,
  total_events integer DEFAULT 0,
  critical_events integer DEFAULT 0,
  warnings_count integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  filters_applied jsonb,
  included_event_types text[],
  excluded_event_types text[],
  generation_status character varying DEFAULT 'completed' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  file_size_bytes bigint,
  file_location text,
  download_count integer DEFAULT 0,
  recipients jsonb,
  email_sent boolean DEFAULT false,
  email_sent_at timestamp with time zone,
  retention_policy character varying DEFAULT 'standard',
  compliance_export boolean DEFAULT false,
  delete_after_days integer DEFAULT 90,
  generated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  last_accessed_at timestamp with time zone,
  CONSTRAINT audit_reports_pkey PRIMARY KEY (id),
  CONSTRAINT audit_reports_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT audit_reports_generated_by_user_id_fkey FOREIGN KEY (generated_by_user_id) REFERENCES public.personas(id)
);

-- Auditoria de segurança
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
  CONSTRAINT security_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT security_audit_logs_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT security_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.personas(id)
);

-- Auditoria de configurações
CREATE TABLE IF NOT EXISTS public.configuration_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  config_type character varying NOT NULL,
  config_category character varying NOT NULL,
  config_section character varying,
  config_key character varying NOT NULL,
  change_type character varying NOT NULL,
  old_value jsonb,
  new_value jsonb,
  default_value jsonb,
  changed_by_user_id uuid,
  changed_by_username character varying,
  change_reason text,
  approval_required boolean DEFAULT false,
  approved_by_user_id uuid,
  approved_at timestamp with time zone,
  impact_assessment text,
  validation_status character varying DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'failed', 'rolled_back')),
  validation_errors text[],
  compliance_impact boolean DEFAULT false,
  security_impact boolean DEFAULT false,
  requires_restart boolean DEFAULT false,
  rollback_available boolean DEFAULT true,
  rolled_back_at timestamp with time zone,
  rollback_reason text,
  changed_at timestamp with time zone DEFAULT now(),
  effective_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT configuration_audit_pkey PRIMARY KEY (id),
  CONSTRAINT configuration_audit_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT configuration_audit_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.personas(id),
  CONSTRAINT configuration_audit_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.personas(id)
);

-- Auditoria de acesso a dados
CREATE TABLE IF NOT EXISTS public.data_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  data_operation character varying NOT NULL,
  data_type character varying NOT NULL,
  data_classification character varying NOT NULL,
  table_name character varying,
  record_count integer DEFAULT 1,
  record_ids jsonb,
  columns_accessed text[],
  accessed_by_user_id uuid,
  accessed_by_username character varying,
  access_purpose text NOT NULL,
  legal_basis character varying,
  access_method character varying,
  source_ip inet,
  client_application character varying,
  filter_criteria jsonb,
  date_range_start date,
  date_range_end date,
  operation_successful boolean NOT NULL DEFAULT true,
  error_details text,
  data_exported boolean DEFAULT false,
  export_format character varying,
  export_filename character varying,
  consent_verified boolean DEFAULT false,
  retention_policy_applied boolean DEFAULT true,
  anonymized boolean DEFAULT false,
  accessed_at timestamp with time zone DEFAULT now(),
  data_retention_until timestamp with time zone,
  CONSTRAINT data_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT data_audit_logs_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT data_audit_logs_accessed_by_user_id_fkey FOREIGN KEY (accessed_by_user_id) REFERENCES public.personas(id)
);

-- Auditoria de compliance
CREATE TABLE IF NOT EXISTS public.compliance_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  compliance_framework character varying NOT NULL,
  compliance_requirement character varying NOT NULL,
  control_id character varying,
  assessment_type character varying NOT NULL,
  assessment_status character varying NOT NULL,
  compliance_score integer CHECK (compliance_score >= 0 AND compliance_score <= 100),
  evidence_type character varying,
  evidence_description text,
  evidence_data jsonb,
  evidence_file_reference character varying,
  findings text[],
  gaps_identified text[],
  recommendations text[],
  risk_level character varying DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  corrective_actions jsonb,
  action_owner_user_id uuid,
  action_due_date date,
  action_status character varying DEFAULT 'pending' CHECK (action_status IN ('pending', 'in_progress', 'completed', 'overdue')),
  action_completed_at timestamp with time zone,
  auditor_name character varying,
  auditor_type character varying NOT NULL,
  audit_period_start date NOT NULL,
  audit_period_end date NOT NULL,
  assessed_at timestamp with time zone DEFAULT now(),
  next_assessment_due timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT compliance_audit_pkey PRIMARY KEY (id),
  CONSTRAINT compliance_audit_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT compliance_audit_action_owner_user_id_fkey FOREIGN KEY (action_owner_user_id) REFERENCES public.personas(id)
);

-- =====================================================
-- 2. SISTEMA DE SINCRONIZAÇÃO
-- =====================================================

-- Logs de sincronização
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  sync_type character varying NOT NULL,
  source_system character varying NOT NULL,
  target_system character varying NOT NULL,
  sync_direction character varying CHECK (sync_direction IN ('bidirectional', 'source_to_target', 'target_to_source')),
  entity_type character varying,
  entity_count integer DEFAULT 0,
  status character varying CHECK (status IN ('success', 'failed', 'partial', 'in_progress')),
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  error_message text,
  sync_details jsonb,
  CONSTRAINT sync_logs_pkey PRIMARY KEY (id),
  CONSTRAINT sync_logs_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id)
);

-- Alertas do sistema
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  empresa_id uuid,
  alert_type character varying NOT NULL,
  severity character varying CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title character varying NOT NULL,
  description text,
  source_system character varying,
  entity_type character varying,
  entity_id uuid,
  metadata jsonb,
  status character varying DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by uuid,
  acknowledged_at timestamp with time zone,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT system_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT system_alerts_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id),
  CONSTRAINT system_alerts_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.personas(id)
);

-- =====================================================
-- 3. SISTEMA CRM
-- =====================================================

-- Pipelines de CRM
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

-- Estágios dos pipelines
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

-- Leads
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

-- Oportunidades
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

-- Atividades CRM
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
-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_id ON public.audit_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_executed_at ON public.audit_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON public.audit_logs(risk_level);

-- Índices para security_audit_logs
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_empresa_id ON public.security_audit_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_timestamp ON public.security_audit_logs(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_security_level ON public.security_audit_logs(security_level);

-- Índices para sync_logs
CREATE INDEX IF NOT EXISTS idx_sync_logs_empresa_id ON public.sync_logs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON public.sync_logs(status);

-- Índices para CRM
CREATE INDEX IF NOT EXISTS idx_crm_leads_empresa_id ON public.crm_leads(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_empresa_id ON public.crm_opportunities(empresa_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_empresa_id ON public.crm_activities(empresa_id);

-- =====================================================
-- 5. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento (ajuste conforme necessário)
CREATE POLICY "Allow all operations" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.audit_reports FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.security_audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.configuration_audit FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.data_audit_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.compliance_audit FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.sync_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.system_alerts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.crm_pipelines FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.crm_pipeline_stages FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.crm_leads FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.crm_opportunities FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON public.crm_activities FOR ALL USING (true);

-- =====================================================
-- 6. DADOS INICIAIS DE TESTE
-- =====================================================

-- Inserir pipeline padrão para CRM
INSERT INTO public.crm_pipelines (id, empresa_id, name, description, is_default, is_active)
VALUES 
  (uuid_generate_v4(), null, 'Pipeline Padrão', 'Pipeline de vendas padrão do sistema', true, true)
ON CONFLICT DO NOTHING;

-- Inserir estágios padrão
WITH default_pipeline AS (
  SELECT id FROM public.crm_pipelines WHERE is_default = true LIMIT 1
)
INSERT INTO public.crm_pipeline_stages (pipeline_id, name, description, sort_order, probability, stage_type)
SELECT 
  dp.id,
  stage_name,
  stage_desc,
  stage_order,
  stage_prob,
  stage_type_val
FROM default_pipeline dp,
(VALUES 
  ('Lead Qualificado', 'Lead inicial identificado', 1, 10.00, 'open'),
  ('Proposta Enviada', 'Proposta comercial enviada', 2, 30.00, 'open'),
  ('Negociação', 'Em processo de negociação', 3, 60.00, 'open'),
  ('Fechado - Ganho', 'Venda realizada com sucesso', 4, 100.00, 'won'),
  ('Fechado - Perdido', 'Oportunidade perdida', 5, 0.00, 'lost')
) AS stages(stage_name, stage_desc, stage_order, stage_prob, stage_type_val)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 
  table_name,
  table_schema
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

-- Verificar se os dados iniciais foram inseridos
SELECT 'CRM Pipeline criado:' as info, COUNT(*) as total FROM public.crm_pipelines;
SELECT 'CRM Stages criados:' as info, COUNT(*) as total FROM public.crm_pipeline_stages;

-- Sucesso!
SELECT 'IMPLEMENTAÇÃO CONCLUÍDA COM SUCESSO!' as status;