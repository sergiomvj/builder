// ============================================================================
// API: Criar nova meta para uma persona
// ============================================================================
// POST /api/personas/metas
// Body: { persona_id, titulo, descricao, categoria, valor_alvo, ... }
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
    
    if (!body.titulo) {
      return NextResponse.json(
        { error: 'titulo é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!body.valor_alvo) {
      return NextResponse.json(
        { error: 'valor_alvo é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!body.data_prazo) {
      return NextResponse.json(
        { error: 'data_prazo é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = SupabaseSingleton.getInstance();

    // Inserir nova meta
    const { data, error } = await supabase
      .from('personas_metas')
      .insert([{
        persona_id: body.persona_id,
        titulo: body.titulo,
        descricao: body.descricao || null,
        categoria: body.categoria || 'performance',
        valor_alvo: parseFloat(body.valor_alvo),
        valor_atual: parseFloat(body.valor_atual || 0),
        unidade_medida: body.unidade_medida || null,
        data_inicio: body.data_inicio || new Date().toISOString().split('T')[0],
        data_prazo: body.data_prazo,
        status: body.status || 'nao_iniciada',
        progresso_percentual: parseInt(body.progresso_percentual || 0),
        prioridade: parseInt(body.prioridade || 2),
        responsavel: body.responsavel || null,
        observacoes: body.observacoes || null,
        vinculada_kpi: body.vinculada_kpi || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar meta:', error);
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
    console.error('Erro no POST /api/personas/metas:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar meta' },
      { status: 500 }
    );
  }
}
