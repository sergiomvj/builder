import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 👥 GET /api/personas - Lista todas as personas do banco Supabase
 * 
 * Query params opcionais:
 * - empresa_id: filtrar por empresa específica
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresa_id');

    let query = supabase
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
      .order('full_name', { ascending: true });

    // Filtrar por empresa se fornecido
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }

    const { data: personas, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar personas:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: personas || []
    });

  } catch (error) {
    console.error('❌ Erro na API personas:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 📝 POST /api/personas - Cria nova persona
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresa_id, full_name, role, email } = body;

    if (!empresa_id || !full_name || !role) {
      return NextResponse.json(
        { success: false, error: 'empresa_id, full_name e role são obrigatórios' },
        { status: 400 }
      );
    }

    const { data: persona, error } = await supabase
      .from('personas')
      .insert({
        empresa_id,
        full_name,
        role,
        email: email || `${full_name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar persona:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: persona
    });

  } catch (error) {
    console.error('❌ Erro na API personas POST:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * 🗑️ DELETE /api/personas?id=xxx - Remove persona
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Erro ao deletar persona:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Persona removida com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro na API personas DELETE:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
