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
import { Mail, Send, Inbox, Archive, Star, Trash2, Filter, Search, Plus, Settings } from 'lucide-react'

interface EmailCampaign {
  id: string
  name: string
  subject: string
  status: 'draft' | 'scheduled' | 'sent' | 'active'
  recipients: number
  openRate: number
  clickRate: number
  createdAt: string
  scheduledFor?: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  category: 'welcome' | 'newsletter' | 'promotion' | 'follow-up' | 'notification'
  variables: string[]
}

interface EmailConfig {
  smtpProvider: string
  apiKey: string
  fromEmail: string
  fromName: string
  replyTo: string
  trackingEnabled: boolean
  autoResponderEnabled: boolean
}

export default function EmailManagementSystem() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [config, setConfig] = useState<EmailConfig>({
    smtpProvider: '',
    apiKey: '',
    fromEmail: '',
    fromName: '',
    replyTo: '',
    trackingEnabled: true,
    autoResponderEnabled: false
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Load email campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('email_campaigns')
          .select('*')
          .order('created_at', { ascending: false })

        if (campaignsError) {
          console.error('Error loading campaigns:', campaignsError)
        } else if (campaignsData) {
          const mappedCampaigns: EmailCampaign[] = campaignsData.map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            subject: campaign.subject_line,
            status: (campaign.status || 'draft') as EmailCampaign['status'],
            recipients: campaign.recipients_count || 0,
            openRate: parseFloat(campaign.open_rate) || 0,
            clickRate: parseFloat(campaign.click_rate) || 0,
            createdAt: campaign.created_at,
            scheduledFor: campaign.scheduled_at || undefined
          }))
          setCampaigns(mappedCampaigns)
        }

        // Load email templates
        const { data: templatesData, error: templatesError } = await supabase
          .from('email_templates')
          .select('*')
          .order('name')

        if (templatesError) {
          console.error('Error loading templates:', templatesError)
        } else if (templatesData) {
          const mappedTemplates: EmailTemplate[] = templatesData.map(template => ({
            id: template.id,
            name: template.name,
            subject: template.subject_line,
            content: template.content_html || template.content_text || '',
            category: (template.category || 'notification') as EmailTemplate['category'],
            variables: Array.isArray(template.variables) ? template.variables : []
          }))
          setTemplates(mappedTemplates)
        }

        console.log('Email System: Dados carregados do Supabase com sucesso')
      } catch (error) {
        console.error('Error loading email data:', error)
      }
    }

    loadData()
  }, [])

  const getStatusBadge = (status: EmailCampaign['status']) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Agendado' },
      sent: { color: 'bg-green-100 text-green-800', label: 'Enviado' },
      active: { color: 'bg-orange-100 text-orange-800', label: 'Ativo' }
    }
    
    const config = statusConfig[status]
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const handleCreateCampaign = () => {
    // TODO: Implement campaign creation
    console.log('Create new campaign')
  }

  const handleCreateTemplate = () => {
    // TODO: Implement template creation
    console.log('Create new template')
  }

  const handleSaveConfig = async () => {
    setLoading(true)
    try {
      // TODO: Save email configuration to database
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log('Config saved:', config)
    } catch (error) {
      console.error('Error saving config:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sistema de Gestão de Email</h2>
          <p className="text-muted-foreground">
            Gerencie campanhas, templates e configurações de email
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleCreateTemplate} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
          <Button onClick={handleCreateCampaign}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 muted-foreground" />
                <Input placeholder="Buscar campanhas..." className="pl-8" />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>{campaign.subject}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(campaign.status)}
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Destinatários</div>
                      <div className="text-2xl font-bold">{campaign.recipients.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Taxa de Abertura</div>
                      <div className="text-2xl font-bold text-green-600">{campaign.openRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Taxa de Clique</div>
                      <div className="text-2xl font-bold text-blue-600">{campaign.clickRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Criado em</div>
                      <div className="text-lg">{new Date(campaign.createdAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                  {campaign.scheduledFor && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          Agendado para: {new Date(campaign.scheduledFor).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.subject}</CardDescription>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Conteúdo</Label>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                        {template.content}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Variáveis</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
                <p className="text-xs text-muted-foreground">
                  +2 desde o mês passado
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Média de Abertura</CardTitle>
                <Inbox className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">56.9%</div>
                <p className="text-xs text-muted-foreground">
                  +4.1% desde o mês passado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">9,670</div>
                <p className="text-xs text-muted-foreground">
                  +12% desde o mês passado
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance das Campanhas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Gráfico de performance das campanhas seria implementado aqui com uma biblioteca como Chart.js ou Recharts
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email</CardTitle>
              <CardDescription>
                Configure as integrações e preferências do sistema de email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpProvider">Provedor SMTP</Label>
                  <Select value={config.smtpProvider} onValueChange={(value) => setConfig({...config, smtpProvider: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailchimp">Mailchimp</SelectItem>
                      <SelectItem value="amazonses">Amazon SES</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                    placeholder="Chave da API"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email Remetente</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={config.fromEmail}
                    onChange={(e) => setConfig({...config, fromEmail: e.target.value})}
                    placeholder="noreply@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromName">Nome Remetente</Label>
                  <Input
                    id="fromName"
                    value={config.fromName}
                    onChange={(e) => setConfig({...config, fromName: e.target.value})}
                    placeholder="Empresa Ltda"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="replyTo">Email para Resposta</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    value={config.replyTo}
                    onChange={(e) => setConfig({...config, replyTo: e.target.value})}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button onClick={handleSaveConfig} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}