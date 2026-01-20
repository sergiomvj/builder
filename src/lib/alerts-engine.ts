import { supabase } from './supabase';
import { AuditoriaService } from './auditoria-service';
import type { AuditoriaAlerta } from '../types/auditoria';

// =====================================================
// ENGINE DE ALERTAS INTELIGENTE
// =====================================================

export class AlertsEngine {
  private auditoriaService: AuditoriaService;
  private alertRules: AlertRule[] = [];
  private isMonitoring = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.auditoriaService = new AuditoriaService();
    this.initializeDefaultRules();
  }

  // ===================================================
  // REGRAS DE ALERTA
  // ===================================================

  private initializeDefaultRules(): void {
    this.alertRules = [
      // Regras de Eficiência de Workflow
      {
        id: 'workflow_efficiency_critical',
        name: 'Eficiência Crítica de Workflow',
        metric: 'workflow_efficiency',
        condition: 'less_than',
        threshold: 40,
        severity: 'critical',
        description: 'Workflow com eficiência extremamente baixa',
        actions: ['immediate_review', 'escalate_to_management'],
        cooldownMinutes: 60
      },
      {
        id: 'workflow_efficiency_warning',
        name: 'Eficiência Baixa de Workflow',
        metric: 'workflow_efficiency', 
        condition: 'less_than',
        threshold: 60,
        severity: 'warning',
        description: 'Workflow apresentando eficiência abaixo do esperado',
        actions: ['review_process', 'notify_owner'],
        cooldownMinutes: 240
      },

      // Regras de Performance da Equipe
      {
        id: 'team_overload_critical',
        name: 'Sobrecarga Crítica da Equipe',
        metric: 'workload_utilization',
        condition: 'greater_than',
        threshold: 1.5,
        severity: 'critical',
        description: 'Membro da equipe com sobrecarga crítica',
        actions: ['redistribute_tasks', 'emergency_support'],
        cooldownMinutes: 30
      },
      {
        id: 'team_stress_high',
        name: 'Alto Indicador de Stress',
        metric: 'stress_indicator',
        condition: 'greater_than',
        threshold: 0.8,
        severity: 'error',
        description: 'Indicador de stress elevado detectado',
        actions: ['wellness_check', 'workload_review'],
        cooldownMinutes: 120
      },

      // Regras de KPI
      {
        id: 'kpi_deviation_critical',
        name: 'Desvio Crítico de KPI',
        metric: 'kpi_variance',
        condition: 'less_than',
        threshold: -30,
        severity: 'critical',
        description: 'KPI significativamente abaixo do esperado',
        actions: ['executive_alert', 'emergency_meeting'],
        cooldownMinutes: 60
      },

      // Regras de Qualidade
      {
        id: 'quality_decline',
        name: 'Declínio na Qualidade',
        metric: 'quality_score',
        condition: 'less_than',
        threshold: 50,
        severity: 'error',
        description: 'Qualidade do trabalho abaixo do aceitável',
        actions: ['quality_review', 'training_recommendation'],
        cooldownMinutes: 180
      },

      // Regras de Anomalias
      {
        id: 'execution_time_spike',
        name: 'Pico no Tempo de Execução',
        metric: 'avg_execution_time',
        condition: 'spike_detected',
        threshold: 200, // % de aumento
        severity: 'warning',
        description: 'Aumento súbito no tempo de execução detectado',
        actions: ['performance_check', 'system_review'],
        cooldownMinutes: 60
      }
    ];
  }

  // ===================================================
  // MONITORAMENTO EM TEMPO REAL
  // ===================================================

  async startRealTimeMonitoring(intervalMinutes: number = 15): Promise<void> {
    if (this.isMonitoring) {
      console.log('Monitoramento já está ativo');
      return;
    }

    this.isMonitoring = true;
    console.log(`Iniciando monitoramento de alertas a cada ${intervalMinutes} minutos`);

    // Primeira verificação imediata
    await this.runAlertCheck();

    // Agendar verificações regulares
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runAlertCheck();
      } catch (error) {
        console.error('Erro na verificação de alertas:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  async stopRealTimeMonitoring(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('Monitoramento de alertas interrompido');
  }

  private async runAlertCheck(): Promise<void> {
    try {
      console.log('Executando verificação de alertas...', new Date().toISOString());

      // Buscar todas as empresas ativas
      const { data: empresas, error } = await supabase
        .from('empresas')
        .select('id, codigo, nome')
        .eq('status', 'ativa');

      if (error) throw error;

      let totalAlertsCreated = 0;

      for (const empresa of empresas) {
        const alertsCreated = await this.checkEmpresaAlerts(empresa.id);
        totalAlertsCreated += alertsCreated;
      }

      console.log(`Verificação concluída. ${totalAlertsCreated} novos alertas criados`);
    } catch (error) {
      console.error('Erro na verificação geral de alertas:', error);
    }
  }

  private async checkEmpresaAlerts(empresaId: string): Promise<number> {
    try {
      let alertsCreated = 0;

      // Buscar métricas recentes
      const recentMetrics = await this.getRecentMetrics(empresaId);
      
      // Verificar cada regra
      for (const rule of this.alertRules) {
        const relevantMetrics = this.filterMetricsForRule(recentMetrics, rule);
        
        for (const metric of relevantMetrics) {
          const shouldTrigger = await this.evaluateRule(rule, metric, empresaId);
          
          if (shouldTrigger) {
            await this.triggerAlert(rule, metric, empresaId);
            alertsCreated++;
          }
        }
      }

      return alertsCreated;
    } catch (error) {
      console.error(`Erro ao verificar alertas da empresa ${empresaId}:`, error);
      return 0;
    }
  }

  // ===================================================
  // AVALIAÇÃO DE REGRAS
  // ===================================================

  private async getRecentMetrics(empresaId: string): Promise<any[]> {
    const { data: metrics, error } = await supabase
      .from('analytics_metrics')
      .select('*')
      .eq('empresa_id', empresaId)
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // últimas 2 horas
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar métricas recentes:', error);
      return [];
    }

    return metrics || [];
  }

  private filterMetricsForRule(metrics: any[], rule: AlertRule): any[] {
    return metrics.filter(metric => {
      switch (rule.metric) {
        case 'workflow_efficiency':
          return metric.metric_name === 'workflow_efficiency';
        case 'workload_utilization':
          return metric.metric_name === 'team_performance' && metric.metadata?.workload_utilization !== undefined;
        case 'stress_indicator':
          return metric.metric_name === 'team_performance' && metric.metadata?.stress_indicator !== undefined;
        case 'kpi_variance':
          return metric.metric_name === 'kpi_performance' && metric.metadata?.variance_percentage !== undefined;
        case 'quality_score':
          return metric.metric_name === 'team_performance' && metric.value !== undefined;
        case 'avg_execution_time':
          return metric.metric_name === 'workflow_efficiency' && metric.metadata?.avg_execution_time !== undefined;
        default:
          return false;
      }
    });
  }

  private async evaluateRule(rule: AlertRule, metric: any, empresaId: string): Promise<boolean> {
    try {
      // Verificar cooldown
      const inCooldown = await this.isRuleInCooldown(rule.id, empresaId, metric.dimensions);
      if (inCooldown) return false;

      // Extrair valor da métrica
      const value = this.extractMetricValue(metric, rule.metric);
      if (value === null) return false;

      // Avaliar condição
      const conditionMet = this.evaluateCondition(rule.condition, value, rule.threshold, metric);
      
      return conditionMet;
    } catch (error) {
      console.error('Erro ao avaliar regra:', error);
      return false;
    }
  }

  private extractMetricValue(metric: any, metricType: string): number | null {
    switch (metricType) {
      case 'workflow_efficiency':
        return metric.value;
      case 'workload_utilization':
        return metric.metadata?.workload_utilization;
      case 'stress_indicator':
        return metric.metadata?.stress_indicator;
      case 'kpi_variance':
        return metric.metadata?.variance_percentage;
      case 'quality_score':
        return metric.value;
      case 'avg_execution_time':
        return metric.metadata?.avg_execution_time;
      default:
        return null;
    }
  }

  private evaluateCondition(condition: string, value: number, threshold: number, metric?: any): boolean {
    switch (condition) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return Math.abs(value - threshold) < 0.001;
      case 'spike_detected':
        return this.detectSpike(value, threshold, metric);
      case 'trend_negative':
        return this.detectNegativeTrend(metric);
      default:
        return false;
    }
  }

  private detectSpike(currentValue: number, thresholdPercent: number, metric: any): boolean {
    // Buscar valor histórico (simplificado - em produção, buscar média histórica)
    const historicalAvg = metric.metadata?.historical_avg || currentValue * 0.7;
    const increasePercent = ((currentValue - historicalAvg) / historicalAvg) * 100;
    return increasePercent > thresholdPercent;
  }

  private detectNegativeTrend(metric: any): boolean {
    // Verificar se há tendência negativa baseada em dados históricos
    const trendDirection = metric.metadata?.trend_direction;
    return trendDirection === 'declining' || trendDirection === 'decreasing';
  }

  private async isRuleInCooldown(ruleId: string, empresaId: string, dimensions?: any): Promise<boolean> {
    const cooldownMinutes = this.alertRules.find(r => r.id === ruleId)?.cooldownMinutes || 60;
    const cooldownTime = new Date(Date.now() - cooldownMinutes * 60 * 1000);

    const { data: recentAlerts, error } = await supabase
      .from('system_alerts')
      .select('id')
      .eq('empresa_id', empresaId)
      .contains('alert_data', { rule_id: ruleId })
      .gte('triggered_at', cooldownTime.toISOString());

    if (error) {
      console.error('Erro ao verificar cooldown:', error);
      return false;
    }

    return (recentAlerts?.length || 0) > 0;
  }

  // ===================================================
  // CRIAÇÃO E GERENCIAMENTO DE ALERTAS
  // ===================================================

  private async triggerAlert(rule: AlertRule, metric: any, empresaId: string): Promise<void> {
    try {
      const value = this.extractMetricValue(metric, rule.metric);
      
      const alertData: Partial<AuditoriaAlerta> = {
        empresa_id: empresaId,
        tipo: this.mapRuleToAlertType(rule.metric),
        severidade: rule.severity as any,
        titulo: rule.name,
        descricao: `${rule.description}. Valor atual: ${value}, Threshold: ${rule.threshold}`,
        affected_scope: this.determineAffectedScope(metric),
        affected_entities: this.extractAffectedEntities(metric),
        metric_name: rule.metric,
        threshold_value: rule.threshold,
        current_value: value || 0,
        detection_method: 'threshold',
        confidence_score: this.calculateConfidence(rule, metric),
        false_positive_risk: this.calculateFalsePositiveRisk(rule, metric),
        recommended_actions: rule.actions || [],
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // expira em 24h
      };

      await this.auditoriaService.createAlerta(alertData);

      // Executar ações automáticas se necessário
      await this.executeAutomaticActions(rule, metric, empresaId);

      console.log(`Alerta criado: ${rule.name} para empresa ${empresaId}`);
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
    }
  }

  private mapRuleToAlertType(metric: string): 'workflow_inefficiency' | 'performance_decline' | 'kpi_deviation' | 'system_anomaly' {
    switch (metric) {
      case 'workflow_efficiency':
      case 'avg_execution_time':
        return 'workflow_inefficiency';
      case 'workload_utilization':
      case 'stress_indicator':
      case 'quality_score':
        return 'performance_decline';
      case 'kpi_variance':
        return 'kpi_deviation';
      default:
        return 'system_anomaly';
    }
  }

  private determineAffectedScope(metric: any): 'persona' | 'department' | 'workflow' | 'global' {
    if (metric.dimensions?.persona_id) return 'persona';
    if (metric.dimensions?.workflow_id) return 'workflow';
    if (metric.dimensions?.department) return 'department';
    return 'global';
  }

  private extractAffectedEntities(metric: any): string[] {
    const entities: string[] = [];
    
    if (metric.dimensions?.persona_id) entities.push(metric.dimensions.persona_id);
    if (metric.dimensions?.workflow_id) entities.push(metric.dimensions.workflow_id);
    if (metric.dimensions?.meta_global_id) entities.push(metric.dimensions.meta_global_id);
    
    return entities;
  }

  private calculateConfidence(rule: AlertRule, metric: any): number {
    let confidence = 0.8; // base
    
    // Aumentar confiança para desvios maiores
    const value = this.extractMetricValue(metric, rule.metric) || 0;
    const deviationPercent = Math.abs((value - rule.threshold) / rule.threshold);
    
    if (deviationPercent > 0.5) confidence += 0.15;
    if (deviationPercent > 1.0) confidence += 0.05;
    
    // Aumentar confiança para métricas com histórico estável
    if (metric.metadata?.trend_direction === 'stable') confidence += 0.05;
    
    return Math.min(1.0, confidence);
  }

  private calculateFalsePositiveRisk(rule: AlertRule, metric: any): number {
    let risk = 0.1; // base baixa
    
    // Aumentar risco para métricas voláteis
    if (metric.metadata?.trend_direction === 'volatile') risk += 0.2;
    
    // Aumentar risco para dados com pouca amostragem
    const dataPoints = metric.metadata?.data_points || 10;
    if (dataPoints < 5) risk += 0.3;
    
    return Math.min(0.5, risk);
  }

  private async executeAutomaticActions(rule: AlertRule, metric: any, empresaId: string): Promise<void> {
    for (const action of rule.actions || []) {
      try {
        await this.executeAction(action, rule, metric, empresaId);
      } catch (error) {
        console.error(`Erro ao executar ação automática ${action}:`, error);
      }
    }
  }

  private async executeAction(action: string, rule: AlertRule, metric: any, empresaId: string): Promise<void> {
    switch (action) {
      case 'immediate_review':
        await this.scheduleReview(empresaId, 'immediate', rule, metric);
        break;
      case 'escalate_to_management':
        await this.escalateToManagement(empresaId, rule, metric);
        break;
      case 'redistribute_tasks':
        await this.suggestTaskRedistribution(empresaId, metric);
        break;
      case 'notify_owner':
        await this.notifyOwner(empresaId, metric, rule);
        break;
      case 'emergency_support':
        await this.requestEmergencySupport(empresaId, metric);
        break;
      default:
        console.log(`Ação não implementada: ${action}`);
    }
  }

  private async scheduleReview(empresaId: string, priority: string, rule: AlertRule, metric: any): Promise<void> {
    // Implementar agendamento de revisão
    console.log(`Revisão ${priority} agendada para empresa ${empresaId} - Regra: ${rule.name}`);
  }

  private async escalateToManagement(empresaId: string, rule: AlertRule, metric: any): Promise<void> {
    // Implementar escalação para gestão
    console.log(`Escalação para gestão - Empresa ${empresaId} - Alerta crítico: ${rule.name}`);
  }

  private async suggestTaskRedistribution(empresaId: string, metric: any): Promise<void> {
    // Implementar sugestão de redistribuição
    console.log(`Redistribuição de tarefas sugerida para empresa ${empresaId}`);
  }

  private async notifyOwner(empresaId: string, metric: any, rule: AlertRule): Promise<void> {
    // Implementar notificação do responsável
    const personaId = metric.dimensions?.persona_id;
    if (personaId) {
      console.log(`Notificação enviada para persona ${personaId} - ${rule.name}`);
    }
  }

  private async requestEmergencySupport(empresaId: string, metric: any): Promise<void> {
    // Implementar solicitação de suporte emergencial
    console.log(`Suporte emergencial solicitado para empresa ${empresaId}`);
  }

  // ===================================================
  // CONFIGURAÇÃO DE REGRAS
  // ===================================================

  async addCustomRule(rule: AlertRule): Promise<void> {
    this.alertRules.push(rule);
    console.log(`Regra personalizada adicionada: ${rule.name}`);
  }

  async updateRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    const index = this.alertRules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.alertRules[index] = { ...this.alertRules[index], ...updates };
      console.log(`Regra ${ruleId} atualizada`);
    }
  }

  async removeRule(ruleId: string): Promise<void> {
    this.alertRules = this.alertRules.filter(r => r.id !== ruleId);
    console.log(`Regra ${ruleId} removida`);
  }

  getRules(): AlertRule[] {
    return this.alertRules;
  }

  getMonitoringStatus(): any {
    return {
      is_monitoring: this.isMonitoring,
      has_interval: !!this.monitoringInterval,
      active_rules: this.alertRules.length,
      last_check: new Date() // Em produção, armazenar timestamp real
    };
  }
}

// ===================================================
// INTERFACES E TIPOS
// ===================================================

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'spike_detected' | 'trend_negative';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  actions?: string[];
  cooldownMinutes: number;
  enabled?: boolean;
  metadata?: any;
}

// Instância singleton
export const alertsEngine = new AlertsEngine();