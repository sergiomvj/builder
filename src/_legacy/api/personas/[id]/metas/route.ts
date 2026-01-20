// ============================================================================
// API: Listar metas de uma persona
// ============================================================================
// GET /api/personas/[id]/metas
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

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: personaId } = params;

    if (!personaId) {
      return NextResponse.json(
        { error: 'ID da persona é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = SupabaseSingleton.getInstance();

    // Buscar todas as metas da persona
    const { data, error } = await supabase
      .from('personas_metas')
      .select('*')
      .eq('persona_id', personaId)
      .order('data_prazo', { ascending: true });

    if (error) {
      console.error('Erro ao buscar metas:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      }
    });

  } catch (error: any) {
    console.error('Erro no GET /api/personas/[id]/metas:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar metas' },
      { status: 500 }
    );
  }
}
