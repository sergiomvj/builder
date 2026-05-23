import { NextRequest, NextResponse } from 'next/server';

// OpenRouter com modelo gratuito
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'x-ai/grok-4.1-fast:free'; // Fallback para Grok se não houver env

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 Verificando OpenRouter API Key...');
    console.log('🔑 Key presente:', !!OPENROUTER_API_KEY);
    console.log('🔑 Modelo:', OPENROUTER_MODEL);
    
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
- Mercado-alvo: ${mercado_alvo || descricao}
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

IMPORTANTE: Retorne APENAS o JSON válido, sem markdown, sem explicações, sem \`\`\`json.`;

    console.log('🤖 Chamando OpenRouter (Gemini 2.0 Flash) para gerar estrutura organizacional...');
    console.log('📊 Modelo:', OPENROUTER_MODEL);
    
    const startTime = Date.now();
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vcm-app.com',
        'X-Title': 'VCM Company Structure Generator'
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em estrutura organizacional e design de cargos específicos por setor. Retorna sempre JSON válido sem markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter error: ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    const elapsed = Date.now() - startTime;
    
    console.log(`⏱️ Gemini 2.0 Flash respondeu em ${elapsed}ms`);
    console.log('📊 Modelo usado:', result.model);

    let content = result.choices[0].message.content;
    
    // Remover markdown se presente
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('📝 Resposta recebida, parsing JSON...');

    const estrutura = JSON.parse(content);
    
    console.log('✅ Estrutura organizacional gerada com sucesso');
    console.log(`📊 Total de posições: ${estrutura.total_posicoes}`);
    
    return NextResponse.json(estrutura);

  } catch (error: any) {
    console.error('❌ Erro ao gerar estrutura organizacional:', error);
    console.error('❌ Error type:', error.constructor?.name);
    console.error('❌ Error message:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Falha ao gerar estrutura com Gemini 2.0 Flash/OpenRouter',
        details: error.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
