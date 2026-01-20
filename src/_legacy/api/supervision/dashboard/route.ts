import { NextRequest, NextResponse } from 'next/server';
import { SupabaseSingleton } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisor_id');
    const area = searchParams.get('area'); // MKT, VEN, FIN, OPS, PRD, QUA
    const status = searchParams.get('status') || 'pending';

    const supabase = SupabaseSingleton.getInstance();

    // 1. Buscar dados da view v_supervision_pending
    let pendingQuery = supabase
      .from('v_supervision_pending')
      .select('*')
      .order('deadline', { ascending: true });

    if (supervisorId) {
      pendingQuery = pendingQuery.eq('supervisor_persona_id', supervisorId);
    }

    if (area) {
      // Filtrar por área extraída do task_template_code (primeiro segmento antes de _)
      // Nota: Isso requer processamento client-side ou uma view modificada
      // Por enquanto, vamos buscar todos e filtrar depois
    }

    const { data: pendingData, error: pendingError } = await pendingQuery;

    if (pendingError) {
      console.error('Error fetching pending supervisions:', pendingError);
      return NextResponse.json(
        { error: 'Erro ao buscar supervisões pendentes', details: pendingError.message },
        { status: 500 }
      );
    }

    // Filtrar por área se necessário (client-side)
    let filteredPending = pendingData || [];
    if (area) {
      filteredPending = filteredPending.filter(item => 
        item.task_template_code?.startsWith(`${area}_`)
      );
    }

    // 2. Calcular estatísticas
    const now = new Date();
    const stats = {
      total_pending: filteredPending.length,
      overdue: filteredPending.filter(item => new Date(item.deadline) < now).length,
      urgent: filteredPending.filter(item => {
        const hoursUntil = (new Date(item.deadline).getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntil > 0 && hoursUntil < 24;
      }).length,
      high_value: filteredPending.filter(item => item.task_value > 10000).length,
      avg_waiting_hours: 0,
      sla_exceeded_count: filteredPending.filter(item => item.exceeded_sla).length
    };

    // Calcular tempo médio de espera
    if (filteredPending.length > 0) {
      const totalWaitingMs = filteredPending.reduce((sum, item) => {
        const waitingMs = now.getTime() - new Date(item.requested_at).getTime();
        return sum + waitingMs;
      }, 0);
      stats.avg_waiting_hours = (totalWaitingMs / filteredPending.length) / (1000 * 60 * 60);
    }

    // 3. Distribuição por área
    const byArea: Record<string, number> = {};
    filteredPending.forEach(item => {
      const areaCode = item.task_template_code?.split('_')[0] || 'OTHER';
      byArea[areaCode] = (byArea[areaCode] || 0) + 1;
    });

    // 4. Distribuição por supervisor (top 5)
    const bySupervisor: Record<string, { name: string; count: number }> = {};
    filteredPending.forEach(item => {
      const supId = item.supervisor_persona_id;
      if (!bySupervisor[supId]) {
        bySupervisor[supId] = { name: item.supervisor_nome || 'Unknown', count: 0 };
      }
      bySupervisor[supId].count++;
    });

    const topSupervisors = Object.entries(bySupervisor)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Distribuição por prioridade
    const byPriority: Record<string, number> = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0
    };

    filteredPending.forEach(item => {
      const priority = item.task_parameters?.priority || 'normal';
      byPriority[priority] = (byPriority[priority] || 0) + 1;
    });

    // 6. Buscar métricas históricas da view v_supervision_metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from('v_supervision_metrics')
      .select('*')
      .limit(10);

    if (metricsError) {
      console.warn('Error fetching supervision metrics:', metricsError);
    }

    // 7. Taxa de aprovação (últimos 30 dias)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    let historicalQuery = supabase
      .from('task_supervision_logs')
      .select('decision, status')
      .gte('decided_at', thirtyDaysAgo)
      .not('decision', 'is', null);

    if (supervisorId) {
      historicalQuery = historicalQuery.eq('supervisor_persona_id', supervisorId);
    }

    const { data: historicalData, error: historicalError } = await historicalQuery;

    let approvalRates = {
      total_decisions: 0,
      approved: 0,
      rejected: 0,
      escalated: 0,
      approval_rate: 0,
      rejection_rate: 0,
      escalation_rate: 0
    };

    if (!historicalError && historicalData) {
      approvalRates.total_decisions = historicalData.length;
      approvalRates.approved = historicalData.filter(d => 
        d.decision?.includes('approved')
      ).length;
      approvalRates.rejected = historicalData.filter(d => 
        d.decision === 'rejected'
      ).length;
      approvalRates.escalated = historicalData.filter(d => 
        d.decision === 'escalated'
      ).length;

      if (approvalRates.total_decisions > 0) {
        approvalRates.approval_rate = (approvalRates.approved / approvalRates.total_decisions) * 100;
        approvalRates.rejection_rate = (approvalRates.rejected / approvalRates.total_decisions) * 100;
        approvalRates.escalation_rate = (approvalRates.escalated / approvalRates.total_decisions) * 100;
      }
    }

    // 8. Tempo médio de resposta (últimos 30 dias)
    const { data: responseTimeData, error: responseTimeError } = await supabase
      .from('task_supervision_logs')
      .select('requested_at, decided_at')
      .gte('decided_at', thirtyDaysAgo)
      .not('decided_at', 'is', null);

    let avgResponseTime = {
      hours: 0,
      within_sla_percentage: 0
    };

    if (!responseTimeError && responseTimeData && responseTimeData.length > 0) {
      const totalResponseMs = responseTimeData.reduce((sum, item) => {
        const responseMs = new Date(item.decided_at).getTime() - new Date(item.requested_at).getTime();
        return sum + responseMs;
      }, 0);
      
      avgResponseTime.hours = (totalResponseMs / responseTimeData.length) / (1000 * 60 * 60);
      
      // SLA padrão: 48h
      const withinSla = responseTimeData.filter(item => {
        const responseHours = (new Date(item.decided_at).getTime() - new Date(item.requested_at).getTime()) / (1000 * 60 * 60);
        return responseHours <= 48;
      }).length;
      
      avgResponseTime.within_sla_percentage = (withinSla / responseTimeData.length) * 100;
    }

    return NextResponse.json({
      success: true,
      stats,
      distribution: {
        by_area: byArea,
        by_supervisor: topSupervisors,
        by_priority: byPriority
      },
      approval_rates: approvalRates,
      avg_response_time: avgResponseTime,
      pending_items: filteredPending,
      historical_metrics: metricsData || []
    });

  } catch (error: any) {
    console.error('Error in GET /api/supervision/dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
