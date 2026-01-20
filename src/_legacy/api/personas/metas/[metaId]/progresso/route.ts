// ============================================================================
// API: Atualizar apenas o progresso de uma meta
// ============================================================================
// PATCH /api/personas/metas/[metaId]/progresso
// Body: { valor_atual, progresso_percentual?, status? }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseSingleton } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: {
    metaId: string;
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { metaId } = params;
    const body = await request.json();

    if (!metaId) {
      return NextResponse.json(
        { error: 'ID da meta é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = SupabaseSingleton.getInstance();

    // Buscar meta atual para calcular progresso se necessário
    const { data: metaAtual, error: fetchError } = await supabase
      .from('personas_metas')
      .select('valor_alvo, valor_atual')
      .eq('id', metaId)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar meta:', fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    // Preparar dados de atualização
    const updateData: any = {};

    if (body.valor_atual !== undefined) {
      updateData.valor_atual = parseFloat(body.valor_atual);
      
      // Calcular progresso automaticamente se não fornecido
      if (body.progresso_percentual === undefined && metaAtual.valor_alvo > 0) {
        const progresso = (updateData.valor_atual / metaAtual.valor_alvo) * 100;
        updateData.progresso_percentual = Math.min(100, Math.max(0, Math.round(progresso)));
      }
    }

    if (body.progresso_percentual !== undefined) {
      updateData.progresso_percentual = Math.min(100, Math.max(0, parseInt(body.progresso_percentual)));
    }

    // Atualizar status automaticamente baseado no progresso
    if (updateData.progresso_percentual !== undefined) {
      if (updateData.progresso_percentual === 0) {
        updateData.status = 'nao_iniciada';
      } else if (updateData.progresso_percentual === 100) {
        updateData.status = 'concluida';
      } else if (updateData.progresso_percentual > 0) {
        updateData.status = 'em_progresso';
      }
    }

    // Permitir override manual do status
    if (body.status !== undefined) {
      updateData.status = body.status;
    }

    // Atualizar meta
    const { data, error } = await supabase
      .from('personas_metas')
      .update(updateData)
      .eq('id', metaId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar progresso:', error);
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
    console.error('Erro no PATCH /api/personas/metas/[metaId]/progresso:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar progresso' },
      { status: 500 }
    );
  }
}
