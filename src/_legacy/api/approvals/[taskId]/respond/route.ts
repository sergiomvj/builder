import { NextRequest, NextResponse } from 'next/server';
import { SupabaseSingleton } from '@/lib/supabase';

interface RouteParams {
  params: {
    taskId: string;
  };
}

interface RespondApprovalRequest {
  supervisor_persona_id: string;
  decision: 'approved' | 'rejected' | 'approved_with_modifications' | 'escalated';
  decision_notes?: string;
  modifications_requested?: Array<{
    field: string;
    original_value: any;
    new_value: any;
    reason: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { taskId } = params;
    const body: RespondApprovalRequest = await request.json();
    const { supervisor_persona_id, decision, decision_notes, modifications_requested } = body;

    // Validar campos obrigatórios
    if (!supervisor_persona_id || !decision) {
      return NextResponse.json(
        { 
          error: 'Campos obrigatórios ausentes',
          code: 'MISSING_FIELDS',
          required: ['supervisor_persona_id', 'decision']
        },
        { status: 400 }
      );
    }

    // Validar decisão
    const validDecisions = ['approved', 'rejected', 'approved_with_modifications', 'escalated'];
    if (!validDecisions.includes(decision)) {
      return NextResponse.json(
        { 
          error: 'Decisão inválida',
          code: 'INVALID_DECISION',
          valid_decisions: validDecisions
        },
        { status: 400 }
      );
    }

    // Validar notas obrigatórias para reject e escalate
    if ((decision === 'rejected' || decision === 'escalated') && !decision_notes?.trim()) {
      return NextResponse.json(
        { 
          error: 'Notas são obrigatórias para rejeição ou escalação',
          code: 'NOTES_REQUIRED'
        },
        { status: 400 }
      );
    }

    const supabase = SupabaseSingleton.getInstance();

    // 1. Buscar supervision log
    const { data: supLog, error: supLogError } = await supabase
      .from('task_supervision_logs')
      .select(`
        *,
        executor:executor_persona_id(id, nome, cargo, email),
        supervisor:supervisor_persona_id(id, nome, cargo, email),
        chain:chain_id(*)
      `)
      .eq('task_intervention_id', taskId)
      .eq('supervisor_persona_id', supervisor_persona_id)
      .eq('status', 'pending')
      .single();

    if (supLogError || !supLog) {
      return NextResponse.json(
        { 
          error: 'Supervision log não encontrado ou já processado',
          code: 'SUPERVISION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const decidedAt = new Date().toISOString();

    // 2. Atualizar supervision log
    const updateData: any = {
      decision,
      decision_notes: decision_notes || null,
      decided_at: decidedAt,
      status: decision === 'escalated' ? 'escalated' : 
              decision.includes('approved') ? 'approved' : 'rejected'
    };

    if (decision === 'approved_with_modifications' && modifications_requested) {
      updateData.modifications_requested = modifications_requested;
    }

    const { error: updateError } = await supabase
      .from('task_supervision_logs')
      .update(updateData)
      .eq('id', supLog.id);

    if (updateError) {
      console.error('Error updating supervision log:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar aprovação', details: updateError.message },
        { status: 500 }
      );
    }

    // 3. Atualizar comunicação relacionada
    const { error: commError } = await supabase
      .from('personas_communications')
      .update({
        status: 'acted_upon',
        action_taken_at: decidedAt,
        action_notes: `Decisão: ${decision}${decision_notes ? ` - ${decision_notes}` : ''}`
      })
      .eq('receiver_persona_id', supervisor_persona_id)
      .eq('type', 'approval_request')
      .contains('metadata', { supervision_log_id: supLog.id });

    if (commError) {
      console.warn('Error updating communication:', commError);
    }

    // 4. Criar comunicação de notificação para o executor
    let notificationMessage = '';
    let notificationType: 'notification' | 'handoff' = 'notification';
    let notificationPriority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

    switch (decision) {
      case 'approved':
        notificationMessage = `✅ Sua solicitação "${supLog.task_template_code}" foi APROVADA por ${supLog.supervisor.nome}.`;
        notificationType = 'handoff';
        notificationPriority = 'high';
        break;

      case 'approved_with_modifications':
        notificationMessage = `✏️ Sua solicitação "${supLog.task_template_code}" foi APROVADA COM MODIFICAÇÕES por ${supLog.supervisor.nome}.\n\nModificações solicitadas:\n${modifications_requested?.map(m => `• ${m.field}: ${m.original_value} → ${m.new_value} (${m.reason})`).join('\n')}`;
        notificationType = 'handoff';
        notificationPriority = 'high';
        break;

      case 'rejected':
        notificationMessage = `❌ Sua solicitação "${supLog.task_template_code}" foi REJEITADA por ${supLog.supervisor.nome}.\n\nMotivo: ${decision_notes}`;
        notificationType = 'notification';
        notificationPriority = 'urgent';
        break;

      case 'escalated':
        notificationMessage = `⬆️ Sua solicitação "${supLog.task_template_code}" foi ESCALADA para nível superior por ${supLog.supervisor.nome}.\n\nMotivo: ${decision_notes}`;
        notificationType = 'notification';
        notificationPriority = 'high';
        break;
    }

    const { data: notification, error: notifError } = await supabase
      .from('personas_communications')
      .insert({
        sender_persona_id: supervisor_persona_id,
        receiver_persona_id: supLog.executor_persona_id,
        type: notificationType,
        priority: notificationPriority,
        subject: `Decisão de Aprovação: ${supLog.task_template_code}`,
        message: notificationMessage,
        requires_action: decision.includes('approved'),
        metadata: {
          supervision_log_id: supLog.id,
          decision,
          original_request: supLog.task_parameters,
          modifications: modifications_requested || null
        }
      })
      .select()
      .single();

    if (notifError) {
      console.warn('Error creating notification:', notifError);
    }

    // 5. Atualizar intervention status
    let interventionStatus = 'processing';
    if (decision === 'approved' || decision === 'approved_with_modifications') {
      interventionStatus = 'processing'; // Task pode começar
    } else if (decision === 'rejected') {
      interventionStatus = 'cancelled';
    } else if (decision === 'escalated') {
      interventionStatus = 'awaiting_approval'; // Ainda esperando decisão de nível superior
    }

    await supabase
      .from('user_interventions')
      .update({ 
        status: interventionStatus,
        command_data: {
          ...(supLog.task_parameters || {}),
          supervision_decision: decision,
          decided_at: decidedAt,
          decided_by: supervisor_persona_id,
          modifications: modifications_requested || null
        }
      })
      .eq('id', taskId);

    // 6. Se foi escalada, criar novo supervision log no próximo nível
    let escalationResult = null;
    if (decision === 'escalated') {
      const { data: nextChain, error: nextChainError } = await supabase
        .from('task_supervision_chains')
        .select('*')
        .eq('executor_persona_id', supLog.executor_persona_id)
        .gt('hierarchy_level', supLog.chain.hierarchy_level)
        .order('hierarchy_level', { ascending: true })
        .limit(1)
        .single();

      if (!nextChainError && nextChain) {
        const { data: newSupLog, error: newSupError } = await supabase
          .from('task_supervision_logs')
          .insert({
            task_intervention_id: taskId,
            chain_id: nextChain.id,
            executor_persona_id: supLog.executor_persona_id,
            supervisor_persona_id: nextChain.supervisor_persona_id,
            task_template_code: supLog.task_template_code,
            task_parameters: supLog.task_parameters,
            task_value: supLog.task_value,
            risk_level: supLog.risk_level === 'high' ? 'critical' : 'high', // Aumentar risk
            requested_at: decidedAt,
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h para escalação
            status: 'pending'
          })
          .select()
          .single();

        if (!newSupError && newSupLog) {
          // Criar approval_request para novo supervisor
          await supabase
            .from('personas_communications')
            .insert({
              sender_persona_id: supLog.executor_persona_id,
              receiver_persona_id: nextChain.supervisor_persona_id,
              type: 'approval_request',
              priority: 'urgent',
              subject: `ESCALADA: ${supLog.task_template_code}`,
              message: `Solicitação escalada do nível ${supLog.chain.hierarchy_level} (${supLog.supervisor.nome}).\n\nMotivo da escalação: ${decision_notes}\n\nParâmetros: ${JSON.stringify(supLog.task_parameters, null, 2)}`,
              requires_action: true,
              deadline: newSupLog.deadline,
              metadata: {
                supervision_log_id: newSupLog.id,
                escalated_from: supLog.id,
                escalation_reason: decision_notes,
                previous_supervisor: supervisor_persona_id
              }
            });

          escalationResult = {
            new_supervisor_id: nextChain.supervisor_persona_id,
            new_supervision_log_id: newSupLog.id,
            hierarchy_level: nextChain.hierarchy_level
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      decision,
      supervision_log_id: supLog.id,
      notification_id: notification?.id || null,
      intervention_status: interventionStatus,
      escalation: escalationResult,
      message: `Decisão registrada: ${decision}`
    });

  } catch (error: any) {
    console.error('Error in POST /api/approvals/:taskId/respond:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint para buscar detalhes da aprovação
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { taskId } = params;
    const { searchParams } = new URL(request.url);
    const supervisorId = searchParams.get('supervisor_id');

    const supabase = SupabaseSingleton.getInstance();

    let query = supabase
      .from('task_supervision_logs')
      .select(`
        *,
        executor:executor_persona_id(id, nome, cargo, email, avatar_url),
        supervisor:supervisor_persona_id(id, nome, cargo, email, avatar_url),
        chain:chain_id(*)
      `)
      .eq('task_intervention_id', taskId);

    if (supervisorId) {
      query = query.eq('supervisor_persona_id', supervisorId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar aprovação', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Aprovação não encontrada', code: 'APPROVAL_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      approvals: data
    });

  } catch (error: any) {
    console.error('Error in GET /api/approvals/:taskId/respond:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
