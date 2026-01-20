import { supabase } from './supabase';
import type { 
  AuditoriaWorkflowMetrics,
  AuditoriaTeamPerformance,
  AuditoriaKPIAnalysis,
  AuditoriaAlerta,
  AuditoriaRelatorio,
  AuditoriaConfiguracao
} from '../types/auditoria';

// =====================================================
// SERVIÇO PRINCIPAL DE AUDITORIA
// =====================================================

export class AuditoriaService {
  
  // ===================================================
  // COLETA DE MÉTRICAS DE WORKFLOW
  // ===================================================
  
  async getWorkflowMetrics(empresaId: string, periodo?: string): Promise<AuditoriaWorkflowMetrics[]> {
    try {
      const periodoDias = this.parsePeriodo(periodo);
      const dataCorte = new Date();
      dataCorte.setDate(dataCorte.getDate() - periodoDias);

      // Query complexa para agregar métricas de workflows
      const { data: workflowData, error } = await supabase
        .from('n8n_workflows')
        .select(`
          id,
          workflow_name,
          workflow_type,
          empresa_id,
          created_at,
          updated_at,
          personas!inner (
            id,
            full_name,
            role,
            department
          )
        `)
        .eq('empresa_id', empresaId)
        .gte('created_at', dataCorte.toISOString());

      if (error) throw error;

      // Simular métricas de execução (em produção, viria de logs reais)
      const metricas: AuditoriaWorkflowMetrics[] = await Promise.all(
        workflowData.map(async (workflow: any) => {
          const execucoes = this.generateWorkflowExecutionMetrics(workflow.id);
          
          // Verificar se personas é array ou objeto
          const persona = Array.isArray(workflow.personas) ? workflow.personas[0] : workflow.personas;
          
          return {
            id: `metrics_${workflow.id}`,
            empresa_id: empresaId,
            workflow_id: workflow.id,
            workflow_name: workflow.workflow_name,
            persona_id: persona?.id || 'unknown',
            persona_name: persona?.full_name || 'Unknown',
            departamento: persona?.department || 'Geral',
            
            // Métricas de Performance
            executions_total: execucoes.total,
            executions_success: execucoes.success,
            executions_failed: execucoes.failed,
            success_rate: execucoes.success / execucoes.total,
            
            // Tempos de Execução
            avg_execution_time_ms: execucoes.avgTime,
            min_execution_time_ms: execucoes.minTime,
            max_execution_time_ms: execucoes.maxTime,
            execution_time_variance: execucoes.variance,
            
            // Eficiência
            efficiency_score: this.calculateEfficiencyScore(execucoes),
            productivity_index: this.calculateProductivityIndex(execucoes),
            bottleneck_detected: execucoes.avgTime > 30000, // > 30s
            bottleneck_stage: execucoes.avgTime > 30000 ? 'processing' : undefined,
            
            // Tendências
            trend_direction: this.calculateTrendDirection(execucoes.history),
            trend_confidence: 0.85,
            
            // Período
            period_start: dataCorte,
            period_end: new Date(),
            data_points: execucoes.total,
            
            created_at: new Date(),
            updated_at: new Date()
          };
        })
      );

      return metricas;
    } catch (error) {
      console.error('Erro ao buscar métricas de workflow:', error);
      throw error;
    }
  }

  // ===================================================
  // ANÁLISE DE PERFORMANCE DA EQUIPE
  // ===================================================
  
  async getTeamPerformance(empresaId: string, periodo?: string): Promise<AuditoriaTeamPerformance[]> {
    try {
      const periodoDias = this.parsePeriodo(periodo);
      const dataCorte = new Date();
      dataCorte.setDate(dataCorte.getDate() - periodoDias);

      const { data: personas, error } = await supabase
        .from('personas')
        .select(`
          id,
          full_name,
          role,
          department,
          personas_atribuicoes (
            nivel_hierarquico,
            departamento
          ),
          personas_tasks (
            id,
            status,
            estimated_duration,
            actual_duration,
            due_date,
            completed_at,
            complexity_score
          ),
          task_execution_analytics (
            efficiency_ratio,
            success_rate,
            output_quality_score,
            stakeholder_satisfaction,
            rework_required
          )
        `)
        .eq('empresa_id', empresaId)
        .eq('status', 'active');

      if (error) throw error;

      const performance: AuditoriaTeamPerformance[] = personas.map(persona => {
  const tasks = persona.personas_tasks || [];
        const analytics = persona.task_execution_analytics || [];
        const tasksCompletas = tasks.filter(t => t.status === 'completed');
        const tasksPendentes = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
        const tasksAtrasadas = tasks.filter(t => 
          t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
        );

        // Cálculos de performance
        const completionRate = tasks.length > 0 ? tasksCompletas.length / tasks.length : 0;
        const avgEfficiency = analytics.length > 0 
          ? analytics.reduce((acc, a) => acc + (a.efficiency_ratio || 0), 0) / analytics.length 
          : 0.7;
        const qualityScore = analytics.length > 0
          ? analytics.reduce((acc, a) => acc + (a.output_quality_score || 7), 0) / analytics.length * 10
          : 70;

        return {
          id: `perf_${persona.id}`,
          empresa_id: empresaId,
          persona_id: persona.id,
          departamento: persona.department || 'Geral',
          nivel_hierarquico: persona.personas_atribuicoes?.[0]?.nivel_hierarquico || 3,
          
          // Performance Individual
          tasks_completed: tasksCompletas.length,
          tasks_pending: tasksPendentes.length,
          tasks_overdue: tasksAtrasadas.length,
          completion_rate: completionRate,
          
          // Qualidade
          quality_score: qualityScore,
          rework_rate: analytics.filter(a => a.rework_required).length / Math.max(analytics.length, 1),
          error_rate: 1 - (analytics.reduce((acc, a) => acc + (a.success_rate || 0.9), 0) / Math.max(analytics.length, 1)),
          
          // Colaboração
          collaboration_score: this.calculateCollaborationScore(persona, tasks),
          dependency_wait_time_avg: this.calculateAvgWaitTime(tasks),
          team_contribution_index: this.calculateTeamContribution(persona, analytics),
          
          // Carga de Trabalho
          workload_utilization: this.calculateWorkloadUtilization(tasks),
          stress_indicator: this.calculateStressIndicator(tasks, tasksAtrasadas.length),
          overload_risk: this.isOverloaded(tasks, analytics),
          underutilized: this.isUnderutilized(tasks, analytics),
          
          // Competências
          skill_match_score: this.calculateSkillMatch(persona, tasks),
          skill_gaps: this.identifySkillGaps(persona, tasks),
          suggested_training: this.suggestTraining(persona, tasks),
          
          // Período
          analysis_period: this.determinePeriod(periodoDias),
          period_start: dataCorte,
          period_end: new Date(),
          
          created_at: new Date()
        };
      });

      return performance;
    } catch (error) {
      console.error('Erro ao analisar performance da equipe:', error);
      throw error;
    }
  }

  // ===================================================
  // ANÁLISE DE KPIs E METAS
  // ===================================================
  
  async getKPIAnalysis(empresaId: string, metaId?: string): Promise<AuditoriaKPIAnalysis[]> {
    try {
      let query = supabase
        .from('metas_globais')
        .select(`
          id,
          titulo,
          descricao,
          prazo,
          progresso,
          status,
          categoria,
          prioridade,
          created_at,
          metas_personas (
            id,
            titulo,
            progresso,
            status,
            persona_id,
            personas (
              id,
              full_name
            )
          )
        `)
        .eq('empresa_id', empresaId)
        .in('status', ['ativa', 'pausada']);

      if (metaId) {
        query = query.eq('id', metaId);
      }

      const { data: metas, error } = await query;
      if (error) throw error;

      const analises: AuditoriaKPIAnalysis[] = await Promise.all(
        metas.map(async (meta) => {
          const progressoEsperado = this.calculateExpectedProgress(
            new Date(meta.created_at), 
            new Date(meta.prazo)
          );

          const personaContributions = meta.metas_personas.map((mp: any) => {
            const persona = Array.isArray(mp.personas) ? mp.personas[0] : mp.personas;
            return {
              persona_id: mp.persona_id,
              persona_name: persona?.full_name || 'Unknown',
              contribution_percentage: mp.progresso / Math.max(meta.progresso, 1) * 100,
              performance_rating: this.ratePersonaPerformance(mp.progresso, progressoEsperado),
              blockers: this.identifyBlockers(mp)
            };
          });

          const variance = meta.progresso - progressoEsperado;
          const velocityScore = this.calculateVelocityScore(meta.progresso, meta.created_at);
          const riskLevel = this.assessRiskLevel(variance, velocityScore, meta.prazo);

          return {
            id: `kpi_${meta.id}`,
            empresa_id: empresaId,
            meta_global_id: meta.id,
            
            // Meta Global
            meta_titulo: meta.titulo,
            meta_descricao: meta.descricao,
            meta_prazo: new Date(meta.prazo),
            meta_progresso_esperado: progressoEsperado,
            meta_progresso_atual: meta.progresso,
            
            // Análise de Performance
            performance_status: this.determinePerformanceStatus(variance, riskLevel),
            variance_percentage: variance,
            velocity_score: velocityScore,
            
            // Indicadores de Risco
            risk_level: riskLevel,
            risk_factors: this.identifyRiskFactors(meta, variance),
            mitigation_strategies: this.suggestMitigationStrategies(riskLevel, meta),
            
            // Contribuições por Persona
            persona_contributions: personaContributions,
            
            // Análise Temporal
            timeline_analysis: {
              days_remaining: this.calculateDaysRemaining(meta.prazo),
              days_ahead_behind: this.calculateDaysAheadBehind(variance, velocityScore),
              projected_completion: this.projectCompletionDate(meta, velocityScore),
              confidence_level: this.calculateConfidenceLevel(velocityScore, variance)
            },
            
            // Recomendações
            recommendations: this.generateRecommendations(meta, variance, riskLevel, personaContributions),
            
            created_at: new Date(),
            updated_at: new Date()
          };
        })
      );

      return analises;
    } catch (error) {
      console.error('Erro ao analisar KPIs:', error);
      throw error;
    }
  }

  // ===================================================
  // SISTEMA DE ALERTAS
  // ===================================================
  
  async createAlerta(alerta: Partial<AuditoriaAlerta>): Promise<AuditoriaAlerta> {
    try {
      const novoAlerta: AuditoriaAlerta = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        empresa_id: alerta.empresa_id!,
        tipo: alerta.tipo!,
        severidade: alerta.severidade!,
        titulo: alerta.titulo!,
        descricao: alerta.descricao!,
        affected_scope: alerta.affected_scope!,
        affected_entities: alerta.affected_entities || [],
        metric_name: alerta.metric_name!,
        threshold_value: alerta.threshold_value!,
        current_value: alerta.current_value!,
        deviation_percentage: ((alerta.current_value! - alerta.threshold_value!) / alerta.threshold_value!) * 100,
        detection_method: alerta.detection_method || 'threshold',
        confidence_score: alerta.confidence_score || 0.9,
        false_positive_risk: alerta.false_positive_risk || 0.1,
        auto_resolution_attempted: false,
        manual_action_required: alerta.severidade === 'critical' || alerta.severidade === 'error',
        recommended_actions: alerta.recommended_actions || [],
        status: 'active',
        created_at: new Date(),
        expires_at: alerta.expires_at
      };

      // Salvar no Supabase
      const { data, error } = await supabase
        .from('system_alerts')
        .insert([{
          empresa_id: novoAlerta.empresa_id,
          alert_type: novoAlerta.tipo,
          severity: novoAlerta.severidade,
          title: novoAlerta.titulo,
          description: novoAlerta.descricao,
          alert_data: {
            metric_name: novoAlerta.metric_name,
            threshold_value: novoAlerta.threshold_value,
            current_value: novoAlerta.current_value,
            affected_scope: novoAlerta.affected_scope,
            affected_entities: novoAlerta.affected_entities
          },
          status: 'active',
          triggered_at: novoAlerta.created_at,
          expires_at: novoAlerta.expires_at
        }])
        .select()
        .single();

      if (error) throw error;

      return novoAlerta;
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
      throw error;
    }
  }

  async getAlertas(empresaId: string, severidade?: string): Promise<AuditoriaAlerta[]> {
    try {
      let query = supabase
        .from('system_alerts')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('status', 'active')
        .order('triggered_at', { ascending: false });

      if (severidade) {
        query = query.eq('severity', severidade);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(alert => ({
        id: alert.id,
        empresa_id: alert.empresa_id,
        tipo: alert.alert_type as any,
        severidade: alert.severity as any,
        titulo: alert.title,
        descricao: alert.description,
        affected_scope: alert.alert_data?.affected_scope || 'global',
        affected_entities: alert.alert_data?.affected_entities || [],
        metric_name: alert.alert_data?.metric_name || '',
        threshold_value: alert.alert_data?.threshold_value || 0,
        current_value: alert.alert_data?.current_value || 0,
        deviation_percentage: 0,
        detection_method: 'system' as any,
        confidence_score: 0.9,
        false_positive_risk: 0.1,
        auto_resolution_attempted: false,
        manual_action_required: alert.severity === 'critical',
        recommended_actions: [],
        status: alert.status as any,
        created_at: new Date(alert.triggered_at),
        expires_at: alert.expires_at ? new Date(alert.expires_at) : undefined
      }));
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      throw error;
    }
  }

  // ===================================================
  // MÉTODOS AUXILIARES
  // ===================================================

  private parsePeriodo(periodo?: string): number {
    switch (periodo) {
      case 'hoje': return 1;
      case 'semana': return 7;
      case 'mes': return 30;
      case 'trimestre': return 90;
      default: return 7; // padrão: última semana
    }
  }

  private generateWorkflowExecutionMetrics(workflowId: string) {
    // Simulação de dados de execução - em produção viria de logs reais
    const total = Math.floor(Math.random() * 100) + 20;
    const success = Math.floor(total * (0.8 + Math.random() * 0.2));
    const failed = total - success;
    
    return {
      total,
      success,
      failed,
      avgTime: Math.floor(Math.random() * 20000) + 5000, // 5-25 segundos
      minTime: Math.floor(Math.random() * 5000) + 1000,
      maxTime: Math.floor(Math.random() * 50000) + 10000,
      variance: Math.random() * 10000,
      history: Array.from({ length: 7 }, () => Math.random() * 30000)
    };
  }

  private calculateEfficiencyScore(execucoes: any): number {
    const successRate = execucoes.success / execucoes.total;
    const speedScore = Math.max(0, (30000 - execucoes.avgTime) / 30000);
    return Math.round((successRate * 0.7 + speedScore * 0.3) * 100);
  }

  private calculateProductivityIndex(execucoes: any): number {
    return execucoes.success / (execucoes.avgTime / 1000); // sucessos por segundo
  }

  private calculateTrendDirection(history: number[]): 'improving' | 'declining' | 'stable' | 'volatile' {
    if (history.length < 2) return 'stable';
    
    const first = history.slice(0, Math.floor(history.length / 2));
    const second = history.slice(Math.floor(history.length / 2));
    const firstAvg = first.reduce((a, b) => a + b) / first.length;
    const secondAvg = second.reduce((a, b) => a + b) / second.length;
    const variance = history.reduce((acc, val, i, arr) => acc + Math.pow(val - (arr.reduce((a, b) => a + b) / arr.length), 2), 0) / history.length;
    
    if (variance > 10000) return 'volatile';
    if (secondAvg < firstAvg * 0.9) return 'improving';
    if (secondAvg > firstAvg * 1.1) return 'declining';
    return 'stable';
  }

  private calculateCollaborationScore(persona: any, tasks: any[]): number {
    // Simulação baseada em dependências entre tasks
    const collaborativeTasks = tasks.filter(t => t.inputs_from?.length > 0 || t.outputs_to?.length > 0);
    return Math.round((collaborativeTasks.length / Math.max(tasks.length, 1)) * 100);
  }

  private calculateAvgWaitTime(tasks: any[]): number {
    // Simulação de tempo médio de espera por dependências
    return Math.floor(Math.random() * 120) + 30; // 30-150 minutos
  }

  private calculateTeamContribution(persona: any, analytics: any[]): number {
    if (analytics.length === 0) return 0.5;
    return analytics.reduce((acc, a) => acc + (a.stakeholder_satisfaction || 5), 0) / (analytics.length * 10);
  }

  private calculateWorkloadUtilization(tasks: any[]): number {
    const totalEstimated = tasks.reduce((acc, t) => acc + (t.estimated_duration || 60), 0);
    const availableMinutes = 8 * 60; // 8 horas por dia
    return Math.min(totalEstimated / availableMinutes, 2); // máximo 200% (sobrecarga)
  }

  private calculateStressIndicator(tasks: any[], overdueTasks: number): number {
    const overloadFactor = tasks.length > 10 ? (tasks.length - 10) / 10 : 0;
    const overdueFactor = overdueTasks / Math.max(tasks.length, 1);
    return Math.min(overloadFactor + overdueFactor, 1);
  }

  private isOverloaded(tasks: any[], analytics: any[]): boolean {
    const utilization = this.calculateWorkloadUtilization(tasks);
    const stress = this.calculateStressIndicator(tasks, tasks.filter(t => new Date(t.due_date) < new Date()).length);
    return utilization > 1.2 || stress > 0.7;
  }

  private isUnderutilized(tasks: any[], analytics: any[]): boolean {
    const utilization = this.calculateWorkloadUtilization(tasks);
    return utilization < 0.5 && tasks.length < 5;
  }

  private calculateSkillMatch(persona: any, tasks: any[]): number {
    // Simulação baseada no role vs complexidade das tasks
    const avgComplexity = tasks.length > 0 
      ? tasks.reduce((acc, t) => acc + (t.complexity_score || 5), 0) / tasks.length 
      : 5;
    
    const roleComplexityMap: Record<string, number> = {
      'CEO': 10, 'CTO': 9, 'Diretor': 8, 'Gerente': 7, 'Coordenador': 6,
      'Sênior': 7, 'Pleno': 6, 'Júnior': 4, 'Estagiário': 3, 'Assistente': 5
    };
    
    const expectedComplexity = Object.entries(roleComplexityMap).find(([role]) => 
      persona.role?.includes(role)
    )?.[1] || 5;
    
    const match = 1 - Math.abs(avgComplexity - expectedComplexity) / 10;
    return Math.round(Math.max(0, match) * 100);
  }

  private identifySkillGaps(persona: any, tasks: any[]): string[] {
    const gaps: string[] = [];
    const highComplexityTasks = tasks.filter(t => (t.complexity_score || 5) > 7);
    
    if (highComplexityTasks.length > tasks.length * 0.5) {
      gaps.push('Gestão de projetos complexos', 'Liderança técnica');
    }
    
    if (persona.role?.includes('Júnior') && highComplexityTasks.length > 0) {
      gaps.push('Conhecimentos técnicos avançados', 'Autonomia para decisões');
    }
    
    return gaps;
  }

  private suggestTraining(persona: any, tasks: any[]): string[] {
    const suggestions: string[] = [];
    const skillGaps = this.identifySkillGaps(persona, tasks);
    
    skillGaps.forEach(gap => {
      switch (gap) {
        case 'Gestão de projetos complexos':
          suggestions.push('Curso de PMP', 'Workshop de Metodologias Ágeis');
          break;
        case 'Liderança técnica':
          suggestions.push('Programa de Liderança', 'Mentoria com Tech Lead');
          break;
        case 'Conhecimentos técnicos avançados':
          suggestions.push('Certificações técnicas', 'Curso de arquitetura de software');
          break;
      }
    });
    
    return suggestions;
  }

  private determinePeriod(dias: number): 'daily' | 'weekly' | 'monthly' {
    if (dias <= 1) return 'daily';
    if (dias <= 7) return 'weekly';
    return 'monthly';
  }

  private calculateExpectedProgress(inicio: Date, prazo: Date): number {
    const agora = new Date();
    const totalDias = (prazo.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
    const diasDecorridos = (agora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(100, Math.max(0, (diasDecorridos / totalDias) * 100));
  }

  private ratePersonaPerformance(progresso: number, esperado: number): number {
    const ratio = progresso / Math.max(esperado, 1);
    if (ratio >= 1.2) return 100;
    if (ratio >= 1.0) return 90;
    if (ratio >= 0.8) return 70;
    if (ratio >= 0.6) return 50;
    return 30;
  }

  private identifyBlockers(metaPersona: any): string[] {
    const blockers: string[] = [];
    if (metaPersona.progresso < 20) blockers.push('Início lento');
    if (metaPersona.status === 'pausada') blockers.push('Meta pausada');
    return blockers;
  }

  private calculateVelocityScore(progresso: number, inicio: string): number {
    const diasDecorridos = (new Date().getTime() - new Date(inicio).getTime()) / (1000 * 60 * 60 * 24);
    return progresso / Math.max(diasDecorridos, 1); // progresso por dia
  }

  private assessRiskLevel(variance: number, velocity: number, prazo: string): 'low' | 'medium' | 'high' | 'critical' {
    const diasRestantes = (new Date(prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    
    if (variance < -30 || (diasRestantes < 7 && variance < 0)) return 'critical';
    if (variance < -15 || (diasRestantes < 30 && variance < 0)) return 'high';
    if (variance < -5 || velocity < 1) return 'medium';
    return 'low';
  }

  private determinePerformanceStatus(variance: number, riskLevel: string): 'on_track' | 'at_risk' | 'off_track' | 'completed' {
    if (variance >= 100) return 'completed';
    if (riskLevel === 'critical') return 'off_track';
    if (riskLevel === 'high' || riskLevel === 'medium') return 'at_risk';
    return 'on_track';
  }

  private identifyRiskFactors(meta: any, variance: number): string[] {
    const factors: string[] = [];
    if (variance < -20) factors.push('Progresso significativamente abaixo do esperado');
    if (meta.prioridade === 'baixa') factors.push('Baixa prioridade pode impactar foco');
    if (meta.metas_personas?.length === 0) factors.push('Falta de atribuição de responsabilidades');
    return factors;
  }

  private suggestMitigationStrategies(riskLevel: string, meta: any): string[] {
    const strategies: string[] = [];
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      strategies.push('Revisão urgente de cronograma');
      strategies.push('Realocação de recursos');
      strategies.push('Priorização desta meta');
    }
    
    if (riskLevel === 'medium') {
      strategies.push('Monitoramento mais frequente');
      strategies.push('Identificar gargalos');
    }
    
    return strategies;
  }

  private calculateDaysRemaining(prazo: string): number {
    return Math.ceil((new Date(prazo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  }

  private calculateDaysAheadBehind(variance: number, velocity: number): number {
    // Estimativa baseada na velocidade atual
    if (velocity <= 0) return -999; // muito atrasado
    return Math.round(variance / velocity);
  }

  private projectCompletionDate(meta: any, velocity: number): Date {
    const progressoRestante = 100 - meta.progresso;
    const diasEstimados = velocity > 0 ? progressoRestante / velocity : 999;
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + diasEstimados);
    return completionDate;
  }

  private calculateConfidenceLevel(velocity: number, variance: number): number {
    let confidence = 0.7; // base
    if (velocity > 2) confidence += 0.2; // velocidade alta
    if (Math.abs(variance) < 10) confidence += 0.1; // baixo desvio
    return Math.min(1, Math.max(0, confidence));
  }

  private generateRecommendations(meta: any, variance: number, riskLevel: string, contributions: any[]): any[] {
    const recommendations: any[] = [];
    
    if (variance < -15) {
      recommendations.push({
        priority: 'high' as const,
        action: 'Acelerar execução das atividades relacionadas',
        expected_impact: 80,
        effort_required: 'high' as const,
        responsible_personas: contributions.filter(c => c.performance_rating < 60).map(c => c.persona_id)
      });
    }
    
    if (contributions.some(c => c.performance_rating < 50)) {
      recommendations.push({
        priority: 'medium' as const,
        action: 'Oferecer suporte adicional aos membros com baixa performance',
        expected_impact: 60,
        effort_required: 'medium' as const,
        responsible_personas: ['manager']
      });
    }
    
    return recommendations;
  }
}