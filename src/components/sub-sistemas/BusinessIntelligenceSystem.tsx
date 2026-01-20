'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3,
  TrendingUp,
  Database,
  RefreshCw,
  Eye,
  Plus,
  Settings,
  Share2,
  Activity,
  Download
} from 'lucide-react'

interface BIDashboard {
  id: string
  name: string
  description: string
  category: 'executive' | 'sales' | 'marketing' | 'financial' | 'operational'
  owner: string
  isPublic: boolean
  refreshInterval: number
  widgets: any[]
  createdAt: string
  lastUpdated: string
}

interface BIDataModel {
  id: string
  name: string
  description: string
  source: 'supabase' | 'api' | 'csv' | 'manual'
  sqlQuery?: string
  refreshSchedule: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual'
  schema: any
  lastSync: string
  status: 'active' | 'error' | 'syncing'
}

interface BIReport {
  id: string
  name: string
  description: string
  dashboardId: string
  format: 'pdf' | 'excel' | 'csv' | 'powerpoint'
  schedule: 'once' | 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  lastGenerated?: string
  nextScheduled?: string
  status: 'active' | 'paused'
}

export default function BusinessIntelligenceSystem() {
  const [dashboards, setDashboards] = useState<BIDashboard[]>([])
  const [dataModels, setDataModels] = useState<BIDataModel[]>([])
  const [reports, setReports] = useState<BIReport[]>([])
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

      const { data: dashData } = await supabase.from('bi_dashboards').select('*').order('created_at', { ascending: false })
      if (dashData) {
        setDashboards(dashData.map((d: any) => ({
          id: d.id, name: d.name, description: d.description || '', category: d.category || 'operational',
          owner: d.owner_persona_id || 'Sistema', isPublic: d.is_public || false,
          refreshInterval: d.refresh_interval_seconds || 300, widgets: Array.isArray(d.widgets) ? d.widgets : [],
          createdAt: d.created_at, lastUpdated: d.updated_at || d.created_at
        })))
      }

      const { data: modelData } = await supabase.from('bi_data_models').select('*').order('name')
      if (modelData) {
        setDataModels(modelData.map((m: any) => ({
          id: m.id, name: m.name, description: m.description || '', source: m.source || 'supabase',
          sqlQuery: m.sql_query || undefined, refreshSchedule: m.refresh_schedule || 'manual',
          schema: m.schema || {}, lastSync: m.last_synced_at || m.created_at, status: m.status || 'active'
        })))
      }

      const { data: reportData } = await supabase.from('bi_reports').select('*').order('created_at', { ascending: false })
      if (reportData) {
        setReports(reportData.map((r: any) => ({
          id: r.id, name: r.name, description: r.description || '', dashboardId: r.dashboard_id,
          format: r.format || 'pdf', schedule: r.schedule || 'once',
          recipients: Array.isArray(r.recipients) ? r.recipients : [],
          lastGenerated: r.last_generated || undefined, nextScheduled: r.next_scheduled || undefined,
          status: r.status || 'active'
        })))
      }
    } catch (error) {
      console.error('Error loading BI data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryBadge = (category: string) => {
    const configs: Record<string, any> = {
      executive: { color: 'bg-purple-100 text-purple-800', label: 'Executivo' },
      sales: { color: 'bg-green-100 text-green-800', label: 'Vendas' },
      marketing: { color: 'bg-blue-100 text-blue-800', label: 'Marketing' },
      financial: { color: 'bg-yellow-100 text-yellow-800', label: 'Financeiro' },
      operational: { color: 'bg-gray-100 text-gray-800', label: 'Operacional' }
    }
    const config = configs[category] || configs.operational
    return <Badge className={config.color}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Intelligence</h2>
          <p className="text-gray-600">Dashboards, relatórios e análise avançada de dados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
          <Button><Plus className="h-4 w-4 mr-2" />Novo Dashboard</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card><CardContent className="p-6"><div className="flex items-center">
          <BarChart3 className="h-8 w-8 text-blue-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Dashboards</p>
          <p className="text-2xl font-bold text-gray-900">{dashboards.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <Database className="h-8 w-8 text-green-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Data Models</p>
          <p className="text-2xl font-bold text-gray-900">{dataModels.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <Activity className="h-8 w-8 text-purple-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Relatórios</p>
          <p className="text-2xl font-bold text-gray-900">{reports.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-orange-600" /><div className="ml-4">
          <p className="text-sm font-medium text-gray-600">Widgets</p>
          <p className="text-2xl font-bold text-gray-900">{dashboards.reduce((sum, d) => sum + (d.widgets?.length || 0), 0)}</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="dashboards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="datamodels">Data Models</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboards">
          {dashboards.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum dashboard criado</p>
              <Button><Plus className="h-4 w-4 mr-2" />Criar Dashboard</Button>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboards.map(d => (
                <Card key={d.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{d.name}</CardTitle>
                      {getCategoryBadge(d.category)}
                    </div>
                    <CardDescription>{d.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600"><Eye className="h-4 w-4 mr-2" />{d.isPublic ? 'Público' : 'Privado'}</div>
                      <div className="flex items-center text-gray-600"><Activity className="h-4 w-4 mr-2" />{d.widgets?.length || 0} widgets</div>
                      <div className="pt-2 flex gap-2">
                        <Button size="sm" className="flex-1"><Eye className="h-3 w-3 mr-1" />Visualizar</Button>
                        <Button size="sm" variant="outline"><Settings className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="datamodels">
          {dataModels.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum data model configurado</p>
              <Button><Plus className="h-4 w-4 mr-2" />Criar Data Model</Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {dataModels.map(m => (
                <Card key={m.id}>
                  <CardHeader><CardTitle>{m.name}</CardTitle><CardDescription>{m.description}</CardDescription></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-gray-600">Fonte</p><p className="font-medium capitalize">{m.source}</p></div>
                      <div><p className="text-gray-600">Atualização</p><p className="font-medium capitalize">{m.refreshSchedule}</p></div>
                      <div><p className="text-gray-600">Status</p><Badge className={m.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{m.status}</Badge></div>
                      <div className="flex gap-2"><Button size="sm" variant="outline"><RefreshCw className="h-3 w-3" /></Button></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports">
          {reports.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum relatório agendado</p>
              <Button><Plus className="h-4 w-4 mr-2" />Agendar Relatório</Button>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {reports.map(r => (
                <Card key={r.id}>
                  <CardHeader><CardTitle>{r.name}</CardTitle><CardDescription>{r.description}</CardDescription></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><p className="text-gray-600">Formato</p><p className="font-medium uppercase">{r.format}</p></div>
                      <div><p className="text-gray-600">Frequência</p><p className="font-medium capitalize">{r.schedule}</p></div>
                      <div><p className="text-gray-600">Destinatários</p><p className="font-medium">{r.recipients.length}</p></div>
                      <div className="flex gap-2"><Button size="sm" variant="outline"><Download className="h-3 w-3" /></Button></div>
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