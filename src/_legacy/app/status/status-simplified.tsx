'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Cpu,
  HardDrive,
  MemoryStick,
  Network,
  Shield,
  Eye,
  Settings
} from 'lucide-react';
import { useIsClient } from '@/components/no-ssr';

interface ServicoStatus {
  id: string;
  nome: string;
  status: 'online' | 'offline' | 'warning' | 'maintenance';
  uptime: string;
  response_time: string;
  last_check: string;
  description: string;
}

interface MetricasSistema {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: string;
  network_out: string;
  active_connections: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  service: string;
  message: string;
}

export default function StatusSimplifiedPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [servicos, setServicos] = useState<ServicoStatus[]>([]);
  const [metricas, setMetricas] = useState<MetricasSistema | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const isClient = useIsClient();

  // Mock data - dados de infraestrutura apenas
  const mockServicos: ServicoStatus[] = [
    {
      id: '1',
      nome: 'VCM Central Database',
      status: 'online',
      uptime: '99.9%',
      response_time: '45ms',
      last_check: '2024-03-15T16:30:00Z',
      description: 'Base de dados principal do sistema'
    },
    {
      id: '2',
      nome: 'Supabase Database',
      status: 'online',
      uptime: '99.8%',
      response_time: '67ms',
      last_check: '2024-03-15T16:30:00Z',
      description: 'Base de dados Supabase'
    },
    {
      id: '3',
      nome: 'OpenAI API',
      status: 'online',
      uptime: '99.5%',
      response_time: '234ms',
      last_check: '2024-03-15T16:29:00Z',
      description: 'Serviço de geração de conteúdo'
    },
    {
      id: '4',
      nome: 'Google AI API',
      status: 'warning',
      uptime: '97.3%',
      response_time: '456ms',
      last_check: '2024-03-15T16:28:00Z',
      description: 'Serviço Google Gemini'
    },
    {
      id: '5',
      nome: 'File Storage System',
      status: 'online',
      uptime: '99.9%',
      response_time: '23ms',
      last_check: '2024-03-15T16:30:00Z',
      description: 'Sistema de armazenamento de arquivos'
    }
  ];

  const mockMetricas: MetricasSistema = {
    cpu_usage: 23.5,
    memory_usage: 67.2,
    disk_usage: 45.8,
    network_in: '1.2 MB/s',
    network_out: '850 KB/s',
    active_connections: 142
  };

  const mockLogs: LogEntry[] = [
    {
      id: '1',
      timestamp: '2024-03-15T16:30:15Z',
      level: 'info',
      service: 'VCM Central',
      message: 'Database backup completed successfully'
    },
    {
      id: '2',
      timestamp: '2024-03-15T16:28:43Z',
      level: 'warning',
      service: 'Google AI API',
      message: 'Response time above threshold (456ms)'
    },
    {
      id: '3',
      timestamp: '2024-03-15T16:25:12Z',
      level: 'success',
      service: 'System Health',
      message: 'All systems operational'
    },
    {
      id: '4',
      timestamp: '2024-03-15T16:20:08Z',
      level: 'info',
      service: 'Supabase',
      message: 'Connection pool optimized'
    }
  ];

  useEffect(() => {
    if (isClient) {
      setTimeout(() => {
        setServicos(mockServicos);
        setMetricas(mockMetricas);
        setLogs(mockLogs);
        setLoading(false);
      }, 1000);
    }
  }, [isClient]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'offline':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'maintenance':
        return <Settings className="h-5 w-5 text-blue-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      case 'maintenance':
        return <Badge className="bg-blue-100 text-blue-800">Manutenção</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getLogBadge = (level: string) => {
    switch (level) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
    }
  };

  const getOverallStatus = () => {
    const onlineCount = servicos.filter(s => s.status === 'online').length;
    const totalCount = servicos.length;
    const percentage = (onlineCount / totalCount) * 100;

    if (percentage >= 90) return { status: 'Operational', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentage >= 70) return { status: 'Degraded', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'Major Outage', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const overallStatus = getOverallStatus();

  if (!isClient || loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Infrastructure Status</h1>
              <p className="text-gray-600">Monitoramento de infraestrutura do sistema VCM</p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  Scripts e execução → Acesse /tools
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-4 py-2 rounded-full ${overallStatus.bg}`}>
              <span className={`font-semibold ${overallStatus.color}`}>
                {overallStatus.status}
              </span>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Status Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {servicos.filter(s => s.status === 'online').length}
                  </p>
                  <p className="text-sm text-gray-600">Serviços Online</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {servicos.filter(s => s.status === 'warning').length}
                  </p>
                  <p className="text-sm text-gray-600">Avisos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {servicos.filter(s => s.status === 'offline').length}
                  </p>
                  <p className="text-sm text-gray-600">Serviços Offline</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">99.2%</p>
                  <p className="text-sm text-gray-600">Uptime Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs Principais - Foco apenas em infraestrutura */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="servicos">Infraestrutura</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Serviços de Infraestrutura */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5 text-blue-600" />
                  <span>Infraestrutura</span>
                </CardTitle>
                <CardDescription>Status dos componentes de infraestrutura</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {servicos.map((servico) => (
                    <div key={servico.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(servico.status)}
                        <div>
                          <p className="font-medium text-sm">{servico.nome}</p>
                          <p className="text-xs text-gray-500">
                            Uptime: {servico.uptime} | Response: {servico.response_time}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(servico.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métricas do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5 text-purple-600" />
                  <span>Recursos do Sistema</span>
                </CardTitle>
                <CardDescription>Utilização em tempo real</CardDescription>
              </CardHeader>
              <CardContent>
                {metricas && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU</span>
                        <span>{metricas.cpu_usage}%</span>
                      </div>
                      <Progress value={metricas.cpu_usage} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Memória</span>
                        <span>{metricas.memory_usage}%</span>
                      </div>
                      <Progress value={metricas.memory_usage} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Disco</span>
                        <span>{metricas.disk_usage}%</span>
                      </div>
                      <Progress value={metricas.disk_usage} className="h-2" />
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Network In: {metricas.network_in}</span>
                        <span>Network Out: {metricas.network_out}</span>
                      </div>
                      <div className="text-center text-xs text-gray-500 mt-1">
                        Conexões Ativas: {metricas.active_connections}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Infraestrutura */}
        <TabsContent value="servicos">
          <Card>
            <CardHeader>
              <CardTitle>Serviços de Infraestrutura</CardTitle>
              <CardDescription>
                Monitoramento detalhado de todos os componentes de infraestrutura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {servicos.map((servico) => (
                  <Card key={servico.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(servico.status)}
                          <div>
                            <h3 className="font-semibold">{servico.nome}</h3>
                            <p className="text-sm text-gray-600">{servico.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(servico.status)}
                          <div className="text-xs text-gray-500 mt-1">
                            Last check: {new Date(servico.last_check).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Uptime:</span>
                          <span className="ml-2 font-medium">{servico.uptime}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Response Time:</span>
                          <span className="ml-2 font-medium">{servico.response_time}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                Logs recentes do sistema (apenas infraestrutura)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="mt-0.5">
                      {getLogIcon(log.level)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getLogBadge(log.level)}
                        <span className="text-sm font-medium">{log.service}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}