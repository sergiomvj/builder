import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const personaId = params.id;

    // Buscar persona básica primeiro
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (personaError || !persona) {
      console.error('Error fetching persona:', personaError);
      return NextResponse.json(
        { error: 'Persona not found' },
        { status: 404 }
      );
    }

    // Buscar dados relacionados individualmente para evitar erros de join
    const [biografias, atribuicoes, competencias, tasks, workflows, mlModels, avatares, auditorias] = await Promise.all([
      supabase.from('personas_biografias').select('*').eq('persona_id', personaId),
      supabase.from('personas_atribuicoes').select('*').eq('persona_id', personaId).order('ordem'),
      supabase.from('personas_competencias').select('*').eq('persona_id', personaId),
      supabase.from('personas_tasks').select('*').eq('persona_id', personaId),
      supabase.from('personas_workflows').select('*').eq('persona_id', personaId),
      supabase.from('personas_machine_learning').select('*').eq('persona_id', personaId),
      supabase.from('personas_avatares').select('*').eq('persona_id', personaId),
      supabase.from('personas_auditorias').select('*').eq('persona_id', personaId).order('audit_date', { ascending: false })
    ]);

    // Montar objeto completo
    const fullPersona = {
      ...persona,
      personas_biografias: biografias.data || [],
      personas_atribuicoes: atribuicoes.data || [],
      personas_competencias: competencias.data || [],
      personas_tasks: tasks.data || [],
      personas_workflows: workflows.data || [],
      personas_machine_learning: mlModels.data || [],
      personas_avatares: avatares.data || [],
      personas_auditorias: auditorias.data || []
    };

    return NextResponse.json(fullPersona, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/personas/[id]/full:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
