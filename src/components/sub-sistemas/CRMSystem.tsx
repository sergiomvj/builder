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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, 
  Phone, 
  Mail, 
  Calendar, 
  Building, 
  MapPin, 
  Star,
  Plus, 
  Search, 
  Filter,
  Edit3,
  Trash2,
  MessageCircle,
  DollarSign,
  TrendingUp,
  Clock
} from 'lucide-react'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  position: string
  leadScore: number
  status: 'lead' | 'prospect' | 'customer' | 'inactive'
  source: string
  assignedTo: string
  lastContact: string
  nextFollowUp?: string
  notes: string
  tags: string[]
  createdAt: string
  dealValue?: number
}

interface Deal {
  id: string
  title: string
  contactId: string
  contactName: string
  value: number
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability: number
  expectedCloseDate: string
  assignedTo: string
  notes: string
  activities: Activity[]
}

interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note' | 'task'
  subject: string
  description: string
  contactId: string
  dealId?: string
  completedAt?: string
  scheduledFor?: string
  assignedTo: string
  createdAt: string
}

export default function CRMSystem() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isDealModalOpen, setIsDealModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Load demo data (substitute with real database later)
  useEffect(() => {
    const loadData = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Load contacts from crm_leads table
        const { data: leadsData, error: leadsError } = await supabase
          .from('crm_leads')
          .select('*')
          .order('created_at', { ascending: false })

        if (leadsError) {
          console.error('Error loading leads:', leadsError)
        } else if (leadsData) {
          const mappedContacts: Contact[] = leadsData.map(lead => ({
            id: lead.id,
            firstName: lead.first_name,
            lastName: lead.last_name,
            email: lead.email || '',
            phone: lead.phone || '',
            company: lead.company || '',
            position: lead.position || '',
            leadScore: lead.lead_score || 0,
            status: lead.status as Contact['status'],
            source: lead.source || '',
            assignedTo: lead.owner_persona_id || 'Sistema',
            lastContact: lead.last_contact_date || new Date().toISOString(),
            nextFollowUp: lead.next_follow_up,
            notes: lead.notes || '',
            tags: Array.isArray(lead.tags) ? lead.tags : [],
            createdAt: lead.created_at,
            dealValue: lead.estimated_value
          }))
          setContacts(mappedContacts)
        }

        // Load deals from crm_opportunities table
        const { data: dealsData, error: dealsError } = await supabase
          .from('crm_opportunities')
          .select(`
            *,
            lead:crm_leads(first_name, last_name),
            stage:crm_pipeline_stages(name)
          `)
          .order('created_at', { ascending: false })

        if (dealsError) {
          console.error('Error loading opportunities:', dealsError)
        } else if (dealsData) {
          const mappedDeals: Deal[] = dealsData.map(opp => ({
            id: opp.id,
            title: opp.name,
            contactId: opp.lead_id || '',
            contactName: opp.lead ? `${opp.lead.first_name} ${opp.lead.last_name}` : 'N/A',
            value: parseFloat(opp.value) || 0,
            stage: opp.stage?.name || opp.status,
            probability: parseFloat(opp.probability) || 0,
            expectedCloseDate: opp.expected_close_date || '',
            assignedTo: opp.owner_persona_id || 'Sistema',
            notes: opp.description || '',
            activities: []
          }))
          setDeals(mappedDeals)
        }

        // Load activities from crm_activities table
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('crm_activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (activitiesError) {
          console.error('Error loading activities:', activitiesError)
        } else if (activitiesData) {
          const mappedActivities: Activity[] = activitiesData.map(act => ({
            id: act.id,
            type: act.type as Activity['type'],
            subject: act.subject,
            description: act.description || '',
            contactId: act.lead_id || '',
            dealId: act.opportunity_id,
            completedAt: act.completed_at,
            scheduledFor: act.due_date,
            assignedTo: act.persona_id || 'Sistema',
            createdAt: act.created_at
          }))
          setActivities(mappedActivities)
        }
        
        console.log('CRM System: Dados carregados do Supabase com sucesso')
      } catch (error) {
        console.error('Error loading CRM data:', error)
      }
    }
    
    loadData()
  }, [])

  const getStatusBadge = (status: Contact['status']) => {
    const statusConfig = {
      lead: { color: 'bg-blue-100 text-blue-800', label: 'Lead' },
      prospect: { color: 'bg-yellow-100 text-yellow-800', label: 'Prospect' },
      customer: { color: 'bg-green-100 text-green-800', label: 'Cliente' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inativo' }
    }
    
    const config = statusConfig[status]
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getStageBadge = (stage: Deal['stage']) => {
    const stageConfig = {
      prospecting: { color: 'bg-blue-100 text-blue-800', label: 'Prospecção' },
      qualification: { color: 'bg-purple-100 text-purple-800', label: 'Qualificação' },
      proposal: { color: 'bg-yellow-100 text-yellow-800', label: 'Proposta' },
      negotiation: { color: 'bg-orange-100 text-orange-800', label: 'Negociação' },
      'closed-won': { color: 'bg-green-100 text-green-800', label: 'Fechado (Ganho)' },
      'closed-lost': { color: 'bg-red-100 text-red-800', label: 'Fechado (Perdido)' }
    }
    
    const config = stageConfig[stage]
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = `${contact.firstName} ${contact.lastName} ${contact.email} ${contact.company}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || contact.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const totalDealsValue = deals.reduce((sum, deal) => sum + deal.value, 0)
  const avgLeadScore = contacts.length > 0 ? contacts.reduce((sum, contact) => sum + contact.leadScore, 0) / contacts.length : 0

  const handleAddContact = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseKey)

      const formData = new FormData(document.querySelector('form') as HTMLFormElement)
      
      const { data, error } = await supabase
        .from('crm_leads')
        .insert([{
          first_name: formData.get('firstName') as string,
          last_name: formData.get('lastName') as string,
          full_name: `${formData.get('firstName')} ${formData.get('lastName')}`,
          email: formData.get('email') as string,
          phone: formData.get('phone') as string,
          company: formData.get('company') as string,
          position: formData.get('position') as string,
          lead_score: parseInt(formData.get('leadScore') as string) || 0,
          status: formData.get('status') as string,
          source: formData.get('source') as string,
          owner_persona_id: formData.get('assignedTo') as string,
          notes: formData.get('notes') as string,
          tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t)
        }])
        .select()

      if (error) throw error

      if (data && data[0]) {
        const newContact: Contact = {
          id: data[0].id,
          firstName: data[0].first_name,
          lastName: data[0].last_name,
          email: data[0].email,
          phone: data[0].phone,
          company: data[0].company,
          position: data[0].position,
          leadScore: data[0].lead_score,
          status: data[0].status,
          source: data[0].source,
          assignedTo: data[0].owner_persona_id,
          lastContact: data[0].created_at,
          notes: data[0].notes,
          tags: data[0].tags,
          createdAt: data[0].created_at
        }
        setContacts([newContact, ...contacts])
        setIsContactModalOpen(false)
        console.log('Novo contato salvo no Supabase:', newContact)
      }
    } catch (error) {
      console.error('Erro ao adicionar contato:', error)
      alert('Erro ao salvar contato')
    }
  }

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact)
    setIsContactModalOpen(true)
  }

  const handleDeleteContact = (contactId: string) => {
    setContacts(contacts.filter(c => c.id !== contactId))
    console.log('Contato removido:', contactId)
  }

  const handleAddDeal = () => {
    const newDeal: Deal = {
      id: Date.now().toString(),
      title: 'Nova Oportunidade',
      contactId: contacts[0]?.id || '',
      contactName: contacts[0]?.firstName + ' ' + contacts[0]?.lastName || 'Cliente',
      value: 10000,
      stage: 'prospecting',
      probability: 25,
      expectedCloseDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      assignedTo: 'Sistema',
      notes: 'Oportunidade criada pelo sistema',
      activities: []
    }
    setDeals([...deals, newDeal])
    setIsDealModalOpen(false)
    console.log('Nova oportunidade adicionada:', newDeal)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sistema CRM</h2>
          <p className="text-muted-foreground">
            Gerencie contatos, leads e oportunidades de negócio
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleAddDeal} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Nova Oportunidade
          </Button>
          <Button onClick={() => setIsContactModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Contato
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">
              +{contacts.filter(c => new Date(c.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total em Negociação</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalDealsValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {deals.length} oportunidades ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Médio de Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLeadScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              De 100 pontos possíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atividades Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => a.scheduledFor && !a.completedAt).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Para os próximos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="deals">Oportunidades</TabsTrigger>
          <TabsTrigger value="activities">Atividades</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 muted-foreground" />
                <Input 
                  placeholder="Buscar contatos..." 
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="lead">Leads</SelectItem>
                <SelectItem value="prospect">Prospects</SelectItem>
                <SelectItem value="customer">Clientes</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold">{contact.firstName} {contact.lastName}</h3>
                          <p className="text-muted-foreground">{contact.position} at {contact.company}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(contact.status)}
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{contact.leadScore}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                          {contact.email}
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                          {contact.phone}
                        </div>
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-2 text-muted-foreground" />
                          {contact.company}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                          Última conversa: {new Date(contact.lastContact).toLocaleDateString('pt-BR')}
                        </div>
                      </div>

                      {contact.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {contact.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {contact.notes && (
                        <p className="mt-3 text-sm text-muted-foreground">{contact.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedContact(contact)
                          setIsContactModalOpen(true)
                        }}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          if (confirm(`Deseja realmente deletar o contato ${contact.firstName} ${contact.lastName}?`)) {
                            setContacts(contacts.filter(c => c.id !== contact.id))
                            // Also remove related deals and activities
                            setDeals(deals.filter(d => d.contactId !== contact.id))
                            setActivities(activities.filter(a => a.contactId !== contact.id))
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Deletar
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Contato
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="space-y-4">
          <div className="grid gap-4">
            {deals.map((deal) => (
              <Card key={deal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{deal.title}</CardTitle>
                      <CardDescription>{deal.contactName}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStageBadge(deal.stage)}
                      <div className="text-right">
                        <div className="font-semibold">R$ {deal.value.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">{deal.probability}% prob.</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Responsável</div>
                      <div className="font-medium">{deal.assignedTo}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Fechamento Esperado</div>
                      <div className="font-medium">{new Date(deal.expectedCloseDate).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Valor Esperado</div>
                      <div className="font-medium">R$ {(deal.value * deal.probability / 100).toLocaleString()}</div>
                    </div>
                  </div>
                  {deal.notes && (
                    <p className="mt-3 text-sm text-muted-foreground">{deal.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <div className="space-y-4">
            {activities.map((activity) => {
              const contact = contacts.find(c => c.id === activity.contactId)
              const isCompleted = !!activity.completedAt
              const isOverdue = activity.scheduledFor && new Date(activity.scheduledFor) < new Date() && !isCompleted

              return (
                <Card key={activity.id} className={isOverdue ? 'border-red-200 bg-red-50' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-yellow-500'}`} />
                          <h4 className="font-medium">{activity.subject}</h4>
                          <Badge variant="outline" className="text-xs capitalize">
                            {activity.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <span>Contato: {contact?.firstName} {contact?.lastName}</span>
                          <span>Responsável: {activity.assignedTo}</span>
                          {activity.completedAt && (
                            <span>Concluído: {new Date(activity.completedAt).toLocaleDateString('pt-BR')}</span>
                          )}
                          {activity.scheduledFor && !activity.completedAt && (
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              Agendado: {new Date(activity.scheduledFor).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
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

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline de Vendas</CardTitle>
              <CardDescription>Visualização do funil de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4">
                {['prospecting', 'qualification', 'proposal', 'negotiation', 'closed-won', 'closed-lost'].map((stage) => {
                  const stageDeals = deals.filter(deal => deal.stage === stage)
                  const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0)
                  
                  return (
                    <div key={stage} className="text-center">
                      <div className="font-medium text-sm mb-2 capitalize">
                        {stage.replace('-', ' ')}
                      </div>
                      <div className="text-lg font-bold">R$ {stageValue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{stageDeals.length} deals</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Management Modal - Functional CRUD Implementation */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedContact ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
            <DialogDescription>
              {selectedContact ? 'Atualize as informações do contato' : 'Adicione um novo contato ao CRM'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const contactData: Partial<Contact> = {
              firstName: formData.get('firstName') as string,
              lastName: formData.get('lastName') as string,
              email: formData.get('email') as string,
              phone: formData.get('phone') as string,
              company: formData.get('company') as string,
              position: formData.get('position') as string,
              leadScore: parseInt(formData.get('leadScore') as string) || 0,
              status: formData.get('status') as Contact['status'],
              source: formData.get('source') as string,
              assignedTo: formData.get('assignedTo') as string,
              notes: formData.get('notes') as string,
              tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t)
            }
            
            if (selectedContact) {
              // Update existing contact
              const updatedContacts = contacts.map(c => 
                c.id === selectedContact.id ? { ...selectedContact, ...contactData } : c
              )
              setContacts(updatedContacts)
            } else {
              // Create new contact
              const newContact: Contact = {
                id: Date.now().toString(),
                ...contactData as Contact,
                createdAt: new Date().toISOString(),
                lastContact: new Date().toISOString()
              }
              setContacts([...contacts, newContact])
            }
            
            setIsContactModalOpen(false)
            setSelectedContact(null)
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome</Label>
                <Input 
                  id="firstName" 
                  name="firstName" 
                  defaultValue={selectedContact?.firstName || ''}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input 
                  id="lastName" 
                  name="lastName" 
                  defaultValue={selectedContact?.lastName || ''}
                  required 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  defaultValue={selectedContact?.email || ''}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  defaultValue={selectedContact?.phone || ''}
                  placeholder="+55 11 99999-9999"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input 
                  id="company" 
                  name="company" 
                  defaultValue={selectedContact?.company || ''}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input 
                  id="position" 
                  name="position" 
                  defaultValue={selectedContact?.position || ''}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadScore">Lead Score</Label>
                <Input 
                  id="leadScore" 
                  name="leadScore" 
                  type="number" 
                  min="0" 
                  max="100"
                  defaultValue={selectedContact?.leadScore || 0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={selectedContact?.status || 'lead'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Origem</Label>
                <Select name="source" defaultValue={selectedContact?.source || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Origem do lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Referral">Indicação</SelectItem>
                    <SelectItem value="Event">Evento</SelectItem>
                    <SelectItem value="Cold Call">Cold Call</SelectItem>
                    <SelectItem value="Social Media">Redes Sociais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Responsável</Label>
              <Select name="assignedTo" defaultValue={selectedContact?.assignedTo || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ana Costa">Ana Costa</SelectItem>
                  <SelectItem value="Carlos Lima">Carlos Lima</SelectItem>
                  <SelectItem value="Maria Silva">Maria Silva</SelectItem>
                  <SelectItem value="João Santos">João Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input 
                id="tags" 
                name="tags" 
                defaultValue={selectedContact?.tags?.join(', ') || ''}
                placeholder="hot-lead, enterprise, tech"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                defaultValue={selectedContact?.notes || ''}
                placeholder="Adicione observações sobre este contato..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsContactModalOpen(false)
                setSelectedContact(null)
              }}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleAddContact}>
                {selectedContact ? 'Atualizar Contato' : 'Criar Contato'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deal Management Modal - Functional CRUD Implementation */}
      <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Oportunidade</DialogTitle>
            <DialogDescription>Crie uma nova oportunidade de negócio</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            const dealData: Omit<Deal, 'id' | 'activities'> = {
              title: formData.get('title') as string,
              contactId: formData.get('contactId') as string,
              contactName: contacts.find(c => c.id === formData.get('contactId'))?.firstName + ' ' + 
                          contacts.find(c => c.id === formData.get('contactId'))?.lastName || '',
              value: parseFloat(formData.get('value') as string) || 0,
              stage: formData.get('stage') as Deal['stage'],
              probability: parseInt(formData.get('probability') as string) || 0,
              expectedCloseDate: formData.get('expectedCloseDate') as string,
              assignedTo: formData.get('assignedTo') as string,
              notes: formData.get('notes') as string
            }
            
            const newDeal: Deal = {
              id: Date.now().toString(),
              ...dealData,
              activities: []
            }
            
            setDeals([...deals, newDeal])
            setIsDealModalOpen(false)
          }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Oportunidade</Label>
              <Input 
                id="title" 
                name="title" 
                placeholder="Ex: Automação Tech Solutions"
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactId">Contato</Label>
                <Select name="contactId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map(contact => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.firstName} {contact.lastName} - {contact.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor (R$)</Label>
                <Input 
                  id="value" 
                  name="value" 
                  type="number" 
                  min="0" 
                  step="0.01"
                  placeholder="50000.00"
                  required 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Estágio</Label>
                <Select name="stage" defaultValue="prospecting">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estágio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospecting">Prospecção</SelectItem>
                    <SelectItem value="qualification">Qualificação</SelectItem>
                    <SelectItem value="proposal">Proposta</SelectItem>
                    <SelectItem value="negotiation">Negociação</SelectItem>
                    <SelectItem value="closed-won">Fechado (Ganho)</SelectItem>
                    <SelectItem value="closed-lost">Fechado (Perdido)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="probability">Probabilidade (%)</Label>
                <Input 
                  id="probability" 
                  name="probability" 
                  type="number" 
                  min="0" 
                  max="100"
                  placeholder="75"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expectedCloseDate">Data Prevista</Label>
                <Input 
                  id="expectedCloseDate" 
                  name="expectedCloseDate" 
                  type="date"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Responsável</Label>
                <Select name="assignedTo" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ana Costa">Ana Costa</SelectItem>
                    <SelectItem value="Carlos Lima">Carlos Lima</SelectItem>
                    <SelectItem value="Maria Silva">Maria Silva</SelectItem>
                    <SelectItem value="João Santos">João Santos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                placeholder="Detalhes sobre a oportunidade..."
                rows={3}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDealModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Oportunidade
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}