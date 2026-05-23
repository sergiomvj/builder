import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Buscar dados completos do projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const systemPrompt = `Você é um Estrategista Sênior de Marketing e Negócios (CMO / CGO).
Sua tarefa é analisar os dados de um projeto e gerar um documento estratégico consolidado em JSON.
Este documento será usado como contexto base para preencher automaticamente campos de um formulário de estratégia de marketing.

REGRA ABSOLUTA DE SAÍDA:
Retorne APENAS um objeto JSON válido, sem \`\`\`json, sem texto antes ou depois.
Todos os valores devem ser strings descritivas e específicas ao projeto analisado.`;

    const metadata = project.metadata || {};
    const strategicFoundation = metadata.strategic_foundation || {};
    const productStrategy = metadata.product_strategy || {};
    const projectMeta = metadata.project_metadata || {};

    const userMessage = `
Analise o projeto abaixo e gere um documento estratégico completo:

DADOS DO PROJETO:
- Nome: ${project.name}
- Descrição: ${project.description || 'Não informada'}
- Missão: ${project.mission || strategicFoundation.mission || 'Não informada'}
- Visão: ${project.vision || strategicFoundation.vision || 'Não informada'}
- Valores: ${JSON.stringify(project.values || strategicFoundation.core_values || [])}
- Público-alvo: ${project.target_audience || 'Não informado'}
- Tagline: ${projectMeta.tagline || ''}
- Modelo de negócio: ${projectMeta.business_model || ''}
- Streams de receita: ${JSON.stringify(project.revenue_streams || [])}

ANÁLISE INICIAL COMPLETA (use como base principal):
${JSON.stringify(metadata, null, 2)}

Gere um documento estratégico JSON com EXATAMENTE estas chaves:
{
  "resumo_executivo": "Parágrafo denso de 3-4 frases sobre o negócio, sua proposta de valor e posicionamento",
  "setor_mercado": "Setor específico (ex: EdTech B2B, Healthtech SaaS, E-commerce de moda sustentável)",
  "modelo_negocio": "Modelo detalhado (ex: SaaS B2B com planos mensais/anuais, freemium como aquisição)",
  "fase_empresa": "Uma das opções: Early Stage (pré-product-market-fit) | Growth (escalando) | Mature (consolidada)",
  "publico_alvo_macro": "Descrição dos 2-3 grandes segmentos de audiência com dados demográficos e psicográficos",
  "diferenciais_competitivos": "Lista dos 3-5 principais diferenciais únicos da empresa vs. concorrentes",
  "posicionamento_sugerido": "Como a empresa deve se posicionar no mercado. Inclua UVP no formato: Ajudamos [público] a [resultado] através de [método]",
  "maturidade_digital_estimada": "Uma das opções: Iniciante (sem presença digital) | Intermediário (site + redes básicas) | Avançado (conteúdo + paid media) | Sofisticado (automação + dados)",
  "concorrentes_potenciais": "Lista de 3-5 tipos de concorrentes com breve posicionamento de cada",
  "okrs_sugeridos": "2-3 OKRs de marketing com formato: Objetivo → KR1, KR2, KR3",
  "canais_recomendados": "Canais de marketing mais indicados para este negócio com justificativa (ex: LinkedIn para B2B enterprise, Instagram para consumidor final)",
  "tom_voz_sugerido": "Tom de voz recomendado (ex: Técnico e educativo, Inspirador e humano, Direto e pragmático) com exemplos curtos",
  "brand_personality_sugerido": "1-2 arquétipos de marca mais adequados (ex: O Sábio + O Criador) com justificativa",
  "gaps_marketing_potenciais": "2-3 gaps ou oportunidades de marketing mais comuns para empresas neste estágio/setor",
  "sprints_recomendados": "Ações prioritárias para os primeiros 90 dias de marketing, organizadas em 3 sprints de 30 dias"
}
`;

    const resultText = await llmService.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ], {
      temperature: 0.6,
      maxTokens: 3000
    });

    if (!resultText) {
      return NextResponse.json({ error: 'LLM returned empty response' }, { status: 500 });
    }

    let documentData: Record<string, any> = {};
    try {
      const cleanJson = resultText.replace(/```json/gi, '').replace(/```/g, '').trim();
      documentData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('[generate-strategic-doc] Failed to parse LLM JSON:', resultText.substring(0, 200));
      return NextResponse.json({ error: 'LLM returned invalid JSON' }, { status: 500 });
    }

    // Upsert no banco (a constraint unique_project_strategic_doc garante 1 doc por projeto)
    const { data: savedDoc, error: saveError } = await supabase
      .from('strategic_documents')
      .upsert(
        { project_id: projectId, document_data: documentData },
        { onConflict: 'project_id' }
      )
      .select()
      .single();

    if (saveError) {
      console.error('[generate-strategic-doc] Supabase upsert error:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    console.log(`[generate-strategic-doc] ✅ Strategic doc generated for project ${projectId}`);

    return NextResponse.json({
      success: true,
      documentId: savedDoc?.id,
      documentData
    });

  } catch (error: any) {
    console.error('[generate-strategic-doc] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
