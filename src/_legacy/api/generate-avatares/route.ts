import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'

// Estado global para gerenciar execução
let globalExecutionState = {
  isRunning: false,
  phase: '',
  progress: '0/15',
  persona: '',
  error: null as string | null
}

export async function POST(request: NextRequest) {
  try {
    const { empresaId } = await request.json()

    if (!empresaId) {
      return NextResponse.json({ 
        success: false, 
        error: 'empresaId é obrigatório' 
      }, { status: 400 })
    }

    // Verificar se já está executando
    if (globalExecutionState.isRunning) {
      return NextResponse.json({ 
        success: false, 
        error: 'Script já está em execução' 
      }, { status: 409 })
    }

    // Iniciar execução
    globalExecutionState = {
      isRunning: true,
      phase: 'Iniciando geração de avatares com LLM...',
      progress: '0/15',
      persona: '',
      error: null
    }

    const scriptPath = path.join(process.cwd(), 'AUTOMACAO', '00_generate_avatares.js')
    const command = `node "${scriptPath}" --empresaId=${empresaId}`

    console.log('🔄 Status atualizado:', globalExecutionState)

    // Executar em background
    exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro na execução:', error)
        globalExecutionState = {
          ...globalExecutionState,
          isRunning: false,
          phase: `Erro: ${error.message}`,
          error: error.message
        }
      } else {
        console.log('✅ Script concluído com sucesso')
        globalExecutionState = {
          ...globalExecutionState,
          isRunning: false,
          phase: 'Concluído com sucesso',
          progress: '15/15',
          persona: ''
        }
      }
      console.log('🔄 Status atualizado:', globalExecutionState)
    })

    // Simular fases de execução
    setTimeout(() => {
      if (globalExecutionState.isRunning) {
        globalExecutionState.phase = 'Analisando biografias e competências...'
        globalExecutionState.progress = '3/15'
        console.log('🔄 Status atualizado:', globalExecutionState)
      }
    }, 2000)

    setTimeout(() => {
      if (globalExecutionState.isRunning) {
        globalExecutionState.phase = 'Gerando perfis visuais com LLM...'
        globalExecutionState.progress = '8/15'
        console.log('🔄 Status atualizado:', globalExecutionState)
      }
    }, 4000)

    setTimeout(() => {
      if (globalExecutionState.isRunning) {
        globalExecutionState.phase = 'Salvando avatares na tabela avatares_personas...'
        globalExecutionState.progress = '12/15'
        console.log('🔄 Status atualizado:', globalExecutionState)
      }
    }, 6000)

    return NextResponse.json({ 
      success: true, 
      message: 'Script de avatares iniciado com sucesso',
      status: globalExecutionState
    })

  } catch (error) {
    console.error('❌ Erro no endpoint:', error)
    
    globalExecutionState = {
      ...globalExecutionState,
      isRunning: false,
      phase: 'Erro interno',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }

    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json(globalExecutionState)
}