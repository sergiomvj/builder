-- =====================================================
-- VCM DASHBOARD - IMPLEMENTAÇÃO SUPABASE (PARTE 2)
-- =====================================================
-- Execute este bloco APÓS executar supabase_step1.sql

-- =====================================================
-- 3. CONTINUAÇÃO DO SISTEMA DE AUDITORIA
-- =====================================================

-- 3.1. Auditoria de configurações
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

-- 3.2. Auditoria de acesso a dados
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

-- 3.3. Auditoria de compliance
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
-- 4. SISTEMA DE SINCRONIZAÇÃO
-- =====================================================

-- 4.1. Logs de sincronização
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

-- 4.2. Alertas do sistema
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

-- Verificar criação
SELECT 'Tabelas de auditoria e sincronização criadas:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('configuration_audit', 'data_audit_logs', 'compliance_audit', 'sync_logs', 'system_alerts')
ORDER BY table_name;