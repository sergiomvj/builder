import { NextRequest, NextResponse } from 'next/server'

interface ExecutionState {
  isRunning: boolean
  currentPhase: string
  progress: number
  total: number
  currentPersona: string
  logs: string[]
  error?: string
  completedAt?: string
  startedAt?: string
}

// Estado global de execução (em produção, usar Redis ou database)
let globalExecutionState: ExecutionState = {
  isRunning: false,
  currentPhase: 'Aguardando',
  progress: 0,
  total: 15,
  currentPersona: '',
  logs: [],
}

export async function GET() {
  return NextResponse.json(globalExecutionState)
}

export async function POST(request: NextRequest) {
  try {
    const { action, ...updateData } = await request.json()
    
    if (action === 'reset') {
      globalExecutionState = {
        isRunning: false,
        currentPhase: 'Aguardando',
        progress: 0,
        total: 15,
        currentPersona: '',
        logs: [],
      }
      return NextResponse.json({ success: true, message: 'Estado resetado' })
    }
    
    if (action === 'update') {
      globalExecutionState = {
        ...globalExecutionState,
        ...updateData,
        logs: updateData.logs 
          ? [...globalExecutionState.logs, ...updateData.logs]
          : globalExecutionState.logs
      }
      return NextResponse.json({ success: true, message: 'Estado atualizado' })
    }
    
    return NextResponse.json(globalExecutionState)
    
  } catch (error) {
    console.error('Erro na API de status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}