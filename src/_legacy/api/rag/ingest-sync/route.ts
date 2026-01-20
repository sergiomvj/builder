import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresa_id } = body;
    
    // Mock para RAG sync
    const mockResponse = {
      success: true,
      message: 'Sincronização RAG finalizada',
      data: {
        empresa_id,
        sync_status: 'completed',
        documents_processed: 150,
        embeddings_created: 300,
        completed_at: new Date().toISOString()
      }
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Erro na API de RAG sync:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}