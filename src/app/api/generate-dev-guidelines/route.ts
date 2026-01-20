
import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, moduleName, moduleDescription, features } = body;

    if (!moduleName) {
      return NextResponse.json({ error: 'Module name is required' }, { status: 400 });
    }

    const systemPrompt = `
      Você é um Tech Lead Senior e Arquiteto de Software.
      Sua tarefa é criar um documento de Guidelines de Desenvolvimento (DEV GUIDELINES) detalhado para um módulo específico de um sistema.
      
      O documento deve ser em Markdown e seguir esta estrutura:
      # Dev Guidelines: [Nome do Módulo]
      
      ## 1. Visão Geral
      Descrição técnica do módulo e seu papel no sistema.
      
      ## 2. Requisitos Funcionais Detalhados
      Para cada feature listada, expanda com critérios de aceitação e fluxo lógico.
      
      ## 3. Arquitetura Sugerida
      - Padrões de Design (e.g., Repository Pattern, Factory)
      - Estrutura de Pastas Sugerida
      - Dependências Chave
      
      ## 4. Modelo de Dados (Schema Sugerido)
      Exemplo de tabelas/collections e relacionamentos.
      
      ## 5. API Endpoints (Contrato Sugerido)
      Lista de endpoints REST ou Queries/Mutations GraphQL necessários.
      
      ## 6. Considerações de Segurança e Performance
      
      ## 7. Definição de Pronto (DoD)
      
      Responda APENAS com o conteúdo Markdown.
    `;

    const userMessage = `
      Módulo: ${moduleName}
      Descrição: ${moduleDescription}
      Features Listadas: ${features?.join(', ') || 'Nenhuma feature listada inicialmente'}
      
      Gere o documento técnico detalhado para guiar o time de desenvolvimento na implementação deste módulo.
    `;

    const markdown = await llmService.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]);

    if (!markdown) {
      throw new Error('Failed to generate markdown');
    }

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="DEV_GUIDELINES_${moduleName.replace(/\s+/g, '_')}.md"`
      }
    });

  } catch (error: any) {
    console.error('Error generating guidelines:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
