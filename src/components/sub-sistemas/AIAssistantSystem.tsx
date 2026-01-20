'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bot,
  Settings,
  Play,
  Pause,
  BarChart3,
  MessageSquare,
  Users,
  Zap,
  CheckCircle
} from 'lucide-react'

interface AIAssistant {
  id: string
  name: string
  type: string
  description: string
  status: string
  model: string
  capabilities: string[]
  performance: {
    accuracy: number
    responseTime: number
    userSatisfaction: number
    totalInteractions: number
  }
}

export default function AIAssistantSystem() {
  const [assistants, setAssistants] = useState<AIAssistant[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)

        const { data: aiData, error: aiError } = await supabase
          .from('ai_automations')
          .select('*')
          .order('created_at', { ascending: false })

        if (aiError) {
          console.error('Error loading AI assistants:', aiError)
        } else if (aiData) {
          const mapped: AIAssistant[] = aiData.map(ai => ({
            id: ai.id,
            name: ai.name,
            type: ai.automation_type || 'virtual-agent',
            description: ai.description || '',
            status: ai.status || 'active',
            model: ai.ai_model || 'GPT-4',
            capabilities: Array.isArray(ai.capabilities) ? ai.capabilities : [],
            performance: {
              accuracy: parseFloat(ai.accuracy_rate) || 90,
              responseTime: parseFloat(ai.avg_response_time) || 1.0,
              userSatisfaction: parseFloat(ai.satisfaction_score) || 4.0,
              totalInteractions: ai.total_interactions || 0
            }
          }))
          setAssistants(mapped)
        }

        console.log('AI Assistant System: Dados carregados do Supabase')
      } catch (error) {
        console.error('Error loading AI assistant data:', error)
      }
    }

    loadData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sistema de Assistentes IA</h2>
          <p className="text-gray-600">Gerenciar assistentes virtuais e automações inteligentes</p>
        </div>
        <Button>
          <Bot className="h-4 w-4 mr-2" />
          Novo Assistente
        </Button>
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Assistentes</p>
                <p className="text-2xl font-bold text-gray-900">{assistants.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assistentes Ativos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assistants.filter(a => a.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Interações Hoje</p>
                <p className="text-2xl font-bold text-gray-900">1,247</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Satisfação Média</p>
                <p className="text-2xl font-bold text-gray-900">4.4/5</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Assistentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assistants.map((assistant) => (
          <Card key={assistant.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Bot className="h-4 w-4" />
                <span className="ml-2">{assistant.name}</span>
              </CardTitle>
              <Badge className="bg-green-100 text-green-800">
                {assistant.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {assistant.description}
              </CardDescription>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Modelo:</p>
                  <Badge variant="outline">{assistant.model}</Badge>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Capacidades:</p>
                  <div className="flex flex-wrap gap-1">
                    {assistant.capabilities.slice(0, 3).map((cap, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Precisão</p>
                    <p className="text-lg font-semibold">{assistant.performance.accuracy}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Satisfação</p>
                    <p className="text-lg font-semibold">{assistant.performance.userSatisfaction}/5</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-1" />
                    Configurar
                  </Button>
                  <Button size="sm" variant="outline">
                    <Pause className="h-4 w-4 mr-1" />
                    Pausar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}