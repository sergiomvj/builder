import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * 🗄️ API Route para RAG database gerada pelo Script 3
 */
export async function GET(request: NextRequest) {
  try {
    const ragPath = path.join(process.cwd(), 'AUTOMACAO', 'rag_knowledge_base.json');
    
    try {
      const content = await readFile(ragPath, 'utf-8');
      const ragData = JSON.parse(content);
      
      return NextResponse.json({
        success: true,
        data: ragData,
        message: 'RAG Knowledge Base carregada com sucesso',
        timestamp: new Date().toISOString()
      });
      
    } catch (fileError) {
      return NextResponse.json({
        success: false,
        error: 'RAG Knowledge Base não encontrada',
        message: 'Execute o Script 3 primeiro para gerar a RAG database',
        path: ragPath
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('❌ Erro na API de RAG:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}