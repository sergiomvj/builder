'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { DatabaseService } from '@/lib/database'
import { 
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Share2,
  Settings,
  Clock,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react'

interface AnalyticsMetric {
  id: string
  name: string
  value: number
  previousValue: number
  change: number
  changeType: 'increase' | 'decrease' | 'neutral'
  unit: string
  category: 'revenue' | 'users' | 'engagement' | 'performance'
  description: string
  target?: number
  isKPI: boolean
}

interface DashboardWidget {
  id: string
  title: string
  type: 'chart' | 'metric' | 'table' | 'gauge'
  chartType?: 'line' | 'bar' | 'pie' | 'area'
  size: 'small' | 'medium' | 'large'
  data: any[]
  config: any
  isVisible: boolean
  position: { x: number; y: number }
}

interface AnalyticsReport {
  id: string
  name: string
  description: string
  type: 'automated' | 'custom' | 'scheduled'
  frequency: 'daily' | 'weekly' | 'monthly'
  recipients: string[]
  lastGenerated: string
  nextGeneration?: string
  status: 'active' | 'paused' | 'error'
  widgets: string[]
  format: 'pdf' | 'excel' | 'dashboard'
}

interface Goal {
  id: string
  name: string
  description: string
  type: 'revenue' | 'growth' | 'retention' | 'efficiency'
  target: number
  current: number
  deadline: string
  responsible: string
  status: 'on-track' | 'at-risk' | 'behind' | 'completed'
  milestones: GoalMilestone[]
}

interface GoalMilestone {
  id: string
  name: string
  target: number
  completed: boolean
  date: string
}

interface AnalyticsFilter {
  dateRange: { start: string; end: string }
  segment: string
  region: string
  product: string
  channel: string
}

export default function AnalyticsReportingSystem() {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([])
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [reports, setReports] = useState<AnalyticsReport[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [filters, setFilters] = useState<AnalyticsFilter>({
    dateRange: { start: '2024-10-16', end: '2024-11-16' },
    segment: 'all',
    region: 'all',
    product: 'all',
    channel: 'all'
  })
  
  const [selectedDateRange, setSelectedDateRange] = useState('30days')
  const [isRealTime, setIsRealTime] = useState(false)

  useEffect(() => {
    // Mock data for demonstration
    const mockMetrics: AnalyticsMetric[] = [
      {
        id: '1',
        name: 'Receita Mensal',
        value: 125400,
        previousValue: 118200,
        change: 6.1,
        changeType: 'increase',
        unit: 'R$',
        category: 'revenue',
        description: 'Receita total do mês atual',
        target: 130000,
        isKPI: true
      },
      {
        id: '2',
        name: 'Novos Usuários',
        value: 1234,
        previousValue: 1156,
        change: 6.7,
        changeType: 'increase',
        unit: 'usuários',
        category: 'users',
        description: 'Novos usuários cadastrados no período',
        target: 1300,
        isKPI: true
      },
      {
        id: '3',
        name: 'Taxa de Conversão',
        value: 3.2,
        previousValue: 2.8,
        change: 14.3,
        changeType: 'increase',
        unit: '%',
        category: 'engagement',
        description: 'Taxa de conversão de visitantes para clientes',
        target: 3.5,
        isKPI: true
      },
      {
        id: '4',
        name: 'Tempo Médio de Resposta',
        value: 2.1,
        previousValue: 2.8,
        change: -25.0,
        changeType: 'decrease',
        unit: 'seg',
        category: 'performance',
        description: 'Tempo médio de resposta da aplicação',
        target: 2.0,
        isKPI: false
      },
      {
        id: '5',
        name: 'NPS Score',
        value: 72,
        previousValue: 68,
        change: 5.9,
        changeType: 'increase',
        unit: 'pontos',
        category: 'engagement',
        description: 'Net Promoter Score',
        target: 75,
        isKPI: true
      },
      {
        id: '6',
        name: 'CAC (Custo de Aquisição)',
        value: 85,
        previousValue: 92,
        change: -7.6,
        changeType: 'decrease',
        unit: 'R$',
        category: 'revenue',
        description: 'Custo médio para adquirir um cliente',
        target: 80,
        isKPI: true
      },
      {
        id: '7',
        name: 'LTV (Lifetime Value)',
        value: 850,
        previousValue: 820,
        change: 3.7,
        changeType: 'increase',
        unit: 'R$',
        category: 'revenue',
        description: 'Valor médio do cliente durante seu ciclo de vida',
        target: 900,
        isKPI: true
      },
      {
        id: '8',
        name: 'Taxa de Churn',
        value: 2.3,
        previousValue: 2.8,
        change: -17.9,
        changeType: 'decrease',
        unit: '%',
        category: 'users',
        description: 'Taxa de cancelamento de clientes',
        target: 2.0,
        isKPI: true
      }
    ]

    const mockWidgets: DashboardWidget[] = [
      {
        id: '1',
        title: 'Receita nos Últimos 12 Meses',
        type: 'chart',
        chartType: 'line',
        size: 'large',
        data: [
          { month: 'Jan', value: 98000 },
          { month: 'Fev', value: 105000 },
          { month: 'Mar', value: 112000 },
          { month: 'Abr', value: 108000 },
          { month: 'Mai', value: 115000 },
          { month: 'Jun', value: 122000 },
          { month: 'Jul', value: 118000 },
          { month: 'Ago', value: 125000 },
          { month: 'Set', value: 130000 },
          { month: 'Out', value: 118200 },
          { month: 'Nov', value: 125400 }
        ],
        config: { color: '#3b82f6' },
        isVisible: true,
        position: { x: 0, y: 0 }
      },
      {
        id: '2',
        title: 'Funil de Conversão',
        type: 'chart',
        chartType: 'bar',
        size: 'medium',
        data: [
          { stage: 'Visitantes', value: 10000 },
          { stage: 'Leads', value: 2500 },
          { stage: 'Prospects', value: 800 },
          { stage: 'Clientes', value: 320 }
        ],
        config: { color: '#10b981' },
        isVisible: true,
        position: { x: 1, y: 0 }
      },
      {
        id: '3',
        title: 'Origem do Tráfego',
        type: 'chart',
        chartType: 'pie',
        size: 'medium',
        data: [
          { source: 'Orgânico', value: 45, color: '#3b82f6' },
          { source: 'Pago', value: 30, color: '#f59e0b' },
          { source: 'Social', value: 15, color: '#10b981' },
          { source: 'Email', value: 10, color: '#ef4444' }
        ],
        config: {},
        isVisible: true,
        position: { x: 0, y: 1 }
      }
    ]

    const mockReports: AnalyticsReport[] = [
      {
        id: '1',
        name: 'Relatório Executivo Mensal',
        description: 'Resumo executivo com métricas principais e KPIs',
        type: 'automated',
        frequency: 'monthly',
        recipients: ['ceo@empresa.com', 'diretoria@empresa.com'],
        lastGenerated: '2024-11-01T09:00:00',
        nextGeneration: '2024-12-01T09:00:00',
        status: 'active',
        widgets: ['1', '2', '3'],
        format: 'pdf'
      },
      {
        id: '2',
        name: 'Dashboard de Performance',
        description: 'Métricas de performance e tempo de resposta',
        type: 'scheduled',
        frequency: 'daily',
        recipients: ['tech@empresa.com'],
        lastGenerated: '2024-11-16T08:00:00',
        nextGeneration: '2024-11-17T08:00:00',
        status: 'active',
        widgets: ['4'],
        format: 'dashboard'
      },
      {
        id: '3',
        name: 'Análise de Vendas Semanal',
        description: 'Análise detalhada do funil de vendas e conversões',
        type: 'custom',
        frequency: 'weekly',
        recipients: ['vendas@empresa.com', 'marketing@empresa.com'],
        lastGenerated: '2024-11-11T10:00:00',
        nextGeneration: '2024-11-18T10:00:00',
        status: 'active',
        widgets: ['2'],
        format: 'excel'
      }
    ]

    const mockGoals: Goal[] = [
      {
        id: '1',
        name: 'Aumentar Receita Mensal',
        description: 'Meta de atingir R$ 150.000 em receita mensal',
        type: 'revenue',
        target: 150000,
        current: 125400,
        deadline: '2024-12-31',
        responsible: 'Equipe de Vendas',
        status: 'on-track',
        milestones: [
          { id: '1', name: 'R$ 130.000', target: 130000, completed: false, date: '2024-11-30' },
          { id: '2', name: 'R$ 140.000', target: 140000, completed: false, date: '2024-12-15' },
          { id: '3', name: 'R$ 150.000', target: 150000, completed: false, date: '2024-12-31' }
        ]
      },
      {
        id: '2',
        name: 'Reduzir Taxa de Churn',
        description: 'Meta de reduzir churn para menos de 2%',
        type: 'retention',
        target: 2.0,
        current: 2.3,
        deadline: '2024-12-31',
        responsible: 'Customer Success',
        status: 'at-risk',
        milestones: [
          { id: '4', name: '2.5%', target: 2.5, completed: true, date: '2024-10-31' },
          { id: '5', name: '2.2%', target: 2.2, completed: false, date: '2024-11-30' },
          { id: '6', name: '2.0%', target: 2.0, completed: false, date: '2024-12-31' }
        ]
      },
      {
        id: '3',
        name: 'Melhorar NPS',
        description: 'Atingir NPS de 80 pontos',
        type: 'retention',
        target: 80,
        current: 72,
        deadline: '2024-12-31',
        responsible: 'Produto & UX',
        status: 'on-track',
        milestones: [
          { id: '7', name: '75 pontos', target: 75, completed: false, date: '2024-11-30' },
          { id: '8', name: '80 pontos', target: 80, completed: false, date: '2024-12-31' }
        ]
      }
    ]

    // Load data from Supabase
    const loadData = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Load metrics from analytics_metrics
        const { data: metricsData, error: metricsError } = await supabase
          .from('analytics_metrics')
          .select('*')
          .order('created_at', { ascending: false })

        if (metricsError) {
          console.error('Error loading metrics:', metricsError)
          setMetrics(mockMetrics)
        } else if (metricsData && metricsData.length > 0) {
          const mappedMetrics: AnalyticsMetric[] = metricsData.map(metric => ({
            id: metric.id,
            name: metric.metric_name,
            value: parseFloat(metric.value) || 0,
            previousValue: parseFloat(metric.previous_value) || 0,
            change: parseFloat(metric.change_percentage) || 0,
            changeType: (parseFloat(metric.change_percentage) || 0) > 0 ? 'increase' : 
                       (parseFloat(metric.change_percentage) || 0) < 0 ? 'decrease' : 'neutral',
            unit: metric.unit || '',
            category: metric.category as AnalyticsMetric['category'],
            description: metric.description || '',
            target: parseFloat(metric.target_value) || undefined,
            isKPI: metric.is_kpi || false
          }))
          setMetrics(mappedMetrics)
        } else {
          setMetrics(mockMetrics)
        }

        // Load reports from analytics_reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('analytics_reports')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (reportsError) {
          console.error('Error loading reports:', reportsError)
          setReports(mockReports)
        } else if (reportsData && reportsData.length > 0) {
          const mappedReports: AnalyticsReport[] = reportsData.map(report => ({
            id: report.id,
            name: report.report_name,
            description: report.description || '',
            type: report.report_type as AnalyticsReport['type'],
            frequency: report.frequency as AnalyticsReport['frequency'],
            recipients: Array.isArray(report.recipients) ? report.recipients : [],
            lastGenerated: report.last_generated,
            nextGeneration: report.next_generation || undefined,
            status: report.status as AnalyticsReport['status'],
            widgets: Array.isArray(report.widget_ids) ? report.widget_ids : [],
            format: (report.format || 'pdf') as AnalyticsReport['format']
          }))
          setReports(mappedReports)
        } else {
          setReports(mockReports)
        }

        // Load goals from analytics_metrics with target values
        const { data: goalsData, error: goalsError } = await supabase
          .from('analytics_metrics')
          .select('*')
          .not('target_value', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10)

        if (goalsError) {
          console.error('Error loading goals:', goalsError)
          setGoals(mockGoals)
        } else if (goalsData && goalsData.length > 0) {
          const mappedGoals: Goal[] = goalsData.map(goal => ({
            id: goal.id,
            name: goal.metric_name,
            description: goal.description || '',
            type: goal.category as Goal['type'],
            target: parseFloat(goal.target_value) || 0,
            current: parseFloat(goal.value) || 0,
            deadline: goal.target_deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            responsible: 'Sistema',
            status: (parseFloat(goal.value) || 0) >= (parseFloat(goal.target_value) || 0) ? 'completed' : 
                    (parseFloat(goal.value) || 0) >= (parseFloat(goal.target_value) || 0) * 0.8 ? 'on-track' : 
                    (parseFloat(goal.value) || 0) >= (parseFloat(goal.target_value) || 0) * 0.6 ? 'at-risk' : 'behind',
            milestones: []
          }))
          setGoals(mappedGoals)
        } else {
          setGoals(mockGoals)
        }

        console.log('Analytics System: Dados carregados do Supabase com sucesso')
      } catch (error) {
        console.error('Error loading analytics data:', error)
        setMetrics(mockMetrics)
        setReports(mockReports)
        setGoals(mockGoals)
      }
    }

    loadData()
  }, [])

  const getMetricsByCategory = (category: string) => {
    return metrics.filter(m => m.category === category)
  }

  const getKPIMetrics = () => {
    return metrics.filter(m => m.isKPI)
  }

  const getGoalProgress = (goal: Goal) => {
    return (goal.current / goal.target) * 100
  }

  const getGoalStatusColor = (status: string) => {
    const colors = {
      'on-track': 'text-green-600',
      'at-risk': 'text-yellow-600',
      'behind': 'text-red-600',
      'completed': 'text-blue-600'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600'
  }

  const getGoalStatusBadge = (status: string) => {
    const configs = {
      'on-track': { color: 'bg-green-100 text-green-800', label: 'No Prazo' },
      'at-risk': { color: 'bg-yellow-100 text-yellow-800', label: 'Em Risco' },
      'behind': { color: 'bg-red-100 text-red-800', label: 'Atrasado' },
      'completed': { color: 'bg-blue-100 text-blue-800', label: 'Concluído' }
    }
    
    const config = configs[status as keyof typeof configs]
    return config ? <Badge className={config.color}>{config.label}</Badge> : null
  }

  const formatNumber = (value: number, unit: string) => {
    if (unit === 'R$') {
      return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      }).format(value)
    } else if (unit === '%') {
      return `${value}%`
    } else if (value >= 1000) {
      return new Intl.NumberFormat('pt-BR', { 
        notation: 'compact', 
        compactDisplay: 'short' 
      }).format(value)
    }
    return `${value} ${unit}`
  }

  const getChangeIcon = (changeType: string) => {
    return changeType === 'increase' ? (
      <ArrowUpRight className="w-4 h-4 text-green-600" />
    ) : changeType === 'decrease' ? (
      <ArrowDownRight className="w-4 h-4 text-red-600" />
    ) : null
  }

  const getChangeColor = (changeType: string) => {
    return changeType === 'increase' ? 'text-green-600' : 
           changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Relatórios</h2>
          <p className="text-muted-foreground">
            Insights, métricas e relatórios para tomada de decisão
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório
          </Button>
        </div>
      </div>

      {/* Real-time Toggle and Filters */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={isRealTime} 
              onCheckedChange={setIsRealTime}
            />
            <Label className="text-sm">Tempo Real</Label>
            {isRealTime && (
              <div className="flex items-center text-green-600">
                <Activity className="w-4 h-4 mr-1 animate-pulse" />
                <span className="text-xs">Ativo</span>
              </div>
            )}
          </div>
          
          <div className="h-4 w-px bg-gray-300" />
          
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 dias</SelectItem>
              <SelectItem value="30days">30 dias</SelectItem>
              <SelectItem value="90days">90 dias</SelectItem>
              <SelectItem value="1year">1 ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="ghost" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Key Metrics Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            {getKPIMetrics().slice(0, 4).map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  <div className="flex items-center space-x-1">
                    {getChangeIcon(metric.changeType)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(metric.value, metric.unit)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <p className={`text-xs ${getChangeColor(metric.changeType)}`}>
                      {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">vs período anterior</p>
                  </div>
                  {metric.target && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Meta</span>
                        <span>{formatNumber(metric.target, metric.unit)}</span>
                      </div>
                      <Progress 
                        value={(metric.value / metric.target) * 100} 
                        className="h-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Receita nos Últimos 12 Meses</CardTitle>
                <CardDescription>Evolução da receita mensal com tendência</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center border border-dashed rounded">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="w-12 h-12 mx-auto mb-2" />
                    <p>Gráfico de Linha - Receita Mensal</p>
                    <p className="text-sm">Integração com biblioteca de gráficos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>Taxa de conversão por etapa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center border border-dashed rounded">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                    <p>Gráfico de Barras - Funil</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Origem do Tráfego</CardTitle>
                <CardDescription>Distribuição por canal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] flex items-center justify-center border border-dashed rounded">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="w-12 h-12 mx-auto mb-2" />
                    <p>Gráfico de Pizza - Canais</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getMetricsByCategory('performance').map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-muted-foreground">{metric.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatNumber(metric.value, metric.unit)}</div>
                        <div className={`text-sm flex items-center ${getChangeColor(metric.changeType)}`}>
                          {getChangeIcon(metric.changeType)}
                          {metric.change.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Engajamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getMetricsByCategory('engagement').map((metric) => (
                    <div key={metric.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{metric.name}</div>
                        <div className="text-sm text-muted-foreground">{metric.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatNumber(metric.value, metric.unit)}</div>
                        <div className={`text-sm flex items-center ${getChangeColor(metric.changeType)}`}>
                          {getChangeIcon(metric.changeType)}
                          {metric.change.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {getKPIMetrics().map((metric) => (
              <Card key={metric.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {metric.name}
                    <Badge variant={metric.target && metric.value >= metric.target ? "default" : "secondary"}>
                      KPI
                    </Badge>
                  </CardTitle>
                  <CardDescription>{metric.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">
                        {formatNumber(metric.value, metric.unit)}
                      </div>
                      <div className={`text-sm flex items-center ${getChangeColor(metric.changeType)}`}>
                        {getChangeIcon(metric.changeType)}
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}% vs anterior
                      </div>
                    </div>
                    {metric.target && (
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Meta</div>
                        <div className="font-medium">{formatNumber(metric.target, metric.unit)}</div>
                        <div className={`text-xs ${
                          metric.value >= metric.target ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {metric.value >= metric.target ? 'Atingida!' : 
                           `${((metric.value / metric.target) * 100).toFixed(1)}% da meta`}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {metric.target && (
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progresso</span>
                        <span>{((metric.value / metric.target) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={(metric.value / metric.target) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="space-y-4">
            {goals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <CardDescription>{goal.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getGoalStatusBadge(goal.status)}
                      <div className="text-sm text-muted-foreground">
                        {goal.responsible}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Atual</div>
                      <div className="text-2xl font-bold">
                        {goal.type === 'revenue' ? 
                          formatNumber(goal.current, 'R$') : 
                          `${goal.current}${goal.type === 'retention' && goal.current < 10 ? '%' : ''}`
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Meta</div>
                      <div className="text-2xl font-bold">
                        {goal.type === 'revenue' ? 
                          formatNumber(goal.target, 'R$') : 
                          `${goal.target}${goal.type === 'retention' && goal.target < 10 ? '%' : ''}`
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Prazo</div>
                      <div className="font-medium">
                        {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Progresso</span>
                      <span>{getGoalProgress(goal).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={getGoalProgress(goal)} 
                      className="h-3"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Marcos ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length})</div>
                    <div className="grid grid-cols-3 gap-2">
                      {goal.milestones.map((milestone) => (
                        <div key={milestone.id} className={`p-2 rounded text-center text-sm border ${
                          milestone.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className={`font-medium ${
                            milestone.completed ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            {milestone.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(milestone.date).toLocaleDateString('pt-BR')}
                          </div>
                          {milestone.completed && (
                            <div className="text-green-600 text-xs mt-1">
                              ✓ Concluído
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={report.status === 'active' ? 'default' : 
                                   report.status === 'paused' ? 'secondary' : 'destructive'}>
                        {report.status === 'active' ? 'Ativo' : 
                         report.status === 'paused' ? 'Pausado' : 'Erro'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {report.frequency}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Tipo</div>
                      <div className="font-medium capitalize">{report.type}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Formato</div>
                      <div className="font-medium uppercase">{report.format}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Último Gerado</div>
                      <div className="font-medium">
                        {new Date(report.lastGenerated).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Próxima Geração</div>
                      <div className="font-medium">
                        {report.nextGeneration ? 
                          new Date(report.nextGeneration).toLocaleString('pt-BR') : 
                          'Sob demanda'
                        }
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Destinatários</div>
                    <div className="flex flex-wrap gap-1">
                      {report.recipients.map((recipient) => (
                        <Badge key={recipient} variant="outline" className="text-xs">
                          {recipient}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizar
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Gerar Agora
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                  Insights Automáticos
                </CardTitle>
                <CardDescription>
                  Análises e recomendações baseadas em IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-800">Performance Positiva</div>
                      <div className="text-sm text-green-700">
                        A taxa de conversão aumentou 14.3% este mês, principalmente devido ao 
                        novo funil de onboarding implementado.
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        Recomendação: Expandir esta estratégia para outras páginas de conversão.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800">Atenção Necessária</div>
                      <div className="text-sm text-yellow-700">
                        O CAC (Custo de Aquisição) está próximo da meta, mas pode ser otimizado 
                        focando em canais orgânicos.
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Recomendação: Investir 20% mais em SEO e content marketing.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-800">Oportunidade Identificada</div>
                      <div className="text-sm text-blue-700">
                        Usuários do segmento Enterprise têm 3x maior LTV. 
                        Considere criar ofertas específicas para este público.
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Recomendação: Desenvolver planos Enterprise personalizados.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendências Previstas</CardTitle>
                <CardDescription>
                  Projeções baseadas em dados históricos e machine learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">Receita Dezembro 2024</div>
                      <div className="text-sm text-muted-foreground">Baseado na tendência atual</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">R$ 142.000</div>
                      <div className="text-sm text-muted-foreground">+13.2% vs atual</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">Novos Usuários (30 dias)</div>
                      <div className="text-sm text-muted-foreground">Projeção conservadora</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">1.450</div>
                      <div className="text-sm text-muted-foreground">+17.5% vs atual</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <div className="font-medium">Taxa de Churn (Meta)</div>
                      <div className="text-sm text-muted-foreground">Se mantiver tendência atual</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-600">1.8%</div>
                      <div className="text-sm text-muted-foreground">Meta atingida!</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}