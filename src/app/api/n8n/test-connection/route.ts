import { NextRequest, NextResponse } from 'next/server';
import { createN8NClient } from '@/lib/n8n-client';

/**
 * POST /api/n8n/test-connection
 * Testa a conexão com a instância N8N
 * 
 * Body: { url: string, apiKey: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.url || !body.apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'URL e API Key são obrigatórios' 
        },
        { status: 400 }
      );
    }

    // Cria client temporário com as credenciais fornecidas
    const { N8NClient } = await import('@/lib/n8n-client');
    const client = new N8NClient({
      url: body.url,
      apiKey: body.apiKey,
    });

    const result = await client.testConnection();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        version: result.version,
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message 
        },
        { status: 401 }
      );
    }

  } catch (error: any) {
    console.error('Erro ao testar conexão N8N:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao testar conexão' 
      },
      { status: 500 }
    );
  }
}
