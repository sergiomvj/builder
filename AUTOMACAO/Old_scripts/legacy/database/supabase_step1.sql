-- =====================================================
-- VCM DASHBOARD - IMPLEMENTAÇÃO SUPABASE (CORRIGIDO)
-- =====================================================
-- Execute este SQL no Supabase SQL Editor

-- IMPORTANTE: Execute linha por linha ou em blocos pequenos
-- para evitar timeouts e facilitar debug

-- =====================================================
-- 1. VERIFICAR SE TABELAS JÁ EXISTEM
-- =====================================================

-- Verificar tabelas existentes antes de executar
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
-- 2. SISTEMA DE AUDITORIA EXPANDIDO
-- =====================================================

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

-- 2.2. Relatórios de auditoria
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

-- 2.3. Auditoria de segurança  
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

-- =====================================================
-- 3. EXECUTAR PRÓXIMO BLOCO SEPARADAMENTE
-- =====================================================

-- Para continuar, execute os próximos blocos em uma nova consulta
-- Isso evita timeouts e facilita o debug de erros

-- Verificar se as tabelas foram criadas até aqui
SELECT 'Tabelas criadas até agora:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('audit_logs', 'audit_reports', 'security_audit_logs')
ORDER BY table_name;