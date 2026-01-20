'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  Square, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock,
  Package,
  Users,
  Briefcase,
  Brain,
  Image,
  Workflow
} from 'lucide-react'

interface SetupStep {
  id: string
  name: string
  description: string
  icon: any
  apiEndpoint: string
  estimatedTime: string
  status: 'pending' | 'running' | 'completed' | 'error' | 'skipped'
  progress: number
  logs: string[]
  required: boolean
}

export default function SetupWizardPage() {
  const [empresaId, setEmpresaId] = useState<string>('')
  const [empresaNome, setEmpresaNome] = useState<string>('')
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'atribuicoes',
      name: 'Atribuições Contextualizadas',
      description: 'Definir responsabilidades de cada cargo',
      icon: Briefcase,
      apiEndpoint: '/api/generate-atribuicoes',
      estimatedTime: '~2-3 min',
      status: 'pending',
      progress: 0,
      logs: [],
      required: true
    },
    {
      id: 'competencias',
      name: 'Competências Técnicas',
      description: 'Habilidades necessárias para cada cargo',
      icon: Brain,
      apiEndpoint: '/api/generate-competencias',
      estimatedTime: '~3-4 min',
      status: 'pending',
      progress: 0,
      logs: [],
      required: true
    },
    {
      id: 'avatares',
      name: 'Avatares Visuais',
      description: 'Perfis visuais detalhados via LLM',
      icon: Image,
      apiEndpoint: '/api/generate-avatares',
      estimatedTime: '~2-3 min',
      status: 'pending',
      progress: 0,
      logs: [],
      required: false
    },
    {
      id: 'workflows',
      name: 'Workflows N8N',
      description: 'Automações e integrações',
      icon: Workflow,
      apiEndpoint: '/api/automation/generate-workflows',
      estimatedTime: '~5-7 min',
      status: 'pending',
      progress: 0,
      logs: [],
      required: false
    }
  ])

  const [isRunningFull, setIsRunningFull] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [overallProgress, setOverallProgress] = useState(0)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervals = useRef<{ [key: string]: NodeJS.Timeout }>({})

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [steps])

  // Carregar empresa ativa ao montar
  useEffect(() => {
    const loadActiveCompany = async () => {
      try {
        const response = await fetch('/api/empresas')
        const data = await response.json()
        
        if (data.empresas && data.empresas.length > 0) {
          const empresaAtiva = data.empresas.find((e: any) => e.ativo) || data.empresas[0]
          setEmpresaId(empresaAtiva.id)
          setEmpresaNome(empresaAtiva.nome)
        }
      } catch (error) {
        console.error('Erro ao carregar empresa:', error)
      }
    }
    
    loadActiveCompany()
  }, [])

  // Limpar intervalos ao desmontar
  useEffect(() => {
    return () => {
      Object.values(pollingIntervals.current).forEach(clearInterval)
    }
  }, [])

  const addLog = (stepId: string, message: string) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        const timestamp = new Date().toLocaleTimeString('pt-BR')
        return {
          ...step,
          logs: [...step.logs, `[${timestamp}] ${message}`]
        }
      }
      return step
    }))
  }

  const updateStepStatus = (stepId: string, status: SetupStep['status'], progress?: number) => {
    setSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        return {
          ...step,
          status,
          progress: progress !== undefined ? progress : step.progress
        }
      }
      return step
    }))
  }

  const pollStepStatus = (stepId: string, apiEndpoint: string) => {
    // Limpar polling anterior se existir
    if (pollingIntervals.current[stepId]) {
      clearInterval(pollingIntervals.current[stepId])
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${apiEndpoint}?empresaId=${empresaId}&action=status`)
        const data = await response.json()

        if (data.status) {
          const { status, currentPhase, progress, logs } = data.status

          // Atualizar progresso
          if (progress?.current && progress?.total) {
            const percentage = Math.round((progress.current / progress.total) * 100)
            updateStepStatus(stepId, status === 'completed' ? 'completed' : 'running', percentage)
          }

          // Adicionar novos logs
          if (logs && Array.isArray(logs)) {
            const currentStep = steps.find(s => s.id === stepId)
            const newLogs = logs.slice(currentStep?.logs.length || 0)
            newLogs.forEach((log: string) => addLog(stepId, log))
          }

          // Se completou ou deu erro, parar polling
          if (status === 'completed' || status === 'error') {
            clearInterval(pollingIntervals.current[stepId])
            delete pollingIntervals.current[stepId]
            
            if (status === 'completed') {
              updateStepStatus(stepId, 'completed', 100)
            } else {
              updateStepStatus(stepId, 'error', 0)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao fazer polling:', error)
      }
    }, 2000) // Poll a cada 2 segundos

    pollingIntervals.current[stepId] = interval
  }

  const executeStep = async (stepId: string) => {
    const step = steps.find(s => s.id === stepId)
    if (!step) return

    try {
      updateStepStatus(stepId, 'running', 0)
      addLog(stepId, `🚀 Iniciando ${step.name}...`)

      const response = await fetch(step.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId })
      })

      const data = await response.json()

      if (data.success) {
        addLog(stepId, `✅ ${step.name} iniciado com sucesso`)
        
        // Iniciar polling para acompanhar progresso
        pollStepStatus(stepId, step.apiEndpoint)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (error: any) {
      updateStepStatus(stepId, 'error', 0)
      addLog(stepId, `❌ Erro: ${error.message}`)
    }
  }

  const executeFullSetup = async () => {
    if (!empresaId) {
      alert('Por favor, selecione uma empresa primeiro')
      return
    }

    setIsRunningFull(true)
    setCurrentStepIndex(0)

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      setCurrentStepIndex(i)

      await executeStep(step.id)

      // Aguardar conclusão antes de passar para próximo
      await new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          const currentStep = steps.find(s => s.id === step.id)
          if (currentStep?.status === 'completed' || currentStep?.status === 'error') {
            clearInterval(checkInterval)
            resolve()
          }
        }, 1000)
      })

      // Delay entre etapas
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    setIsRunningFull(false)
    setCurrentStepIndex(-1)
  }

  const stopFullSetup = () => {
    setIsRunningFull(false)
    setCurrentStepIndex(-1)
    
    // Parar todas as execuções
    Object.values(pollingIntervals.current).forEach(clearInterval)
    pollingIntervals.current = {}
    
    steps.forEach(step => {
      if (step.status === 'running') {
        updateStepStatus(step.id, 'skipped', 0)
      }
    })
  }

  const resetSetup = () => {
    setSteps(prev => prev.map(step => ({
      ...step,
      status: 'pending',
      progress: 0,
      logs: []
    })))
    setCurrentStepIndex(-1)
    setOverallProgress(0)
  }

  const completedSteps = steps.filter(s => s.status === 'completed').length
  const totalSteps = steps.length
  const globalProgress = Math.round((completedSteps / totalSteps) * 100)

  const getStatusIcon = (status: SetupStep['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'running': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
      case 'skipped': return <Clock className="h-5 w-5 text-gray-400" />
      default: return <Clock className="h-5 w-5 text-gray-300" />
    }
  }

  const getStatusBadge = (status: SetupStep['status']) => {
    const variants: { [key: string]: any } = {
      pending: { variant: 'outline', text: 'Pendente' },
      running: { variant: 'default', text: 'Executando' },
      completed: { variant: 'default', text: 'Concluído', className: 'bg-green-500' },
      error: { variant: 'destructive', text: 'Erro' },
      skipped: { variant: 'secondary', text: 'Ignorado' }
    }
    
    const badge = variants[status] || variants.pending
    return <Badge variant={badge.variant} className={badge.className}>{badge.text}</Badge>
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Assistente de Configuração</h1>
        </div>
        <p className="text-muted-foreground">
          Configure sua empresa em poucos passos. Execute tudo de uma vez ou selecione etapas individuais.
        </p>
      </div>

      {/* Empresa Selecionada */}
      {empresaNome && (
        <Alert className="mb-6">
          <Users className="h-4 w-4" />
          <AlertDescription>
            <strong>Empresa:</strong> {empresaNome} ({empresaId})
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Global */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progresso Geral</CardTitle>
              <CardDescription>
                {completedSteps} de {totalSteps} etapas concluídas
              </CardDescription>
            </div>
            <div className="text-3xl font-bold text-primary">{globalProgress}%</div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={globalProgress} className="h-3" />
          
          <div className="flex gap-2 mt-4">
            <Button
              onClick={executeFullSetup}
              disabled={isRunningFull || !empresaId}
              className="flex-1"
              size="lg"
            >
              {isRunningFull ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando... (Etapa {currentStepIndex + 1}/{totalSteps})
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Executar Configuração Completa
                </>
              )}
            </Button>

            {isRunningFull && (
              <Button onClick={stopFullSetup} variant="destructive" size="lg">
                <Square className="mr-2 h-4 w-4" />
                Parar
              </Button>
            )}

            <Button onClick={resetSetup} variant="outline" size="lg" disabled={isRunningFull}>
              Resetar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = currentStepIndex === index

          return (
            <Card 
              key={step.id} 
              className={`transition-all ${isActive ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      step.status === 'completed' ? 'bg-green-100' :
                      step.status === 'running' ? 'bg-blue-100' :
                      step.status === 'error' ? 'bg-red-100' :
                      'bg-gray-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        step.status === 'completed' ? 'text-green-600' :
                        step.status === 'running' ? 'text-blue-600' :
                        step.status === 'error' ? 'text-red-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{step.name}</CardTitle>
                        {step.required && (
                          <Badge variant="secondary" className="text-xs">Obrigatório</Badge>
                        )}
                      </div>
                      <CardDescription>{step.description}</CardDescription>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tempo estimado: {step.estimatedTime}
                      </p>
                    </div>
                  </div>
                  {getStatusIcon(step.status)}
                </div>
              </CardHeader>

              <CardContent>
                {/* Progress Bar */}
                {step.status === 'running' && (
                  <div className="mb-3">
                    <Progress value={step.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {step.progress}%
                    </p>
                  </div>
                )}

                {/* Logs */}
                {step.logs.length > 0 && (
                  <ScrollArea className="h-32 rounded border bg-muted/50 p-2 mb-3">
                    <div className="space-y-1">
                      {step.logs.map((log, i) => (
                        <div key={i} className="text-xs font-mono">{log}</div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </ScrollArea>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(step.status)}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => executeStep(step.id)}
                    disabled={step.status === 'running' || isRunningFull || !empresaId}
                  >
                    {step.status === 'running' ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Executando
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-3 w-3" />
                        Executar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
