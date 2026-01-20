import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { empresaId } = await request.json();

    if (!empresaId) {
      return NextResponse.json({
        success: false,
        message: 'ID da empresa é obrigatório'
      }, { status: 400 });
    }

    console.log(`🎭 Iniciando geração de avatares para empresa: ${empresaId}`);

    // Usar o script Nano Banana que gera imagens reais via Google AI
    const scriptPath = path.join(process.cwd(), 'AUTOMACAO', '00_generate_avatares.js');
    
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const childProcess = spawn('node', [scriptPath, `--empresaId=${empresaId}`], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(`[Avatares stdout]: ${text}`);
      });

      childProcess.stderr?.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error(`[Avatares stderr]: ${text}`);
      });

      childProcess.on('close', (code) => {
        const executionTime = (Date.now() - startTime) / 1000;
        
        console.log(`🎭 Script de avatares finalizado com código: ${code}`);

        if (code === 0) {
          resolve(NextResponse.json({
            success: true,
            message: 'Avatares gerados com sucesso',
            execution_time: executionTime,
            output: output,
            script_type: 'avatares'
          }));
        } else {
          resolve(NextResponse.json({
            success: false,
            message: 'Erro na geração de avatares',
            execution_time: executionTime,
            output: output,
            error: errorOutput,
            script_type: 'avatares'
          }));
        }
      });

      childProcess.on('error', (error) => {
        console.error('❌ Erro ao executar script de avatares:', error);
        resolve(NextResponse.json({
          success: false,
          message: `Erro ao executar script: ${error.message}`,
          execution_time: (Date.now() - startTime) / 1000,
          script_type: 'avatares'
        }));
      });
    });

  } catch (error) {
    console.error('❌ Erro na API de avatares:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      script_type: 'avatares'
    }, { status: 500 });
  }
}