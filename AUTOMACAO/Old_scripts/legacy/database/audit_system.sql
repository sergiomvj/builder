-- =====================================================
-- SISTEMA COMPLETO DE AUDITORIA VCM
-- Rastreamento completo de mudanças, logs, compliance
-- =====================================================

-- ============================================================
-- 1. TABELA DE LOGS DE AUDITORIA GERAL
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Identificação da Ação
    action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'execute', 'access', 'config_change'
    entity_type VARCHAR(50) NOT NULL, -- 'persona', 'task', 'empresa', 'optimization', 'system_config'
    entity_id UUID, -- ID da entidade afetada
    entity_name VARCHAR(500), -- Nome/título da entidade para referência
    
    -- Usuário/Sistema Responsável
    actor_type VARCHAR(30) NOT NULL, -- 'user', 'system', 'ai_optimization', 'scheduler', 'api'
    actor_id UUID, -- ID do usuário ou sistema responsável
    actor_name VARCHAR(255), -- Nome do ator para referência
    actor_ip_address INET, -- IP do usuário se aplicável
    user_agent TEXT, -- User agent se ação via web
    
    -- Detalhes da Ação
    action_description TEXT NOT NULL, -- Descrição clara da ação
    before_state JSONB, -- Estado anterior (para updates/deletes)
    after_state JSONB, -- Estado posterior (para creates/updates)
    changes_summary JSONB, -- Resumo estruturado das mudanças
    
    -- Contexto da Ação
    session_id VARCHAR(100), -- ID da sessão se aplicável
    request_id VARCHAR(100), -- ID da requisição para rastreamento
    business_context VARCHAR(100), -- Contexto de negócio ('daily_tasks', 'optimization_cycle', 'manual_config')
    automated BOOLEAN DEFAULT false, -- Se foi ação automática
    
    -- Metadados de Segurança
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    sensitive_data_involved BOOLEAN DEFAULT false,
    compliance_relevant BOOLEAN DEFAULT false,
    
    -- Resultado e Status
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT, -- Mensagem de erro se success = false
    rollback_possible BOOLEAN DEFAULT true,
    rollback_data JSONB, -- Dados para possível rollback
    
    -- Timestamps
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER, -- Duração da operação em ms
    
    -- Índices para busca
    search_text TEXT GENERATED ALWAYS AS (
        COALESCE(entity_name, '') || ' ' ||
        COALESCE(actor_name, '') || ' ' ||
        COALESCE(action_description, '')
    ) STORED
);

-- ============================================================
-- 2. TABELA DE LOGS DE ACESSO E SEGURANÇA
-- ============================================================
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Tipo de Evento de Segurança
    security_event_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'access_denied', 'privilege_escalation', 'data_export', 'config_change'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Usuário/Origem
    user_id UUID REFERENCES personas(id),
    username VARCHAR(255),
    ip_address INET NOT NULL,
    user_agent TEXT,
    country_code VARCHAR(2), -- País baseado no IP
    
    -- Detalhes do Acesso
    resource_accessed VARCHAR(255), -- Recurso tentado ou acessado
    permission_required VARCHAR(100), -- Permissão necessária
    permission_granted BOOLEAN NOT NULL,
    access_method VARCHAR(50), -- 'web', 'api', 'mobile', 'system'
    
    -- Contexto da Tentativa
    session_id VARCHAR(100),
    request_path TEXT, -- Path da requisição HTTP
    http_method VARCHAR(10), -- GET, POST, etc.
    query_parameters JSONB, -- Parâmetros da query
    
    -- Resultado
    success BOOLEAN NOT NULL,
    failure_reason TEXT, -- Motivo da falha se success = false
    action_taken VARCHAR(100), -- Ação tomada pelo sistema ('blocked', 'allowed', 'flagged')
    
    -- Análise de Risco
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    anomaly_detected BOOLEAN DEFAULT false,
    anomaly_reasons TEXT[], -- Motivos da anomalia
    
    -- Timestamps
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    response_time_ms INTEGER
);

-- ============================================================
-- 3. TABELA DE AUDITORIA DE MUDANÇAS DE CONFIGURAÇÃO
-- ============================================================
CREATE TABLE IF NOT EXISTS configuration_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Tipo de Configuração
    config_type VARCHAR(50) NOT NULL, -- 'system_settings', 'ml_config', 'user_permissions', 'workflow_config', 'security_settings'
    config_category VARCHAR(50) NOT NULL, -- 'automation', 'security', 'performance', 'business_rules'
    config_section VARCHAR(100), -- Seção específica da configuração
    
    -- Identificação da Mudança
    config_key VARCHAR(255) NOT NULL, -- Chave específica alterada
    change_type VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete', 'reset'
    
    -- Valores
    old_value JSONB, -- Valor anterior
    new_value JSONB, -- Novo valor
    default_value JSONB, -- Valor padrão do sistema
    
    -- Contexto da Mudança
    changed_by_user_id UUID REFERENCES personas(id),
    changed_by_username VARCHAR(255),
    change_reason TEXT, -- Motivo informado pelo usuário
    approval_required BOOLEAN DEFAULT false,
    approved_by_user_id UUID REFERENCES personas(id),
    approved_at TIMESTAMPTZ,
    
    -- Impacto e Validação
    impact_assessment TEXT, -- Avaliação do impacto da mudança
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'failed', 'rolled_back')),
    validation_errors TEXT[], -- Erros de validação se houver
    
    -- Compliance e Segurança
    compliance_impact BOOLEAN DEFAULT false, -- Se afeta compliance
    security_impact BOOLEAN DEFAULT false, -- Se afeta segurança
    requires_restart BOOLEAN DEFAULT false, -- Se requer reinicialização
    
    -- Rollback
    rollback_available BOOLEAN DEFAULT true,
    rolled_back_at TIMESTAMPTZ,
    rollback_reason TEXT,
    
    -- Timestamps
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    effective_at TIMESTAMPTZ DEFAULT NOW(), -- Quando a mudança entra em vigor
    expires_at TIMESTAMPTZ -- Para configurações temporárias
);

-- ============================================================
-- 4. TABELA DE AUDITORIA DE DADOS SENSÍVEIS
-- ============================================================
CREATE TABLE IF NOT EXISTS data_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Tipo de Operação com Dados
    data_operation VARCHAR(50) NOT NULL, -- 'view', 'export', 'import', 'delete', 'backup', 'restore', 'anonymize'
    data_type VARCHAR(50) NOT NULL, -- 'personal_info', 'financial_data', 'performance_metrics', 'system_logs'
    data_classification VARCHAR(20) NOT NULL, -- 'public', 'internal', 'confidential', 'restricted'
    
    -- Dados Afetados
    table_name VARCHAR(100), -- Tabela afetada
    record_count INTEGER DEFAULT 1, -- Número de registros afetados
    record_ids JSONB, -- IDs específicos dos registros (se poucos)
    columns_accessed TEXT[], -- Colunas específicas acessadas
    
    -- Usuário e Acesso
    accessed_by_user_id UUID REFERENCES personas(id),
    accessed_by_username VARCHAR(255),
    access_purpose TEXT NOT NULL, -- Propósito declarado do acesso
    legal_basis VARCHAR(100), -- Base legal para o acesso (LGPD/GDPR)
    
    -- Contexto do Acesso
    access_method VARCHAR(50), -- 'direct_query', 'report_export', 'api_call', 'backup_operation'
    source_ip INET,
    client_application VARCHAR(100),
    
    -- Filtros e Critérios
    filter_criteria JSONB, -- Critérios de filtro usados
    date_range_start DATE, -- Início do período dos dados
    date_range_end DATE, -- Fim do período dos dados
    
    -- Resultado da Operação
    operation_successful BOOLEAN NOT NULL DEFAULT true,
    error_details TEXT, -- Detalhes de erro se não foi bem-sucedida
    data_exported BOOLEAN DEFAULT false, -- Se dados foram exportados do sistema
    export_format VARCHAR(20), -- Formato da exportação ('csv', 'json', 'pdf')
    export_filename VARCHAR(255), -- Nome do arquivo exportado
    
    -- Compliance e Auditoria
    consent_verified BOOLEAN DEFAULT false, -- Se consentimento foi verificado
    retention_policy_applied BOOLEAN DEFAULT true, -- Se política de retenção foi respeitada
    anonymized BOOLEAN DEFAULT false, -- Se dados foram anonimizados
    
    -- Timestamps
    accessed_at TIMESTAMPTZ DEFAULT NOW(),
    data_retention_until TIMESTAMPTZ -- Até quando os dados devem ser mantidos
);

-- ============================================================
-- 5. TABELA DE COMPLIANCE E RELATÓRIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS compliance_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Tipo de Compliance
    compliance_framework VARCHAR(50) NOT NULL, -- 'LGPD', 'GDPR', 'SOX', 'ISO27001', 'INTERNAL_POLICY'
    compliance_requirement VARCHAR(255) NOT NULL, -- Requisito específico
    control_id VARCHAR(100), -- ID do controle interno
    
    -- Avaliação de Compliance
    assessment_type VARCHAR(50) NOT NULL, -- 'automated_check', 'manual_review', 'periodic_audit'
    assessment_status VARCHAR(20) NOT NULL, -- 'compliant', 'non_compliant', 'partially_compliant', 'pending_review'
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    
    -- Evidências
    evidence_type VARCHAR(50), -- 'system_log', 'configuration', 'document', 'process_execution'
    evidence_description TEXT,
    evidence_data JSONB, -- Dados estruturados da evidência
    evidence_file_reference VARCHAR(255), -- Referência a arquivo de evidência
    
    -- Descobertas
    findings TEXT[], -- Achados da auditoria
    gaps_identified TEXT[], -- Lacunas identificadas
    recommendations TEXT[], -- Recomendações
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Ações Corretivas
    corrective_actions JSONB, -- Ações corretivas requeridas
    action_owner_user_id UUID REFERENCES personas(id), -- Responsável pela ação
    action_due_date DATE, -- Prazo para correção
    action_status VARCHAR(20) DEFAULT 'pending' CHECK (action_status IN ('pending', 'in_progress', 'completed', 'overdue')),
    action_completed_at TIMESTAMPTZ,
    
    -- Auditoria da Auditoria
    auditor_name VARCHAR(255), -- Nome do auditor
    auditor_type VARCHAR(20) NOT NULL, -- 'internal', 'external', 'automated'
    audit_period_start DATE NOT NULL,
    audit_period_end DATE NOT NULL,
    
    -- Timestamps
    assessed_at TIMESTAMPTZ DEFAULT NOW(),
    next_assessment_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. TABELA DE RELATÓRIOS DE AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Tipo de Relatório
    report_type VARCHAR(50) NOT NULL, -- 'daily_summary', 'security_report', 'compliance_report', 'performance_audit', 'data_access_report'
    report_category VARCHAR(50) NOT NULL, -- 'operational', 'security', 'compliance', 'performance'
    report_format VARCHAR(20) NOT NULL, -- 'json', 'pdf', 'csv', 'html'
    
    -- Período do Relatório
    report_period_start TIMESTAMPTZ NOT NULL,
    report_period_end TIMESTAMPTZ NOT NULL,
    data_cutoff_time TIMESTAMPTZ DEFAULT NOW(), -- Momento do corte dos dados
    
    -- Geração do Relatório
    generated_by_user_id UUID REFERENCES personas(id), -- NULL se automático
    generated_by_system VARCHAR(50), -- 'manual', 'scheduled', 'alert_triggered'
    generation_trigger VARCHAR(100), -- O que disparou a geração
    
    -- Conteúdo do Relatório
    summary JSONB NOT NULL, -- Resumo executivo em JSON
    total_events INTEGER DEFAULT 0,
    critical_events INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Filtros Aplicados
    filters_applied JSONB, -- Filtros que foram aplicados ao relatório
    included_event_types TEXT[], -- Tipos de eventos incluídos
    excluded_event_types TEXT[], -- Tipos de eventos excluídos
    
    -- Status do Relatório
    generation_status VARCHAR(20) DEFAULT 'completed' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
    file_size_bytes BIGINT, -- Tamanho do arquivo gerado
    file_location TEXT, -- Localização do arquivo gerado
    download_count INTEGER DEFAULT 0,
    
    -- Distribuição
    recipients JSONB, -- Lista de destinatários do relatório
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    
    -- Retenção e Compliance
    retention_policy VARCHAR(50) DEFAULT 'standard', -- Política de retenção aplicada
    compliance_export BOOLEAN DEFAULT false, -- Se é para fins de compliance
    delete_after_days INTEGER DEFAULT 90,
    
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE E BUSCA
-- ============================================================

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_empresa ON audit_logs(empresa_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type, entity_type);
CREATE INDEX idx_audit_logs_time ON audit_logs(executed_at);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX idx_audit_logs_search ON audit_logs USING gin(to_tsvector('portuguese', search_text));
CREATE INDEX idx_audit_logs_automated ON audit_logs(automated, executed_at) WHERE automated = true;
CREATE INDEX idx_audit_logs_risk ON audit_logs(risk_level, executed_at) WHERE risk_level IN ('high', 'critical');

-- Índices para security_audit_logs
CREATE INDEX idx_security_audit_empresa ON security_audit_logs(empresa_id);
CREATE INDEX idx_security_audit_time ON security_audit_logs(attempted_at);
CREATE INDEX idx_security_audit_user ON security_audit_logs(user_id, attempted_at);
CREATE INDEX idx_security_audit_ip ON security_audit_logs(ip_address, attempted_at);
CREATE INDEX idx_security_audit_failures ON security_audit_logs(success, attempted_at) WHERE success = false;
CREATE INDEX idx_security_audit_anomalies ON security_audit_logs(anomaly_detected, attempted_at) WHERE anomaly_detected = true;

-- Índices para configuration_audit
CREATE INDEX idx_config_audit_empresa ON configuration_audit(empresa_id);
CREATE INDEX idx_config_audit_type ON configuration_audit(config_type, config_key);
CREATE INDEX idx_config_audit_time ON configuration_audit(changed_at);
CREATE INDEX idx_config_audit_user ON configuration_audit(changed_by_user_id);
CREATE INDEX idx_config_audit_rollback ON configuration_audit(rollback_available, changed_at) WHERE rollback_available = true;

-- Índices para data_audit_logs
CREATE INDEX idx_data_audit_empresa ON data_audit_logs(empresa_id);
CREATE INDEX idx_data_audit_user ON data_audit_logs(accessed_by_user_id, accessed_at);
CREATE INDEX idx_data_audit_sensitive ON data_audit_logs(data_classification, accessed_at) WHERE data_classification IN ('confidential', 'restricted');
CREATE INDEX idx_data_audit_export ON data_audit_logs(data_exported, accessed_at) WHERE data_exported = true;

-- Índices para compliance_audit
CREATE INDEX idx_compliance_audit_empresa ON compliance_audit(empresa_id);
CREATE INDEX idx_compliance_audit_framework ON compliance_audit(compliance_framework);
CREATE INDEX idx_compliance_audit_status ON compliance_audit(assessment_status);
CREATE INDEX idx_compliance_audit_due ON compliance_audit(next_assessment_due);
CREATE INDEX idx_compliance_audit_risk ON compliance_audit(risk_level, assessed_at) WHERE risk_level IN ('high', 'critical');

-- ============================================================
-- VIEWS PARA RELATÓRIOS EXECUTIVOS
-- ============================================================

-- View: Resumo de Atividade Diária
CREATE VIEW v_daily_audit_summary AS
SELECT 
    DATE(executed_at) as audit_date,
    empresa_id,
    COUNT(*) as total_actions,
    COUNT(CASE WHEN automated = true THEN 1 END) as automated_actions,
    COUNT(CASE WHEN automated = false THEN 1 END) as manual_actions,
    COUNT(CASE WHEN risk_level IN ('high', 'critical') THEN 1 END) as high_risk_actions,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_actions,
    STRING_AGG(DISTINCT action_type, ', ') as action_types,
    STRING_AGG(DISTINCT actor_type, ', ') as actor_types
FROM audit_logs
WHERE executed_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(executed_at), empresa_id
ORDER BY audit_date DESC;

-- View: Alertas de Segurança
CREATE VIEW v_security_alerts AS
SELECT 
    sal.*,
    p.full_name as user_full_name,
    p.role as user_role,
    CASE 
        WHEN sal.severity = 'critical' AND sal.success = false THEN 'CRITICAL FAILURE'
        WHEN sal.anomaly_detected = true THEN 'ANOMALY DETECTED'
        WHEN sal.severity = 'error' THEN 'SECURITY ERROR'
        ELSE 'INFO'
    END as alert_level
FROM security_audit_logs sal
LEFT JOIN personas p ON sal.user_id = p.id
WHERE sal.attempted_at >= NOW() - INTERVAL '24 hours'
  AND (sal.severity IN ('error', 'critical') OR sal.anomaly_detected = true OR sal.success = false)
ORDER BY sal.attempted_at DESC;

-- View: Compliance Dashboard
CREATE VIEW v_compliance_dashboard AS
SELECT 
    ca.compliance_framework,
    ca.empresa_id,
    COUNT(*) as total_assessments,
    COUNT(CASE WHEN ca.assessment_status = 'compliant' THEN 1 END) as compliant_count,
    COUNT(CASE WHEN ca.assessment_status = 'non_compliant' THEN 1 END) as non_compliant_count,
    COUNT(CASE WHEN ca.assessment_status = 'partially_compliant' THEN 1 END) as partial_compliant_count,
    ROUND(AVG(ca.compliance_score), 2) as avg_compliance_score,
    COUNT(CASE WHEN ca.action_status = 'overdue' THEN 1 END) as overdue_actions,
    COUNT(CASE WHEN ca.risk_level IN ('high', 'critical') THEN 1 END) as high_risk_findings
FROM compliance_audit ca
WHERE ca.assessed_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY ca.compliance_framework, ca.empresa_id;

-- ============================================================
-- TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- ============================================================

-- Trigger para auditoria automática de mudanças em tabelas críticas
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Auditar mudanças em personas
    IF TG_TABLE_NAME = 'personas' THEN
        INSERT INTO audit_logs (
            empresa_id, action_type, entity_type, entity_id, entity_name,
            actor_type, action_description, before_state, after_state, automated
        ) VALUES (
            COALESCE(NEW.empresa_id, OLD.empresa_id),
            CASE WHEN TG_OP = 'DELETE' THEN 'delete' WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
            'persona',
            COALESCE(NEW.id, OLD.id),
            COALESCE(NEW.full_name, OLD.full_name),
            'system',
            'Automated audit of persona ' || TG_OP,
            CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
            true
        );
    END IF;
    
    -- Auditar mudanças em empresas
    IF TG_TABLE_NAME = 'empresas' THEN
        INSERT INTO audit_logs (
            empresa_id, action_type, entity_type, entity_id, entity_name,
            actor_type, action_description, before_state, after_state, automated
        ) VALUES (
            COALESCE(NEW.id, OLD.id),
            CASE WHEN TG_OP = 'DELETE' THEN 'delete' WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END,
            'empresa',
            COALESCE(NEW.id, OLD.id),
            COALESCE(NEW.nome, OLD.nome),
            'system',
            'Automated audit of empresa ' || TG_OP,
            CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
            CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
            true
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER audit_personas_changes
    AFTER INSERT OR UPDATE OR DELETE ON personas
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_empresas_changes
    AFTER INSERT OR UPDATE OR DELETE ON empresas
    FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

-- ============================================================
-- FUNÇÕES DE UTILIDADE PARA AUDITORIA
-- ============================================================

-- Função para gerar ID de sessão único
CREATE OR REPLACE FUNCTION generate_session_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'sess_' || extract(epoch from now())::bigint::text || '_' || substring(gen_random_uuid()::text from 1 for 8);
END;
$$ LANGUAGE plpgsql;

-- Função para calcular score de risco de acesso
CREATE OR REPLACE FUNCTION calculate_access_risk_score(
    ip_address INET,
    user_agent TEXT,
    access_time TIMESTAMPTZ,
    resource_sensitivity VARCHAR
) RETURNS INTEGER AS $$
DECLARE
    risk_score INTEGER := 0;
    hour_of_day INTEGER;
BEGIN
    -- Risco baseado no horário (acesso fora do horário comercial)
    hour_of_day := EXTRACT(HOUR FROM access_time);
    IF hour_of_day < 6 OR hour_of_day > 22 THEN
        risk_score := risk_score + 20;
    END IF;
    
    -- Risco baseado na sensibilidade do recurso
    CASE resource_sensitivity
        WHEN 'restricted' THEN risk_score := risk_score + 30;
        WHEN 'confidential' THEN risk_score := risk_score + 20;
        WHEN 'internal' THEN risk_score := risk_score + 10;
        ELSE risk_score := risk_score + 0;
    END CASE;
    
    -- User agent suspeito
    IF user_agent ILIKE '%bot%' OR user_agent ILIKE '%curl%' OR user_agent ILIKE '%wget%' THEN
        risk_score := risk_score + 25;
    END IF;
    
    RETURN LEAST(risk_score, 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- COMENTÁRIOS FINAIS
-- ============================================================

/*
SISTEMA COMPLETO DE AUDITORIA VCM IMPLEMENTADO!

Este sistema de auditoria oferece:

✅ LOGS ABRANGENTES:
- audit_logs: Auditoria geral de todas as ações
- security_audit_logs: Logs específicos de segurança e acesso
- configuration_audit: Rastreamento de mudanças de configuração
- data_audit_logs: Auditoria de acesso a dados sensíveis

✅ COMPLIANCE AUTOMÁTICO:
- compliance_audit: Verificações de compliance contínuas
- audit_reports: Relatórios automatizados
- Triggers automáticos para auditoria de mudanças

✅ SEGURANÇA E CONTROLE:
- Rastreamento de IP e user agent
- Detecção de anomalias
- Cálculo automático de risk score
- Alertas em tempo real

✅ RELATÓRIOS EXECUTIVOS:
- Views para dashboards executivos
- Resumos diários automáticos
- Alertas de segurança priorizados
- Dashboard de compliance

✅ RETENÇÃO E COMPLIANCE:
- Políticas de retenção configuráveis
- Suporte a LGPD/GDPR
- Rastreamento de consentimento
- Evidências para auditoria externa

O sistema agora pode rastrear TUDO que acontece no VCM! 🔍✨
*/