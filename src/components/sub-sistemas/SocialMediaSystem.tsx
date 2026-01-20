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
import { 
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Calendar,
  Image,
  BarChart3,
  Users,
  Heart,
  MessageCircle,
  Share,
  Eye,
  TrendingUp,
  Clock,
  Plus,
  Upload,
  Settings,
  Zap
} from 'lucide-react'

interface SocialPost {
  id: string
  content: string
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube'
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  scheduledFor?: string
  publishedAt?: string
  imageUrl?: string
  videoUrl?: string
  hashtags: string[]
  engagement: {
    likes: number
    comments: number
    shares: number
    views: number
  }
  campaignId?: string
  createdAt: string
  createdBy: string
}

interface SocialCampaign {
  id: string
  name: string
  description: string
  platforms: string[]
  startDate: string
  endDate: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  budget?: number
  targetAudience: string
  objective: 'awareness' | 'engagement' | 'traffic' | 'leads' | 'sales'
  posts: number
  totalReach: number
  totalEngagement: number
  createdBy: string
}

interface PlatformAccount {
  platform: string
  accountName: string
  accountId: string
  followers: number
  isConnected: boolean
  lastSync: string
  profileImage?: string
}

interface ContentIdea {
  id: string
  title: string
  description: string
  category: 'educational' | 'promotional' | 'entertainment' | 'news' | 'behind-scenes'
  platforms: string[]
  priority: 'low' | 'medium' | 'high'
  status: 'idea' | 'in-progress' | 'review' | 'approved' | 'published'
  assignedTo?: string
  dueDate?: string
  createdAt: string
}

export default function SocialMediaSystem() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([])
  const [accounts, setAccounts] = useState<PlatformAccount[]>([])
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Load social posts
        const { data: postsData, error: postsError } = await supabase
          .from('social_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (postsError) {
          console.error('Error loading social posts:', postsError)
        } else if (postsData) {
          const mappedPosts: SocialPost[] = postsData.map(post => ({
            id: post.id,
            content: post.content || '',
            platform: post.platform as SocialPost['platform'],
            status: (post.status || 'draft') as SocialPost['status'],
            scheduledFor: post.scheduled_for || undefined,
            publishedAt: post.published_at || undefined,
            imageUrl: post.image_url || undefined,
            videoUrl: post.video_url || undefined,
            hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
            engagement: {
              likes: post.likes || 0,
              comments: post.comments || 0,
              shares: post.shares || 0,
              views: post.views || 0
            },
            campaignId: post.campaign_id || undefined,
            createdAt: post.created_at,
            createdBy: post.created_by_persona_id || 'Sistema'
          }))
          setPosts(mappedPosts)
        }

        // Load social campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('social_campaigns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (campaignsError) {
          console.error('Error loading social campaigns:', campaignsError)
        } else if (campaignsData) {
          const mappedCampaigns: SocialCampaign[] = campaignsData.map(campaign => ({
            id: campaign.id,
            name: campaign.name,
            description: campaign.description || '',
            platforms: Array.isArray(campaign.platforms) ? campaign.platforms : [],
            startDate: campaign.start_date,
            endDate: campaign.end_date,
            status: (campaign.status || 'draft') as SocialCampaign['status'],
            budget: parseFloat(campaign.budget) || undefined,
            targetAudience: campaign.target_audience || '',
            objective: (campaign.objective || 'awareness') as SocialCampaign['objective'],
            posts: campaign.posts_count || 0,
            totalReach: campaign.total_reach || 0,
            totalEngagement: campaign.total_engagement || 0,
            createdBy: campaign.created_by_persona_id || 'Sistema'
          }))
          setCampaigns(mappedCampaigns)
        }

        // Load social accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from('social_accounts')
          .select('*')
          .order('platform')

        if (accountsError) {
          console.error('Error loading social accounts:', accountsError)
        } else if (accountsData) {
          const mappedAccounts: PlatformAccount[] = accountsData.map(account => ({
            platform: account.platform,
            accountName: account.account_name,
            accountId: account.account_id,
            followers: account.followers_count || 0,
            isConnected: account.is_connected || false,
            lastSync: account.last_synced_at || account.created_at,
            profileImage: account.profile_image_url || undefined
          }))
          setAccounts(mappedAccounts)
        }

        console.log('Social Media System: Dados carregados do Supabase com sucesso')
      } catch (error) {
        console.error('Error loading social media data:', error)
      }
    }

    loadData()
  }, [])

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: <Facebook className="w-4 h-4 text-blue-600" />,
      instagram: <Instagram className="w-4 h-4 text-pink-600" />,
      twitter: <Twitter className="w-4 h-4 text-blue-400" />,
      linkedin: <Linkedin className="w-4 h-4 text-blue-700" />,
      youtube: <Youtube className="w-4 h-4 text-red-600" />
    }
    return icons[platform as keyof typeof icons] || null
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Rascunho' },
      scheduled: { color: 'bg-blue-100 text-blue-800', label: 'Agendado' },
      published: { color: 'bg-green-100 text-green-800', label: 'Publicado' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Falhou' },
      active: { color: 'bg-green-100 text-green-800', label: 'Ativa' },
      paused: { color: 'bg-yellow-100 text-yellow-800', label: 'Pausada' },
      completed: { color: 'bg-blue-100 text-blue-800', label: 'Concluída' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig]
    return config ? <Badge className={config.color}>{config.label}</Badge> : null
  }

  const totalFollowers = accounts.reduce((sum, acc) => sum + acc.followers, 0)
  const connectedAccounts = accounts.filter(acc => acc.isConnected).length
  const totalEngagement = posts.reduce((sum, post) => 
    sum + post.engagement.likes + post.engagement.comments + post.engagement.shares, 0
  )

  const filteredPosts = selectedPlatform === 'all' 
    ? posts 
    : posts.filter(post => post.platform === selectedPlatform)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sistema de Gestão de Mídias Sociais</h2>
          <p className="text-muted-foreground">
            Gerencie posts, campanhas e engagement em todas as plataformas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Post
          </Button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Seguidores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFollowers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {connectedAccounts}/{accounts.length} contas conectadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Total</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Publicados</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {posts.filter(p => p.status === 'published').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campanhas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Em andamento
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="accounts">Contas</TabsTrigger>
          <TabsTrigger value="content-ideas">Ideias de Conteúdo</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as plataformas</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="twitter">Twitter</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {post.imageUrl && (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getPlatformIcon(post.platform)}
                        <span className="font-medium capitalize">{post.platform}</span>
                        {getStatusBadge(post.status)}
                        <span className="text-sm text-muted-foreground">
                          por {post.createdBy}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-3 line-clamp-2">{post.content}</p>
                      
                      {post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.hashtags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {post.status === 'published' && (
                          <>
                            <div className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              {post.engagement.likes}
                            </div>
                            <div className="flex items-center">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              {post.engagement.comments}
                            </div>
                            <div className="flex items-center">
                              <Share className="w-4 h-4 mr-1" />
                              {post.engagement.shares}
                            </div>
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {post.engagement.views}
                            </div>
                          </>
                        )}
                        
                        {post.status === 'scheduled' && post.scheduledFor && (
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Agendado para: {new Date(post.scheduledFor).toLocaleDateString('pt-BR')} às {new Date(post.scheduledFor).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        
                        {post.status === 'published' && post.publishedAt && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Publicado em: {new Date(post.publishedAt).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>{campaign.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(campaign.status)}
                      <Badge variant="outline" className="capitalize">
                        {campaign.objective}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {campaign.platforms.map(platform => getPlatformIcon(platform))}
                    <span className="text-sm text-muted-foreground">
                      {campaign.platforms.join(', ')}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Posts</div>
                      <div className="font-medium">{campaign.posts}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Alcance Total</div>
                      <div className="font-medium">{campaign.totalReach.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Engagement</div>
                      <div className="font-medium">{campaign.totalEngagement.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Período</div>
                      <div className="font-medium">
                        {new Date(campaign.startDate).toLocaleDateString('pt-BR')} - 
                        {new Date(campaign.endDate).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {campaign.budget && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Budget: </span>
                      <span className="font-medium">R$ {campaign.budget.toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <Card key={account.platform}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getPlatformIcon(account.platform)}
                      <div>
                        <div className="font-medium">{account.accountName}</div>
                        <div className="text-sm text-muted-foreground">{account.accountId}</div>
                      </div>
                    </div>
                    <Switch checked={account.isConnected} />
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Seguidores</div>
                      <div className="font-medium">{account.followers.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Última Sync</div>
                      <div className="font-medium text-xs">
                        {new Date(account.lastSync).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm" disabled={!account.isConnected}>
                      <Zap className="w-4 h-4 mr-1" />
                      Sincronizar
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

        <TabsContent value="content-ideas" className="space-y-4">
          <div className="space-y-4">
            {contentIdeas.map((idea) => (
              <Card key={idea.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium">{idea.title}</h3>
                        <Badge variant="outline" className={`capitalize ${
                          idea.priority === 'high' ? 'border-red-200 text-red-800' :
                          idea.priority === 'medium' ? 'border-yellow-200 text-yellow-800' :
                          'border-gray-200 text-gray-800'
                        }`}>
                          {idea.priority}
                        </Badge>
                        {getStatusBadge(idea.status)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          {idea.platforms.map(platform => getPlatformIcon(platform))}
                        </div>
                        
                        {idea.assignedTo && (
                          <span>Responsável: {idea.assignedTo}</span>
                        )}
                        
                        {idea.dueDate && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Entrega: {new Date(idea.dueDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button size="sm">
                        Criar Post
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.filter(acc => acc.isConnected).map(account => {
                    const platformPosts = posts.filter(p => p.platform === account.platform && p.status === 'published')
                    const totalEngagement = platformPosts.reduce((sum, post) => 
                      sum + post.engagement.likes + post.engagement.comments + post.engagement.shares, 0
                    )
                    
                    return (
                      <div key={account.platform} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getPlatformIcon(account.platform)}
                          <span className="capitalize">{account.platform}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{totalEngagement} interações</div>
                          <div className="text-sm text-muted-foreground">{platformPosts.length} posts</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crescimento de Seguidores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalFollowers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total de seguidores</div>
                  <div className="text-sm text-green-600 mt-2">
                    <TrendingUp className="w-4 h-4 inline mr-1" />
                    +12% este mês
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