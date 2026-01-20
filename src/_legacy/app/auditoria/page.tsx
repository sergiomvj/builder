'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield,
  Activity,
  FileText,
  Users,
  AlertTriangle,
  CheckCircle,
  Eye,
  Search,
  Download,
  Settings,
  Clock,
  Database,
  Lock
} from 'lucide-react';
import { useIsClient } from '@/components/no-ssr';

export default function AuditoriaPage() {
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
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Auditoria & Compliance</h1>
            <p className="text-gray-600">Monitoramento e análise de conformidade do sistema</p>
          </div>
        </div>

        {/* Como Funciona - Auditoria */}
        <Alert className="border-blue-200 bg-blue-50 mb-6">
          <Shield className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-800 text-lg">Como Funciona o Módulo de Auditoria</AlertTitle>
          <AlertDescription className="text-blue-700 mt-3">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">🔍 1. Monitoramento Contínuo</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Rastreamento de todas as ações de personas</li>
                    <li>• Captura automática de eventos do sistema</li>
                    <li>• Análise de padrões comportamentais</li>
                    <li>• Detecção de atividades suspeitas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📊 2. Análise de Compliance</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Verificação de conformidade regulatória</li>
                    <li>• Validação de políticas empresariais</li>
                    <li>• Controle de acesso e permissões</li>
                    <li>• Auditoria de dados sensíveis</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📈 3. Relatórios Automáticos</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Geração de relatórios periódicos</li>
                    <li>• Dashboards em tempo real</li>
                    <li>• Alertas de não conformidade</li>
                    <li>• Métricas de performance</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">🛡️ 4. Segurança e Riscos</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Identificação de vulnerabilidades</li>
                    <li>• Análise de riscos operacionais</li>
                    <li>• Logs de segurança detalhados</li>
                    <li>• Planos de mitigação</li>
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
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-3xl font-bold text-green-600">97.5%</p>
                  <p className="text-sm text-gray-600">Taxa de Conformidade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Activity className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-3xl font-bold text-blue-600">1,247</p>
                  <p className="text-sm text-gray-600">Eventos Monitorados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-3xl font-bold text-orange-600">3</p>
                  <p className="text-sm text-gray-600">Alertas Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-3xl font-bold text-purple-600">142</p>
                  <p className="text-sm text-gray-600">Relatórios Gerados</p>
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
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Atividades Recentes</span>
                </CardTitle>
                <CardDescription>Últimos eventos monitorados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { evento: 'Login persona Sarah Mitchell', time: '14:32', tipo: 'success' },
                    { evento: 'Acesso negado - Dados financeiros', time: '14:15', tipo: 'warning' },
                    { evento: 'Backup automático concluído', time: '14:00', tipo: 'info' },
                    { evento: 'Tentativa de acesso suspeita', time: '13:45', tipo: 'error' },
                    { evento: 'Relatório de compliance gerado', time: '13:30', tipo: 'success' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {item.tipo === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {item.tipo === 'warning' && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                        {item.tipo === 'error' && <AlertTriangle className="h-4 w-4 text-red-600" />}
                        {item.tipo === 'info' && <Activity className="h-4 w-4 text-blue-600" />}
                        <span className="text-sm font-medium">{item.evento}</span>
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
                  <Lock className="h-5 w-5 text-purple-600" />
                  <span>Status de Segurança</span>
                </CardTitle>
                <CardDescription>Indicadores de conformidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Políticas de Segurança</span>
                    <Badge className="bg-green-100 text-green-800">Conforme</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Controle de Acesso</span>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Logs de Auditoria</span>
                    <Badge className="bg-blue-100 text-blue-800">Capturando</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Backup de Dados</span>
                    <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Compliance */}
        <TabsContent value="compliance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Conformidade</CardTitle>
                <CardDescription>Status das principais regulamentações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { norma: 'LGPD', status: 'Conforme', score: 98, cor: 'green' },
                    { norma: 'ISO 27001', status: 'Conforme', score: 95, cor: 'green' },
                    { norma: 'SOX', status: 'Parcial', score: 78, cor: 'orange' },
                    { norma: 'GDPR', status: 'Conforme', score: 97, cor: 'green' },
                    { norma: 'PCI DSS', status: 'Não Aplicável', score: 0, cor: 'gray' },
                    { norma: 'HIPAA', status: 'Não Aplicável', score: 0, cor: 'gray' }
                  ].map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <h3 className="font-semibold text-lg">{item.norma}</h3>
                          <p className={`text-sm ${item.cor === 'green' ? 'text-green-600' : item.cor === 'orange' ? 'text-orange-600' : 'text-gray-600'}`}>
                            {item.status}
                          </p>
                          {item.score > 0 && (
                            <div className="mt-2">
                              <div className="text-2xl font-bold">{item.score}%</div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className={`h-2 rounded-full ${item.cor === 'green' ? 'bg-green-500' : 'bg-orange-500'}`}
                                  style={{ width: `${item.score}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Relatórios */}
        <TabsContent value="relatorios">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-blue-500" />
                  <span>Relatório de Compliance</span>
                </CardTitle>
                <CardDescription>Relatório mensal de conformidade</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-6 w-6 text-green-500" />
                  <span>Log de Atividades</span>
                </CardTitle>
                <CardDescription>Histórico detalhado de eventos</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                  <span>Relatório de Riscos</span>
                </CardTitle>
                <CardDescription>Análise de vulnerabilidades</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Analisar
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Configurações */}
        <TabsContent value="configuracoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-blue-600" />
                <span>Configurações de Auditoria</span>
              </CardTitle>
              <CardDescription>Personalize as configurações do módulo de auditoria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-4">Monitoramento</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Rastreamento de Login</span>
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Análise de Comportamento</span>
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Detecção de Anomalias</span>
                        <Badge className="bg-blue-100 text-blue-800">Configurando</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-4">Relatórios</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Frequência: Semanal</span>
                        <Button variant="outline" size="sm">Configurar</Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Auto-envio por Email</span>
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Retenção: 12 meses</span>
                        <Button variant="outline" size="sm">Alterar</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}