import { supabase } from './supabase';
import { AuditoriaService } from './auditoria-service';
import type { AuditoriaAlerta } from '../types/auditoria';

// =====================================================
// COLETOR AUTOMATIZADO DE MÉTRICAS
// =====================================================

export class MetricsCollector {
  private auditoriaService: AuditoriaService;
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;

  constructor() {
    this.auditoriaService = new AuditoriaService();
  }

  // ===================================================
  // COLETA AUTOMATIZADA
  // ===================================================

  async startAutomaticCollection(intervalMinutes: number = 60): Promise<void> {
    if (this.isRunning) {
      console.log('Coleta automática já está em execução');
      return;
    }

    this.isRunning = true;
    console.log(`Iniciando coleta automática de métricas a cada ${intervalMinutes} minutos`);

    // Primeira coleta imediata
    await this.collectAllMetrics();

    // Agendar coletas regulares
    this.intervalId = setInterval(async () => {
      try {
        await this.collectAllMetrics();
      } catch (error) {
        console.error('Erro na coleta automática:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  async stopAutomaticCollection(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('Coleta automática interrompida');
  }

  // ===================================================
  // COLETA PRINCIPAL
  // ===================================================

  async collectAllMetrics(): Promise<void> {
    try {
      console.log('Iniciando coleta de métricas...', new Date().toISOString());

      // Buscar todas as empresas ativas
      const { data: empresas, error } = await supabase
        .from('empresas')
        .select('id, codigo, nome')
        .eq('status', 'ativa');

      if (error) throw error;

      for (const empresa of empresas) {
        await this.collectEmpresaMetrics(empresa.id, empresa.nome);
      }

      console.log('Coleta de métricas concluída com sucesso');
    } catch (error) {
      console.error('Erro na coleta geral de métricas:', error);
      throw error;
    }
  }

  private async collectEmpresaMetrics(empresaId: string, empresaNome: string): Promise<void> {
    try {
      console.log(`Coletando métricas para empresa: ${empresaNome}`);

      // Coletar métricas de workflow
      const workflowMetrics = await this.auditoriaService.getWorkflowMetrics(empresaId, 'semana');
      await this.storeWorkflowMetrics(workflowMetrics);

      // Coletar performance da equipe
      const teamPerformance = await this.auditoriaService.getTeamPerformance(empresaId, 'semana');
      await this.storeTeamPerformance(teamPerformance);

      // Coletar análise de KPIs
      const kpiAnalysis = await this.auditoriaService.getKPIAnalysis(empresaId);
      await this.storeKPIAnalysis(kpiAnalysis);

      // Análise de anomalias e alertas
      await this.detectAndCreateAlerts(empresaId, {
        workflowMetrics,
        teamPerformance,
        kpiAnalysis
      });

      console.log(`Métricas coletadas com sucesso para ${empresaNome}`);
    } catch (error) {
      console.error(`Erro ao coletar métricas para empresa ${empresaNome}:`, error);
    }
  }

  // ===================================================
  // ARMAZENAMENTO DAS MÉTRICAS
  // ===================================================

  private async storeWorkflowMetrics(metrics: any[]): Promise<void> {
    if (metrics.length === 0) return;

    try {
      // Primeiro, verificar se as métricas já existem
      const existingMetrics = await supabase
        .from('analytics_metrics')
        .select('id')
        .eq('metric_name', 'workflow_efficiency')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Se já temos métricas recentes, pular
      if (existingMetrics.data && existingMetrics.data.length > 0) {
        console.log('Métricas de workflow já coletadas nas últimas 24h');
        return;
      }

      const analyticsData = metrics.map(metric => ({
        empresa_id: metric.empresa_id,
        metric_name: 'workflow_efficiency',
        category: 'workflow',
        subcategory: metric.workflow_type || 'general',
        value: metric.efficiency_score,
        unit: 'score',
        date: new Date().toISOString().split('T')[0],
        period: 'daily',
        source_system: 'vcm_auditoria',
        dimensions: {
          workflow_id: metric.workflow_id,
          workflow_name: metric.workflow_name,
          persona_id: metric.persona_id,
          persona_name: metric.persona_name,
          department: metric.departamento
        },
        metadata: {
          executions_total: metric.executions_total,
          success_rate: metric.success_rate,
          avg_execution_time: metric.avg_execution_time_ms,
          trend_direction: metric.trend_direction
        }
      }));

      const { error } = await supabase
        .from('analytics_metrics')
        .insert(analyticsData);

      if (error) throw error;

      console.log(`${analyticsData.length} métricas de workflow armazenadas`);
    } catch (error) {
      console.error('Erro ao armazenar métricas de workflow:', error);
    }
  }

  private async storeTeamPerformance(performance: any[]): Promise<void> {
    if (performance.length === 0) return;

    try {
      const analyticsData = performance.map(perf => ({
        empresa_id: perf.empresa_id,
        metric_name: 'team_performance',
        category: 'performance',
        subcategory: perf.departamento,
        value: perf.quality_score,
        unit: 'score',
        date: new Date().toISOString().split('T')[0],
        period: 'daily',
        source_system: 'vcm_auditoria',
        dimensions: {
          persona_id: perf.persona_id,
          department: perf.departamento,
          nivel_hierarquico: perf.nivel_hierarquico
        },
        metadata: {
          completion_rate: perf.completion_rate,
          workload_utilization: perf.workload_utilization,
          collaboration_score: perf.collaboration_score,
          stress_indicator: perf.stress_indicator,
          tasks_completed: perf.tasks_completed,
          tasks_overdue: perf.tasks_overdue
        }
      }));

      const { error } = await supabase
        .from('analytics_metrics')
        .insert(analyticsData);

      if (error) throw error;

      console.log(`${analyticsData.length} métricas de performance armazenadas`);
    } catch (error) {
      console.error('Erro ao armazenar métricas de performance:', error);
    }
  }

  private async storeKPIAnalysis(analysis: any[]): Promise<void> {
    if (analysis.length === 0) return;

    try {
      const analyticsData = analysis.map(kpi => ({
        empresa_id: kpi.empresa_id,
        metric_name: 'kpi_performance',
        category: 'kpi',
        subcategory: 'meta_global',
        value: kpi.meta_progresso_atual,
        unit: 'percentage',
        date: new Date().toISOString().split('T')[0],
        period: 'daily',
        source_system: 'vcm_auditoria',
        dimensions: {
          meta_global_id: kpi.meta_global_id,
          meta_titulo: kpi.meta_titulo
        },
        metadata: {
          progresso_esperado: kpi.meta_progresso_esperado,
          variance_percentage: kpi.variance_percentage,
          performance_status: kpi.performance_status,
          risk_level: kpi.risk_level,
          velocity_score: kpi.velocity_score
        }
      }));

      const { error } = await supabase
        .from('analytics_metrics')
        .insert(analyticsData);

      if (error) throw error;

      console.log(`${analyticsData.length} análises de KPI armazenadas`);
    } catch (error) {
      console.error('Erro ao armazenar análises de KPI:', error);
    }
  }

  // ===================================================
  // DETECÇÃO DE ANOMALIAS E ALERTAS
  // ===================================================

  private async detectAndCreateAlerts(empresaId: string, data: {
    workflowMetrics: any[];
    teamPerformance: any[];
    kpiAnalysis: any[];
  }): Promise<void> {
    try {
      const alertsToCreate: Partial<AuditoriaAlerta>[] = [];

      // Verificar workflows com baixa eficiência
      const lowEfficiencyWorkflows = data.workflowMetrics.filter(m => m.efficiency_score < 60);
      for (const workflow of lowEfficiencyWorkflows) {
        alertsToCreate.push({
          empresa_id: empresaId,
          tipo: 'workflow_inefficiency',
          severidade: workflow.efficiency_score < 40 ? 'critical' : 'warning',
          titulo: `Baixa eficiência no workflow: ${workflow.workflow_name}`,
          descricao: `O workflow está operando com eficiência de apenas ${workflow.efficiency_score}%`,
          affected_scope: 'workflow',
          affected_entities: [workflow.workflow_id],
          metric_name: 'efficiency_score',
          threshold_value: 60,
          current_value: workflow.efficiency_score,
          recommended_actions: [
            'Revisar processo do workflow',
            'Verificar gargalos no fluxo',
            'Considerar otimização ou retreinamento'
          ]
        });
      }

      // Verificar membros da equipe sobrecarregados
      const overloadedMembers = data.teamPerformance.filter(p => p.overload_risk);
      for (const member of overloadedMembers) {
        alertsToCreate.push({
          empresa_id: empresaId,
          tipo: 'performance_decline',
          severidade: member.stress_indicator > 0.8 ? 'error' : 'warning',
          titulo: `Sobrecarga detectada: ${member.persona_name || 'Membro da equipe'}`,
          descricao: `Membro apresenta utilização de ${Math.round(member.workload_utilization * 100)}% e indicador de stress ${Math.round(member.stress_indicator * 100)}%`,
          affected_scope: 'persona',
          affected_entities: [member.persona_id],
          metric_name: 'workload_utilization',
          threshold_value: 1.0,
          current_value: member.workload_utilization,
          recommended_actions: [
            'Redistribuir tarefas',
            'Aumentar equipe ou prazo',
            'Priorizar tarefas críticas'
          ]
        });
      }

      // Verificar KPIs em risco
      const riskyKPIs = data.kpiAnalysis.filter(k => k.risk_level === 'high' || k.risk_level === 'critical');
      for (const kpi of riskyKPIs) {
        alertsToCreate.push({
          empresa_id: empresaId,
          tipo: 'kpi_deviation',
          severidade: kpi.risk_level === 'critical' ? 'critical' : 'error',
          titulo: `Meta em risco: ${kpi.meta_titulo}`,
          descricao: `Meta com desvio de ${Math.round(kpi.variance_percentage)}% e nível de risco ${kpi.risk_level}`,
          affected_scope: 'global',
          affected_entities: [kpi.meta_global_id],
          metric_name: 'meta_progress',
          threshold_value: kpi.meta_progresso_esperado,
          current_value: kpi.meta_progresso_atual,
          recommended_actions: kpi.recommendations?.map((r: any) => r.action) || [
            'Revisar cronograma da meta',
            'Realinhar recursos',
            'Avaliar viabilidade do prazo'
          ]
        });
      }

      // Criar os alertas no sistema
      for (const alertData of alertsToCreate) {
        try {
          await this.auditoriaService.createAlerta(alertData);
        } catch (error) {
          console.error('Erro ao criar alerta:', error);
        }
      }

      console.log(`${alertsToCreate.length} alertas criados para empresa ${empresaId}`);
    } catch (error) {
      console.error('Erro na detecção de alertas:', error);
    }
  }

  // ===================================================
  // ANÁLISE PREDITIVA
  // ===================================================

  async performPredictiveAnalysis(empresaId: string): Promise<any> {
    try {
      // Buscar histórico de métricas
      const { data: historicMetrics, error } = await supabase
        .from('analytics_metrics')
        .select('*')
        .eq('empresa_id', empresaId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!historicMetrics || historicMetrics.length < 7) {
        return {
          prediction_available: false,
          message: 'Dados históricos insuficientes para análise preditiva'
        };
      }

      // Agrupar por métrica
      const metricGroups = historicMetrics.reduce((acc, metric) => {
        if (!acc[metric.metric_name]) acc[metric.metric_name] = [];
        acc[metric.metric_name].push(metric);
        return acc;
      }, {} as Record<string, any[]>);

      const predictions: any = {};

      // Análise de tendência para cada métrica
      for (const [metricName, metrics] of Object.entries(metricGroups)) {
        if (Array.isArray(metrics) && metrics.length < 5) continue;

        const values = (metrics as any[]).map((m: any) => m.value).slice(-7); // últimos 7 valores
        const trend = this.calculateTrend(values);
        const prediction = this.predictNextValue(values, trend);

        predictions[metricName] = {
          current_value: values[values.length - 1],
          trend_direction: trend.direction,
          trend_strength: trend.strength,
          predicted_next_value: prediction.value,
          confidence: prediction.confidence,
          recommendation: this.generatePredictionRecommendation(metricName, trend, prediction)
        };
      }

      return {
        prediction_available: true,
        empresa_id: empresaId,
        analysis_date: new Date(),
        predictions,
        summary: this.generatePredictionSummary(predictions)
      };
    } catch (error) {
      console.error('Erro na análise preditiva:', error as Error);
      return {
        prediction_available: false,
        error: (error as Error).message
      };
    }
  }

  private calculateTrend(values: number[]): { direction: string; strength: number } {
    if (values.length < 2) return { direction: 'stable', strength: 0 };

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((acc, val) => acc + val, 0);
    const sumXY = values.reduce((acc, val, i) => acc + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const direction = slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';
    const strength = Math.abs(slope);

    return { direction, strength };
  }

  private predictNextValue(values: number[], trend: any): { value: number; confidence: number } {
    const lastValue = values[values.length - 1];
    const avgChange = trend.strength * (trend.direction === 'increasing' ? 1 : -1);
    const predictedValue = Math.max(0, lastValue + avgChange);

    // Confidence baseada na estabilidade da tendência
    const variance = values.reduce((acc, val, i, arr) => {
      const avg = arr.reduce((a, b) => a + b) / arr.length;
      return acc + Math.pow(val - avg, 2);
    }, 0) / values.length;

    const confidence = Math.max(0.3, Math.min(0.95, 1 - (variance / 1000)));

    return { value: predictedValue, confidence };
  }

  private generatePredictionRecommendation(metricName: string, trend: any, prediction: any): string {
    if (trend.direction === 'decreasing' && prediction.confidence > 0.7) {
      switch (metricName) {
        case 'workflow_efficiency':
          return 'Tendência de queda na eficiência detectada. Revisar processos imediatamente.';
        case 'team_performance':
          return 'Performance da equipe em declínio. Considerar suporte adicional ou redistribuição.';
        case 'kpi_performance':
          return 'KPIs mostrando tendência negativa. Ação corretiva urgente recomendada.';
        default:
          return 'Métrica mostrando tendência de declínio. Monitoramento próximo recomendado.';
      }
    }

    if (trend.direction === 'increasing') {
      return 'Tendência positiva identificada. Manter estratégias atuais.';
    }

    return 'Métrica estável. Continuar monitoramento regular.';
  }

  private generatePredictionSummary(predictions: any): any {
    const metrics = Object.keys(predictions);
    const decreasingTrends = metrics.filter(m => predictions[m].trend_direction === 'decreasing').length;
    const increasingTrends = metrics.filter(m => predictions[m].trend_direction === 'increasing').length;
    const stableTrends = metrics.length - decreasingTrends - increasingTrends;

    return {
      total_metrics_analyzed: metrics.length,
      trends: {
        decreasing: decreasingTrends,
        increasing: increasingTrends,
        stable: stableTrends
      },
      overall_health: decreasingTrends > increasingTrends ? 'declining' : 
                      increasingTrends > decreasingTrends ? 'improving' : 'stable',
      action_required: decreasingTrends > metrics.length * 0.3,
      high_confidence_predictions: metrics.filter(m => predictions[m].confidence > 0.8).length
    };
  }

  // ===================================================
  // LIMPEZA E MANUTENÇÃO
  // ===================================================

  async cleanupOldMetrics(retentionDays: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { error } = await supabase
        .from('analytics_metrics')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      console.log(`Métricas antigas (>${retentionDays} dias) removidas com sucesso`);
    } catch (error) {
      console.error('Erro na limpeza de métricas antigas:', error);
    }
  }

  async getCollectionStatus(): Promise<any> {
    return {
      is_running: this.isRunning,
      has_interval: !!this.intervalId,
      last_collection: new Date() // Em produção, buscar do banco
    };
  }
}

// Instância singleton para uso global
export const metricsCollector = new MetricsCollector();