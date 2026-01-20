import { NextRequest, NextResponse } from 'next/server';
import { SupabaseSingleton } from '@/lib/supabase';
import { getTemplateByCode } from '@/lib/task-templates';

interface CreateTaskRequest {
  template_code: string;
  parameters: Record<string, any>;
  assigned_to?: string; // persona_id ou 'auto'
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  user_id?: string;
  user_email?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTaskRequest = await request.json();
    const { template_code, parameters, assigned_to, priority, user_id, user_email } = body;

    // 1. Validar template existe
    const template = getTemplateByCode(template_code);
    if (!template) {
      return NextResponse.json(
        { error: 'Template não encontrado', code: 'TEMPLATE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 2. Validar parâmetros obrigatórios
    const missingParams = template.parameters
      .filter(p => p.required)
      .filter(p => !parameters[p.name] || parameters[p.name] === '');

    if (missingParams.length > 0) {
      return NextResponse.json(
        { 
          error: 'Parâmetros obrigatórios ausentes',
          code: 'MISSING_PARAMETERS',
          missing: missingParams.map(p => p.name)
        },
        { status: 400 }
      );
    }

    // 3. Validar valores de parâmetros (tipos, ranges)
    for (const param of template.parameters) {
      const value = parameters[param.name];
      if (value === undefined || value === null) continue;

      // Validar tipo number
      if (param.type === 'number') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return NextResponse.json(
            { error: `Parâmetro ${param.name} deve ser um número`, code: 'INVALID_TYPE' },
            { status: 400 }
          );
        }
        if (param.min !== undefined && numValue < param.min) {
          return NextResponse.json(
            { error: `${param.name} deve ser >= ${param.min}`, code: 'VALUE_TOO_LOW' },
            { status: 400 }
          );
        }
        if (param.max !== undefined && numValue > param.max) {
          return NextResponse.json(
            { error: `${param.name} deve ser <= ${param.max}`, code: 'VALUE_TOO_HIGH' },
            { status: 400 }
          );
        }
      }

      // Validar email
      if (param.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return NextResponse.json(
            { error: `${param.name} deve ser um email válido`, code: 'INVALID_EMAIL' },
            { status: 400 }
          );
        }
      }

      // Validar URL
      if (param.type === 'url' && value) {
        try {
          new URL(value);
        } catch {
          return NextResponse.json(
            { error: `${param.name} deve ser uma URL válida`, code: 'INVALID_URL' },
            { status: 400 }
          );
        }
      }
    }

    const supabase = SupabaseSingleton.getInstance();

    // 4. Auto-assign persona se necessário
    let targetPersonaId = assigned_to;
    if (!assigned_to || assigned_to === 'auto') {
      // Buscar persona adequada baseado no executor_role do template
      const { data: personas, error: personaError } = await supabase
        .from('personas')
        .select('id, cargo')
        .ilike('cargo', `%${template.executor_role}%`)
        .limit(1);

      if (personaError || !personas || personas.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma persona disponível para este tipo de tarefa', code: 'NO_PERSONA_AVAILABLE' },
          { status: 404 }
        );
      }

      targetPersonaId = personas[0].id;
    }

    // 5. Verificar se persona existe
    const { data: persona, error: personaCheckError } = await supabase
      .from('personas')
      .select('id, nome, cargo, empresa_id')
      .eq('id', targetPersonaId)
      .single();

    if (personaCheckError || !persona) {
      return NextResponse.json(
        { error: 'Persona não encontrada', code: 'PERSONA_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 6. Criar intervention record
    const interventionData = {
      user_id: user_id || 'system',
      user_email: user_email || 'system@vcm.local',
      intervention_type: 'create_task',
      command_template: template_code,
      command_data: {
        template_code,
        parameters,
        priority: priority || template.priority || 'normal',
        assigned_to: targetPersonaId
      },
      target_persona_id: targetPersonaId,
      status: 'pending',
      expected_metrics: template.expected_metrics.reduce((acc, metric) => {
        acc[metric.name] = metric.target;
        return acc;
      }, {} as Record<string, any>)
    };

    const { data: intervention, error: interventionError } = await supabase
      .from('user_interventions')
      .insert(interventionData)
      .select()
      .single();

    if (interventionError) {
      console.error('Error creating intervention:', interventionError);
      return NextResponse.json(
        { error: 'Erro ao criar intervenção', details: interventionError.message },
        { status: 500 }
      );
    }

    // 7. Checar se precisa de supervisão
    const requiresSupervision = template.supervision_required || false;
    let supervisionLog = null;

    if (requiresSupervision) {
      // Buscar cadeia de supervisão para esta persona e template
      const { data: chains, error: chainError } = await supabase
        .from('task_supervision_chains')
        .select('*')
        .eq('executor_persona_id', targetPersonaId)
        .or(`task_template_code.eq.${template_code},task_category.eq.${template.functional_area}`)
        .order('hierarchy_level', { ascending: true })
        .limit(1);

      if (!chainError && chains && chains.length > 0) {
        const chain = chains[0];
        
        // Criar supervision log
        const supervisionData = {
          task_intervention_id: intervention.id,
          chain_id: chain.id,
          executor_persona_id: targetPersonaId,
          supervisor_persona_id: chain.supervisor_persona_id,
          task_template_code: template_code,
          task_parameters: parameters,
          task_value: parameters.budget || parameters.value || 0,
          risk_level: parameters.risk_level || 'medium',
          requested_at: new Date().toISOString(),
          deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h padrão
          status: 'pending'
        };

        const { data: supLog, error: supError } = await supabase
          .from('task_supervision_logs')
          .insert(supervisionData)
          .select()
          .single();

        if (!supError && supLog) {
          supervisionLog = supLog;

          // Criar comunicação de approval_request
          await supabase
            .from('personas_communications')
            .insert({
              sender_persona_id: targetPersonaId,
              receiver_persona_id: chain.supervisor_persona_id,
              type: 'approval_request',
              priority: priority || 'normal',
              subject: `Aprovação: ${template.name}`,
              message: `Solicitação de aprovação para tarefa "${template.name}" com os seguintes parâmetros: ${JSON.stringify(parameters, null, 2)}`,
              requires_action: true,
              deadline: supervisionData.deadline,
              metadata: {
                supervision_log_id: supLog.id,
                task_intervention_id: intervention.id,
                template_code: template_code
              }
            });
        }
      }
    }

    // 8. Atualizar intervention status para 'processing' ou 'awaiting_approval'
    await supabase
      .from('user_interventions')
      .update({ 
        status: requiresSupervision ? 'awaiting_approval' : 'processing' 
      })
      .eq('id', intervention.id);

    // 9. Retornar resultado
    return NextResponse.json({
      success: true,
      intervention_id: intervention.id,
      task: {
        template_code,
        template_name: template.name,
        assigned_to: {
          id: persona.id,
          nome: persona.nome,
          cargo: persona.cargo
        },
        parameters,
        priority: priority || template.priority || 'normal',
        expected_metrics: template.expected_metrics
      },
      requires_supervision: requiresSupervision,
      supervision_log_id: supervisionLog?.id || null,
      estimated_duration: template.estimated_duration_hours
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/tasks/create:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint para listar tasks criadas (opcional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = SupabaseSingleton.getInstance();

    let query = supabase
      .from('user_interventions')
      .select(`
        *,
        persona:target_persona_id (id, nome, cargo)
      `)
      .eq('intervention_type', 'create_task')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar tarefas', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tasks: data,
      count: data?.length || 0
    });

  } catch (error: any) {
    console.error('Error in GET /api/tasks/create:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
