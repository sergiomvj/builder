'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Zap, Users, Mail, TrendingUp, Plus, Play, Pause, Settings, BarChart3, Clock, CheckCircle } from 'lucide-react'

interface Workflow {
  id: string
  name: string
  description: string
  trigger: 'form_submit' | 'email_open' | 'link_click' | 'tag_added' | 'manual'
  status: 'active' | 'paused' | 'draft'
  steps: WorkflowStep[]
  stats: { triggered: number; completed: number; active: number }
  createdAt: string
}

interface WorkflowStep {
  id: string
  type: 'wait' | 'email' | 'tag' | 'webhook' | 'condition'
  config: any
  order: number
}

interface Segment {
  id: string
  name: string
  description: string
  rules: any[]
  contactCount: number
  status: 'active' | 'draft'
}

interface Automation {
  id: string
  name: string
  type: 'email_sequence' | 'lead_scoring' | 'nurture' | 're_engagement'
  status: 'active' | 'paused'
  metrics: { sent: number; opened: number; clicked: number; converted: number }
  lastRun: string
}

export default function MarketingAutomationSystem() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data: wfData } = await supabase.from('marketing_workflows').select('*').order('created_at', { ascending: false })
      if (wfData) {
        setWorkflows(wfData.map((w: any) => ({
          id: w.id, name: w.name, description: w.description || '', trigger: w.trigger_type || 'manual',
          status: w.status || 'draft', steps: Array.isArray(w.steps) ? w.steps : [],
          stats: { triggered: w.triggered_count || 0, completed: w.completed_count || 0, active: w.active_count || 0 },
          createdAt: w.created_at
        })))
      }

      const { data: autoData } = await supabase.from('marketing_automations').select('*').order('created_at', { ascending: false })
      if (autoData) {
        setAutomations(autoData.map((a: any) => ({
          id: a.id, name: a.name, type: a.automation_type || 'email_sequence', status: a.status || 'paused',
          metrics: { sent: a.sent_count || 0, opened: a.opened_count || 0, clicked: a.clicked_count || 0, converted: a.converted_count || 0 },
          lastRun: a.last_run_at || a.created_at
        })))
      }

      console.log('Marketing Automation: Dados carregados')
    } catch (error) {
      console.error('Error loading marketing automation data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, any> = {
      active: { color: 'bg-green-100 text-green-800', label: 'Ativo', icon: CheckCircle },
      paused: { color: 'bg-yellow-100 text-yellow-800', label: 'Pausado', icon: Pause },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Rascunho', icon: Clock }
    }
    const config = configs[status] || configs.draft
    return <Badge className={config.color}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Marketing Automation</h2>
          <p className="text-gray-600">Workflows automáticos e nurture de leads</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-2" />Novo Workflow</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center">
          <Zap className="h-8 w-8 text-blue-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Workflows</p>
          <p className="text-2xl font-bold text-gray-900">{workflows.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <Users className="h-8 w-8 text-green-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Automações</p>
          <p className="text-2xl font-bold text-gray-900">{automations.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <Mail className="h-8 w-8 text-purple-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Emails Enviados</p>
          <p className="text-2xl font-bold text-gray-900">{automations.reduce((s, a) => s + a.metrics.sent, 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-orange-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Conversões</p>
          <p className="text-2xl font-bold text-gray-900">{automations.reduce((s, a) => s + a.metrics.converted, 0)}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="automations">Automações</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows">
          {workflows.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum workflow criado</p>
              <Button><Plus className="h-4 w-4 mr-2" />Criar Workflow</Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {workflows.map(wf => (
                <Card key={wf.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{wf.name}</CardTitle>
                          {getStatusBadge(wf.status)}
                        </div>
                        <CardDescription>{wf.description}</CardDescription>
                      </div>
                      <Button size="sm" variant="outline">{wf.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-gray-600">Trigger</p><p className="font-medium capitalize">{wf.trigger.replace('_', ' ')}</p></div>
                      <div><p className="text-gray-600">Executados</p><p className="font-medium">{wf.stats.triggered}</p></div>
                      <div><p className="text-gray-600">Ativos</p><p className="font-medium">{wf.stats.active}</p></div>
                      <div><p className="text-gray-600">Etapas</p><p className="font-medium">{wf.steps.length}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="automations">
          {automations.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhuma automação configurada</p>
              <Button><Plus className="h-4 w-4 mr-2" />Criar Automação</Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {automations.map(auto => (
                <Card key={auto.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{auto.name}</CardTitle>
                        {getStatusBadge(auto.status)}
                      </div>
                      <Button size="sm" variant="outline"><Settings className="h-3 w-3" /></Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div><p className="text-gray-600">Enviados</p><p className="font-medium">{auto.metrics.sent}</p></div>
                      <div><p className="text-gray-600">Abertos</p><p className="font-medium">{auto.metrics.opened} ({auto.metrics.sent > 0 ? ((auto.metrics.opened / auto.metrics.sent) * 100).toFixed(1) : 0}%)</p></div>
                      <div><p className="text-gray-600">Cliques</p><p className="font-medium">{auto.metrics.clicked} ({auto.metrics.sent > 0 ? ((auto.metrics.clicked / auto.metrics.sent) * 100).toFixed(1) : 0}%)</p></div>
                      <div><p className="text-gray-600">Conversões</p><p className="font-medium">{auto.metrics.converted}</p></div>
                      <div><p className="text-gray-600">Última Exec</p><p className="font-medium">{new Date(auto.lastRun).toLocaleDateString('pt-BR')}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}