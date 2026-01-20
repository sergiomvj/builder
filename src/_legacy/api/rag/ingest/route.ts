import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { empresa_id, force_update } = body;
    
    // Mock para RAG ingestion
    const mockResponse = {
      success: true,
      message: 'RAG ingestion iniciada com sucesso',
      data: {
        empresa_id,
        force_update,
        status: 'processing',
        started_at: new Date().toISOString(),
        estimated_duration: '5-10 minutes'
      }
    };

    return NextResponse.json(mockResponse);

  } catch (error) {
    console.error('Erro na API de RAG ingest:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}