// ============================================================================
// API: Atualizar ou deletar uma atribuição específica
// ============================================================================
// PUT /api/personas/atribuicoes/[id] - Atualizar atribuição
// DELETE /api/personas/atribuicoes/[id] - Deletar atribuição
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseSingleton } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT - Atualizar atribuição
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID da atribuição é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = SupabaseSingleton.getInstance();

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (body.atribuicao !== undefined) {
      // Se for objeto estruturado, validar campos
      if (typeof body.atribuicao === 'object') {
        updateData.atribuicao = {
          titulo: body.atribuicao.titulo || '',
          descricao: body.atribuicao.descricao || '',
          frequencia: body.atribuicao.frequencia || 'diária',
        };
      } else {
        updateData.atribuicao = body.atribuicao;
      }
    }
    
    if (body.ordem !== undefined) {
      updateData.ordem = parseInt(body.ordem);
    }

    // Atualizar atribuição
    const { data, error } = await supabase
      .from('personas_atribuicoes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar atribuição:', error);
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
    console.error('Erro no PUT /api/personas/atribuicoes/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar atribuição' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar atribuição
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID da atribuição é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = SupabaseSingleton.getInstance();

    // Buscar persona_id antes de deletar para reordenar depois
    const { data: atribuicao, error: fetchError } = await supabase
      .from('personas_atribuicoes')
      .select('persona_id, ordem')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Erro ao buscar atribuição:', fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    // Deletar atribuição
    const { error: deleteError } = await supabase
      .from('personas_atribuicoes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Erro ao deletar atribuição:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    // Reordenar as atribuições restantes
    const { data: restantes, error: restantesError } = await supabase
      .from('personas_atribuicoes')
      .select('id, ordem')
      .eq('persona_id', atribuicao.persona_id)
      .order('ordem', { ascending: true });

    if (!restantesError && restantes) {
      // Atualizar ordem sequencialmente
      for (let i = 0; i < restantes.length; i++) {
        await supabase
          .from('personas_atribuicoes')
          .update({ ordem: i + 1 })
          .eq('id', restantes[i].id);
      }
    }

    return NextResponse.json(
      { message: 'Atribuição deletada com sucesso' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        }
      }
    );

  } catch (error: any) {
    console.error('Erro no DELETE /api/personas/atribuicoes/[id]:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar atribuição' },
      { status: 500 }
    );
  }
}
