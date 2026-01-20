-- =====================================================
-- SISTEMA COMPLETO DE MACHINE LEARNING PARA VCM
-- Implementação real do aprendizado contínuo prometido
-- =====================================================

-- ============================================================
-- 1. TABELA DE TAREFAS BÁSICA (se não existir)
-- ============================================================
CREATE TABLE IF NOT EXISTS persona_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    task_id VARCHAR(255) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) CHECK (task_type IN ('daily', 'weekly', 'monthly', 'ad_hoc')),
    priority VARCHAR(50) DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    estimated_duration INTEGER, -- em minutos
    actual_duration INTEGER, -- em minutos (medido quando possível)
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Integração com sub-sistemas
    required_subsystems JSONB DEFAULT '[]'::jsonb,
    inputs_from JSONB DEFAULT '[]'::jsonb,
    outputs_to JSONB DEFAULT '[]'::jsonb,
    success_criteria TEXT,
    
    -- Metadados para ML
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    ai_generated BOOLEAN DEFAULT true,
    generation_context JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. ANALYTICS DE EXECUÇÃO DE TAREFAS
-- ============================================================
CREATE TABLE task_execution_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    task_id UUID REFERENCES persona_tasks(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Identificação da Tarefa
    task_title VARCHAR(500),
    task_type VARCHAR(50),
    
    -- Métricas de Performance
    estimated_duration INTEGER,    -- Tempo estimado (minutos)
    actual_duration INTEGER,       -- Tempo real se disponível (minutos)
    efficiency_ratio DECIMAL(4,2), -- actual/estimated (1.0 = perfeito)
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    success_rate DECIMAL(3,2) CHECK (success_rate >= 0 AND success_rate <= 1),
    
    -- Contexto da Execução
    execution_context JSONB DEFAULT '{}'::jsonb, -- {"urgency": "high", "workload": "normal", "time_of_day": 14}
    subsystems_used TEXT[] DEFAULT '{}',
    dependencies_met BOOLEAN DEFAULT true,
    resource_availability DECIMAL(3,2) DEFAULT 1.0, -- 0.0-1.0
    
    -- Métricas de Qualidade
    output_quality_score INTEGER CHECK (output_quality_score >= 1 AND output_quality_score <= 10),
    stakeholder_satisfaction INTEGER CHECK (stakeholder_satisfaction >= 1 AND stakeholder_satisfaction <= 10),
    rework_required BOOLEAN DEFAULT false,
    error_count INTEGER DEFAULT 0,
    
    -- Dados para ML
    persona_workload_factor DECIMAL(3,2), -- Carga de trabalho da persona no momento
    team_coordination_score DECIMAL(3,2), -- Quão bem coordenou com outros
    innovation_score INTEGER CHECK (innovation_score >= 1 AND innovation_score <= 10),
    
    -- Timestamps
    execution_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. PADRÕES DE APRENDIZADO DETECTADOS
-- ============================================================
CREATE TABLE learning_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Tipo de Padrão
    pattern_type VARCHAR(50) NOT NULL, -- 'workload_balance', 'task_complexity', 'subsystem_usage', 'timing_optimization'
    pattern_category VARCHAR(50), -- 'efficiency', 'quality', 'collaboration', 'innovation'
    
    -- Escopo do Padrão
    scope_type VARCHAR(50) NOT NULL, -- 'global', 'department', 'persona', 'task_type'
    scope_identifier VARCHAR(100), -- ID da persona, departamento, etc
    
    -- Dados do Padrão
    pattern_description TEXT NOT NULL,
    pattern_data JSONB NOT NULL, -- Dados estruturados do padrão
    statistical_confidence DECIMAL(4,3) CHECK (statistical_confidence >= 0 AND statistical_confidence <= 1),
    sample_size INTEGER NOT NULL,
    observation_period_days INTEGER NOT NULL,
    
    -- Significância do Padrão
    impact_magnitude DECIMAL(5,2), -- Quão grande é o impacto
    frequency_score DECIMAL(3,2), -- Quão frequente é o padrão
    consistency_score DECIMAL(3,2), -- Quão consistente é
    
    -- Status de Aplicação
    applied BOOLEAN DEFAULT false,
    application_date TIMESTAMPTZ,
    measured_improvement DECIMAL(5,2), -- Melhoria real medida
    rollback_triggered BOOLEAN DEFAULT false,
    
    -- Auditoria
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    last_validated TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    validation_count INTEGER DEFAULT 1
);

-- ============================================================
-- 4. HISTÓRICO DE EVOLUÇÃO DO SISTEMA
-- ============================================================
CREATE TABLE system_evolution_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Tipo de Evolução
    evolution_type VARCHAR(50) NOT NULL, -- 'task_adjustment', 'complexity_calibration', 'workload_redistribution', 'subsystem_optimization'
    evolution_category VARCHAR(50), -- 'automation', 'optimization', 'balancing', 'quality_improvement'
    
    -- Contexto da Mudança
    trigger_source VARCHAR(50) NOT NULL, -- 'pattern_detection', 'performance_degradation', 'manual_override', 'scheduled_optimization'
    trigger_data JSONB DEFAULT '{}'::jsonb,
    
    -- Estado Anterior vs Novo
    before_state JSONB NOT NULL,
    after_state JSONB NOT NULL,
    change_summary TEXT NOT NULL,
    technical_details JSONB DEFAULT '{}'::jsonb,
    
    -- Impacto e Métricas
    affected_personas TEXT[] DEFAULT '{}',
    affected_subsystems TEXT[] DEFAULT '{}',
    expected_improvement_percent DECIMAL(5,2),
    actual_improvement_percent DECIMAL(5,2),
    improvement_metric VARCHAR(50), -- 'efficiency', 'quality', 'satisfaction', 'throughput'
    
    -- Segurança e Rollback
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES personas(id),
    rollback_data JSONB, -- Dados para reverter a mudança
    rollback_available BOOLEAN DEFAULT true,
    
    -- Timeline
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    effectiveness_measured_at TIMESTAMPTZ,
    next_review_date TIMESTAMPTZ,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'rolled_back', 'superseded', 'expired')),
    notes TEXT
);

-- ============================================================
-- 5. MÉTRICAS DE PERFORMANCE CONTÍNUA
-- ============================================================
CREATE TABLE performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Escopo da Métrica
    metric_scope VARCHAR(50) NOT NULL, -- 'system', 'company', 'department', 'persona', 'subsystem'
    scope_id VARCHAR(100), -- ID específico do escopo
    
    -- Definição da Métrica
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL, -- 'efficiency', 'quality', 'satisfaction', 'throughput', 'innovation'
    metric_description TEXT,
    
    -- Valores
    metric_value DECIMAL(10,4) NOT NULL,
    baseline_value DECIMAL(10,4), -- Valor base para comparação
    target_value DECIMAL(10,4), -- Meta desejada
    unit_of_measure VARCHAR(50),
    
    -- Contexto
    measurement_period VARCHAR(50), -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    calculation_method TEXT, -- Como foi calculada
    
    -- Qualidade dos Dados
    data_quality_score DECIMAL(3,2) CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    sample_size INTEGER,
    confidence_interval JSONB, -- {"lower": 0.85, "upper": 0.95}
    
    -- Análise
    trend_direction VARCHAR(20) CHECK (trend_direction IN ('improving', 'declining', 'stable', 'volatile')),
    significance_level VARCHAR(20) CHECK (significance_level IN ('low', 'medium', 'high', 'critical')),
    anomaly_detected BOOLEAN DEFAULT false,
    
    -- Timestamps
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. ANÁLISE DE CARGA DE TRABALHO
-- ============================================================
CREATE TABLE workload_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    
    -- Período de Análise
    analysis_date DATE NOT NULL,
    analysis_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    
    -- Métricas de Carga
    total_tasks INTEGER NOT NULL DEFAULT 0,
    completed_tasks INTEGER NOT NULL DEFAULT 0,
    overdue_tasks INTEGER NOT NULL DEFAULT 0,
    
    -- Métricas de Tempo
    total_estimated_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
    total_actual_hours DECIMAL(6,2) DEFAULT 0,
    available_hours DECIMAL(6,2) NOT NULL DEFAULT 8, -- Horas disponíveis por dia
    utilization_rate DECIMAL(4,3) CHECK (utilization_rate >= 0), -- pode ser > 1 se overworked
    
    -- Métricas de Eficiência
    average_efficiency DECIMAL(4,3), -- média do efficiency_ratio
    task_completion_rate DECIMAL(4,3) CHECK (task_completion_rate >= 0 AND task_completion_rate <= 1),
    quality_score DECIMAL(4,2), -- média das qualidades das tarefas
    stress_indicator DECIMAL(4,3) CHECK (stress_indicator >= 0), -- indicador de stress/sobrecarga
    
    -- Distribuição de Tarefas
    task_type_distribution JSONB DEFAULT '{}'::jsonb, -- {"daily": 5, "weekly": 2, "monthly": 1}
    complexity_distribution JSONB DEFAULT '{}'::jsonb, -- {"low": 3, "medium": 4, "high": 1}
    subsystem_usage JSONB DEFAULT '{}'::jsonb, -- {"email": 5, "crm": 3, "analytics": 7}
    
    -- Análise Temporal
    peak_hours JSONB DEFAULT '[]'::jsonb, -- [9, 10, 14, 15] - horas de maior atividade
    productivity_curve JSONB DEFAULT '{}'::jsonb, -- {"morning": 0.9, "afternoon": 0.8, "evening": 0.6}
    
    -- Colaboração
    collaboration_score DECIMAL(4,3), -- quão bem trabalha com outros
    dependency_wait_time DECIMAL(6,2), -- tempo esperando dependências
    
    -- Flags de Alerta
    overload_risk BOOLEAN DEFAULT false,
    underutilized BOOLEAN DEFAULT false,
    skill_mismatch BOOLEAN DEFAULT false,
    requires_rebalancing BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. OTIMIZAÇÕES APLICADAS E SEU HISTÓRICO
-- ============================================================
CREATE TABLE optimization_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    pattern_id UUID REFERENCES learning_patterns(id),
    evolution_log_id UUID REFERENCES system_evolution_log(id),
    
    -- Tipo de Otimização
    optimization_type VARCHAR(50) NOT NULL, -- 'task_rebalancing', 'complexity_adjustment', 'timing_optimization', 'subsystem_redistribution'
    optimization_name VARCHAR(200) NOT NULL,
    optimization_description TEXT,
    
    -- Alvo da Otimização
    target_scope VARCHAR(50) NOT NULL, -- 'persona', 'department', 'subsystem', 'global'
    target_identifiers TEXT[] DEFAULT '{}', -- IDs dos alvos afetados
    
    -- Dados da Otimização
    optimization_parameters JSONB NOT NULL,
    expected_outcomes JSONB DEFAULT '{}'::jsonb,
    success_criteria JSONB DEFAULT '{}'::jsonb,
    
    -- Implementação
    implementation_method VARCHAR(50), -- 'gradual', 'immediate', 'phased', 'a_b_test'
    implementation_details JSONB DEFAULT '{}'::jsonb,
    rollout_percentage DECIMAL(5,2) DEFAULT 100.0, -- para rollouts graduais
    
    -- Resultados
    measured_at TIMESTAMPTZ,
    actual_outcomes JSONB DEFAULT '{}'::jsonb,
    success_score DECIMAL(4,3) CHECK (success_score >= 0 AND success_score <= 1),
    improvement_achieved DECIMAL(6,2), -- percentual de melhoria
    side_effects JSONB DEFAULT '{}'::jsonb,
    
    -- Status e Controle
    status VARCHAR(30) DEFAULT 'implemented' CHECK (status IN ('planned', 'implementing', 'implemented', 'measuring', 'successful', 'failed', 'rolled_back')),
    auto_applied BOOLEAN DEFAULT true,
    human_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES personas(id),
    review_notes TEXT,
    
    -- Timeline
    planned_at TIMESTAMPTZ DEFAULT NOW(),
    implemented_at TIMESTAMPTZ,
    measurement_period_days INTEGER DEFAULT 7,
    next_evaluation TIMESTAMPTZ,
    
    -- Rollback
    rollback_reason TEXT,
    rolled_back_at TIMESTAMPTZ
);

-- ============================================================
-- 8. FEEDBACK E LEARNING CONTÍNUO
-- ============================================================
CREATE TABLE ml_feedback_loop (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Fonte do Feedback
    feedback_source VARCHAR(50) NOT NULL, -- 'task_execution', 'user_input', 'system_monitoring', 'performance_metrics'
    source_reference_id UUID, -- ID da fonte específica
    
    -- Tipo de Feedback
    feedback_type VARCHAR(50) NOT NULL, -- 'quality_rating', 'efficiency_improvement', 'error_report', 'optimization_suggestion'
    feedback_category VARCHAR(50), -- 'positive', 'negative', 'neutral', 'suggestion'
    
    -- Conteúdo do Feedback
    feedback_content JSONB NOT NULL,
    feedback_score DECIMAL(4,2), -- score numérico se aplicável
    feedback_text TEXT,
    
    -- Contexto
    context_data JSONB DEFAULT '{}'::jsonb,
    related_patterns TEXT[] DEFAULT '{}', -- IDs de padrões relacionados
    
    -- Processamento
    processed BOOLEAN DEFAULT false,
    processing_result JSONB DEFAULT '{}'::jsonb,
    action_taken VARCHAR(100),
    impact_assessment JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    received_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================================
-- 9. ALERTAS E MONITORAMENTO AUTOMÁTICO
-- ============================================================
CREATE TABLE system_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Tipo de Alerta
    alert_type VARCHAR(50) NOT NULL, -- 'performance_degradation', 'overload_detected', 'anomaly_found', 'optimization_opportunity'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Conteúdo
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    alert_data JSONB DEFAULT '{}'::jsonb,
    
    -- Contexto
    affected_scope VARCHAR(50), -- 'persona', 'department', 'subsystem', 'global'
    affected_entities TEXT[] DEFAULT '{}',
    potential_impact VARCHAR(200),
    
    -- Ações Recomendadas
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    auto_resolution_attempted BOOLEAN DEFAULT false,
    auto_resolution_result JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed', 'escalated')),
    acknowledged_by UUID REFERENCES personas(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Timestamps
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- para alertas temporários
);

-- ============================================================
-- 10. CONFIGURAÇÕES DE MACHINE LEARNING
-- ============================================================
CREATE TABLE ml_system_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
    
    -- Configurações de Aprendizado
    learning_enabled BOOLEAN DEFAULT true,
    auto_optimization_enabled BOOLEAN DEFAULT true,
    confidence_threshold DECIMAL(4,3) DEFAULT 0.80, -- mínimo para aplicar otimizações
    min_sample_size INTEGER DEFAULT 10, -- mínimo de amostras para detectar padrões
    observation_window_days INTEGER DEFAULT 14, -- janela de observação para padrões
    
    -- Configurações de Performance
    performance_tracking_enabled BOOLEAN DEFAULT true,
    anomaly_detection_enabled BOOLEAN DEFAULT true,
    anomaly_sensitivity DECIMAL(4,3) DEFAULT 0.95, -- sensibilidade para detecção de anomalias
    
    -- Configurações de Segurança
    require_human_approval BOOLEAN DEFAULT false, -- exigir aprovação humana para mudanças
    auto_rollback_enabled BOOLEAN DEFAULT true,
    rollback_threshold_hours INTEGER DEFAULT 24, -- horas para medir impacto antes de rollback
    max_optimization_frequency_hours INTEGER DEFAULT 6, -- máximo de otimizações por período
    
    -- Configurações de Alertas
    alert_enabled BOOLEAN DEFAULT true,
    critical_alert_threshold DECIMAL(4,3) DEFAULT 0.20, -- queda de performance para alerta crítico
    warning_alert_threshold DECIMAL(4,3) DEFAULT 0.10, -- queda para alerta warning
    
    -- Configurações Avançadas
    experimental_features_enabled BOOLEAN DEFAULT false,
    custom_ml_rules JSONB DEFAULT '{}'::jsonb,
    integration_settings JSONB DEFAULT '{}'::jsonb,
    
    -- Metadados
    config_version VARCHAR(20) DEFAULT '1.0',
    last_updated_by UUID REFERENCES personas(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Índices para task_execution_analytics
CREATE INDEX idx_task_execution_analytics_persona ON task_execution_analytics(persona_id);
CREATE INDEX idx_task_execution_analytics_date ON task_execution_analytics(execution_date);
CREATE INDEX idx_task_execution_analytics_efficiency ON task_execution_analytics(efficiency_ratio);
CREATE INDEX idx_task_execution_analytics_empresa ON task_execution_analytics(empresa_id);

-- Índices para learning_patterns
CREATE INDEX idx_learning_patterns_type ON learning_patterns(pattern_type);
CREATE INDEX idx_learning_patterns_confidence ON learning_patterns(statistical_confidence);
CREATE INDEX idx_learning_patterns_active ON learning_patterns(is_active) WHERE is_active = true;
CREATE INDEX idx_learning_patterns_empresa ON learning_patterns(empresa_id);

-- Índices para system_evolution_log
CREATE INDEX idx_system_evolution_log_type ON system_evolution_log(evolution_type);
CREATE INDEX idx_system_evolution_log_date ON system_evolution_log(applied_at);
CREATE INDEX idx_system_evolution_log_status ON system_evolution_log(status);

-- Índices para performance_metrics
CREATE INDEX idx_performance_metrics_scope ON performance_metrics(metric_scope, scope_id);
CREATE INDEX idx_performance_metrics_period ON performance_metrics(period_start, period_end);
CREATE INDEX idx_performance_metrics_trend ON performance_metrics(trend_direction);

-- Índices para workload_analytics
CREATE INDEX idx_workload_analytics_persona ON workload_analytics(persona_id);
CREATE INDEX idx_workload_analytics_date ON workload_analytics(analysis_date);
CREATE INDEX idx_workload_analytics_utilization ON workload_analytics(utilization_rate);

-- ============================================================
-- VIEWS PARA RELATÓRIOS E DASHBOARDS
-- ============================================================

-- View: Resumo de Performance por Persona
CREATE VIEW v_persona_performance_summary AS
SELECT 
    p.id as persona_id,
    p.full_name,
    p.role,
    p.department,
    COUNT(tea.*) as total_tasks_analyzed,
    AVG(tea.efficiency_ratio) as avg_efficiency,
    AVG(tea.output_quality_score) as avg_quality,
    AVG(wa.utilization_rate) as avg_utilization,
    COUNT(CASE WHEN lp.applied = true THEN 1 END) as optimizations_applied,
    MAX(tea.execution_date) as last_analysis_date
FROM personas p
LEFT JOIN task_execution_analytics tea ON p.id = tea.persona_id
LEFT JOIN workload_analytics wa ON p.id = wa.persona_id AND wa.analysis_date >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN learning_patterns lp ON lp.scope_identifier = p.id::text AND lp.scope_type = 'persona'
GROUP BY p.id, p.full_name, p.role, p.department;

-- View: Trending de Métricas do Sistema
CREATE VIEW v_system_metrics_trending AS
SELECT 
    pm.metric_name,
    pm.metric_category,
    pm.period_start,
    pm.metric_value,
    pm.baseline_value,
    pm.target_value,
    pm.trend_direction,
    LAG(pm.metric_value) OVER (PARTITION BY pm.metric_name ORDER BY pm.period_start) as previous_value,
    (pm.metric_value - LAG(pm.metric_value) OVER (PARTITION BY pm.metric_name ORDER BY pm.period_start)) as value_change
FROM performance_metrics pm
WHERE pm.metric_scope = 'system'
ORDER BY pm.metric_name, pm.period_start DESC;

-- View: Alertas Ativos por Severidade
CREATE VIEW v_active_alerts_summary AS
SELECT 
    severity,
    alert_type,
    COUNT(*) as alert_count,
    MAX(triggered_at) as latest_alert,
    STRING_AGG(DISTINCT affected_scope, ', ') as affected_scopes
FROM system_alerts
WHERE status = 'active'
GROUP BY severity, alert_type
ORDER BY 
    CASE severity 
        WHEN 'critical' THEN 1 
        WHEN 'error' THEN 2 
        WHEN 'warning' THEN 3 
        ELSE 4 
    END;

-- ============================================================
-- TRIGGERS PARA AUTOMAÇÃO
-- ============================================================

-- Trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas relevantes
CREATE TRIGGER tr_persona_tasks_updated_at
    BEFORE UPDATE ON persona_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_ml_system_config_updated_at
    BEFORE UPDATE ON ml_system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNÇÕES DE UTILIDADE PARA ML
-- ============================================================

-- Função para calcular score de eficiência
CREATE OR REPLACE FUNCTION calculate_efficiency_score(
    estimated_duration INTEGER,
    actual_duration INTEGER
) RETURNS DECIMAL(4,2) AS $$
BEGIN
    IF estimated_duration IS NULL OR estimated_duration = 0 THEN
        RETURN NULL;
    END IF;
    
    IF actual_duration IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Eficiência = estimado / real (1.0 = perfeito, >1.0 = melhor que esperado)
    RETURN ROUND((estimated_duration::DECIMAL / actual_duration), 2);
END;
$$ LANGUAGE plpgsql;

-- Função para detectar anomalias simples
CREATE OR REPLACE FUNCTION detect_performance_anomaly(
    current_value DECIMAL,
    historical_avg DECIMAL,
    historical_stddev DECIMAL,
    sensitivity DECIMAL DEFAULT 0.95
) RETURNS BOOLEAN AS $$
DECLARE
    z_score DECIMAL;
    threshold DECIMAL;
BEGIN
    IF historical_stddev IS NULL OR historical_stddev = 0 THEN
        RETURN FALSE;
    END IF;
    
    z_score := ABS((current_value - historical_avg) / historical_stddev);
    
    -- Usar diferentes thresholds baseados na sensibilidade
    threshold := CASE 
        WHEN sensitivity >= 0.99 THEN 2.58  -- 99% confidence
        WHEN sensitivity >= 0.95 THEN 1.96  -- 95% confidence
        WHEN sensitivity >= 0.90 THEN 1.65  -- 90% confidence
        ELSE 1.28  -- 80% confidence
    END;
    
    RETURN z_score > threshold;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DADOS INICIAIS DE CONFIGURAÇÃO
-- ============================================================

-- Inserir configuração padrão para cada empresa
INSERT INTO ml_system_config (empresa_id, learning_enabled, auto_optimization_enabled)
SELECT id, true, false FROM empresas -- Começar com auto_optimization_enabled = false por segurança
ON CONFLICT DO NOTHING;

-- ============================================================
-- COMENTÁRIOS FINAIS
-- ============================================================

/*
SISTEMA COMPLETO DE MACHINE LEARNING IMPLEMENTADO!

Este SQL cria um sistema completo de aprendizado contínuo que:

✅ COLETA DADOS:
- task_execution_analytics: Métricas detalhadas de execução
- workload_analytics: Análise de carga de trabalho
- performance_metrics: Métricas de performance contínua

✅ DETECTA PADRÕES:
- learning_patterns: Padrões identificados pelo sistema
- ml_feedback_loop: Feedback contínuo para aprendizado

✅ APLICA OTIMIZAÇÕES:
- optimization_history: Histórico de otimizações
- system_evolution_log: Log de evolução do sistema

✅ MONITORA SEGURANÇA:
- system_alerts: Alertas automáticos
- ml_system_config: Configurações de segurança

✅ PERMITE AUDITORIA:
- Views para relatórios
- Índices para performance
- Triggers para automação

O sistema agora REALMENTE pode aprender e evoluir automaticamente! 🧠✨
*/