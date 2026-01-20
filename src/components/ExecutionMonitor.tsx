'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertCircle, CheckCircle, Clock, Play, Square, RotateCcw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ExecutionStatus {
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

interface ExecutionMonitorProps {
  scriptName: string
  apiEndpoint: string
  onExecutionComplete?: () => void
}

export function ExecutionMonitor({ scriptName, apiEndpoint, onExecutionComplete }: ExecutionMonitorProps) {
  const [status, setStatus] = useState<ExecutionStatus>({
    isRunning: false,
    currentPhase: 'Aguardando',
    progress: 0,
    total: 15,
    currentPersona: '',
    logs: [],
  })
  
  const [isPolling, setIsPolling] = useState(false)

  // Polling para verificar status durante execução
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isPolling && status.isRunning) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(apiEndpoint, {
            method: 'GET'
          })
          if (response.ok) {
            const statusData = await response.json()
            setStatus(prev => ({
              ...prev,
              ...statusData,
            }))
            
            // Se completou, parar polling
            if (statusData.isRunning === false) {
              setIsPolling(false)
              if (onExecutionComplete) {
                onExecutionComplete()
              }
            }
          }
        } catch (error) {
          console.error('Erro ao verificar status:', error)
        }
      }, 2000) // Verificar a cada 2 segundos
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isPolling, status.isRunning, apiEndpoint, onExecutionComplete])

  const executeScript = async () => {
    try {
      // Reset status
      setStatus({
        isRunning: true,
        currentPhase: 'Iniciando execução...',
        progress: 0,
        total: 15,
        currentPersona: '',
        logs: [`[${new Date().toLocaleTimeString()}] 🚀 Iniciando ${scriptName}...`],
        startedAt: new Date().toISOString(),
      })
      
      setIsPolling(true)
      
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
        throw new Error(`Erro HTTP: ${response.status}`)
      }
      
      const result = await response.json()
      
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        currentPhase: 'Concluído',
        progress: prev.total,
        logs: [
          ...prev.logs,
          `[${new Date().toLocaleTimeString()}] ✅ Execução concluída com sucesso`,
          `[${new Date().toLocaleTimeString()}] 📊 Resultado: ${JSON.stringify(result, null, 2)}`
        ],
        completedAt: new Date().toISOString(),
      }))
      
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        currentPhase: 'Erro',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        logs: [
          ...prev.logs,
          `[${new Date().toLocaleTimeString()}] ❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        ],
      }))
    } finally {
      setIsPolling(false)
    }
  }

  const resetExecution = () => {
    setStatus({
      isRunning: false,
      currentPhase: 'Aguardando',
      progress: 0,
      total: 15,
      currentPersona: '',
      logs: [],
    })
    setIsPolling(false)
  }

  const getStatusBadge = () => {
    if (status.error) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erro</Badge>
    }
    if (status.isRunning) {
      return <Badge className="bg-blue-500"><Clock className="w-3 h-3 mr-1" />Executando</Badge>
    }
    if (status.completedAt) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>
    }
    return <Badge variant="outline">Aguardando</Badge>
  }

  const progressPercentage = Math.round((status.progress / status.total) * 100)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {scriptName}
              {getStatusBadge()}
            </CardTitle>
            <CardDescription>{status.currentPhase}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={executeScript} 
              disabled={status.isRunning}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              {status.isRunning ? 'Executando...' : 'Executar'}
            </Button>
            {(status.completedAt || status.error) && (
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
            <span>Progresso: {status.progress}/{status.total}</span>
            <span>{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
          {status.currentPersona && (
            <p className="text-sm text-muted-foreground">
              Processando: <span className="font-medium">{status.currentPersona}</span>
            </p>
          )}
        </div>

        {/* Error Alert */}
        {status.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {/* Execution Times */}
        {(status.startedAt || status.completedAt) && (
          <div className="flex gap-4 text-xs text-muted-foreground">
            {status.startedAt && (
              <span>Iniciado: {new Date(status.startedAt).toLocaleString('pt-BR')}</span>
            )}
            {status.completedAt && (
              <span>Concluído: {new Date(status.completedAt).toLocaleString('pt-BR')}</span>
            )}
          </div>
        )}

        {/* Logs */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Logs de Execução</h4>
          <ScrollArea className="h-[200px] w-full border rounded-md p-3 bg-muted/30">
            {status.logs.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Nenhum log disponível</p>
            ) : (
              <div className="space-y-1">
                {status.logs.map((log, index) => (
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