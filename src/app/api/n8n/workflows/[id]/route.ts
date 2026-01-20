import { NextRequest, NextResponse } from 'next/server';
import { createN8NClient } from '@/lib/n8n-client';

/**
 * GET /api/n8n/workflows/:id
 * Obtém detalhes de um workflow específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await createN8NClient();
    
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'N8N não configurado' 
        },
        { status: 503 }
      );
    }

    const workflow = await client.getWorkflow(params.id);

    return NextResponse.json({
      success: true,
      data: workflow,
    });

  } catch (error: any) {
    console.error(`Erro ao buscar workflow ${params.id}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao buscar workflow' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/n8n/workflows/:id
 * Atualiza um workflow (incluindo ativar/desativar)
 * 
 * Body: { active?: boolean, name?: string, nodes?: any[], etc }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const client = await createN8NClient();
    
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'N8N não configurado' 
        },
        { status: 503 }
      );
    }

    // Se for apenas mudança de status, usa método específico
    if (Object.keys(body).length === 1 && 'active' in body) {
      const workflow = await client.activateWorkflow(params.id, body.active);
      return NextResponse.json({
        success: true,
        data: workflow,
        message: `Workflow ${body.active ? 'ativado' : 'desativado'} com sucesso!`,
      });
    }

    // Senão, faz update completo
    const workflow = await client.updateWorkflow(params.id, body);

    return NextResponse.json({
      success: true,
      data: workflow,
      message: 'Workflow atualizado com sucesso!',
    });

  } catch (error: any) {
    console.error(`Erro ao atualizar workflow ${params.id}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao atualizar workflow' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/n8n/workflows/:id
 * Deleta um workflow
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await createN8NClient();
    
    if (!client) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'N8N não configurado' 
        },
        { status: 503 }
      );
    }

    await client.deleteWorkflow(params.id);

    return NextResponse.json({
      success: true,
      message: 'Workflow deletado com sucesso!',
    });

  } catch (error: any) {
    console.error(`Erro ao deletar workflow ${params.id}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao deletar workflow' 
      },
      { status: 500 }
    );
  }
}
