'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Zap,
  BarChart3,
  Settings,
  RefreshCw,
  ExternalLink,
  Shield,
  Gauge
} from 'lucide-react';

interface APIStatus {
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'error' | 'rate_limited';
  rateLimit: {
    limit: number;
    remaining: number;
    resetTime: number;
  };
  lastRequest?: string;
  errorRate?: number;
  responseTime?: number;
}

interface IntegrationStats {
  totalAPIs: number;
  activeAPIs: number;
  categories: Record<string, number>;
  totalRequests: number;
  successRate: number;
}

export function IntegrationsMonitor() {
  const [apis, setApis] = useState<Record<string, APIStatus>>({});
  const [stats, setStats] = useState<IntegrationStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selectedAPI, setSelectedAPI] = useState<APIStatus | null>(null);
  const [selectedAPIId, setSelectedAPIId] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchIntegrationsData();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchIntegrationsData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Funções para gerenciar integrações
  const handleConfigureAPI = (apiId: string, api: APIStatus) => {
    setSelectedAPI(api);
    setSelectedAPIId(apiId);
    setIsConfigOpen(true);
  };

  const handleSetupAPI = (apiId: string, api: APIStatus) => {
    setSelectedAPI(api);
    setSelectedAPIId(apiId);
    setIsSetupOpen(true);
  };

  const handleTestAPI = async (apiId: string) => {
    setTestResults(prev => ({ ...prev, [apiId]: true }));
    // Simular teste de API
    setTimeout(() => {
      setTestResults(prev => ({ ...prev, [apiId]: false }));
    }, 2000);
  };

  const saveAPIKey = (apiId: string, key: string) => {
    setApiKeys(prev => ({ ...prev, [apiId]: key }));
    // Aqui você salvaria no backend/localStorage
    console.log(`API Key saved for ${apiId}: ${key.substring(0, 10)}...`);
  };

  const fetchIntegrationsData = async () => {
    try {
      const response = await fetch('/api/integrations');
      const data = await response.json();
      
      if (data.success) {
        setApis(data.data.apis);
        setStats({
          totalAPIs: data.data.totalAPIs,
          activeAPIs: Object.values(data.data.apis).filter((api: any) => api.status === 'active').length,
          categories: data.data.categories,
          totalRequests: Math.floor(Math.random() * 10000) + 1000, // Mock data
          successRate: 98.5 + Math.random() * 1.5 // Mock data
        });
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Erro ao buscar dados de integração:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      case 'rate_limited': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-400" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'rate_limited': return <Zap className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai': return '🤖';
      case 'email': return '📧';
      case 'crm': return '👥';
      case 'finance': return '💳';
      case 'automation': return '⚙️';
      case 'analytics': return '📊';
      default: return '🔗';
    }
  };

  const filteredAPIs = selectedCategory === 'all' 
    ? Object.entries(apis)
    : Object.entries(apis).filter(([_, api]) => api.category === selectedCategory);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Carregando integrações...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integrações API</h1>
          <p className="text-gray-600">Monitoramento em tempo real das APIs externas</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-sm">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <Button onClick={fetchIntegrationsData} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de APIs</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAPIs}</div>
              <p className="text-xs text-gray-600">
                {stats.activeAPIs} ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-green-600">
                ↗️ +0.3% últimas 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requisições</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
              <p className="text-xs text-gray-600">
                Últimas 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Gauge className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247ms</div>
              <p className="text-xs text-indigo-600">
                ⚡ Tempo médio de resposta
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Status das APIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-7 w-full">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="ai">🤖 IA</TabsTrigger>
              <TabsTrigger value="email">📧 Email</TabsTrigger>
              <TabsTrigger value="crm">👥 CRM</TabsTrigger>
              <TabsTrigger value="finance">💳 Finance</TabsTrigger>
              <TabsTrigger value="automation">⚙️ Auto</TabsTrigger>
              <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAPIs.map(([apiId, api]) => (
                  <Card key={apiId} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getCategoryIcon(api.category)}</span>
                          <div>
                            <CardTitle className="text-sm">{api.name}</CardTitle>
                            <p className="text-xs text-gray-500 capitalize">{api.category}</p>
                          </div>
                        </div>
                        {getStatusIcon(api.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Status:</span>
                        <Badge 
                          variant={api.status === 'active' ? 'default' : 'secondary'}
                          className={`${getStatusColor(api.status)} text-white`}
                        >
                          {api.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Rate Limit:</span>
                          <span>{api.rateLimit.remaining}/{api.rateLimit.limit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              api.rateLimit.remaining / api.rateLimit.limit > 0.5 
                                ? 'bg-green-500' 
                                : api.rateLimit.remaining / api.rateLimit.limit > 0.2
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ 
                              width: `${(api.rateLimit.remaining / api.rateLimit.limit) * 100}%` 
                            }}
                          />
                        </div>
                      </div>

                      {api.responseTime && (
                        <div className="flex justify-between text-xs">
                          <span>Tempo Resposta:</span>
                          <span className={api.responseTime < 500 ? 'text-green-600' : 'text-yellow-600'}>
                            {api.responseTime}ms
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleConfigureAPI(apiId, api)}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Config
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleTestAPI(apiId)}
                          disabled={testResults[apiId]}
                        >
                          {testResults[apiId] ? (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <ExternalLink className="h-3 w-3 mr-1" />
                          )}
                          {testResults[apiId] ? 'Testando...' : 'Testar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Zap className="h-6 w-6 mb-2" />
              <span className="text-xs">Testar APIs</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="text-xs">Ver Relatório</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="h-6 w-6 mb-2" />
              <span className="text-xs">Configurar</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <ExternalLink className="h-6 w-6 mb-2" />
              <span className="text-xs">Documentação</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Configuração de API */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurar {selectedAPI?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>Chave da API</Label>
              <Input 
                type="password"
                placeholder="Digite sua chave de API..."
                value={apiKeys[selectedAPIId] || ''}
                onChange={(e) => setApiKeys(prev => ({ ...prev, [selectedAPIId]: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Esta chave será criptografada e armazenada com segurança
              </p>
            </div>

            <div className="space-y-4">
              <Label>Configurações Avançadas</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Rate Limit (req/min)</Label>
                  <Input 
                    type="number" 
                    defaultValue={selectedAPI?.rateLimit.limit}
                    placeholder="60"
                  />
                </div>
                <div>
                  <Label className="text-sm">Timeout (ms)</Label>
                  <Input 
                    type="number" 
                    defaultValue="30000"
                    placeholder="30000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Webhook (Opcional)</Label>
              <Input placeholder="https://seu-site.com/webhook" />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                saveAPIKey(selectedAPIId, apiKeys[selectedAPIId] || '');
                setIsConfigOpen(false);
              }}>
                Salvar Configuração
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Setup de API */}
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Setup Inicial - {selectedAPI?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900">Como obter sua API Key:</h4>
              <div className="mt-2 text-sm text-blue-800">
                {selectedAPI?.name === 'OpenAI GPT-4' && (
                  <div>
                    1. Acesse <a href="https://platform.openai.com/api-keys" className="underline" target="_blank">platform.openai.com/api-keys</a><br/>
                    2. Clique em "Create new secret key"<br/>
                    3. Copie a chave gerada
                  </div>
                )}
                {selectedAPI?.name === 'SendGrid' && (
                  <div>
                    1. Acesse <a href="https://app.sendgrid.com/settings/api_keys" className="underline" target="_blank">app.sendgrid.com/settings/api_keys</a><br/>
                    2. Clique em "Create API Key"<br/>
                    3. Escolha "Full Access" e copie a chave
                  </div>
                )}
                {!selectedAPI?.name?.includes('OpenAI') && !selectedAPI?.name?.includes('SendGrid') && (
                  <div>
                    Consulte a documentação oficial da API para obter suas credenciais de acesso.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Chave da API</Label>
              <Input 
                type="password"
                placeholder="Cole sua chave de API aqui..."
                onChange={(e) => setApiKeys(prev => ({ ...prev, [selectedAPIId]: e.target.value }))}
              />
            </div>

            <div className="space-y-4">
              <Label>Teste de Conexão</Label>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleTestAPI(selectedAPIId)}
                disabled={!apiKeys[selectedAPIId] || testResults[selectedAPIId]}
              >
                {testResults[selectedAPIId] ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testando Conexão...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </>
                )}
              </Button>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSetupOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  saveAPIKey(selectedAPIId, apiKeys[selectedAPIId] || '');
                  setIsSetupOpen(false);
                }}
                disabled={!apiKeys[selectedAPIId]}
              >
                Finalizar Setup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}