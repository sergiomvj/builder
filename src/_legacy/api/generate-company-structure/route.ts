import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Verificando OpenAI API Key...');
    console.log('🔑 Key presente:', !!process.env.OPENAI_API_KEY);
    console.log('🔑 Key primeiros chars:', process.env.OPENAI_API_KEY?.substring(0, 10));
    
    const body = await request.json();
    const { nome, descricao, industria, mercado_alvo, porte, pais } = body;

    console.log('📥 Request recebida:', { nome, industria, porte });

    if (!nome || !descricao || !industria) {
      return NextResponse.json(
        { error: 'Nome, descrição e indústria são obrigatórios' },
        { status: 400 }
      );
    }

    const prompt = `Você é um especialista em estrutura organizacional e RH estratégico.

EMPRESA:
- Nome: ${nome}
- Descrição: ${descricao}
- Indústria: ${industria}
- Mercado-alvo: ${mercado_alvo}
- Porte: ${porte || 'medio'}
- País: ${pais}

TAREFA:
Crie uma estrutura organizacional COMPLETA e REALISTA para esta empresa, com cargos 100% ESPECÍFICOS do nicho de atuação.

REGRAS CRÍTICAS:
1. **CARGOS ESPECÍFICOS**: Use títulos de cargos REAIS e específicos do setor (ex: "Veterinário Consultor Sênior" não "Especialista Senior")
2. **CONTEXTO DO MERCADO**: Considere as necessidades REAIS do mercado-alvo
3. **DIVERSIDADE DE GÊNERO**: Sugira distribuição equilibrada (40-60% cada gênero nos níveis hierárquicos)
4. **NÍVEIS HIERÁRQUICOS**: C-Level → Diretoria → Gerência → Especialistas → Operacional
5. **JUSTIFICATIVA**: Explique POR QUE cada cargo é necessário para ESTA empresa específica
6. **TAMANHO ADEQUADO**: 
   - Pequeno porte: 8-15 pessoas
   - Médio porte: 15-40 pessoas
   - Grande porte: 40-100 pessoas

FORMATO DE RESPOSTA (JSON válido):
{
  "ceo": {
    "titulo": "CEO / Fundador",
    "departamento": "Executivo",
    "nivel": "C-Level",
    "especialidade": "Gestão Estratégica",
    "justificativa": "Liderança geral e visão estratégica",
    "genero_sugerido": "feminino"
  },
  "diretoria": [
    {
      "titulo": "Diretor(a) Técnico [específico do nicho]",
      "departamento": "Técnico",
      "nivel": "C-Level",
      "especialidade": "[área específica]",
      "justificativa": "Por que este cargo é essencial",
      "genero_sugerido": "masculino"
    }
  ],
  "gerencia": [
    {
      "titulo": "Gerente de [área específica do negócio]",
      "departamento": "[departamento]",
      "nivel": "Senior",
      "especialidade": "[especialidade]",
      "justificativa": "Necessidade específica",
      "genero_sugerido": "feminino"
    }
  ],
  "especialistas": [
    {
      "titulo": "[Cargo técnico específico do nicho]",
      "departamento": "[departamento]",
      "nivel": "Pleno",
      "especialidade": "[especialidade técnica]",
      "justificativa": "Expertise necessária",
      "genero_sugerido": "masculino"
    }
  ],
  "operacional": [
    {
      "titulo": "[Cargo operacional específico]",
      "departamento": "Operações",
      "nivel": "Junior",
      "especialidade": "[área]",
      "justificativa": "Suporte operacional",
      "genero_sugerido": "feminino"
    }
  ],
  "total_posicoes": 25,
  "diversidade_recomendada": {
    "executivos_homens": 2,
    "executivos_mulheres": 2,
    "gerencia_homens": 3,
    "gerencia_mulheres": 4,
    "especialistas_homens": 5,
    "especialistas_mulheres": 5,
    "operacional_homens": 2,
    "operacional_mulheres": 2
  }
}

IMPORTANTE: Retorne APENAS o JSON válido, sem markdown ou explicações adicionais.`;

    console.log('🤖 Chamando OpenAI para gerar estrutura organizacional...');
    console.log('📊 Modelo:', 'gpt-4o');
    console.log('📝 Prompt length:', prompt.length);
    
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em estrutura organizacional e design de cargos específicos por setor. Retorna sempre JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const elapsed = Date.now() - startTime;
    console.log(`⏱️ OpenAI respondeu em ${elapsed}ms`);
    console.log('📊 Uso:', response.usage);

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI retornou resposta vazia');
    }

    const estrutura = JSON.parse(content);
    
    console.log('✅ Estrutura organizacional gerada com sucesso');
    console.log(`📊 Total de posições: ${estrutura.total_posicoes}`);
    
    return NextResponse.json(estrutura);

  } catch (error: any) {
    console.error('❌ Erro ao gerar estrutura organizacional:', error);
    console.error('❌ Error type:', error.constructor.name);
    console.error('❌ Error status:', error.status);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error:', JSON.stringify(error, null, 2));
    
    // Tratamento específico para erro 429 (Rate Limit)
    if (error.status === 429 || error.code === 'rate_limit_exceeded') {
      return NextResponse.json(
        { 
          error: 'Limite de requisições atingido',
          details: 'A OpenAI tem limite de requisições por minuto. Aguarde 1 minuto e tente novamente.',
          code: 'RATE_LIMIT'
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Falha ao gerar estrutura',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
