import { NextRequest, NextResponse } from 'next/server';
import { createN8NClient } from '@/lib/n8n-client';

/**
 * GET /api/n8n/workflows
 * Lista todos os workflows do N8N
 * 
 * Query params:
 *   - active: boolean (filtrar por status ativo/inativo)
 *   - tags: string (filtrar por tags, separadas por vírgula)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const activeParam = searchParams.get('active');
    const tagsParam = searchParams.get('tags');

    const client = await createN8NClient();
    
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'N8N não configurado. Configure em Integrações primeiro.' 
        },
        { status: 503 }
      );
    }

    const options: any = {};
    
    if (activeParam !== null) {
      options.active = activeParam === 'true';
    }
    
    if (tagsParam) {
      options.tags = tagsParam.split(',').map(t => t.trim());
    }

    const workflows = await client.getWorkflows(options);

    return NextResponse.json({
      success: true,
      data: workflows,
      count: workflows.length,
    });

  } catch (error: any) {
    console.error('Erro ao buscar workflows N8N:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao buscar workflows' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/n8n/workflows
 * Cria/importa um novo workflow no N8N
 * 
 * Body: JSON do workflow (formato N8N)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || !body.name || !body.nodes) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Workflow inválido. Campos obrigatórios: name, nodes, connections' 
        },
        { status: 400 }
      );
    }

    const client = await createN8NClient();
    
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'N8N não configurado. Configure em Integrações primeiro.' 
        },
        { status: 503 }
      );
    }

    const workflow = await client.createWorkflow(body);

    return NextResponse.json({
      success: true,
      data: workflow,
      message: `Workflow "${workflow.name}" criado com sucesso!`,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar workflow N8N:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao criar workflow' 
      },
      { status: 500 }
    );
  }
}
