import { NextRequest, NextResponse } from 'next/server';

// Mapeamento de idiomas nativos por nacionalidade
const IDIOMAS_NATIVOS: Record<string, string> = {
  // Europeus
  'sueco': 'sueco',
  'sueca': 'sueco',
  'dinamarques': 'dinamarquês',
  'dinamarquesa': 'dinamarquês',
  'noruegues': 'norueguês',
  'norueguesa': 'norueguês',
  'finlandes': 'finlandês',
  'finlandesa': 'finlandês',
  'alemao': 'alemão',
  'alema': 'alemão',
  'frances': 'francês',
  'francesa': 'francês',
  'italiano': 'italiano',
  'italiana': 'italiano',
  'espanhol': 'espanhol',
  'espanhola': 'espanhol',
  'portugues': 'português',
  'portuguesa': 'português',
  'russo': 'russo',
  'russa': 'russo',
  'polones': 'polonês',
  'polonesa': 'polonês',
  'ucraniano': 'ucraniano',
  'ucraniana': 'ucraniano',
  'holandes': 'holandês',
  'holandesa': 'holandês',
  
  // Americanos
  'americano': 'inglês',
  'americana': 'inglês',
  'canadense': 'inglês',
  'brasileiro': 'português',
  'brasileira': 'português',
  'argentino': 'espanhol',
  'argentina': 'espanhol',
  'mexicano': 'espanhol',
  'mexicana': 'espanhol',
  'chileno': 'espanhol',
  'chilena': 'espanhol',
  
  // Asiáticos
  'chines': 'mandarim',
  'chinesa': 'mandarim',
  'japones': 'japonês',
  'japonesa': 'japonês',
  'coreano': 'coreano',
  'coreana': 'coreano',
  'indiano': 'hindi',
  'indiana': 'hindi',
  
  // Genéricos (fallback)
  'europeus': 'inglês',
  'asiaticos': 'inglês',
  'africanos': 'inglês',
  'oceanicos': 'inglês'
};

async function gerarNacionalidadesComLLM(
  totalPessoas: number,
  percentuaisNacionalidades: Array<{tipo: string, percentual: number}>,
  idiomasEmpresa: string[]
): Promise<Array<{nacionalidade_especifica: string, genero: string, idioma_nativo: string}>> {
  
  const prompt = `Você é um especialista em diversidade e inclusão corporativa.

TAREFA: Gerar uma lista de ${totalPessoas} pessoas com nacionalidades específicas, gêneros balanceados e idiomas nativos corretos.

DISTRIBUIÇÃO DE NACIONALIDADES (percentuais solicitados):
${percentuaisNacionalidades.map(n => `- ${n.tipo}: ${n.percentual}%`).join('\n')}

REGRAS IMPORTANTES:
1. NACIONALIDADES ESPECÍFICAS: Use nacionalidades reais e específicas:
   - Para "europeus": sueco, dinamarquês, norueguês, finlandês, alemão, francês, italiano, espanhol, português, russo, polonês, ucraniano, holandês, etc.
   - Para "asiáticos": chinês, japonês, coreano, indiano, tailandês, vietnamita, filipino, etc.
   - Para "americanos": americano, canadense, brasileiro, argentino, mexicano, chileno, etc.
   - Para "africanos": sul-africano, nigeriano, queniano, egípcio, etc.

2. GÊNERO: Alterne entre "masculino" e "feminino" de forma balanceada (~50/50)

3. IDIOMA NATIVO: OBRIGATORIAMENTE usar o idioma correto para cada nacionalidade:
   - Sueco → sueco
   - Dinamarquês → dinamarquês
   - Russo → russo
   - Francês → francês
   - Alemão → alemão
   - Chinês → mandarim
   - Japonês → japonês
   - Brasileiro → português
   - Argentino → espanhol
   - Etc.

4. NÃO GERE NOMES - apenas nacionalidade, gênero e idioma nativo

FORMATO DE SAÍDA (JSON válido):
{
  "pessoas": [
    {"nacionalidade_especifica": "sueco", "genero": "masculino", "idioma_nativo": "sueco"},
    {"nacionalidade_especifica": "dinamarquesa", "genero": "feminino", "idioma_nativo": "dinamarquês"},
    {"nacionalidade_especifica": "russo", "genero": "masculino", "idioma_nativo": "russo"}
  ]
}

Gere exatamente ${totalPessoas} pessoas respeitando os percentuais solicitados.`;

  const messages = [
    {
      role: 'system',
      content: 'Você é um especialista em diversidade corporativa. Responda APENAS com JSON válido, sem explicações.'
    },
    {
      role: 'user',
      content: prompt
    }
  ];

  // Tentar OpenAI primeiro
  try {
    console.log('🤖 Tentando OpenAI (gpt-4o-mini)...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (content) {
        const parsed = JSON.parse(content);
        console.log('✅ OpenAI respondeu com sucesso');
        return parsed.pessoas || [];
      }
    }
    
    throw new Error(`OpenAI falhou: ${response.status}`);

  } catch (openaiError) {
    console.warn('⚠️ OpenAI falhou, tentando OpenRouter...', openaiError);
    
    // Fallback para OpenRouter (Grok)
    try {
      console.log('🔄 Tentando OpenRouter (Grok)...');
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001',
        },
        body: JSON.stringify({
          model: 'x-ai/grok-beta',
          messages: messages,
          temperature: 0.8,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Resposta vazia da LLM');
      }

      // Parse do JSON retornado
      const parsed = JSON.parse(content);
      console.log('✅ OpenRouter respondeu com sucesso');
      return parsed.pessoas || [];

    } catch (openrouterError) {
      console.error('❌ Ambos OpenAI e OpenRouter falharam');
      throw openrouterError;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { empresa_id, cargos, nacionalidades, idiomas } = await request.json();
    
    if (!cargos || !nacionalidades || !idiomas) {
      return NextResponse.json({ 
        success: false, 
        error: 'Campos obrigatórios ausentes.' 
      }, { status: 400 });
    }

    const totalPessoas = cargos.length;

    console.log('🌍 Gerando nacionalidades via LLM...');
    console.log(`   Total de pessoas: ${totalPessoas}`);
    console.log(`   Percentuais: ${JSON.stringify(nacionalidades)}`);

    // Gerar nacionalidades específicas via LLM
    const pessoasGeradas = await gerarNacionalidadesComLLM(
      totalPessoas,
      nacionalidades,
      idiomas
    );

    // Formatar para o formato esperado pelo frontend
    const personas = pessoasGeradas.map((pessoa) => ({
      nacionalidade_especifica: pessoa.nacionalidade_especifica,
      genero: pessoa.genero,
      idioma_nativo: pessoa.idioma_nativo,
      idiomas_empresa: idiomas // Idiomas disponíveis na empresa
    }));

    console.log(`✅ ${personas.length} nacionalidades geradas com sucesso`);

    return NextResponse.json({ success: true, personas });
    
  } catch (error) {
    console.error('❌ Erro ao gerar nacionalidades:', error);
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  }
}
