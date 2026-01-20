// =====================================================
// MÓDULO AUDITORIA - INTERFACES & TIPOS
// =====================================================

export interface AuditoriaWorkflowMetrics {
  id: string;
  empresa_id: string;
  workflow_id: string;
  workflow_name: string;
  persona_id: string;
  persona_name: string;
  departamento: string;
  
  // Métricas de Performance
  executions_total: number;
  executions_success: number;
  executions_failed: number;
  success_rate: number;
  
  // Tempos de Execução
  avg_execution_time_ms: number;
  min_execution_time_ms: number;
  max_execution_time_ms: number;
  execution_time_variance: number;
  
  // Eficiência
  efficiency_score: number; // 0-100
  productivity_index: number; // Relação output/tempo
  bottleneck_detected: boolean;
  bottleneck_stage?: string;
  
  // Tendências
  trend_direction: 'improving' | 'declining' | 'stable' | 'volatile';
  trend_confidence: number; // 0-1
  
  // Período de análise
  period_start: Date;
  period_end: Date;
  data_points: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface AuditoriaTeamPerformance {
  id: string;
  empresa_id: string;
  persona_id: string;
  departamento: string;
  nivel_hierarquico: number;
  
  // Performance Individual
  tasks_completed: number;
  tasks_pending: number;
  tasks_overdue: number;
  completion_rate: number; // 0-1
  
  // Qualidade
  quality_score: number; // 0-100
  rework_rate: number; // 0-1
  error_rate: number; // 0-1
  
  // Colaboração
  collaboration_score: number; // 0-100
  dependency_wait_time_avg: number; // minutos
  team_contribution_index: number; // 0-1
  
  // Carga de Trabalho
  workload_utilization: number; // 0-1
  stress_indicator: number; // 0-1
  overload_risk: boolean;
  underutilized: boolean;
  
  // Competências
  skill_match_score: number; // 0-100
  skill_gaps: string[];
  suggested_training: string[];
  
  // Período
  analysis_period: 'daily' | 'weekly' | 'monthly';
  period_start: Date;
  period_end: Date;
  
  created_at: Date;
}

export interface AuditoriaKPIAnalysis {
  id: string;
  empresa_id: string;
  meta_global_id: string;
  
  // Meta Global
  meta_titulo: string;
  meta_descricao: string;
  meta_prazo: Date;
  meta_progresso_esperado: number; // 0-100
  meta_progresso_atual: number; // 0-100
  
  // Análise de Performance
  performance_status: 'on_track' | 'at_risk' | 'off_track' | 'completed';
  variance_percentage: number; // Diferença entre esperado e atual
  velocity_score: number; // Velocidade de progresso
  
  // Indicadores de Risco
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: string[];
  mitigation_strategies: string[];
  
  // Contribuições por Persona
  persona_contributions: Array<{
    persona_id: string;
    persona_name: string;
    contribution_percentage: number;
    performance_rating: number; // 0-100
    blockers: string[];
  }>;
  
  // Análise Temporal
  timeline_analysis: {
    days_remaining: number;
    days_ahead_behind: number;
    projected_completion: Date;
    confidence_level: number; // 0-1
  };
  
  // Recomendações
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    expected_impact: number; // 0-100
    effort_required: 'low' | 'medium' | 'high';
    responsible_personas: string[];
  }>;
  
  created_at: Date;
  updated_at: Date;
}

export interface AuditoriaAlerta {
  id: string;
  empresa_id: string;
  tipo: 'workflow_inefficiency' | 'performance_decline' | 'kpi_deviation' | 'system_anomaly';
  severidade: 'info' | 'warning' | 'error' | 'critical';
  titulo: string;
  descricao: string;
  
  // Dados do Alerta
  affected_scope: 'persona' | 'department' | 'workflow' | 'global';
  affected_entities: string[];
  metric_name: string;
  threshold_value: number;
  current_value: number;
  deviation_percentage: number;
  
  // Contexto
  detection_method: 'threshold' | 'pattern' | 'anomaly' | 'manual';
  confidence_score: number; // 0-1
  false_positive_risk: number; // 0-1
  
  // Ações
  auto_resolution_attempted: boolean;
  auto_resolution_result?: string;
  manual_action_required: boolean;
  recommended_actions: string[];
  
  // Status
  status: 'active' | 'acknowledged' | 'investigating' | 'resolved' | 'false_alarm';
  assigned_to?: string;
  acknowledged_at?: Date;
  resolved_at?: Date;
  resolution_notes?: string;
  
  created_at: Date;
  expires_at?: Date;
}

export interface AuditoriaRelatorio {
  id: string;
  empresa_id: string;
  tipo: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'ad_hoc';
  titulo: string;
  descricao: string;
  
  // Configuração
  generated_by: 'system' | 'manual';
  generated_by_persona_id?: string;
  schedule_config?: {
    frequency: string;
    day_of_week?: number;
    day_of_month?: number;
    time: string;
    timezone: string;
  };
  
  // Conteúdo do Relatório
  summary: {
    total_workflows_analyzed: number;
    total_personas_analyzed: number;
    overall_efficiency_score: number; // 0-100
    key_insights: string[];
    critical_issues: number;
    improvement_opportunities: number;
  };
  
  // Seções do Relatório
  workflow_performance: AuditoriaWorkflowMetrics[];
  team_performance: AuditoriaTeamPerformance[];
  kpi_analysis: AuditoriaKPIAnalysis[];
  alerts_summary: {
    total_alerts: number;
    critical_alerts: number;
    resolved_alerts: number;
    trending_issues: string[];
  };
  
  // Recomendações Estratégicas
  strategic_recommendations: Array<{
    category: 'efficiency' | 'performance' | 'process' | 'training' | 'technology';
    priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
    recommendation: string;
    expected_impact: number; // 0-100
    implementation_effort: 'low' | 'medium' | 'high';
    roi_estimate: number;
  }>;
  
  // Anexos e Dados
  attachments: Array<{
    name: string;
    type: 'chart' | 'table' | 'pdf' | 'excel';
    url: string;
    description: string;
  }>;
  
  // Metadados
  period_start: Date;
  period_end: Date;
  data_freshness: Date; // Quando os dados foram coletados
  generated_at: Date;
  format: 'pdf' | 'html' | 'excel' | 'json';
  
  // Distribuição
  recipients: Array<{
    persona_id: string;
    email: string;
    delivery_method: 'email' | 'dashboard' | 'download';
    delivered_at?: Date;
  }>;
}

// =====================================================
// CONFIGURAÇÕES DO SISTEMA DE AUDITORIA
// =====================================================

export interface AuditoriaConfiguracao {
  empresa_id: string;
  
  // Configurações de Coleta
  data_collection: {
    enabled: boolean;
    collection_frequency: 'real_time' | 'hourly' | 'daily';
    retention_days: number;
    sampling_rate: number; // 0-1
  };
  
  // Thresholds e Alertas
  thresholds: {
    efficiency_warning: number; // 0-100
    efficiency_critical: number; // 0-100
    performance_decline_threshold: number; // 0-1
    kpi_deviation_warning: number; // 0-1
    kpi_deviation_critical: number; // 0-1
  };
  
  // Configurações de ML/AI
  ai_analysis: {
    enabled: boolean;
    anomaly_detection: boolean;
    pattern_recognition: boolean;
    predictive_analytics: boolean;
    confidence_threshold: number; // 0-1
  };
  
  // Relatórios Automáticos
  automated_reports: {
    daily_summary: boolean;
    weekly_detailed: boolean;
    monthly_strategic: boolean;
    quarterly_executive: boolean;
    custom_schedules: Array<{
      name: string;
      frequency: string;
      recipients: string[];
      format: string;
    }>;
  };
  
  // Integrações
  integrations: {
    n8n_workflows: boolean;
    supabase_analytics: boolean;
    external_bi: boolean;
    slack_notifications: boolean;
    email_alerts: boolean;
  };
  
  created_at: Date;
  updated_at: Date;
}

// =====================================================
// INTERFACES PARA APIS
// =====================================================

export interface AuditoriaAPI {
  // Coleta de Métricas
  getWorkflowMetrics(empresaId: string, periodo?: string): Promise<AuditoriaWorkflowMetrics[]>;
  getTeamPerformance(empresaId: string, periodo?: string): Promise<AuditoriaTeamPerformance[]>;
  getKPIAnalysis(empresaId: string, metaId?: string): Promise<AuditoriaKPIAnalysis[]>;
  
  // Alertas
  getAlertas(empresaId: string, severidade?: string): Promise<AuditoriaAlerta[]>;
  createAlerta(alerta: Partial<AuditoriaAlerta>): Promise<AuditoriaAlerta>;
  updateAlerta(id: string, updates: Partial<AuditoriaAlerta>): Promise<AuditoriaAlerta>;
  
  // Relatórios
  generateRelatorio(empresaId: string, tipo: string, config?: any): Promise<AuditoriaRelatorio>;
  getRelatorios(empresaId: string): Promise<AuditoriaRelatorio[]>;
  downloadRelatorio(id: string, format: string): Promise<Blob>;
  
  // Configurações
  getConfiguracao(empresaId: string): Promise<AuditoriaConfiguracao>;
  updateConfiguracao(empresaId: string, config: Partial<AuditoriaConfiguracao>): Promise<AuditoriaConfiguracao>;
  
  // Analytics
  getPerformanceTrends(empresaId: string, metrica: string, periodo: string): Promise<any>;
  getEfficiencyAnalysis(empresaId: string): Promise<any>;
  getBenchmarkComparison(empresaId: string): Promise<any>;
}