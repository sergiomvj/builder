import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execPromise = promisify(exec);

/**
 * 🎯 API ENDPOINT - GERAR ATRIBUIÇÕES COM MONITORAMENTO COMPLETO
 * ==========================================================
 * 
 * Sistema de execução com feedback em tempo real
 * Alinhado com Master Fluxo: "Cargos tem atribuições"
 */

// Estado global de execução (em produção, usar Redis/Database)
let currentExecution: {
  isRunning: boolean
  currentPhase: string
  progress: number
  total: number
  currentPersona: string
  logs: string[]
  error?: string
  completedAt?: string
  startedAt?: string
} = {
  isRunning: false,
  currentPhase: 'Aguardando',
  progress: 0,
  total: 15,
  currentPersona: '',
  logs: [],
}

async function updateExecutionStatus(update: Partial<typeof currentExecution>) {
  currentExecution = { ...currentExecution, ...update }
  
  // Log para debug
  console.log('🔄 Status atualizado:', {
    phase: currentExecution.currentPhase,
    progress: `${currentExecution.progress}/${currentExecution.total}`,
    persona: currentExecution.currentPersona
  })
}

export async function GET() {
  return NextResponse.json(currentExecution)
}

export async function POST(req: NextRequest) {
  try {
    const { empresaId } = await req.json();

    if (!empresaId) {
      return NextResponse.json(
        { success: false, error: 'empresa_id é obrigatório' },
        { status: 400 }
      );
    }

    if (currentExecution.isRunning) {
      return NextResponse.json({
        success: false,
        error: 'Script já está executando',
        currentStatus: currentExecution
      });
    }

    // Inicializar execução
    await updateExecutionStatus({
      isRunning: true,
      currentPhase: 'Iniciando script...',
      progress: 0,
      currentPersona: '',
      logs: [`[${new Date().toLocaleTimeString()}] 🚀 Iniciando geração de atribuições`],
      startedAt: new Date().toISOString(),
      error: undefined,
      completedAt: undefined
    })

    // Executar script em background
    setImmediate(async () => {
      try {
        await updateExecutionStatus({
          currentPhase: 'Preparando ambiente...',
          logs: [`[${new Date().toLocaleTimeString()}] 📂 Verificando estrutura de pastas`]
        })

        const scriptPath = path.join(process.cwd(), 'AUTOMACAO', '01.5_generate_atribuicoes_contextualizadas.js');
        const command = `node "${scriptPath}" --empresaId=${empresaId}`;

        await updateExecutionStatus({
          currentPhase: 'Executando script Node.js...',
          logs: [`[${new Date().toLocaleTimeString()}] ⚡ Comando: ${command}`]
        })

        const { stdout, stderr } = await execPromise(command, {
          cwd: process.cwd(),
          timeout: 300000, // 5 minutos
          env: { 
            ...process.env,
            NODE_ENV: 'development'
          }
        });

        // Analisar output para extrair progresso
        const outputLines = stdout.split('\n').filter(line => line.trim());
        let personaCount = 0;
        
        for (const line of outputLines) {
          if (line.includes('Processando persona:')) {
            personaCount++;
            const personaName = line.split('Processando persona:')[1]?.trim() || '';
            await updateExecutionStatus({
              currentPhase: 'Processando personas...',
              progress: personaCount,
              currentPersona: personaName,
              logs: [`[${new Date().toLocaleTimeString()}] 👤 Processando: ${personaName} (${personaCount}/15)`]
            })
            
            // Simular delay para monitoramento
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
          if (line.includes('✅') || line.includes('Sucesso') || line.includes('salvo')) {
            await updateExecutionStatus({
              logs: [`[${new Date().toLocaleTimeString()}] ✅ ${line}`]
            })
          }
        }

        if (stderr && stderr.trim()) {
          await updateExecutionStatus({
            logs: [`[${new Date().toLocaleTimeString()}] ⚠️ Warnings: ${stderr}`]
          })
        }

        // Completar execução
        await updateExecutionStatus({
          isRunning: false,
          currentPhase: 'Concluído com sucesso',
          progress: 15,
          currentPersona: '',
          logs: [`[${new Date().toLocaleTimeString()}] 🎉 Processo concluído com sucesso!`],
          completedAt: new Date().toISOString()
        })

      } catch (error) {
        console.error('❌ Erro na execução:', error);
        
        await updateExecutionStatus({
          isRunning: false,
          currentPhase: 'Erro na execução',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          logs: [`[${new Date().toLocaleTimeString()}] ❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`]
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Script iniciado com sucesso',
      executionId: currentExecution.startedAt,
      statusEndpoint: '/api/generate-atribuicoes'
    });

  } catch (error) {
    console.error('❌ Erro na API:', error);

    await updateExecutionStatus({
      isRunning: false,
      currentPhase: 'Erro na API',
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      logs: [`[${new Date().toLocaleTimeString()}] ❌ Erro na API: ${error instanceof Error ? error.message : 'Erro interno'}`]
    })

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}