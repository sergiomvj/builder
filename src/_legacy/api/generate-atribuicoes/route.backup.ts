import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

/**
 * 🎯 API ENDPOINT - GERAR ATRIBUIÇÕES CONTEXTUALIZADAS
 * ==================================================
 * 
 * Executa o script 01.5_generate_atribuicoes_contextualizadas.js via interface web
 * Alinhado ao Master Fluxo: "Cargos tem atribuições" 
 */

export async function POST(req: NextRequest) {
  try {
    const { empresaId } = await req.json();

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresa_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🎯 Iniciando geração de atribuições via API para empresa:', empresaId);

    // Caminho para o script
    const scriptPath = path.join(process.cwd(), 'AUTOMACAO', '01.5_generate_atribuicoes_contextualizadas.js');
    const command = `node "${scriptPath}" --empresaId=${empresaId}`;
    
    console.log('📋 Executando comando:', command);

    // Executar script com timeout de 5 minutos
    const { stdout, stderr } = await execPromise(command, {
      timeout: 5 * 60 * 1000,
      cwd: process.cwd()
    });

    console.log('✅ Script executado com sucesso');
    console.log('📋 stdout:', stdout);
    
    if (stderr) {
      console.log('⚠️ stderr:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Atribuições contextualizadas geradas com sucesso!',
      output: stdout,
      stderr: stderr || null
    });

  } catch (error: any) {
    console.error('❌ Erro na API de atribuições:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro interno do servidor',
        details: error.stderr || error.stdout || ''
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'generate-atribuicoes',
    description: 'Gera atribuições contextualizadas via LLM para cargos de uma empresa',
    usage: 'POST com { empresaId: "uuid" }',
    script: '01.5_generate_atribuicoes_contextualizadas.js',
    masterFluxo: 'Cargos tem atribuições'
  });
}