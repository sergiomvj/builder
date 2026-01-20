import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import path from 'path'

// Estado global para gerenciar execução
let globalExecutionState = {
  isRunning: false,
  phase: '',
  progress: '0/15',
  persona: '',
  error: null
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
      phase: 'Iniciando análise de machine learning...',
      progress: '0/15',
      persona: '',
      error: null
    }

    // Por enquanto simular execução até termos o script real
    console.log('🔄 Status atualizado:', globalExecutionState)

    // Simular execução em background
    setTimeout(() => {
      globalExecutionState.phase = 'Analisando resultados da auditoria...'
      console.log('🔄 Status atualizado:', globalExecutionState)
    }, 2000)

    setTimeout(() => {
      globalExecutionState.phase = 'Identificando padrões de melhoria...'
      globalExecutionState.progress = '5/15'
      console.log('🔄 Status atualizado:', globalExecutionState)
    }, 4000)

    setTimeout(() => {
      globalExecutionState.phase = 'Atualizando base de conhecimento...'
      globalExecutionState.progress = '10/15'
      console.log('🔄 Status atualizado:', globalExecutionState)
    }, 6000)

    setTimeout(() => {
      globalExecutionState.phase = 'Evoluindo competências das personas...'
      globalExecutionState.progress = '13/15'
      console.log('🔄 Status atualizado:', globalExecutionState)
    }, 8000)

    setTimeout(() => {
      globalExecutionState.phase = 'Concluído com sucesso - Evolução aplicada'
      globalExecutionState.progress = '15/15'
      globalExecutionState.isRunning = false
      console.log('🔄 Status atualizado:', globalExecutionState)
    }, 10000)

    return NextResponse.json({ 
      success: true, 
      message: 'Script de machine learning iniciado com sucesso',
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