import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * API para parar execução de scripts em andamento
 * POST com { scriptName: 'avatares' | 'atribuicoes' | 'competencias' }
 */
export async function POST(request: NextRequest) {
  try {
    const { scriptName } = await request.json()

    if (!scriptName) {
      return NextResponse.json({ 
        success: false, 
        error: 'scriptName é obrigatório' 
      }, { status: 400 })
    }

    // Criar arquivo .stop_{script}
    const stopFile = path.join(process.cwd(), 'AUTOMACAO', `.stop_${scriptName}`)
    
    fs.writeFileSync(stopFile, new Date().toISOString(), 'utf8')
    
    console.log(`🛑 Sinal de parada enviado para script: ${scriptName}`)

    return NextResponse.json({ 
      success: true, 
      message: `Sinal de parada enviado para ${scriptName}`,
      stopFile
    })

  } catch (error) {
    console.error('❌ Erro ao enviar sinal de parada:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'stop-script',
    description: 'Envia sinal de parada para scripts em execução',
    usage: {
      post: 'POST com { scriptName: "avatares" | "atribuicoes" | "competencias" }'
    },
    availableScripts: ['avatares', 'atribuicoes', 'competencias', 'workflows']
  })
}
