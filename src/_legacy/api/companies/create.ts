import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Função para gerar dados de empresa com LLM
async function generateCompanyDataWithLLM(companyInput: any) {
  try {
    // Gerar personas usando LLM (OpenAI)
    const prompt = `Você é um especialista em criação de empresas virtuais e personas corporativas. 

Crie dados detalhados para uma empresa com as seguintes características:
- Nome: ${companyInput.nome}
- Indústria: ${companyInput.industry}
- País: ${companyInput.pais}
- Descrição: ${companyInput.descricao}

Estrutura de personas:
- CEO: ${companyInput.ceo_gender}
- Executivos: ${companyInput.executives_male} homens, ${companyInput.executives_female} mulheres
- Assistentes: ${companyInput.assistants_male} homens, ${companyInput.assistants_female} mulheres  
- Especialistas: ${companyInput.specialists_male} homens, ${companyInput.specialists_female} mulheres

Gere dados adicionais relevantes como:
- Missão e visão da empresa
- Valores corporativos
- Estrutura organizacional
- Principais produtos/serviços

Retorne em formato JSON estruturado.`;

    // Simular chamada para OpenAI (implementar depois)
    console.log('🧠 [LLM] Gerando dados com prompt:', prompt.substring(0, 200) + '...');
    
    // Por enquanto, dados estruturados baseados no input
    const totalPersonas = companyInput.executives_male + companyInput.executives_female + 
                         companyInput.assistants_male + companyInput.assistants_female + 
                         companyInput.specialists_male + companyInput.specialists_female + 1; // +1 CEO

    const generatedData = {
      // Dados básicos da empresa
      codigo: companyInput.codigo || `${companyInput.nome.replace(/\s+/g, '').toUpperCase()}_${Date.now()}`,
      nome: companyInput.nome,
      descricao: companyInput.descricao,
      industria: companyInput.industry || companyInput.industria,
      pais: companyInput.pais || 'BR',
      idiomas: companyInput.idiomas || ['português'],
      status: 'ativa' as const,
      total_personas: totalPersonas,
      
      // Status dos scripts - marcamos biografias como true
      scripts_status: {
        biografias: true,  // ✅ Acabamos de "gerar" dados
        competencias: false,
        tech_specs: false,
        rag: false,
        fluxos: false,
        workflows: false
      },
      
      // Dados de personas
      ceo_gender: companyInput.ceo_gender,
      executives_male: companyInput.executives_male,
      executives_female: companyInput.executives_female,
      assistants_male: companyInput.assistants_male,
      assistants_female: companyInput.assistants_female,
      specialists_male: companyInput.specialists_male,
      specialists_female: companyInput.specialists_female,
      
      // Campos obrigatórios do schema Supabase
      dominio: companyInput.dominio || '',
      industry: companyInput.industry,
      nationalities: [], // Array vazio por padrão
      
      // Metadados de criação
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('✅ [LLM] Dados gerados:', generatedData);
    return generatedData;
    
  } catch (error) {
    console.error('❌ Erro ao gerar dados com LLM:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🚀 [COMPANIES API] Criando empresa com dados:', body);
    
    // Gerar dados enriquecidos com LLM
    const enrichedCompanyData = await generateCompanyDataWithLLM(body);
    
    console.log('🧠 [LLM] Dados enriquecidos:', enrichedCompanyData);
    
    // Salvar no Supabase
    const { data: empresaCriada, error: empresaError } = await supabase
      .from('empresas')
      .insert([enrichedCompanyData])
      .select()
      .single();
      
    if (empresaError) {
      console.error('❌ Erro ao salvar empresa no Supabase:', empresaError);
      return NextResponse.json({
        success: false,
        message: `Erro ao salvar no banco de dados: ${empresaError.message}`,
        error: empresaError
      }, { status: 500 });
    }
    
    console.log('✅ Empresa criada com sucesso:', empresaCriada);
    
    return NextResponse.json({
      success: true,
      message: `Empresa "${empresaCriada.nome}" criada com sucesso!`,
      data: empresaCriada,
      personas_geradas: enrichedCompanyData.total_personas,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na API de criação de empresa:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}