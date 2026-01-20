import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 🏢 API Route para listar empresas do banco Supabase
 */
export async function GET() {
  try {
    // Configurar cliente Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, message: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todas as empresas (excluir empresas deletadas)
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('*')
      .not('nome', 'like', '[DELETED-%')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar empresas:', error);
      return NextResponse.json(
        { success: false, message: 'Erro ao buscar empresas', error: error.message },
        { status: 500 }
      );
    }

    // Para cada empresa, buscar contagem de personas
    const empresasComPersonas = await Promise.all(
      empresas.map(async (empresa) => {
        const { count: personasCount } = await supabase
          .from('personas')
          .select('id', { count: 'exact', head: true })
          .eq('empresa_id', empresa.id);

        // Buscar competências através das personas
        const { data: personasIds } = await supabase
          .from('personas')
          .select('id')
          .eq('empresa_id', empresa.id);

        let competenciasCount = 0;
        if (personasIds && personasIds.length > 0) {
          const { count } = await supabase
            .from('competencias')
            .select('id', { count: 'exact', head: true })
            .in('persona_id', personasIds.map(p => p.id));
          competenciasCount = count || 0;
        }

        return {
          id: empresa.id,
          codigo: empresa.codigo,
          nome: empresa.nome,
          descricao: empresa.descricao,
          status: empresa.status,
          total_personas: personasCount || 0,
          total_competencias: competenciasCount,
          pais: empresa.pais,
          idiomas: empresa.idiomas,
          industry: empresa.industry || empresa.industria,
          ceo_gender: empresa.ceo_gender,
          executives_male: empresa.executives_male,
          executives_female: empresa.executives_female,
          assistants_male: empresa.assistants_male,
          assistants_female: empresa.assistants_female,
          specialists_male: empresa.specialists_male,
          specialists_female: empresa.specialists_female,
          scripts_status: empresa.scripts_status,
          created_at: empresa.created_at,
          updated_at: empresa.updated_at,
          dominio: empresa.dominio
        };
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Empresas carregadas do banco de dados',
      data: empresasComPersonas,
      total: empresasComPersonas.length
    });

  } catch (error) {
    console.error('❌ Erro ao listar empresas:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro ao listar empresas', 
        error: String(error) 
      },
      { status: 500 }
    );
  }
}