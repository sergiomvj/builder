// ============================================================================
// API: Atualizar procedimento de execução de uma tarefa
// ============================================================================
// PATCH /api/personas/tasks/[taskId]/procedimento
// Body: { procedimento_execucao: [...steps] }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseSingleton } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: {
    taskId: string;
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { taskId } = params;
    const body = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'ID da tarefa é obrigatório' },
        { status: 400 }
      );
    }

    if (!body.procedimento_execucao) {
      return NextResponse.json(
        { error: 'procedimento_execucao é obrigatório' },
        { status: 400 }
      );
    }

    // Validar estrutura do procedimento
    if (!Array.isArray(body.procedimento_execucao)) {
      return NextResponse.json(
        { error: 'procedimento_execucao deve ser um array' },
        { status: 400 }
      );
    }

    // Validar cada step
    for (const step of body.procedimento_execucao) {
      if (!step.step || !step.acao) {
        return NextResponse.json(
          { error: 'Cada step deve ter "step" (número) e "acao" (texto)' },
          { status: 400 }
        );
      }
    }

    const supabase = SupabaseSingleton.getInstance();

    // Atualizar tarefa com novo procedimento
    const { data, error } = await supabase
      .from('personas_tasks')
      .update({
        procedimento_execucao: body.procedimento_execucao,
      })
      .eq('task_id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar procedimento:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      }
    });

  } catch (error: any) {
    console.error('Erro no PATCH /api/personas/tasks/[taskId]/procedimento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar procedimento' },
      { status: 500 }
    );
  }
}
