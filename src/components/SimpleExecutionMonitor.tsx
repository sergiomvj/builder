'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, CheckCircle, Clock, Play, RotateCcw, Activity, Square } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SimpleExecutionMonitorProps {
  scriptName: string
  apiEndpoint: string
  onExecutionComplete?: () => void
}

export function SimpleExecutionMonitor({ scriptName, apiEndpoint, onExecutionComplete }: SimpleExecutionMonitorProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<string>('')
  const [currentPersona, setCurrentPersona] = useState<string>('')
  const pollingInterval = useRef<NodeJS.Timeout | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString('pt-BR')
    setLogs(prev => {
      const newLogs = [...prev, `[${timestamp}] ${message}`]
      // Auto-scroll para o final
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight
          }
        }
      }, 100)
      return newLogs
    })
  }

  const startPolling = () => {
    if (pollingInterval.current) return
    
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await fetch(apiEndpoint, { method: 'GET' })
        if (response.ok) {
          const status = await response.json()
          
          if (status.phase) {
            setCurrentPhase(status.phase)
            
            // Atualizar progresso baseado na fase
            if (status.progress && status.progress.includes('/')) {
              const [current, total] = status.progress.split('/')
              const progressPercent = Math.round((parseInt(current) / parseInt(total)) * 100)
              setProgress(progressPercent)
              addLog(`📊 Progresso: ${status.progress} (${progressPercent}%)`)
            }
            
            if (status.persona && status.persona !== currentPersona) {
              setCurrentPersona(status.persona)
              addLog(`👤 Processando: ${status.persona}`)
            }
            
            // Verificar se concluído
            if (status.phase.includes('Concluído') || status.phase.includes('sucesso')) {
              setCompleted(true)
              setIsRunning(false)
              setProgress(100)
              addLog(`✅ ${status.phase}`)
              stopPolling()
              
              if (onExecutionComplete) {
                onExecutionComplete()
              }
            }
            
            // Verificar se há erro
            if (status.phase.includes('Erro') || status.error) {
              setError(status.error || status.phase)
              setIsRunning(false)
              addLog(`❌ Erro: ${status.error || status.phase}`)
              stopPolling()
            }
          }
        }
      } catch (err) {
        console.error('Erro no polling:', err)
        // Não interromper o polling por erros de rede temporários
      }
    }, 2000) // Poll a cada 2 segundos
  }

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current)
      pollingInterval.current = null
    }
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [])

  const executeScript = async () => {
    try {
      setIsRunning(true)
      setError(null)
      setCompleted(false)
      setProgress(0)
      setLogs([])
      setCurrentPhase('')
      setCurrentPersona('')
      
      addLog(`🚀 Iniciando ${scriptName}...`)
      
      // Iniciar polling para acompanhamento em tempo real
      startPolling()

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresaId: '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17' // ARVA Tech Solutions
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        // O polling vai capturar o status final
        addLog(`🎯 Script iniciado com sucesso - acompanhando execução...`)
      } else {
        throw new Error(result.error || result.message || 'Erro desconhecido')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      addLog(`❌ Erro: ${errorMessage}`)
      console.error('Erro na execução:', err)
      setIsRunning(false)
      stopPolling()
    }
  }

  const resetExecution = () => {
    stopPolling()
    setIsRunning(false)
    setLogs([])
    setProgress(0)
    setError(null)
    setCompleted(false)
    setCurrentPhase('')
    setCurrentPersona('')
  }

  const stopExecution = async () => {
    try {
      addLog('🛑 Enviando sinal de parada...')
      
      // Mapear nome do script para ID
      const scriptMapping: { [key: string]: string } = {
        'Atribuições Contextualizadas': 'atribuicoes',
        'Competências Técnicas': 'competencias',
        'Geração de Avatares': 'avatares',
        'Workflows': 'workflows'
      }
      
      const scriptId = scriptMapping[scriptName] || scriptName.toLowerCase().replace(/[^a-z]/g, '')
      
      const response = await fetch('/api/stop-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptName: scriptId })
      })
      
      const result = await response.json()
      
      if (result.success) {
        addLog('✅ Sinal de parada enviado - aguardando conclusão segura...')
      } else {
        throw new Error(result.error || 'Erro ao parar script')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      addLog(`❌ Erro ao parar: ${errorMessage}`)
      console.error('Erro ao parar script:', err)
    }
  }

  const getStatusBadge = () => {
    if (error) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>
    }
    if (isRunning) {
      return <Badge className="bg-blue-500 animate-pulse"><Activity className="w-3 h-3 mr-1" />Executando</Badge>
    }
    if (completed) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>
    }
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Aguardando</Badge>
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {scriptName}
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>
              {isRunning && currentPhase ? currentPhase : 
               isRunning ? 'Executando...' : 
               completed ? 'Concluído' : 'Pronto para execução'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={executeScript} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Executando...' : 'Executar'}
            </Button>
            {isRunning && (
              <Button 
                onClick={stopExecution} 
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Parar
              </Button>
            )}
            {(completed || error) && (
              <Button 
                onClick={resetExecution} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span>Progresso</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
          {currentPersona && (
            <div className="text-xs text-muted-foreground">
              👤 Processando: {currentPersona}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Logs */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Logs de Execução</h4>
          <ScrollArea ref={scrollAreaRef} className="h-[200px] w-full border rounded-md p-3 bg-muted/30">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Nenhum log disponível</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs font-mono break-all">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}