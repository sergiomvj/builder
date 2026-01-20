import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * ⚙️ API Route para especificações técnicas geradas pelo Script 2
 */
export async function GET(request: NextRequest) {
  try {
    const techSpecsPath = path.join(process.cwd(), 'AUTOMACAO', 'tech_specifications.json');
    
    try {
      const content = await readFile(techSpecsPath, 'utf-8');
      const techData = JSON.parse(content);
      
      return NextResponse.json({
        success: true,
        data: techData,
        message: 'Especificações técnicas carregadas com sucesso',
        timestamp: new Date().toISOString()
      });
      
    } catch (fileError) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo de especificações técnicas não encontrado',
        message: 'Execute o Script 2 primeiro para gerar as especificações técnicas',
        path: techSpecsPath
      }, { status: 404 });
    }
    
  } catch (error) {
    console.error('❌ Erro na API de tech specs:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}