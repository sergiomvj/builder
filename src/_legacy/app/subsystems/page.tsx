'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Users,
  BarChart3,
  Building2,
  FileText,
  Headphones,
  Mail,
  ShoppingCart,
  DollarSign,
  Target,
  Share2,
  Bot,
  TrendingUp,
  Search,
  Settings,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Camera
} from 'lucide-react';

// 🚀 LAZY LOADING - Carregar sub-sistemas apenas quando necessário
const CRMSystem = dynamic(() => import('@/components/sub-sistemas/CRMSystem'), {
  loading: () => <div className="p-8 text-center">Carregando CRM System...</div>
});
const AnalyticsReportingSystem = dynamic(() => import('@/components/sub-sistemas/AnalyticsReportingSystem'), {
  loading: () => <div className="p-8 text-center">Carregando Analytics...</div>
});
const BusinessIntelligenceSystem = dynamic(() => import('@/components/sub-sistemas/BusinessIntelligenceSystem'), {
  loading: () => <div className="p-8 text-center">Carregando BI System...</div>
});
const ContentCreationSystem = dynamic(() => import('@/components/sub-sistemas/ContentCreationSystem'), {
  loading: () => <div className="p-8 text-center">Carregando Content Creation...</div>
});
const CustomerSupportSystem = dynamic(() => import('@/components/sub-sistemas/CustomerSupportSystem'), {
  loading: () => <div className="p-8 text-center">Carregando Customer Support...</div>
});
const EcommerceSystem = dynamic(() => import('@/components/sub-sistemas/EcommerceSystem'), {
  loading: () => <div className="p-8 text-center">Carregando E-commerce...</div>
});
const EmailManagementSystem = dynamic(() => import('@/components/sub-sistemas/EmailManagementSystem'), {
  loading: () => <div className="p-8 text-center">Carregando Email Management...</div>
});
const FinancialSystem = dynamic(() => import('@/components/sub-sistemas/FinancialSystem'), {
  loading: () => <div className="p-8 text-center">Carregando Financial System...</div>
});
const HREmployeeManagementSystem = dynamic(() => import('@/components/sub-sistemas/HREmployeeManagementSystem'), {
  loading: () => <div className="p-8 text-center">Carregando HR System...</div>
});
const SDRLeadGenSystem = dynamic(() => import('@/components/sub-sistemas/SDRLeadGenSystem'), {
  loading: () => <div className="p-8 text-center">Carregando SDR Lead Gen...</div>
});
const SocialMediaSystem = dynamic(() => import('@/components/sub-sistemas/SocialMediaSystem'), {
  loading: () => <div className="p-8 text-center">Carregando Social Media...</div>
});
const AIAssistantSystem = dynamic(() => import('@/components/sub-sistemas/AIAssistantSystem'), {
  loading: () => <div className="p-8 text-center">Carregando AI Assistant...</div>
});
const AvatarAdvancedSystem = dynamic(() => import('@/components/sub-sistemas/AvatarAdvancedSystem'), {
  loading: () => <div className="p-8 text-center">Carregando Avatar System...</div>
});

interface SubsystemInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'development' | 'maintenance';
  category: 'sales' | 'marketing' | 'finance' | 'hr' | 'support' | 'analytics' | 'ai';
  component: React.ComponentType;
  features: string[];
  metrics: {
    users: number;
    lastUpdate: string;
    uptime: number;
  };
}

const subsystems: SubsystemInfo[] = [
  {
    id: 'crm',
    name: 'CRM System',
    description: 'Gestão completa de relacionamento com clientes, leads e oportunidades',
    icon: <Target className="h-6 w-6" />,
    status: 'active',
    category: 'sales',
    component: CRMSystem,
    features: ['Gestão de Contatos', 'Pipeline de Vendas', 'Atividades', 'Relatórios'],
    metrics: { users: 12, lastUpdate: '2024-11-19', uptime: 99.2 }
  },
  {
    id: 'analytics',
    name: 'Analytics & Reporting',
    description: 'Sistema avançado de análise de dados e relatórios personalizados',
    icon: <BarChart3 className="h-6 w-6" />,
    status: 'active',
    category: 'analytics',
    component: AnalyticsReportingSystem,
    features: ['Dashboards', 'KPIs', 'Relatórios', 'Metas'],
    metrics: { users: 8, lastUpdate: '2024-11-19', uptime: 98.5 }
  },
  {
    id: 'business-intelligence',
    name: 'Business Intelligence',
    description: 'Inteligência empresarial e análise estratégica avançada',
    icon: <Building2 className="h-6 w-6" />,
    status: 'active',
    category: 'analytics',
    component: BusinessIntelligenceSystem,
    features: ['Data Mining', 'Análise Preditiva', 'Insights', 'Business Intelligence'],
    metrics: { users: 5, lastUpdate: '2024-11-19', uptime: 97.8 }
  },
  {
    id: 'sdr-leadgen',
    name: 'SDR & Lead Generation',
    description: 'Sistema automatizado de geração e qualificação de leads',
    icon: <Users className="h-6 w-6" />,
    status: 'active',
    category: 'sales',
    component: SDRLeadGenSystem,
    features: ['Prospecção', 'Qualificação', 'Cadência', 'Follow-up'],
    metrics: { users: 6, lastUpdate: '2024-11-19', uptime: 96.3 }
  },
  {
    id: 'social-media',
    name: 'Social Media Management',
    description: 'Gestão completa de redes sociais e marketing digital',
    icon: <Share2 className="h-6 w-6" />,
    status: 'active',
    category: 'marketing',
    component: SocialMediaSystem,
    features: ['Posts Programados', 'Analytics Sociais', 'Campanhas', 'Engagement'],
    metrics: { users: 4, lastUpdate: '2024-11-19', uptime: 98.1 }
  },
  {
    id: 'content-creation',
    name: 'Content Creation',
    description: 'Sistema de criação e gestão de conteúdo automatizada',
    icon: <FileText className="h-6 w-6" />,
    status: 'active',
    category: 'marketing',
    component: ContentCreationSystem,
    features: ['Geração AI', 'Calendário Editorial', 'SEO', 'Templates'],
    metrics: { users: 7, lastUpdate: '2024-11-19', uptime: 94.7 }
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Sistema completo de atendimento e suporte ao cliente',
    icon: <Headphones className="h-6 w-6" />,
    status: 'active',
    category: 'support',
    component: CustomerSupportSystem,
    features: ['Tickets', 'Chat', 'Base de Conhecimento', 'SLA'],
    metrics: { users: 9, lastUpdate: '2024-11-19', uptime: 99.5 }
  },
  {
    id: 'email-management',
    name: 'Email Management',
    description: 'Sistema de gestão e automação de emails marketing',
    icon: <Mail className="h-6 w-6" />,
    status: 'active',
    category: 'marketing',
    component: EmailManagementSystem,
    features: ['Campanhas', 'Automação', 'Segmentação', 'A/B Testing'],
    metrics: { users: 5, lastUpdate: '2024-11-19', uptime: 97.2 }
  },
  {
    id: 'financial',
    name: 'Financial System',
    description: 'Sistema financeiro completo com controle de orçamento e relatórios',
    icon: <DollarSign className="h-6 w-6" />,
    status: 'active',
    category: 'finance',
    component: FinancialSystem,
    features: ['Contas', 'Transações', 'Orçamentos', 'Relatórios Financeiros'],
    metrics: { users: 3, lastUpdate: '2024-11-19', uptime: 99.8 }
  },
  {
    id: 'hr-employee',
    name: 'HR & Employee Management',
    description: 'Sistema de gestão de recursos humanos e funcionários',
    icon: <Users className="h-6 w-6" />,
    status: 'active',
    category: 'hr',
    component: HREmployeeManagementSystem,
    features: ['Funcionários', 'Departamentos', 'Folha de Pagamento', 'Avaliações'],
    metrics: { users: 4, lastUpdate: '2024-11-19', uptime: 98.9 }
  },
  {
    id: 'ecommerce',
    name: 'E-commerce System',
    description: 'Plataforma completa de comércio eletrônico',
    icon: <ShoppingCart className="h-6 w-6" />,
    status: 'development',
    category: 'sales',
    component: EcommerceSystem,
    features: ['Produtos', 'Pedidos', 'Clientes', 'Pagamentos'],
    metrics: { users: 2, lastUpdate: '2024-11-19', uptime: 95.1 }
  },
  {
    id: 'avatar-advanced',
    name: 'Avatar System',
    description: 'Sistema avançado de geração de avatares com Google Nano Banana AI',
    icon: <Camera className="h-6 w-6" />,
    status: 'active',
    category: 'ai',
    component: AvatarAdvancedSystem,
    features: ['Geração Individual', 'Cenários Múltiplos', 'Grupos', 'Google Nano Banana AI'],
    metrics: { users: 8, lastUpdate: '2024-11-21', uptime: 99.1 }
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant System',
    description: 'Sistema de assistente AI para automação e suporte inteligente',
    icon: <Bot className="h-6 w-6" />,
    status: 'active',
    category: 'ai',
    component: AIAssistantSystem,
    features: ['Chat AI', 'Automação', 'Análise Preditiva', 'Workflows'],
    metrics: { users: 15, lastUpdate: '2024-11-19', uptime: 96.7 }
  }
];

export default function SubsystemsPage() {
  const [selectedSystem, setSelectedSystem] = useState<SubsystemInfo | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>;
      case 'development':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Desenvolvimento</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Manutenção</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return <Target className="h-4 w-4" />;
      case 'marketing': return <TrendingUp className="h-4 w-4" />;
      case 'analytics': return <BarChart3 className="h-4 w-4" />;
      case 'finance': return <DollarSign className="h-4 w-4" />;
      case 'hr': return <Users className="h-4 w-4" />;
      case 'support': return <Headphones className="h-4 w-4" />;
      case 'ai': return <Bot className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const filteredSystems = subsystems.filter(system => {
    const matchesCategory = activeCategory === 'all' || system.category === activeCategory;
    const matchesSearch = system.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         system.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', name: 'Todos', count: subsystems.length },
    { id: 'sales', name: 'Vendas', count: subsystems.filter(s => s.category === 'sales').length },
    { id: 'marketing', name: 'Marketing', count: subsystems.filter(s => s.category === 'marketing').length },
    { id: 'analytics', name: 'Analytics', count: subsystems.filter(s => s.category === 'analytics').length },
    { id: 'finance', name: 'Financeiro', count: subsystems.filter(s => s.category === 'finance').length },
    { id: 'hr', name: 'RH', count: subsystems.filter(s => s.category === 'hr').length },
    { id: 'support', name: 'Suporte', count: subsystems.filter(s => s.category === 'support').length },
    { id: 'ai', name: 'AI', count: subsystems.filter(s => s.category === 'ai').length }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando sistemas VCM...</p>
        </div>
      </div>
    );
  }

  // Se um sistema está selecionado, renderizar apenas esse sistema
  if (selectedSystem) {
    const SystemComponent = selectedSystem.component;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setSelectedSystem(null)}
            >
              ← Voltar aos Sistemas
            </Button>
            <div className="flex items-center space-x-2">
              {selectedSystem.icon}
              <h1 className="text-3xl font-bold">{selectedSystem.name}</h1>
              {getStatusBadge(selectedSystem.status)}
            </div>
          </div>
        </div>
        
        <SystemComponent />
      </div>
    );
  }

  // Dashboard principal dos sistemas
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sistemas VCM</h1>
            <p className="text-gray-600 mt-1">
              Módulos empresariais completos e funcionais ({subsystems.length} sistemas disponíveis)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar sistemas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistemas Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 ml-auto text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {subsystems.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Operacionais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Desenvolvimento</CardTitle>
            <Clock className="h-4 w-4 ml-auto text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {subsystems.filter(s => s.status === 'development').length}
            </div>
            <p className="text-xs text-muted-foreground">Em progresso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {subsystems.reduce((acc, s) => acc + s.metrics.users, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Usuários ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime Médio</CardTitle>
            <Activity className="h-4 w-4 ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(subsystems.reduce((acc, s) => acc + s.metrics.uptime, 0) / subsystems.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Disponibilidade</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-8">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-1">
              {getCategoryIcon(category.id)}
              <span>{category.name}</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                {category.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSystems.map((system) => (
              <Card key={system.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {system.icon}
                      <div>
                        <CardTitle className="text-lg">{system.name}</CardTitle>
                        <CardDescription className="text-sm line-clamp-2">
                          {system.description}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(system.status)}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Funcionalidades:</div>
                      <div className="flex flex-wrap gap-1">
                        {system.features.slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {system.features.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{system.features.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{system.metrics.users}</div>
                        <div className="text-gray-500">Usuários</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{system.metrics.uptime}%</div>
                        <div className="text-gray-500">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Hoje</div>
                        <div className="text-gray-500">Atualizado</div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => setSelectedSystem(system)}
                      className="w-full"
                      disabled={system.status === 'maintenance'}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Acessar Sistema
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}