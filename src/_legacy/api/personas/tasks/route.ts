import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/personas/tasks
 * Adiciona uma nova tarefa para uma persona
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { persona_id, title, description, priority, estimated_duration, status } = body;

    if (!persona_id || !title) {
      return NextResponse.json(
        { error: 'persona_id e title são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar empresa_id da persona
    const { data: persona } = await supabase
      .from('personas')
      .select('empresa_id')
      .eq('id', persona_id)
      .single();

    if (!persona) {
      return NextResponse.json(
        { error: 'Persona não encontrada' },
        { status: 404 }
      );
    }

    // Inserir tarefa
    const { data: task, error } = await supabase
      .from('personas_tasks')
      .insert({
        persona_id,
        empresa_id: persona.empresa_id,
        task_id: `${persona_id}-task-${Date.now()}`,
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        estimated_duration: estimated_duration || null,
        status: status || 'pending',
        ai_generated: false,
        required_subsystems: [],
        inputs_from: [],
        outputs_to: [],
        generation_context: {}
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao inserir tarefa:', error);
      return NextResponse.json(
        { error: 'Erro ao criar tarefa' },
        { status: 500 }
      );
    }

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Erro em POST /api/personas/tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
