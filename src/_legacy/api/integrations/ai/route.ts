// AI Integration API Endpoints
import { NextRequest, NextResponse } from 'next/server';
import { AIService } from '@/lib/api-gateway';

const aiService = new AIService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, model = 'openai' } = body;

    let response;

    switch (action) {
      case 'generate_content':
        response = await aiService.generateContent(data.prompt, model);
        break;

      case 'generate_persona':
        const personaPrompt = `
          Crie uma persona virtual completa com base nos seguintes dados:
          Nome: ${data.name || 'Gerado automaticamente'}
          Cargo: ${data.role || 'Não especificado'}
          Empresa: ${data.company || 'Virtual Company'}
          
          Inclua:
          - Biografia completa (200-300 palavras)
          - Competências técnicas (5-8 skills)
          - Competências comportamentais (3-5 traits)
          - Background profissional
          - Objetivos e motivações
          
          Formato JSON estruturado.
        `;
        response = await aiService.generateContent(personaPrompt, model);
        break;

      case 'analyze_data':
        const analysisPrompt = `
          Analise os seguintes dados e forneça insights:
          ${JSON.stringify(data.content, null, 2)}
          
          Forneça:
          - Resumo executivo
          - Principais insights
          - Recomendações de ação
          - Métricas importantes
        `;
        response = await aiService.generateContent(analysisPrompt, model);
        break;

      case 'create_workflow':
        const workflowPrompt = `
          Crie um workflow automatizado para:
          Objetivo: ${data.objective}
          Parâmetros: ${JSON.stringify(data.parameters)}
          
          Gere um workflow em formato JSON com:
          - Steps detalhados
          - Triggers
          - Condições
          - Ações
          - Error handling
        `;
        response = await aiService.generateContent(workflowPrompt, model);
        break;

      case 'optimize_content':
        const optimizationPrompt = `
          Otimize o seguinte conteúdo para melhor performance:
          Conteúdo: ${data.content}
          Objetivo: ${data.goal || 'Engajamento geral'}
          
          Forneça:
          - Versão otimizada
          - Justificativas das mudanças
          - Métricas esperadas
        `;
        response = await aiService.generateContent(optimizationPrompt, model);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Ação não reconhecida'
        }, { status: 400 });
    }

    return NextResponse.json(response);

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    availableActions: [
      'generate_content',
      'generate_persona', 
      'analyze_data',
      'create_workflow',
      'optimize_content'
    ],
    supportedModels: ['openai', 'anthropic', 'google']
  });
}