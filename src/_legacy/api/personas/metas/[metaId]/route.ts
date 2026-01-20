// ============================================================================
// API: Atualizar ou deletar uma meta específica
// ============================================================================
// PUT /api/personas/metas/[metaId] - Atualizar meta completa
// DELETE /api/personas/metas/[metaId] - Deletar meta
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

// PUT - Atualizar meta completa
export async function PUT(
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

    // Preparar dados para atualização (apenas campos fornecidos)
    const updateData: any = {};
    
    if (body.titulo !== undefined) updateData.titulo = body.titulo;
    if (body.descricao !== undefined) updateData.descricao = body.descricao;
    if (body.categoria !== undefined) updateData.categoria = body.categoria;
    if (body.valor_alvo !== undefined) updateData.valor_alvo = parseFloat(body.valor_alvo);
    if (body.valor_atual !== undefined) updateData.valor_atual = parseFloat(body.valor_atual);
    if (body.unidade_medida !== undefined) updateData.unidade_medida = body.unidade_medida;
    if (body.data_inicio !== undefined) updateData.data_inicio = body.data_inicio;
    if (body.data_prazo !== undefined) updateData.data_prazo = body.data_prazo;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.progresso_percentual !== undefined) updateData.progresso_percentual = parseInt(body.progresso_percentual);
    if (body.prioridade !== undefined) updateData.prioridade = parseInt(body.prioridade);
    if (body.responsavel !== undefined) updateData.responsavel = body.responsavel;
    if (body.observacoes !== undefined) updateData.observacoes = body.observacoes;
    if (body.vinculada_kpi !== undefined) updateData.vinculada_kpi = body.vinculada_kpi;

    // Atualizar meta
    const { data, error } = await supabase
      .from('personas_metas')
      .update(updateData)
      .eq('id', metaId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar meta:', error);
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
    console.error('Erro no PUT /api/personas/metas/[metaId]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar meta' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar meta
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { metaId } = params;

    if (!metaId) {
      return NextResponse.json(
        { error: 'ID da meta é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = SupabaseSingleton.getInstance();

    // Deletar meta
    const { error } = await supabase
      .from('personas_metas')
      .delete()
      .eq('id', metaId);

    if (error) {
      console.error('Erro ao deletar meta:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Meta deletada com sucesso' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        }
      }
    );

  } catch (error: any) {
    console.error('Erro no DELETE /api/personas/metas/[metaId]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar meta' },
      { status: 500 }
    );
  }
}
