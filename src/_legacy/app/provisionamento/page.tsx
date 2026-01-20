'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  RefreshCw,
  Upload,
  Download,
  Database,
  Zap,
  CheckCircle,
  AlertTriangle,
  Clock,
  Server,
  GitBranch,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { useIsClient } from '@/components/no-ssr';

export default function ProvisionamentoPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const isClient = useIsClient();

  useEffect(() => {
    if (isClient) {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [isClient]);

  if (!isClient || loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Package className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Provisionamento & Deployment</h1>
            <p className="text-gray-600">Gestão de packages e sincronização de dados</p>
          </div>
        </div>

        {/* Como Funciona - Provisionamento */}
        <Alert className="border-purple-200 bg-purple-50 mb-6">
          <Package className="h-5 w-5 text-purple-600" />
          <AlertTitle className="text-purple-800 text-lg">Como Funciona o Módulo de Provisionamento</AlertTitle>
          <AlertDescription className="text-purple-700 mt-3">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">📦 1. Criação de Packages</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Empacotamento de personas e dados</li>
                    <li>• Versionamento automático de releases</li>
                    <li>• Validação de integridade dos dados</li>
                    <li>• Configuração de ambientes de destino</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🔄 2. Sincronização Bidirecionais</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Sync entre VCM Central e RAG Databases</li>
                    <li>• Resolução automática de conflitos</li>
                    <li>• Backup antes de cada sincronização</li>
                    <li>• Monitoramento de status em tempo real</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🚀 3. Deploy Automatizado</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Deploy de personas para ambientes</li>
                    <li>• Rollback automático em caso de erro</li>
                    <li>• Testes de integridade pós-deploy</li>
                    <li>• Notificações de status via webhook</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🔧 4. Gestão de Versões</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Controle de versões Git-like</li>
                    <li>• Comparação entre versões</li>
                    <li>• Merge de mudanças conflitantes</li>
                    <li>• Histórico completo de deployments</li>
                  </ul>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-3xl font-bold text-purple-600">24</p>
                  <p className="text-sm text-gray-600">Packages Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-3xl font-bold text-green-600">98.7%</p>
                  <p className="text-sm text-gray-600">Sucesso em Syncs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Zap className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-3xl font-bold text-blue-600">127</p>
                  <p className="text-sm text-gray-600">Deployments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-3xl font-bold text-orange-600">2.3min</p>
                  <p className="text-sm text-gray-600">Tempo Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="sincronizacao">Sincronização</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  <span>Sincronizações Recentes</span>
                </CardTitle>
                <CardDescription>Últimas operações de sync</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { origem: 'VCM Central', destino: 'LifewayUSA RAG', status: 'success', time: '14:32' },
                    { origem: 'TechCorp RAG', destino: 'VCM Central', status: 'success', time: '14:15' },
                    { origem: 'VCM Central', destino: 'GlobalMarketing RAG', status: 'warning', time: '14:00' },
                    { origem: 'StartupTech RAG', destino: 'VCM Central', status: 'error', time: '13:45' },
                    { origem: 'VCM Central', destino: 'FinanceCorpRAG', status: 'success', time: '13:30' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {item.status === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                        {item.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                        <div>
                          <p className="text-sm font-medium">{item.origem} → {item.destino}</p>
                          <p className="text-xs text-gray-500">Sincronização de dados</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5 text-purple-600" />
                  <span>Status dos Ambientes</span>
                </CardTitle>
                <CardDescription>Saúde dos ambientes de deployment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { ambiente: 'Produção', status: 'online', deployments: 24 },
                    { ambiente: 'Homologação', status: 'online', deployments: 8 },
                    { ambiente: 'Desenvolvimento', status: 'maintenance', deployments: 12 },
                    { ambiente: 'Staging', status: 'online', deployments: 16 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.status === 'online' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {item.status === 'maintenance' && <Settings className="h-5 w-5 text-orange-600" />}
                        <div>
                          <p className="font-medium">{item.ambiente}</p>
                          <p className="text-sm text-gray-500">{item.deployments} packages ativos</p>
                        </div>
                      </div>
                      <Badge variant={item.status === 'online' ? 'default' : 'secondary'}>
                        {item.status === 'online' ? 'Online' : 'Manutenção'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Packages */}
        <TabsContent value="packages">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Packages Disponíveis</h3>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Criar Novo Package
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { nome: 'LifewayUSA-v2.1.4', status: 'deployed', personas: 20, size: '2.4 MB' },
                { nome: 'TechCorp-v1.8.2', status: 'ready', personas: 15, size: '1.8 MB' },
                { nome: 'GlobalMarketing-v3.0.1', status: 'building', personas: 25, size: '3.1 MB' },
                { nome: 'StartupTech-v1.2.0', status: 'error', personas: 12, size: '1.5 MB' },
                { nome: 'FinanceCorp-v2.5.3', status: 'deployed', personas: 18, size: '2.2 MB' },
                { nome: 'HealthSystem-v1.0.0', status: 'ready', personas: 22, size: '2.8 MB' }
              ].map((pkg, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{pkg.nome}</CardTitle>
                      <Badge variant={
                        pkg.status === 'deployed' ? 'default' :
                        pkg.status === 'ready' ? 'secondary' :
                        pkg.status === 'building' ? 'outline' : 'destructive'
                      }>
                        {pkg.status === 'deployed' ? 'Deployed' :
                         pkg.status === 'ready' ? 'Pronto' :
                         pkg.status === 'building' ? 'Construindo' : 'Erro'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Personas:</span>
                        <span>{pkg.personas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tamanho:</span>
                        <span>{pkg.size}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Play className="h-4 w-4 mr-1" />
                        Deploy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab: Sincronização */}
        <TabsContent value="sincronizacao">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>Configuração de Sincronização</span>
                </CardTitle>
                <CardDescription>Configure as sincronizações automáticas entre databases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { origem: 'VCM Central', destino: 'LifewayUSA RAG', frequencia: 'A cada 30min', status: 'ativo', progresso: 100 },
                    { origem: 'VCM Central', destino: 'TechCorp RAG', frequencia: 'A cada 1h', status: 'ativo', progresso: 100 },
                    { origem: 'VCM Central', destino: 'GlobalMarketing RAG', frequencia: 'A cada 2h', status: 'sincronizando', progresso: 65 },
                    { origem: 'VCM Central', destino: 'StartupTech RAG', frequencia: 'A cada 1h', status: 'erro', progresso: 0 }
                  ].map((sync, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{sync.origem} → {sync.destino}</h4>
                            <p className="text-sm text-gray-500">{sync.frequencia}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant={
                              sync.status === 'ativo' ? 'default' :
                              sync.status === 'sincronizando' ? 'outline' : 'destructive'
                            }>
                              {sync.status === 'ativo' ? 'Ativo' :
                               sync.status === 'sincronizando' ? 'Sincronizando' : 'Erro'}
                            </Badge>
                            <Button size="sm" variant="ghost">
                              {sync.status === 'ativo' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        {sync.status === 'sincronizando' && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progresso</span>
                              <span>{sync.progresso}%</span>
                            </div>
                            <Progress value={sync.progresso} className="h-2" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Deployments */}
        <TabsContent value="deployments">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5 text-purple-600" />
                  <span>Histórico de Deployments</span>
                </CardTitle>
                <CardDescription>Acompanhe todos os deployments realizados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { package: 'LifewayUSA-v2.1.4', ambiente: 'Produção', status: 'success', time: '14:32', duration: '2m 15s' },
                    { package: 'TechCorp-v1.8.2', ambiente: 'Staging', status: 'success', time: '14:15', duration: '1m 48s' },
                    { package: 'GlobalMarketing-v3.0.1', ambiente: 'Desenvolvimento', status: 'running', time: '14:00', duration: '3m 22s...' },
                    { package: 'StartupTech-v1.2.0', ambiente: 'Homologação', status: 'failed', time: '13:45', duration: '45s' },
                    { package: 'FinanceCorp-v2.5.3', ambiente: 'Produção', status: 'success', time: '13:30', duration: '2m 8s' }
                  ].map((deploy, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {deploy.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                        {deploy.status === 'running' && <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />}
                        {deploy.status === 'failed' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                        <div>
                          <p className="font-medium">{deploy.package}</p>
                          <p className="text-sm text-gray-500">{deploy.ambiente} • {deploy.time} • {deploy.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={
                          deploy.status === 'success' ? 'default' :
                          deploy.status === 'running' ? 'outline' : 'destructive'
                        }>
                          {deploy.status === 'success' ? 'Sucesso' :
                           deploy.status === 'running' ? 'Executando' : 'Falha'}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}