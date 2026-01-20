import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterLLM } from '../../../../lib/llm_fallback';

export async function POST(request: NextRequest) {
  try {
    const { nome, descricao, industria, mercado_alvo, porte, pais } = await request.json();
    if (!nome || !descricao || !industria || !pais) {
      console.error('[LLM] Campos obrigatórios ausentes:', { nome, descricao, industria, pais });
      return NextResponse.json({ success: false, error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }
    // Prompt contextualizado para LLM
    const prompt = `Você é um consultor de RH especialista em estrutura organizacional. Crie uma estrutura completa para a empresa abaixo, considerando o mercado, porte e país. Responda em JSON estruturado com cargos, departamentos, níveis, especialidades e recomendações de diversidade.\n\nEmpresa: ${nome}\nDescrição: ${descricao}\nIndústria: ${industria}\nMercado alvo: ${mercado_alvo}\nPorte: ${porte}\nPaís: ${pais}`;
    try {
      // Chamada ao LLM via OpenRouter
      const llmResponse = await callOpenRouterLLM({ prompt, model: 'z-ai/glm-4.6', max_tokens: 1200 });
      console.log('[LLM] Resposta recebida:', llmResponse);
      let estrutura;
      try {
        estrutura = JSON.parse(llmResponse.content);
      } catch (err) {
        console.error('[LLM] Falha ao interpretar resposta da LLM:', llmResponse.content, err);
        return NextResponse.json({ success: false, error: 'Falha ao interpretar resposta da LLM.', raw: llmResponse.content }, { status: 500 });
      }
      return NextResponse.json({ success: true, estrutura });
    } catch (llmError) {
      console.error('[LLM] Erro na chamada ao OpenRouter:', llmError);
      return NextResponse.json({ success: false, error: String(llmError) }, { status: 500 });
    }
  } catch (error) {
    console.error('[LLM] Erro inesperado:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
