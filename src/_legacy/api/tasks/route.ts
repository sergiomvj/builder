import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// CRUD for personas_tasks with multiple persona assignments
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const empresa_id = url.searchParams.get('empresa_id') || undefined;
    const persona_id = url.searchParams.get('persona_id') || undefined;

    let query = supabase
      .from('personas_tasks')
      .select(`
        *,
        task_persona_assignments (
          id,
          persona_id,
          status,
          assigned_at,
          completed_at,
          personas (
            id,
            full_name,
            role,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (empresa_id) query = query.eq('empresa_id', empresa_id);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Se filtrar por persona_id, filtrar tarefas que incluem essa persona
    let tasks = data || [];
    if (persona_id && tasks.length > 0) {
      tasks = tasks.filter(task => 
        task.task_persona_assignments?.some((a: any) => a.persona_id === persona_id)
      );
    }

    return NextResponse.json(tasks);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const payload = {
      title: body.title || 'Untitled',
      description: body.description || null,
      empresa_id: body.empresa_id || null,
      task_id: body.task_id || `TASK-${Date.now()}`,
      task_type: body.task_type || 'ad_hoc',
      priority: body.priority || 'MEDIUM',
      status: body.status || 'pending',
      due_date: body.due_date || null,
      estimated_duration: body.estimated_duration || null,
      complexity_score: body.complexity_score || null,
      success_criteria: body.success_criteria || null,
      ai_generated: body.ai_generated || false,
    };

    // Criar a tarefa
    const { data: task, error: taskError } = await supabase
      .from('personas_tasks')
      .insert(payload)
      .select()
      .single();

    if (taskError) return NextResponse.json({ error: taskError.message }, { status: 500 });

    // Atribuir a personas (se fornecido)
    const persona_ids = body.persona_ids || [];
    if (persona_ids.length > 0 && task) {
      const assignments = persona_ids.map((pid: string) => ({
        task_id: task.id,
        persona_id: pid,
        status: 'pending'
      }));

      const { error: assignError } = await supabase
        .from('task_persona_assignments')
        .insert(assignments);

      if (assignError) {
        console.error('Assignment error:', assignError);
        // Não falha a request, só loga
      }
    }

    // Retornar tarefa com assignments
    const { data: fullTask } = await supabase
      .from('personas_tasks')
      .select(`
        *,
        task_persona_assignments (
          id,
          persona_id,
          status,
          personas (
            id,
            full_name,
            role,
            email
          )
        )
      `)
      .eq('id', task.id)
      .single();

    return NextResponse.json(fullTask || task, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const updates: Record<string, any> = {};
    ['title', 'description', 'due_date', 'status', 'priority', 'task_type', 
     'estimated_duration', 'complexity_score', 'success_criteria', 'completed_at'].forEach((k) => {
      if (body[k] !== undefined) updates[k] = body[k];
    });

    // Atualizar tarefa
    const { data, error } = await supabase
      .from('personas_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Se persona_ids fornecido, atualizar assignments
    if (body.persona_ids !== undefined) {
      // Remover assignments antigas
      await supabase.from('task_persona_assignments').delete().eq('task_id', id);

      // Adicionar novas
      if (body.persona_ids.length > 0) {
        const assignments = body.persona_ids.map((pid: string) => ({
          task_id: id,
          persona_id: pid,
          status: 'pending'
        }));

        await supabase.from('task_persona_assignments').insert(assignments);
      }
    }

    // Retornar com assignments
    const { data: fullTask } = await supabase
      .from('personas_tasks')
      .select(`
        *,
        task_persona_assignments (
          id,
          persona_id,
          status,
          personas (
            id,
            full_name,
            role,
            email
          )
        )
      `)
      .eq('id', id)
      .single();

    return NextResponse.json(fullTask || data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { data, error } = await supabase.from('personas_tasks').delete().eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: true, item: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
