// ============================================================================
// API: Criar, atualizar e deletar atribuições
// ============================================================================
// POST /api/personas/atribuicoes - Criar nova atribuição
// PUT /api/personas/atribuicoes/[id] - Atualizar atribuição
// DELETE /api/personas/atribuicoes/[id] - Deletar atribuição
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseSingleton } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validação básica
    if (!body.persona_id) {
      return NextResponse.json(
        { error: 'persona_id é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!body.atribuicao) {
      return NextResponse.json(
        { error: 'atribuicao é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = SupabaseSingleton.getInstance();

    // Buscar a ordem máxima atual para esta persona
    const { data: maxOrdem, error: ordemError } = await supabase
      .from('personas_atribuicoes')
      .select('ordem')
      .eq('persona_id', body.persona_id)
      .order('ordem', { ascending: false })
      .limit(1)
      .single();

    const novaOrdem = maxOrdem ? maxOrdem.ordem + 1 : 1;

    // Preparar dados da atribuição
    // O campo atribuicao pode ser string (texto simples) ou JSONB (estruturado)
    let atribuicaoData = body.atribuicao;
    
    // Se for um objeto estruturado, garantir que tem os campos corretos
    if (typeof atribuicaoData === 'object') {
      atribuicaoData = {
        titulo: body.atribuicao.titulo || '',
        descricao: body.atribuicao.descricao || '',
        frequencia: body.atribuicao.frequencia || 'diária',
      };
    }

    // Inserir nova atribuição
    const { data, error } = await supabase
      .from('personas_atribuicoes')
      .insert([{
        persona_id: body.persona_id,
        atribuicao: atribuicaoData,
        ordem: body.ordem !== undefined ? parseInt(body.ordem) : novaOrdem,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar atribuição:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { 
      status: 201,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      }
    });

  } catch (error: any) {
    console.error('Erro no POST /api/personas/atribuicoes:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar atribuição' },
      { status: 500 }
    );
  }
}
