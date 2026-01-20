import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.VCM_SUPABASE_URL ??
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey =
      process.env.VCM_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openAiApiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase ausente no ambiente' },
        { status: 500 }
      );
    }

    if (!openAiApiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY ausente no ambiente' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const openai = new OpenAI({ apiKey: openAiApiKey });

    const { scriptId, empresaCodigo } = await request.json();

    if (!scriptId || !empresaCodigo) {
      return NextResponse.json(
        { error: 'scriptId e empresaCodigo são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`🚀 Executando script ${scriptId} para empresa ${empresaCodigo}`);

    // Buscar empresa no banco
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('nome', empresaCodigo)
      .single();

    if (empresaError || !empresa) {
      return NextResponse.json(
        { error: `Empresa ${empresaCodigo} não encontrada` },
        { status: 404 }
      );
    }

    // Buscar personas da empresa
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError) {
      throw personasError;
    }

    console.log(`📊 Encontradas ${personas?.length || 0} personas para processamento`);

    let resultado;

    // Processar baseado no script solicitado
    switch (scriptId) {
      case 'competencias':
        resultado = await processarCompetencias(supabase, openai, empresa, personas || []);
        break;
      case 'tech-specs':
        resultado = await processarTechSpecs(supabase, openai, empresa, personas || []);
        break;
      case 'rag-database':
        resultado = await processarRagDatabase(supabase, openai, empresa, personas || []);
        break;
      case 'fluxos-analise':
        resultado = await processarFluxosAnalise(supabase, openai, empresa, personas || []);
        break;
      case 'workflows-n8n':
        resultado = await processarWorkflowsN8n(supabase, openai, empresa, personas || []);
        break;
      default:
        return NextResponse.json(
          { error: 'Script não encontrado' },
          { status: 404 }
        );
    }

    return NextResponse.json({
      success: true,
      scriptId,
      empresaCodigo,
      resultado,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erro na execução:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor',
      details: error
    }, { status: 500 });
  }
}

// Função para processar competências
async function processarCompetencias(supabase: any, openai: any, empresa: any, personas: any[]) {
  console.log('🧠 Processando competências das personas...');
  
  const competenciasAtualizadas = [];

  for (const persona of personas) {
    try {
      // Usar OpenAI para analisar e enriquecer competências
      const prompt = `
        Analise e enriqueça as competências desta persona:
        
        Nome: ${persona.nome}
        Cargo: ${persona.cargo}
        Empresa: ${empresa.nome}
        Setor: ${empresa.setores?.join(', ')}
        
        Competências Técnicas Atuais: ${persona.competencias_tecnicas?.join(', ') || 'Não definidas'}
        Competências Comportamentais Atuais: ${persona.competencias_comportamentais?.join(', ') || 'Não definidas'}
        
        Retorne um JSON com competências enriquecidas:
        {
          "tecnicas": ["array de competências técnicas específicas"],
          "comportamentais": ["array de competências comportamentais"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const competenciasEnriquecidas = JSON.parse(response.choices[0].message.content || '{}');

      // Atualizar no banco
      const { error } = await supabase
        .from('personas')
        .update({
          competencias_tecnicas: competenciasEnriquecidas.tecnicas,
          competencias_comportamentais: competenciasEnriquecidas.comportamentais,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (error) throw error;

      competenciasAtualizadas.push({
        id: persona.id,
        nome: persona.nome,
        competencias_atualizadas: competenciasEnriquecidas
      });

    } catch (error) {
      console.error(`❌ Erro ao processar competências de ${persona.nome}:`, error);
    }
  }

  return {
    totalPersonas: personas.length,
    competenciasAtualizadas: competenciasAtualizadas.length,
    detalhes: competenciasAtualizadas
  };
}

// Função para processar especificações técnicas
async function processarTechSpecs(supabase: any, openai: any, empresa: any, personas: any[]) {
  console.log('⚙️ Processando especificações técnicas...');
  
  const especificacoesAtualizadas = [];

  for (const persona of personas) {
    try {
      const prompt = `
        Gere especificações técnicas detalhadas para esta persona:
        
        Nome: ${persona.nome}
        Cargo: ${persona.cargo}
        Empresa: ${empresa.nome}
        Competências Técnicas: ${persona.competencias_tecnicas?.join(', ') || 'Não definidas'}
        
        Retorne um JSON com especificações técnicas:
        {
          "ferramentas": ["array de ferramentas específicas"],
          "tecnologias": ["array de tecnologias"],
          "sistemas": ["array de sistemas"],
          "certificacoes": ["array de certificações recomendadas"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", 
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const especificacoes = JSON.parse(response.choices[0].message.content || '{}');

      // Atualizar no banco
      const { error } = await supabase
        .from('personas')
        .update({
          especificacoes_tecnicas: especificacoes,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (error) throw error;

      especificacoesAtualizadas.push({
        id: persona.id,
        nome: persona.nome,
        especificacoes
      });

    } catch (error) {
      console.error(`❌ Erro ao processar tech specs de ${persona.nome}:`, error);
    }
  }

  return {
    totalPersonas: personas.length,
    especificacoesAtualizadas: especificacoesAtualizadas.length,
    detalhes: especificacoesAtualizadas
  };
}

// Função placeholder para RAG Database
async function processarRagDatabase(supabase: any, openai: any, empresa: any, personas: any[]) {
  console.log('🗃️ Processando RAG Database...');
  
  // TODO: Implementar processamento real do RAG
  return {
    status: 'RAG Database atualizado',
    empresa: empresa.nome,
    totalPersonas: personas.length
  };
}

// Função placeholder para Fluxos de Análise
async function processarFluxosAnalise(supabase: any, openai: any, empresa: any, personas: any[]) {
  console.log('📊 Processando Fluxos de Análise...');
  
  // TODO: Implementar análise real dos fluxos
  return {
    status: 'Fluxos de análise processados',
    empresa: empresa.nome,
    totalPersonas: personas.length
  };
}

// Função placeholder para Workflows N8N
async function processarWorkflowsN8n(supabase: any, openai: any, empresa: any, personas: any[]) {
  console.log('🔄 Processando Workflows N8N...');
  
  // TODO: Implementar geração real de workflows
  return {
    status: 'Workflows N8N gerados',
    empresa: empresa.nome,
    totalPersonas: personas.length
  };
}

export async function GET() {
  return NextResponse.json({
    message: 'API de execução de scripts Node.js',
    scripts: [
      'competencias',
      'tech-specs', 
      'rag-database',
      'fluxos-analise',
      'workflows-n8n'
    ]
  });
}
