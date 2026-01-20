import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * 🧠 API Route para dados de competências gerados pelo Script 1
 */
export async function GET(request: NextRequest) {
  try {
    const competenciasPath = path.join(process.cwd(), 'AUTOMACAO', 'competencias_analysis.json');
    
    try {
      const content = await readFile(competenciasPath, 'utf-8');
      const competenciasData = JSON.parse(content);
      
      return NextResponse.json({
        success: true,
        data: competenciasData,
        message: 'Dados de competências carregados com sucesso',
        timestamp: new Date().toISOString()
      });
      
    } catch (fileError) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo de competências não encontrado',
        message: 'Execute o Script 1 primeiro para gerar os dados de competências',
        path: competenciasPath
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('❌ Erro na API de competências:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}