import { NextRequest, NextResponse } from 'next/server';
import { SupabaseSingleton } from '@/lib/supabase';

interface RouteParams {
  params: {
    personaId: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { personaId } = params;
    const { searchParams } = new URL(request.url);

    // Query parameters
    const status = searchParams.get('status'); // pending, read, acted_upon, archived
    const type = searchParams.get('type'); // handoff, notification, approval_request, question
    const priority = searchParams.get('priority'); // low, normal, high, urgent
    const requiresAction = searchParams.get('requires_action'); // true, false
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = SupabaseSingleton.getInstance();

    // Validar persona existe
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('id, nome, cargo')
      .eq('id', personaId)
      .single();

    if (personaError || !persona) {
      return NextResponse.json(
        { error: 'Persona não encontrada', code: 'PERSONA_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Construir query
    let query = supabase
      .from('personas_communications')
      .select(`
        *,
        sender:sender_persona_id (id, nome, cargo, avatar_url),
        receiver:receiver_persona_id (id, nome, cargo, avatar_url)
      `)
      .eq('receiver_persona_id', personaId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (requiresAction) {
      query = query.eq('requires_action', requiresAction === 'true');
    }

    const { data: communications, error } = await query;

    if (error) {
      console.error('Error fetching communications:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar comunicações', details: error.message },
        { status: 500 }
      );
    }

    // Calcular estatísticas
    const stats = {
      total: communications?.length || 0,
      pending: communications?.filter(c => c.status === 'pending').length || 0,
      requires_action: communications?.filter(c => c.requires_action && c.status === 'pending').length || 0,
      overdue: communications?.filter(c => {
        if (!c.deadline || c.status !== 'pending') return false;
        return new Date(c.deadline) < new Date();
      }).length || 0,
      by_type: communications?.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      by_priority: communications?.reduce((acc, c) => {
        acc[c.priority] = (acc[c.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    };

    return NextResponse.json({
      success: true,
      persona: {
        id: persona.id,
        nome: persona.nome,
        cargo: persona.cargo
      },
      communications,
      stats,
      pagination: {
        limit,
        offset,
        total: communications?.length || 0
      }
    });

  } catch (error: any) {
    console.error('Error in GET /api/communications/:personaId:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH endpoint para atualizar status de comunicação
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { personaId } = params;
    const body = await request.json();
    const { communication_id, action, notes } = body;

    // Validar action
    const validActions = ['mark_read', 'mark_acted', 'archive', 'reply'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida', code: 'INVALID_ACTION', valid_actions: validActions },
        { status: 400 }
      );
    }

    const supabase = SupabaseSingleton.getInstance();

    // Validar comunicação existe e pertence à persona
    const { data: comm, error: commError } = await supabase
      .from('personas_communications')
      .select('*')
      .eq('id', communication_id)
      .eq('receiver_persona_id', personaId)
      .single();

    if (commError || !comm) {
      return NextResponse.json(
        { error: 'Comunicação não encontrada', code: 'COMMUNICATION_NOT_FOUND' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'mark_read':
        updateData = {
          status: 'read',
          read_at: new Date().toISOString()
        };
        break;

      case 'mark_acted':
        updateData = {
          status: 'acted_upon',
          action_taken_at: new Date().toISOString(),
          action_notes: notes || null
        };
        break;

      case 'archive':
        updateData = {
          status: 'archived'
        };
        break;

      case 'reply':
        // Criar nova comunicação como resposta
        const { data: reply, error: replyError } = await supabase
          .from('personas_communications')
          .insert({
            sender_persona_id: personaId,
            receiver_persona_id: comm.sender_persona_id,
            type: comm.type === 'question' ? 'notification' : comm.type,
            priority: comm.priority,
            subject: `Re: ${comm.subject}`,
            message: notes || '',
            metadata: {
              in_reply_to: communication_id,
              original_type: comm.type
            }
          })
          .select()
          .single();

        if (replyError) {
          return NextResponse.json(
            { error: 'Erro ao enviar resposta', details: replyError.message },
            { status: 500 }
          );
        }

        // Marcar original como respondida
        updateData = {
          status: 'acted_upon',
          action_taken_at: new Date().toISOString(),
          action_notes: 'Resposta enviada'
        };

        return NextResponse.json({
          success: true,
          action: 'reply',
          reply_id: reply.id,
          original_updated: true
        });
    }

    // Atualizar comunicação
    const { error: updateError } = await supabase
      .from('personas_communications')
      .update(updateData)
      .eq('id', communication_id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao atualizar comunicação', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      action,
      communication_id,
      updated_fields: Object.keys(updateData)
    });

  } catch (error: any) {
    console.error('Error in PATCH /api/communications/:personaId:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
