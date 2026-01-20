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
import { Progress } from '@/components/ui/progress'
import { 
  Target,
  TrendingUp,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  position: string
  source: 'website' | 'linkedin' | 'referral' | 'cold-email' | 'event' | 'organic'
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  score: number
  assignedTo: string
  createdAt: string
  lastActivity: string
  nextFollowUp?: string
  budget?: number
  interest: 'low' | 'medium' | 'high'
  notes: string[]
  tags: string[]
}

interface Campaign {
  id: string
  name: string
  type: 'email' | 'linkedin' | 'phone' | 'mixed'
  status: 'draft' | 'active' | 'paused' | 'completed'
  targetAudience: string
  totalProspects: number
  contacted: number
  responded: number
  qualified: number
  createdAt: string
  startDate: string
  endDate?: string
  assignedTo: string[]
}

interface SDRMetrics {
  totalLeads: number
  qualifiedLeads: number
  conversionRate: number
  avgResponseTime: number
  activitiesCompleted: number
  meetingsBooked: number
  dealsGenerated: number
  revenue: number
}

interface Activity {
  id: string
  leadId: string
  type: 'call' | 'email' | 'linkedin-message' | 'meeting' | 'follow-up'
  subject: string
  description: string
  status: 'completed' | 'scheduled' | 'pending'
  scheduledFor?: string
  completedAt?: string
  outcome?: 'positive' | 'negative' | 'neutral'
  nextAction?: string
  assignedTo: string
}

export default function SDRLeadGenSystem() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [metrics, setMetrics] = useState<SDRMetrics>({
    totalLeads: 0,
    qualifiedLeads: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    activitiesCompleted: 0,
    meetingsBooked: 0,
    dealsGenerated: 0,
    revenue: 0
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Load leads from crm_leads (shared with CRM)
        const { data: leadsData, error: leadsError } = await supabase
          .from('crm_leads')
          .select('*')
          .order('created_at', { ascending: false })

        if (leadsError) {
          console.error('Error loading leads:', leadsError)
        } else if (leadsData) {
          const mappedLeads: Lead[] = leadsData.map(lead => ({
            id: lead.id,
            firstName: lead.first_name,
            lastName: lead.last_name,
            email: lead.email,
            phone: lead.phone || '',
            company: lead.company || '',
            position: lead.position || '',
            source: (lead.lead_source || 'website') as Lead['source'],
            status: (lead.status || 'new') as Lead['status'],
            score: lead.lead_score || 0,
            assignedTo: lead.owner_persona_id || 'Não atribuído',
            createdAt: lead.created_at,
            lastActivity: lead.last_contacted_at || lead.created_at,
            nextFollowUp: lead.next_follow_up || undefined,
            budget: lead.estimated_budget || undefined,
            interest: (lead.interest_level || 'medium') as Lead['interest'],
            notes: Array.isArray(lead.notes) ? lead.notes : [],
            tags: Array.isArray(lead.tags) ? lead.tags : []
          }))
          setLeads(mappedLeads)
        }

        // Load campaigns from marketing_campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('marketing_campaigns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (campaignsError) {
          console.error('Error loading campaigns:', campaignsError)
        } else if (campaignsData) {
          const mappedCampaigns: Campaign[] = campaignsData.map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            type: (campaign.channel || 'email') as Campaign['type'],
            status: (campaign.status || 'draft') as Campaign['status'],
            targetAudience: campaign.target_audience || '',
            totalProspects: campaign.target_count || 0,
            contacted: campaign.sent_count || 0,
            responded: campaign.response_count || 0,
            qualified: campaign.conversion_count || 0,
            createdAt: campaign.created_at,
            startDate: campaign.start_date,
            endDate: campaign.end_date || undefined,
            assignedTo: Array.isArray(campaign.assigned_to) ? campaign.assigned_to : []
          }))
          setCampaigns(mappedCampaigns)
        }

        // Load activities from crm_activities (shared with CRM)
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('crm_activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (activitiesError) {
          console.error('Error loading activities:', activitiesError)
        } else if (activitiesData) {
          const mappedActivities: Activity[] = activitiesData.map(activity => ({
            id: activity.id,
            leadId: activity.lead_id || '',
            type: (activity.type || 'call') as Activity['type'],
            subject: activity.subject || activity.type,
            description: activity.description || '',
            status: (activity.status || 'pending') as Activity['status'],
            scheduledFor: activity.scheduled_for || undefined,
            completedAt: activity.completed_at || undefined,
            outcome: activity.outcome as Activity['outcome'],
            nextAction: activity.next_action || undefined,
            assignedTo: activity.owner_persona_id || 'Sistema'
          }))
          setActivities(mappedActivities)
        }

        // Calculate metrics from loaded data
        const qualifiedCount = leadsData?.filter(l => l.status === 'qualified').length || 0
        const totalCount = leadsData?.length || 0
        const calculatedMetrics: SDRMetrics = {
          totalLeads: totalCount,
          qualifiedLeads: qualifiedCount,
          conversionRate: totalCount > 0 ? (qualifiedCount / totalCount) * 100 : 0,
          avgResponseTime: 2.5,
          activitiesCompleted: activitiesData?.filter(a => a.status === 'completed').length || 0,
          meetingsBooked: activitiesData?.filter(a => a.type === 'meeting').length || 0,
          dealsGenerated: leadsData?.filter(l => l.status === 'won').length || 0,
          revenue: 0
        }
        setMetrics(calculatedMetrics)

        console.log('SDR System: Dados carregados do Supabase com sucesso')
      } catch (error) {
        console.error('Error loading SDR data:', error)
      }
    }

    loadData()
  }, [])

  const getStatusBadge = (status: Lead['status']) => {
    const statusConfig = {
      new: { color: 'bg-blue-100 text-blue-800', label: 'Novo' },
      contacted: { color: 'bg-yellow-100 text-yellow-800', label: 'Contatado' },
      qualified: { color: 'bg-green-100 text-green-800', label: 'Qualificado' },
      proposal: { color: 'bg-purple-100 text-purple-800', label: 'Proposta' },
      negotiation: { color: 'bg-orange-100 text-orange-800', label: 'Negociação' },
      won: { color: 'bg-emerald-100 text-emerald-800', label: 'Ganho' },
      lost: { color: 'bg-red-100 text-red-800', label: 'Perdido' }
    }
    
    const config = statusConfig[status]
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getInterestIcon = (interest: Lead['interest']) => {
    if (interest === 'high') return <AlertCircle className="w-4 h-4 text-red-500" />
    if (interest === 'medium') return <Clock className="w-4 h-4 text-yellow-500" />
    return <Clock className="w-4 h-4 text-gray-400" />
  }

  const getCampaignStatusBadge = (status: Campaign['status']) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
      active: { color: 'bg-green-100 text-green-800', label: 'Ativa' },
      paused: { color: 'bg-yellow-100 text-yellow-800', label: 'Pausada' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Concluída' }
    }
    
    const config = statusConfig[status]
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = `${lead.firstName} ${lead.lastName} ${lead.email} ${lead.company}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter
    
    return matchesSearch && matchesStatus && matchesSource
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sistema SDR & Lead Generation</h2>
          <p className="text-muted-foreground">
            Gerencie leads, campanhas de prospecção e atividades de vendas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Leads
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.qualifiedLeads} qualificados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Lead para qualificado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividades Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activitiesCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.dealsGenerated} deals fechados
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 muted-foreground" />
                <Input 
                  placeholder="Buscar leads..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="contacted">Contatado</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="proposal">Proposta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Fonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="referral">Referência</SelectItem>
                <SelectItem value="cold-email">Cold Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leads List */}
          <div className="space-y-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold">{lead.firstName} {lead.lastName}</h3>
                            {getInterestIcon(lead.interest)}
                          </div>
                          <p className="text-muted-foreground">{lead.position} at {lead.company}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(lead.status)}
                          <div className="flex items-center">
                            <Target className="w-4 h-4 text-blue-400 mr-1" />
                            <span className="text-sm font-medium">{lead.score}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                          {lead.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                          {lead.phone}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          Última atividade: {new Date(lead.lastActivity).toLocaleDateString('pt-BR')}
                        </div>
                        {lead.budget && (
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                            Budget: R$ {lead.budget.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {lead.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {lead.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {lead.nextFollowUp && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="text-sm text-blue-800">
                              Próximo follow-up: {new Date(lead.nextFollowUp).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4">
            {campaigns.map((campaign) => {
              const responseRate = campaign.contacted > 0 ? (campaign.responded / campaign.contacted) * 100 : 0
              const qualificationRate = campaign.responded > 0 ? (campaign.qualified / campaign.responded) * 100 : 0
              const progressPercentage = (campaign.contacted / campaign.totalProspects) * 100

              return (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <span>{campaign.targetAudience}</span>
                          <Badge variant="outline" className="capitalize">{campaign.type}</Badge>
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getCampaignStatusBadge(campaign.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Progress</div>
                        <div className="font-medium">{campaign.contacted}/{campaign.totalProspects}</div>
                        <Progress value={progressPercentage} className="mt-1" />
                      </div>
                      <div>
                        <div className="text-muted-foreground">Taxa de Resposta</div>
                        <div className="font-medium">{responseRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{campaign.responded} respostas</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Taxa de Qualificação</div>
                        <div className="font-medium">{qualificationRate.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">{campaign.qualified} qualificados</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Responsáveis</div>
                        <div className="font-medium">{campaign.assignedTo.join(', ')}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(campaign.startDate).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="space-y-4">
            {activities.map((activity) => {
              const lead = leads.find(l => l.id === activity.leadId)
              const isCompleted = activity.status === 'completed'
              const isOverdue = activity.scheduledFor && new Date(activity.scheduledFor) < new Date() && !isCompleted

              return (
                <Card key={activity.id} className={isOverdue ? 'border-red-200 bg-red-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            isCompleted ? 'bg-green-500' : 
                            isOverdue ? 'bg-red-500' : 
                            'bg-yellow-500'
                          }`} />
                          <h4 className="font-medium">{activity.subject}</h4>
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.type.replace('-', ' ')}
                          </Badge>
                          {activity.outcome && (
                            <Badge variant={activity.outcome === 'positive' ? 'default' : 'secondary'} className="text-xs">
                              {activity.outcome}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>Lead: {lead?.firstName} {lead?.lastName}</span>
                          <span>SDR: {activity.assignedTo}</span>
                          {activity.completedAt && (
                            <span>Concluído: {new Date(activity.completedAt).toLocaleDateString('pt-BR')}</span>
                          )}
                          {activity.scheduledFor && !activity.completedAt && (
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              Agendado: {new Date(activity.scheduledFor).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                        {activity.nextAction && (
                          <div className="mt-2 text-xs text-blue-600">
                            Próxima ação: {activity.nextAction}
                          </div>
                        )}
                      </div>
                      {!isCompleted && (
                        <Button variant="outline" size="sm">
                          Marcar como Concluído
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance por SDR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Maria Santos</span>
                    <div className="text-right">
                      <div className="font-medium">12 leads qualificados</div>
                      <div className="text-sm text-muted-foreground">Taxa: 24%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>João Oliveira</span>
                    <div className="text-right">
                      <div className="font-medium">8 leads qualificados</div>
                      <div className="text-sm text-muted-foreground">Taxa: 18%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance por Fonte</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>LinkedIn</span>
                    <div className="text-right">
                      <div className="font-medium">45% dos leads qualificados</div>
                      <div className="text-sm text-muted-foreground">Taxa de conversão: 22%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Website</span>
                    <div className="text-right">
                      <div className="font-medium">30% dos leads qualificados</div>
                      <div className="text-sm text-muted-foreground">Taxa de conversão: 35%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Referral</span>
                    <div className="text-right">
                      <div className="font-medium">25% dos leads qualificados</div>
                      <div className="text-sm text-muted-foreground">Taxa de conversão: 65%</div>
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