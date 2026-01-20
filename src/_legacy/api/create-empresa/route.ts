import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getNationalitiesForCountry } from '../../../lib/normalizeNationality';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 🏢 API para CRIAR EMPRESA apenas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🏢 Criando empresa:', body);
    
    const { empresa_dados } = body;

    if (!empresa_dados) {
      return NextResponse.json(
        { success: false, message: 'Dados da empresa são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a empresa já existe
    const { data: empresaExistente } = await supabase
      .from('empresas')
      .select('*')
      .eq('codigo', empresa_dados.empresa_codigo)
      .single();

    if (empresaExistente) {
      return NextResponse.json(
        { success: false, message: `Empresa com código "${empresa_dados.empresa_codigo}" já existe` },
        { status: 409 }
      );
    }

    // Criar nova empresa
    const empresaParaSalvar = {
      nome: empresa_dados.empresa_nome || 'Empresa Virtual',
      codigo: empresa_dados.empresa_codigo || `VIRTUAL_${Date.now()}`,
      descricao: empresa_dados.empresa_descricao || 'Empresa virtual gerada automaticamente',
      industria: empresa_dados.empresa_industry || 'tecnologia',
      pais: empresa_dados.empresa_pais || 'BR',
      idiomas: empresa_dados.idiomas_extras || ['português'],
      status: 'ativa',
      total_personas: (empresa_dados.executivos_homens || 0) + 
                     (empresa_dados.executivos_mulheres || 0) + 
                     (empresa_dados.assistentes_homens || 0) + 
                     (empresa_dados.assistentes_mulheres || 0) + 
                     (empresa_dados.especialistas_homens || 0) + 
                     (empresa_dados.especialistas_mulheres || 0) + 1, // +1 CEO
      scripts_status: {
        personas: false,
        biografias: false,
        competencias: false,
        tech_specs: false,
        rag: false,
        fluxos: false,
        workflows: false
      },
      ceo_gender: empresa_dados.ceo_genero || 'feminino',
      executives_male: empresa_dados.executivos_homens || 0,
      executives_female: empresa_dados.executivos_mulheres || 0,
      assistants_male: empresa_dados.assistentes_homens || 0,
      assistants_female: empresa_dados.assistentes_mulheres || 0,
      specialists_male: empresa_dados.especialistas_homens || 0,
      specialists_female: empresa_dados.especialistas_mulheres || 0,
      industry: empresa_dados.empresa_industry || 'tecnologia',
      // If caller provided explicit nationalities use them, otherwise populate
      // a sensible set based on the company country to avoid a single 'Internacional' value.
      nationalities: empresa_dados.nacionalidades && empresa_dados.nacionalidades.length > 0
        ? empresa_dados.nacionalidades
        : getNationalitiesForCountry(empresa_dados.empresa_pais || 'BR'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: empresaCriada, error: empresaError } = await supabase
      .from('empresas')
      .insert([empresaParaSalvar])
      .select()
      .single();

    if (empresaError) {
      console.error('❌ Erro ao criar empresa:', empresaError);
      return NextResponse.json(
        { success: false, message: 'Erro ao criar empresa', error: empresaError.message },
        { status: 500 }
      );
    }

    console.log('✅ Empresa criada:', empresaCriada.nome);

    return NextResponse.json({
      success: true,
      message: `Empresa "${empresaCriada.nome}" criada com sucesso!`,
      empresa: {
        id: empresaCriada.id,
        codigo: empresaCriada.codigo,
        nome: empresaCriada.nome,
        industria: empresaCriada.industria,
        pais: empresaCriada.pais,
        status: empresaCriada.status,
        total_personas: empresaCriada.total_personas
      },
      next_steps: [
        'Gerar Personas',
        'Gerar Biografias', 
        'Gerar Competências',
        'Gerar Tech Specs'
      ]
    });

  } catch (error) {
    console.error('❌ Erro na API de criação de empresa:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor', error: String(error) },
      { status: 500 }
    );
  }
}