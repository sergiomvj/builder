import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET - Obter dados completos de uma persona
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Buscar persona com todas as relações
    const { data, error } = await supabase
      .from('personas')
      .select(`
        *,
        personas_biografias(*),
        personas_atribuicoes(*),
        personas_competencias(*),
        personas_avatares(*),
        personas_automation_opportunities(*),
        personas_workflows(*),
        personas_machine_learning(*),
        personas_auditorias(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API] Erro ao buscar persona:', error);
      return NextResponse.json(
        { error: 'Persona não encontrada', details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[API] Erro ao buscar persona:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Atualizar dados de uma persona
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { table, data: updateData } = body;

    console.log('[API] Atualizando persona:', { id, table, updateData });

    // Se não especificou tabela, atualiza a tabela principal
    if (!table || table === 'personas') {
      const { data, error } = await supabase
        .from('personas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[API] Erro ao atualizar persona:', error);
        return NextResponse.json(
          { error: 'Erro ao atualizar persona', details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Persona atualizada com sucesso',
        data
      });
    }

    // Atualizar tabela específica
    const validTables = [
      'personas_biografias',
      'personas_atribuicoes',
      'personas_competencias',
      'personas_avatares',
      'personas_automation_opportunities',
      'personas_workflows',
      'personas_machine_learning',
      'personas_auditorias'
    ];

    if (!validTables.includes(table)) {
      return NextResponse.json(
        { error: `Tabela inválida: ${table}` },
        { status: 400 }
      );
    }

    // Verificar se já existe registro
    const { data: existing } = await supabase
      .from(table)
      .select('id')
      .eq('persona_id', id)
      .single();

    if (existing) {
      // UPDATE
      const { data, error } = await supabase
        .from(table)
        .update(updateData)
        .eq('persona_id', id)
        .select()
        .single();

      if (error) {
        console.error(`[API] Erro ao atualizar ${table}:`, error);
        return NextResponse.json(
          { error: `Erro ao atualizar ${table}`, details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${table} atualizada com sucesso`,
        data
      });
    } else {
      // INSERT
      const { data, error } = await supabase
        .from(table)
        .insert({ ...updateData, persona_id: id })
        .select()
        .single();

      if (error) {
        console.error(`[API] Erro ao inserir em ${table}:`, error);
        return NextResponse.json(
          { error: `Erro ao inserir em ${table}`, details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${table} criada com sucesso`,
        data
      });
    }

  } catch (error: any) {
    console.error('[API] Erro ao atualizar persona:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Deletar uma persona e todos os dados relacionados
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Cascade delete automático via FK constraints
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API] Erro ao deletar persona:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar persona', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Persona deletada com sucesso'
    });

  } catch (error: any) {
    console.error('[API] Erro ao deletar persona:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}
