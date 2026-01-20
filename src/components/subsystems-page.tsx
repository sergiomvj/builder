'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { 
  Mail, 
  Phone, 
  Users, 
  BarChart3,
  DollarSign,
  Video,
  Zap,
  Database,
  Palette,
  Calendar,
  Shield,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
  Play
} from 'lucide-react';

interface Subsystem {
  id: string;
  name: string;
  category: 'core' | 'operational' | 'utility';
  description: string;
  status: 'active' | 'inactive' | 'development' | 'planned';
  icon: React.ReactNode;
  tools: string[];
  integrations: string[];
  lastUpdate?: string;
  usage?: number;
}

export function SubsystemsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubsystem, setSelectedSubsystem] = useState<Subsystem | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [subsystemStatus, setSubsystemStatus] = useState<Record<string, boolean>>({});

  // Função para configurar subsistema
  const handleConfigure = (subsystem: Subsystem) => {
    setSelectedSubsystem(subsystem);
    setIsConfigOpen(true);
  };

  // Função para fazer setup do subsistema
  const handleSetup = (subsystem: Subsystem) => {
    setSelectedSubsystem(subsystem);
    setIsSetupOpen(true);
  };

  // Função para verificar status
  const handleVerifyStatus = async (subsystemId: string) => {
    // Simular verificação de status
    setSubsystemStatus(prev => ({ ...prev, [subsystemId]: true }));
    setTimeout(() => {
      setSubsystemStatus(prev => ({ ...prev, [subsystemId]: false }));
    }, 2000);
  };

  const subsystems: Subsystem[] = [
    // CORE SYSTEMS
    {
      id: 'email-management',
      name: 'Email Management System',
      category: 'core',
      description: 'Sistema completo de gestão de email marketing, campanhas e automações',
      status: 'development',
      icon: <Mail className="h-5 w-5" />,
      tools: ['Campaign Builder', 'Template Editor', 'Analytics Dashboard', 'A/B Testing'],
      integrations: ['Mailchimp', 'SendGrid', 'AWS SES', 'Gmail API'],
      lastUpdate: '2024-11-15',
      usage: 85
    },
    {
      id: 'crm-sales',
      name: 'CRM & Sales Pipeline',
      category: 'core',
      description: 'Gestão completa de leads, oportunidades e pipeline de vendas',
      status: 'active',
      icon: <Users className="h-5 w-5" />,
      tools: ['Lead Management', 'Pipeline Tracker', 'Contact Database', 'Sales Reports'],
      integrations: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM'],
      lastUpdate: '2024-11-16',
      usage: 92
    },
    {
      id: 'social-media',
      name: 'Social Media Management',
      category: 'core',
      description: 'Gestão unificada de todas as plataformas de redes sociais',
      status: 'active',
      icon: <Phone className="h-5 w-5" />,
      tools: ['Post Scheduler', 'Content Calendar', 'Analytics', 'Engagement Tracker'],
      integrations: ['Facebook', 'Instagram', 'LinkedIn', 'Twitter', 'TikTok'],
      lastUpdate: '2024-11-14',
      usage: 78
    },
    {
      id: 'marketing-traffic',
      name: 'Marketing & Paid Traffic',
      category: 'core',
      description: 'Campanhas de tráfego pago e otimização de conversão',
      status: 'active',
      icon: <BarChart3 className="h-5 w-5" />,
      tools: ['Campaign Manager', 'Audience Builder', 'ROI Tracker', 'Conversion Optimizer'],
      integrations: ['Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'TikTok Ads'],
      lastUpdate: '2024-11-13',
      usage: 89
    },
    {
      id: 'financial-management',
      name: 'Financial Management',
      category: 'core',
      description: 'Controle financeiro completo com relatórios e projeções',
      status: 'development',
      icon: <DollarSign className="h-5 w-5" />,
      tools: ['Budget Tracker', 'Invoice Generator', 'Expense Manager', 'Financial Reports'],
      integrations: ['QuickBooks', 'Xero', 'Stripe', 'PayPal'],
      lastUpdate: '2024-11-12',
      usage: 67
    },
    {
      id: 'content-creation',
      name: 'Content Creation Hub',
      category: 'core',
      description: 'Criação e gestão de conteúdo para YouTube e outras plataformas',
      status: 'planned',
      icon: <Video className="h-5 w-5" />,
      tools: ['Video Editor', 'Thumbnail Creator', 'Script Generator', 'Upload Scheduler'],
      integrations: ['YouTube API', 'Vimeo', 'Adobe Creative Suite', 'Canva'],
      lastUpdate: '2024-11-10',
      usage: 45
    },

    // OPERATIONAL SYSTEMS
    {
      id: 'communication-hub',
      name: 'Communication Hub',
      category: 'operational',
      description: 'Central de comunicação integrada com todos os canais',
      status: 'active',
      icon: <Phone className="h-5 w-5" />,
      tools: ['Unified Inbox', 'Chat Manager', 'Call Center', 'Message Templates'],
      integrations: ['Slack', 'Teams', 'WhatsApp', 'Telegram'],
      lastUpdate: '2024-11-15',
      usage: 73
    },
    {
      id: 'analytics-reporting',
      name: 'Analytics & Reporting',
      category: 'operational',
      description: 'Dashboards executivos e relatórios automatizados',
      status: 'active',
      icon: <BarChart3 className="h-5 w-5" />,
      tools: ['Executive Dashboard', 'Custom Reports', 'KPI Tracker', 'Data Visualization'],
      integrations: ['Google Analytics', 'Tableau', 'Power BI', 'Looker'],
      lastUpdate: '2024-11-16',
      usage: 91
    },
    {
      id: 'automation-workflows',
      name: 'Automation & Workflows',
      category: 'operational',
      description: 'Automação de processos e workflows inteligentes',
      status: 'active',
      icon: <Zap className="h-5 w-5" />,
      tools: ['Workflow Builder', 'Process Automation', 'Task Scheduler', 'Integration Manager'],
      integrations: ['Zapier', 'N8N', 'Microsoft Power Automate', 'IFTTT'],
      lastUpdate: '2024-11-14',
      usage: 88
    },
    {
      id: 'knowledge-management',
      name: 'Knowledge Management',
      category: 'operational',
      description: 'Base de conhecimento e documentação centralizada',
      status: 'development',
      icon: <Database className="h-5 w-5" />,
      tools: ['Document Manager', 'Wiki System', 'Search Engine', 'Version Control'],
      integrations: ['Notion', 'Confluence', 'GitBook', 'Obsidian'],
      lastUpdate: '2024-11-11',
      usage: 56
    },
    {
      id: 'design-creative',
      name: 'Design & Creative Assets',
      category: 'operational',
      description: 'Gestão de assets criativos e templates de design',
      status: 'planned',
      icon: <Palette className="h-5 w-5" />,
      tools: ['Asset Library', 'Template Manager', 'Brand Guidelines', 'Design System'],
      integrations: ['Figma', 'Adobe Creative Cloud', 'Canva', 'Sketch'],
      lastUpdate: '2024-11-09',
      usage: 34
    },
    {
      id: 'project-management',
      name: 'Project Management',
      category: 'operational',
      description: 'Gestão de projetos e coordenação de equipes',
      status: 'active',
      icon: <Calendar className="h-5 w-5" />,
      tools: ['Task Manager', 'Timeline Planner', 'Resource Allocation', 'Team Collaboration'],
      integrations: ['Asana', 'Trello', 'Monday.com', 'Jira'],
      lastUpdate: '2024-11-15',
      usage: 82
    },

    // UTILITY SYSTEMS
    {
      id: 'security-compliance',
      name: 'Security & Compliance',
      category: 'utility',
      description: 'Sistema de segurança e conformidade regulatória',
      status: 'active',
      icon: <Shield className="h-5 w-5" />,
      tools: ['Access Control', 'Audit Logs', 'Compliance Checker', 'Security Scanner'],
      integrations: ['Auth0', 'Okta', '1Password', 'LastPass'],
      lastUpdate: '2024-11-16',
      usage: 95
    },
    {
      id: 'system-administration',
      name: 'System Administration',
      category: 'utility',
      description: 'Administração e monitoramento de todos os sistemas',
      status: 'active',
      icon: <Settings className="h-5 w-5" />,
      tools: ['System Monitor', 'Configuration Manager', 'Backup System', 'Health Checker'],
      integrations: ['Docker', 'Kubernetes', 'AWS', 'Azure'],
      lastUpdate: '2024-11-16',
      usage: 99
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', className: 'bg-green-100 text-green-800' },
      development: { label: 'Desenvolvimento', className: 'bg-yellow-100 text-yellow-800' },
      planned: { label: 'Planejado', className: 'bg-blue-100 text-blue-800' },
      inactive: { label: 'Inativo', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'development':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'planned':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const categories = [
    { id: 'all', label: 'Todos os Sistemas', count: subsystems.length },
    { id: 'core', label: 'Sistemas Core', count: subsystems.filter(s => s.category === 'core').length },
    { id: 'operational', label: 'Sistemas Operacionais', count: subsystems.filter(s => s.category === 'operational').length },
    { id: 'utility', label: 'Sistemas Utilitários', count: subsystems.filter(s => s.category === 'utility').length }
  ];

  const filteredSubsystems = selectedCategory === 'all' 
    ? subsystems 
    : subsystems.filter(s => s.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Tools & Subsistemas</h1>
        <p className="text-purple-100 text-lg">
          Gerenciamento completo de todos os subsistemas e ferramentas operacionais do VCM
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex space-x-4 overflow-x-auto">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category.id)}
            className="flex-shrink-0"
          >
            {category.label} ({category.count})
          </Button>
        ))}
      </div>

      {/* Subsystems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubsystems.map((subsystem) => (
          <Card key={subsystem.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {subsystem.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{subsystem.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusIcon(subsystem.status)}
                      {getStatusBadge(subsystem.status)}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">{subsystem.description}</p>
              
              {/* Usage Bar */}
              {subsystem.usage && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Uso do Sistema</span>
                    <span>{subsystem.usage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${subsystem.usage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Tools */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ferramentas</h4>
                <div className="flex flex-wrap gap-1">
                  {subsystem.tools.slice(0, 3).map((tool, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                  {subsystem.tools.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{subsystem.tools.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Integrations */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Integrações</h4>
                <div className="flex flex-wrap gap-1">
                  {subsystem.integrations.slice(0, 3).map((integration, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {integration}
                    </Badge>
                  ))}
                  {subsystem.integrations.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{subsystem.integrations.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleConfigure(subsystem)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Configurar
                </Button>
                {subsystem.status === 'active' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleVerifyStatus(subsystem.id)}
                    disabled={subsystemStatus[subsystem.id]}
                  >
                    {subsystemStatus[subsystem.id] ? (
                      <Clock className="h-3 w-3 animate-spin" />
                    ) : (
                      <ExternalLink className="h-3 w-3" />
                    )}
                  </Button>
                )}
                {(subsystem.status === 'development' || subsystem.status === 'planned') && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleSetup(subsystem)}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Last Update */}
              {subsystem.lastUpdate && (
                <div className="text-xs text-gray-500 border-t pt-2">
                  Última atualização: {new Date(subsystem.lastUpdate).toLocaleDateString('pt-BR')}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {subsystems.filter(s => s.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Sistemas Ativos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {subsystems.filter(s => s.status === 'development').length}
              </div>
              <div className="text-sm text-gray-600">Em Desenvolvimento</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {subsystems.filter(s => s.status === 'planned').length}
              </div>
              <div className="text-sm text-gray-600">Planejados</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(subsystems.reduce((acc, s) => acc + (s.usage || 0), 0) / subsystems.filter(s => s.usage).length)}
              </div>
              <div className="text-sm text-gray-600">Uso Médio %</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Configuração */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar {selectedSubsystem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Status do Sistema</Label>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={selectedSubsystem?.status === 'active'} 
                  onCheckedChange={(checked) => {
                    // Implementar mudança de status
                    console.log('Status changed:', checked);
                  }}
                />
                <span className="text-sm">
                  {selectedSubsystem?.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Integrações Ativas</Label>
              <div className="grid grid-cols-2 gap-2">
                {selectedSubsystem?.integrations.map((integration, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <span className="text-sm">{integration}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Configurações Avançadas</Label>
              <Textarea 
                placeholder="Digite configurações em JSON..."
                className="h-32"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                // Salvar configurações
                setIsConfigOpen(false);
              }}>
                Salvar Configurações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Setup */}
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Setup Inicial - {selectedSubsystem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Chaves de API</Label>
              {selectedSubsystem?.integrations.map((integration, index) => (
                <div key={index} className="space-y-2">
                  <Label className="text-sm font-medium">{integration}</Label>
                  <Input 
                    type="password" 
                    placeholder={`Digite a chave da API do ${integration}`}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Label>Configuração Inicial</Label>
              <div className="space-y-2">
                <Input placeholder="Nome da configuração" />
                <Input placeholder="URL do webhook (opcional)" />
                <Textarea 
                  placeholder="Configurações específicas..."
                  className="h-24"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Ferramentas Ativas</Label>
              <div className="grid grid-cols-2 gap-2">
                {selectedSubsystem?.tools.map((tool, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <span className="text-sm">{tool}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSetupOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                // Executar setup
                setIsSetupOpen(false);
              }}>
                Executar Setup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}