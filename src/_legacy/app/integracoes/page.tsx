'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Plus,
  Settings,
  ExternalLink,
  Key,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Database,
  Mail,
  MessageSquare,
  Globe,
  Code,
  Webhook,
  Eye,
  Workflow,
  Play,
  Pause
} from 'lucide-react';
import { useIsClient } from '@/components/no-ssr';
import { N8NConfigModal } from '@/components/N8NConfigModal';
import { IntegrationConfigModal } from '@/components/IntegrationConfigModal';

interface Integration {
  id: string;
  name: string;
  type: 'api' | 'webhook' | 'database' | 'email' | 'social';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  provider: string;
  description: string;
  last_sync?: string;
  config_status: 'complete' | 'incomplete';
  endpoint?: string;
  auth_type: 'api_key' | 'oauth2' | 'basic' | 'bearer';
  usage_count: number;
  created_at: string;
}

interface WebhookEvent {
  id: string;
  integration_id: string;
  event_type: string;
  payload_size: number;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  retry_count: number;
}

export default function IntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [activeTab, setActiveTab] = useState('ativos');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [n8nConfigOpen, setN8nConfigOpen] = useState(false);
  const [n8nWorkflows, setN8nWorkflows] = useState<any[]>([]);
  const [n8nExecutions, setN8nExecutions] = useState<any[]>([]);
  const [integrationConfigOpen, setIntegrationConfigOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const isClient = useIsClient();

  // Mock data - substitua por dados reais do banco
  const mockIntegrations: Integration[] = [
    {
      id: '1',
      name: 'Supabase RAG Database',
      type: 'database',
      status: 'connected',
      provider: 'Supabase',
      description: 'Base de conhecimento RAG para IA',
      last_sync: '2024-11-19T10:30:00Z',
      config_status: 'complete',
      endpoint: 'https://rag-db.supabase.co',
      auth_type: 'bearer',
      usage_count: 1250,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      name: 'OpenAI GPT-4',
      type: 'api',
      status: 'connected',
      provider: 'OpenAI',
      description: 'Geração de conteúdo e biografias',
      last_sync: '2024-11-19T10:25:00Z',
      config_status: 'complete',
      endpoint: 'https://api.openai.com/v1',
      auth_type: 'bearer',
      usage_count: 850,
      created_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '3',
      name: 'N8N Automation',
      type: 'webhook',
      status: 'connected',
      provider: 'N8N',
      description: 'Automação de workflows empresariais',
      last_sync: '2024-11-19T09:45:00Z',
      config_status: 'complete',
      endpoint: 'https://n8n.company.com/webhook',
      auth_type: 'api_key',
      usage_count: 320,
      created_at: '2024-02-01T00:00:00Z'
    },
    {
      id: '4',
      name: 'Email Service',
      type: 'email',
      status: 'error',
      provider: 'SendGrid',
      description: 'Envio de emails automatizados',
      config_status: 'incomplete',
      auth_type: 'api_key',
      usage_count: 150,
      created_at: '2024-03-10T00:00:00Z'
    },
    {
      id: '5',
      name: 'Slack Notifications',
      type: 'social',
      status: 'pending',
      provider: 'Slack',
      description: 'Notificações em tempo real',
      config_status: 'incomplete',
      auth_type: 'oauth2',
      usage_count: 0,
      created_at: '2024-11-18T00:00:00Z'
    }
  ];

  const mockWebhookEvents: WebhookEvent[] = [
    {
      id: '1',
      integration_id: '3',
      event_type: 'persona_created',
      payload_size: 2048,
      status: 'success',
      timestamp: '2024-11-19T10:30:00Z',
      retry_count: 0
    },
    {
      id: '2', 
      integration_id: '3',
      event_type: 'workflow_triggered',
      payload_size: 1024,
      status: 'success',
      timestamp: '2024-11-19T10:15:00Z',
      retry_count: 0
    },
    {
      id: '3',
      integration_id: '4',
      event_type: 'email_send_failed',
      payload_size: 512,
      status: 'failed',
      timestamp: '2024-11-19T09:30:00Z',
      retry_count: 3
    }
  ];

  useEffect(() => {
    if (isClient) {
      // Simulate loading
      setTimeout(() => {
        setIntegrations(mockIntegrations);
        setWebhookEvents(mockWebhookEvents);
        setLoading(false);
      }, 1000);
      
      // Carregar workflows N8N
      loadN8NData();
    }
  }, [isClient]);

  const loadN8NData = async () => {
    try {
      const [workflowsRes, executionsRes] = await Promise.all([
        fetch('/api/n8n/workflows'),
        fetch('/api/n8n/executions?limit=10')
      ]);

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        if (workflowsData.success) {
          setN8nWorkflows(workflowsData.data);
        }
      }

      if (executionsRes.ok) {
        const executionsData = await executionsRes.json();
        if (executionsData.success) {
          setN8nExecutions(executionsData.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados N8N:', error);
    }
  };

  const handleN8NConfigSave = async (config: { url: string; apiKey: string }) => {
    // TODO: Salvar no banco (system_integrations table)
    localStorage.setItem('n8n_config', JSON.stringify(config));
    
    // Recarregar dados após configurar
    await loadN8NData();
  };

  const handleOpenIntegrationConfig = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIntegrationConfigOpen(true);
  };

  const handleSaveIntegrationConfig = async (config: any) => {
    console.log('Salvando configuração:', selectedIntegration?.name, config);
    // TODO: Salvar no Supabase (tabela system_integrations)
    alert(`Configuração de ${selectedIntegration?.name} salva com sucesso!`);
  };

  const handleN8NSync = async () => {
    try {
      const response = await fetch('/api/n8n/sync', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        alert(`Sincronização concluída: ${data.data.updated} workflows atualizados`);
        await loadN8NData();
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'disconnected': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'api': return <Code className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'social': return <MessageSquare className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrações</h1>
          <p className="text-gray-500 mt-1">Gerenciar APIs, webhooks e conectores externos</p>
        </div>
        
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Integração
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-green-600">
                  {integrations.filter(i => i.status === 'connected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Com Erro</p>
                <p className="text-2xl font-bold text-red-600">
                  {integrations.filter(i => i.status === 'error').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {integrations.filter(i => i.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Uso</p>
                <p className="text-2xl font-bold text-blue-600">
                  {integrations.reduce((acc, i) => acc + i.usage_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ativos">Integrações Ativas</TabsTrigger>
          <TabsTrigger value="n8n">N8N Workflows</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Events</TabsTrigger>
          <TabsTrigger value="configurar">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="ativos" className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por nome ou provedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((integration) => (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(integration.type)}
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                  </div>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Provedor:</span>
                      <span className="font-medium">{integration.provider}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Uso:</span>
                      <span className="font-medium">{integration.usage_count} calls</span>
                    </div>
                    
                    {integration.last_sync && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Última sincronização:</span>
                        <span className="font-medium">
                          {new Date(integration.last_sync).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleOpenIntegrationConfig(integration)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Config
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-3 w-3 mr-1" />
                        Logs
                      </Button>
                      {integration.endpoint && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="n8n" className="space-y-4">
          {/* N8N Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">N8N Workflow Automation</h2>
              <p className="text-gray-500 mt-1">Gerencie workflows automáticos do N8N</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleN8NSync}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar
              </Button>
              <Button onClick={() => setN8nConfigOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar N8N
              </Button>
            </div>
          </div>

          {/* N8N Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Workflow className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                    <p className="text-2xl font-bold text-blue-600">{n8nWorkflows.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Play className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Ativos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {n8nWorkflows.filter(w => w.active).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Pause className="h-8 w-8 text-gray-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Inativos</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {n8nWorkflows.filter(w => !w.active).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Execuções</p>
                    <p className="text-2xl font-bold text-green-600">{n8nExecutions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Workflows List */}
          <Card>
            <CardHeader>
              <CardTitle>Workflows</CardTitle>
              <CardDescription>
                {n8nWorkflows.length} workflow(s) configurado(s) no N8N
              </CardDescription>
            </CardHeader>
            <CardContent>
              {n8nWorkflows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum workflow configurado.</p>
                  <p className="text-sm mt-1">Configure o N8N para ver os workflows.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setN8nConfigOpen(true)}
                  >
                    Configurar N8N
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {n8nWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                            <Badge className={workflow.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                              {workflow.active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-gray-600 space-y-1">
                            <p>Nós: {workflow.nodes?.length || 0}</p>
                            <p>Última atualização: {new Date(workflow.updatedAt).toLocaleString()}</p>
                            {workflow.tags && workflow.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {workflow.tags.map((tag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`${workflow.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Executions */}
          {n8nExecutions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Execuções Recentes</CardTitle>
                <CardDescription>Últimas 10 execuções de workflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {n8nExecutions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between border-l-4 pl-4 py-2"
                      style={{
                        borderLeftColor: 
                          execution.status === 'success' ? '#10b981' :
                          execution.status === 'error' ? '#ef4444' :
                          execution.status === 'running' ? '#3b82f6' : '#6b7280'
                      }}
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {n8nWorkflows.find(w => w.id === execution.workflowId)?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(execution.startedAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        className={
                          execution.status === 'success' ? 'bg-green-100 text-green-700' :
                          execution.status === 'error' ? 'bg-red-100 text-red-700' :
                          execution.status === 'running' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }
                      >
                        {execution.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">`
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Webhook</CardTitle>
              <CardDescription>Histórico dos últimos eventos recebidos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Evento</th>
                      <th className="text-left p-2">Integração</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Tamanho</th>
                      <th className="text-left p-2">Timestamp</th>
                      <th className="text-left p-2">Tentativas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookEvents.map((event) => {
                      const integration = integrations.find(i => i.id === event.integration_id);
                      return (
                        <tr key={event.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{event.event_type}</td>
                          <td className="p-2">{integration?.name || 'Unknown'}</td>
                          <td className="p-2">
                            <Badge className={getStatusColor(event.status)}>
                              {event.status}
                            </Badge>
                          </td>
                          <td className="p-2">{event.payload_size} bytes</td>
                          <td className="p-2">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="p-2">{event.retry_count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configurar" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Globais</CardTitle>
                <CardDescription>Configurações aplicáveis a todas as integrações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Timeout padrão (segundos)</label>
                  <Input type="number" defaultValue="30" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Máximo de tentativas</label>
                  <Input type="number" defaultValue="3" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium">Webhook Secret</label>
                  <Input type="password" placeholder="Chave secreta para validação" className="mt-1" />
                </div>
                <Button className="w-full">
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Keys</CardTitle>
                <CardDescription>Gerenciar chaves de API do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">OpenAI API Key</span>
                      <p className="text-xs text-gray-500">sk-...Xt4J</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">Supabase Key</span>
                      <p className="text-xs text-gray-500">eyJ...wZi</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">SendGrid Key</span>
                      <p className="text-xs text-red-600">Não configurado</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Key className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Nova API Key
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* N8N Config Modal */}
      <N8NConfigModal
        open={n8nConfigOpen}
        onOpenChange={setN8nConfigOpen}
        onSave={handleN8NConfigSave}
      />

      {/* Generic Integration Config Modal */}
      {selectedIntegration && (
        <IntegrationConfigModal
          open={integrationConfigOpen}
          onOpenChange={setIntegrationConfigOpen}
          integration={selectedIntegration}
          onSave={handleSaveIntegrationConfig}
        />
      )}
    </div>
  );
}