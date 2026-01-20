import { NextRequest, NextResponse } from 'next/server';
import { SupabaseSingleton } from '@/lib/supabase';

interface CreateInterventionRequest {
  user_id: string;
  user_email: string;
  intervention_type: 'create_task' | 'modify_task' | 'confirm_metric' | 'cancel_task' | 'escalate' | 'provide_feedback';
  command_template?: string;
  command_data: Record<string, any>;
  target_persona_id?: string;
  target_task_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateInterventionRequest = await request.json();
    const {
      user_id,
      user_email,
      intervention_type,
      command_template,
      command_data,
      target_persona_id,
      target_task_id
    } = body;

    // Validar campos obrigatórios
    if (!user_id || !user_email || !intervention_type) {
      return NextResponse.json(
        { 
          error: 'Campos obrigatórios ausentes',
          code: 'MISSING_FIELDS',
          required: ['user_id', 'user_email', 'intervention_type']
        },
        { status: 400 }
      );
    }

    // Validar tipo de intervenção
    const validTypes = ['create_task', 'modify_task', 'confirm_metric', 'cancel_task', 'escalate', 'provide_feedback'];
    if (!validTypes.includes(intervention_type)) {
      return NextResponse.json(
        { 
          error: 'Tipo de intervenção inválido',
          code: 'INVALID_INTERVENTION_TYPE',
          valid_types: validTypes
        },
        { status: 400 }
      );
    }

    const supabase = SupabaseSingleton.getInstance();

    // Criar intervention record
    const interventionData: any = {
      user_id,
      user_email,
      intervention_type,
      command_template: command_template || null,
      command_data,
      target_persona_id: target_persona_id || null,
      target_task_id: target_task_id || null,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const { data: intervention, error: insertError } = await supabase
      .from('user_interventions')
      .insert(interventionData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating intervention:', insertError);
      return NextResponse.json(
        { error: 'Erro ao criar intervenção', details: insertError.message },
        { status: 500 }
      );
    }

    // Executar ação específica baseada no tipo
    let result: any = {
      intervention_id: intervention.id,
      status: 'pending'
    };

    try {
      switch (intervention_type) {
        case 'create_task':
          // Task creation é tratado pelo endpoint /api/tasks/create
          result.message = 'Tarefa criada com sucesso';
          result.status = 'processing';
          break;

        case 'modify_task':
          if (!target_task_id) {
            throw new Error('target_task_id é obrigatório para modify_task');
          }
          
          // Atualizar task existente
          const { error: updateError } = await supabase
            .from('user_interventions')
            .update({
              command_data: {
                ...command_data,
                modified_at: new Date().toISOString()
              },
              status: 'processing'
            })
            .eq('id', target_task_id);

          if (updateError) throw updateError;
          
          result.message = 'Tarefa modificada com sucesso';
          result.status = 'processing';
          break;

        case 'confirm_metric':
          if (!target_task_id) {
            throw new Error('target_task_id é obrigatório para confirm_metric');
          }

          // Atualizar métricas da task
          const { error: metricError } = await supabase
            .from('user_interventions')
            .update({
              actual_metrics: command_data.actual_metrics || {},
              metrics_confirmed: true,
              metrics_confirmed_at: new Date().toISOString(),
              status: 'completed'
            })
            .eq('id', target_task_id);

          if (metricError) throw metricError;

          result.message = 'Métricas confirmadas com sucesso';
          result.status = 'completed';
          result.actual_metrics = command_data.actual_metrics;
          break;

        case 'cancel_task':
          if (!target_task_id) {
            throw new Error('target_task_id é obrigatório para cancel_task');
          }

          // Cancelar task
          const { error: cancelError } = await supabase
            .from('user_interventions')
            .update({
              status: 'cancelled',
              command_data: {
                ...command_data,
                cancelled_at: new Date().toISOString(),
                cancellation_reason: command_data.reason || 'User requested'
              }
            })
            .eq('id', target_task_id);

          if (cancelError) throw cancelError;

          result.message = 'Tarefa cancelada com sucesso';
          result.status = 'cancelled';
          break;

        case 'escalate':
          if (!target_task_id) {
            throw new Error('target_task_id é obrigatório para escalate');
          }

          // Buscar supervision log
          const { data: supLog, error: supLogError } = await supabase
            .from('task_supervision_logs')
            .select('*, chain:chain_id(*)')
            .eq('task_intervention_id', target_task_id)
            .eq('status', 'pending')
            .single();

          if (supLogError || !supLog) {
            throw new Error('Supervision log não encontrado');
          }

          // Buscar próximo nível de supervisão
          const { data: nextChain, error: nextChainError } = await supabase
            .from('task_supervision_chains')
            .select('*')
            .eq('executor_persona_id', supLog.chain.executor_persona_id)
            .gt('hierarchy_level', supLog.chain.hierarchy_level)
            .order('hierarchy_level', { ascending: true })
            .limit(1)
            .single();

          if (nextChainError || !nextChain) {
            throw new Error('Não há próximo nível de supervisão disponível');
          }

          // Atualizar log atual para escalated
          await supabase
            .from('task_supervision_logs')
            .update({
              status: 'escalated',
              decision: 'escalated',
              decision_notes: command_data.reason || 'Escalado pelo usuário',
              decided_at: new Date().toISOString()
            })
            .eq('id', supLog.id);

          // Criar novo supervision log no próximo nível
          const { data: newSupLog, error: newSupError } = await supabase
            .from('task_supervision_logs')
            .insert({
              task_intervention_id: target_task_id,
              chain_id: nextChain.id,
              executor_persona_id: supLog.executor_persona_id,
              supervisor_persona_id: nextChain.supervisor_persona_id,
              task_template_code: supLog.task_template_code,
              task_parameters: supLog.task_parameters,
              task_value: supLog.task_value,
              risk_level: supLog.risk_level,
              requested_at: new Date().toISOString(),
              deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h para escalação
              status: 'pending'
            })
            .select()
            .single();

          if (newSupError) throw newSupError;

          // Criar comunicação para novo supervisor
          await supabase
            .from('personas_communications')
            .insert({
              sender_persona_id: supLog.executor_persona_id,
              receiver_persona_id: nextChain.supervisor_persona_id,
              type: 'approval_request',
              priority: 'urgent',
              subject: `ESCALADA: ${supLog.task_template_code}`,
              message: `Solicitação escalada. Motivo: ${command_data.reason || 'Escalação manual'}`,
              requires_action: true,
              deadline: newSupLog.deadline,
              metadata: {
                supervision_log_id: newSupLog.id,
                escalated_from: supLog.id,
                escalation_reason: command_data.reason
              }
            });

          result.message = 'Tarefa escalada com sucesso';
          result.status = 'escalated';
          result.new_supervisor_id = nextChain.supervisor_persona_id;
          result.new_supervision_log_id = newSupLog.id;
          break;

        case 'provide_feedback':
          // Apenas registrar feedback
          result.message = 'Feedback registrado com sucesso';
          result.status = 'completed';
          break;

        default:
          result.message = 'Intervenção registrada';
          result.status = 'pending';
      }

      // Atualizar status da intervention
      await supabase
        .from('user_interventions')
        .update({ 
          status: result.status,
          processing_completed_at: ['completed', 'cancelled'].includes(result.status) 
            ? new Date().toISOString() 
            : null
        })
        .eq('id', intervention.id);

    } catch (executionError: any) {
      console.error('Error executing intervention:', executionError);
      
      // Marcar intervention como failed
      await supabase
        .from('user_interventions')
        .update({ 
          status: 'failed',
          command_data: {
            ...command_data,
            error: executionError.message
          }
        })
        .eq('id', intervention.id);

      return NextResponse.json(
        { 
          error: 'Erro ao executar intervenção',
          intervention_id: intervention.id,
          details: executionError.message
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/interventions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint para listar interventions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = SupabaseSingleton.getInstance();

    let query = supabase
      .from('user_interventions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (type) {
      query = query.eq('intervention_type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar intervenções', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      interventions: data,
      count: data?.length || 0,
      pagination: { limit, offset, total: data?.length || 0 }
    });

  } catch (error: any) {
    console.error('Error in GET /api/interventions:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
