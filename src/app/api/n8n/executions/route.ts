import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

import { createN8NClient } from '@/lib/n8n-client';

/**
 * GET /api/n8n/executions
 * Lista execuções de workflows
 * 
 * Query params:
 *   - workflowId: string (filtrar por workflow específico)
 *   - status: 'success' | 'error' | 'waiting' | 'running'
 *   - limit: number (padrão: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const workflowId = searchParams.get('workflowId');
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '50');

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

    const options: any = { limit };

    if (workflowId) options.workflowId = workflowId;
    if (status) options.status = status;

    const executions = await client.getExecutions(options);

    return NextResponse.json({
      success: true,
      data: executions,
      count: executions.length,
    });

  } catch (error: any) {
    console.error('Erro ao buscar execuções N8N:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao buscar execuções'
      },
      { status: 500 }
    );
  }
}
