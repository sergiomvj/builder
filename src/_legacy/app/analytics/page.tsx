'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Target,
  Activity,
  Eye,
  Download,
  Calendar,
  PieChart,
  LineChart,
  Database,
  Cpu,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Settings
} from 'lucide-react';
import { useIsClient } from '@/components/no-ssr';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MetricaGeral {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
}

interface ProcessoExecucao {
  id: string;
  nome: string;
  status: 'concluido' | 'executando' | 'erro';
  duracao: string;
  timestamp: string;
  output_size: string;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [processos, setProcessos] = useState<ProcessoExecucao[]>([]);
  const [metricas, setMetricas] = useState<MetricaGeral[]>([]);
  const [stats, setStats] = useState({
    totalPersonas: 0,
    totalEmpresas: 0,
    totalMetas: 0,
    progressoMedio: 0,
    personasPorEmpresa: [] as any[]
  });
  const isClient = useIsClient();

  useEffect(() => {
    if (isClient) {
      loadAnalytics();
    }
  }, [isClient]);

  async function loadAnalytics() {
    try {
      setLoading(true);

      // Buscar total de personas
      const { count: totalPersonas } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      // Buscar total de empresas
      const { count: totalEmpresas } = await supabase
        .from('empresas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativa');

      // Buscar total de metas
      const { count: totalMetas } = await supabase
        .from('personas_metas')
        .select('*', { count: 'exact', head: true });

      // Buscar progresso médio das metas
      const { data: metasData } = await supabase
        .from('personas_metas')
        .select('progresso_percentual');
      
      const progressoMedio = metasData && metasData.length > 0
        ? metasData.reduce((acc, m) => acc + (m.progresso_percentual || 0), 0) / metasData.length
        : 0;

      // Buscar distribuição de personas por empresa
      const { data: personasPorEmpresa } = await supabase
        .from('personas')
        .select('empresa_id, empresas(nome, codigo)')
        .eq('status', 'ativo');

      const distribuicao = personasPorEmpresa?.reduce((acc: any, p: any) => {
        const empresaNome = p.empresas?.nome || 'Sem Empresa';
        acc[empresaNome] = (acc[empresaNome] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalPersonas: totalPersonas || 0,
        totalEmpresas: totalEmpresas || 0,
        totalMetas: totalMetas || 0,
        progressoMedio: Math.round(progressoMedio * 100) / 100,
        personasPorEmpresa: Object.entries(distribuicao || {}).map(([nome, count]) => ({
          nome,
          count
        }))
      });

      // Criar métricas com dados reais
      const metricasReais: MetricaGeral[] = [
        {
          label: 'Total de Personas',
          value: totalPersonas || 0,
          change: '+12.5%',
          trend: 'up',
          icon: <Users className="h-5 w-5 text-blue-600" />
        },
        {
          label: 'Empresas Virtuais',
          value: totalEmpresas || 0,
          change: '+3',
          trend: 'up', 
          icon: <Building2 className="h-5 w-5 text-green-600" />
        },
        {
          label: 'Metas Cadastradas',
          value: totalMetas || 0,
          change: '+47',
          trend: 'up',
          icon: <Target className="h-5 w-5 text-purple-600" />
        },
        {
          label: 'Progresso Médio',
          value: `${Math.round(progressoMedio)}%`,
          change: '+8.2%',
          trend: 'up',
          icon: <Activity className="h-5 w-5 text-orange-600" />
        }
      ];

      setMetricas(metricasReais);
      setProcessos(mockProcessos);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const mockProcessos: ProcessoExecucao[] = [
    {
      id: '1',
      nome: 'Geração Biografias - LifewayUSA',
      status: 'concluido',
      duracao: '8m 32s',
      timestamp: '2024-03-15T14:30:00Z',
      output_size: '2.4 MB'
    },
    {
      id: '2',
      nome: 'Análise Competências - TechCorp',
      status: 'executando',
      duracao: '3m 15s',
      timestamp: '2024-03-15T15:45:00Z',
      output_size: '-'
    },
    {
      id: '3',
      nome: 'RAG Database Sync',
      status: 'concluido',
      duracao: '12m 8s',
      timestamp: '2024-03-15T13:20:00Z',
      output_size: '15.7 MB'
    },
    {
      id: '4',
      nome: 'N8N Workflows Generation',
      status: 'erro',
      duracao: '1m 45s',
      timestamp: '2024-03-15T12:10:00Z',
      output_size: '0.2 MB'
    }
  ];

  useEffect(() => {
    if (isClient) {
      setTimeout(() => {
        setProcessos(mockProcessos);
        setLoading(false);
      }, 1000);
    }
  }, [isClient]);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'executando':
        return <Badge className="bg-blue-100 text-blue-800">Executando</Badge>;
      case 'erro':
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'executando':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'erro':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (!isClient || loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
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
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Métricas e insights do sistema VCM</p>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricas.map((metrica: MetricaGeral, index: number) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metrica.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{metrica.value}</p>
                    <p className={`text-sm mt-1 ${getTrendColor(metrica.trend)}`}>
                      {metrica.change} desde o último mês
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-full">
                    {metrica.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="utilizacao">Utilização</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Tab: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Execuções Recentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Execuções Recentes</span>
                </CardTitle>
                <CardDescription>Últimos processos executados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processos.map((processo) => (
                    <div key={processo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(processo.status)}
                        <div>
                          <p className="font-medium text-sm">{processo.nome}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(processo.timestamp).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(processo.status)}
                        <p className="text-xs text-gray-500 mt-1">{processo.duracao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Status do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5 text-green-600" />
                  <span>Status do Sistema</span>
                </CardTitle>
                <CardDescription>Saúde e performance em tempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU</span>
                      <span>23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memória</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Disco</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Database Load</span>
                      <span>12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                </div>

                <div className="mt-6 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Sistema operando normalmente
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos de Tendências */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5 text-purple-600" />
                  <span>Personas Criadas</span>
                </CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                    <p className="text-gray-600">Gráfico de tendências</p>
                    <p className="text-sm text-gray-500">Em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-orange-600" />
                  <span>Distribuição por Empresa</span>
                </CardTitle>
                <CardDescription>Personas ativas por empresa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.personasPorEmpresa.slice(0, 5).map((item, index) => {
                    const percentage = ((item.count / stats.totalPersonas) * 100).toFixed(1);
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                    return (
                      <div key={index}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{item.nome}</span>
                          <span className="text-gray-600">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {stats.personasPorEmpresa.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <PieChart className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>Nenhum dado disponível</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Performance */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tempos de Execução por Script</CardTitle>
                <CardDescription>Performance dos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { nome: 'Geração de Biografias', tempo: '8m 32s', media: '7m 45s', trend: 'up' },
                    { nome: 'Análise de Competências', tempo: '3m 15s', media: '3m 22s', trend: 'down' },
                    { nome: 'Tech Specifications', tempo: '12m 8s', media: '11m 30s', trend: 'up' },
                    { nome: 'RAG Database', tempo: '18m 45s', media: '16m 12s', trend: 'up' },
                    { nome: 'N8N Workflows', tempo: '6m 22s', media: '6m 18s', trend: 'stable' }
                  ].map((script, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{script.nome}</p>
                        <p className="text-sm text-gray-600">Média: {script.media}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{script.tempo}</p>
                        <div className={`text-sm ${getTrendColor(script.trend)}`}>
                          {script.trend === 'up' && '↗️ +5%'}
                          {script.trend === 'down' && '↘️ -3%'}
                          {script.trend === 'stable' && '➡️ Estável'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Qualidade</CardTitle>
                <CardDescription>Indicadores de saúde</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Taxa de Sucesso</span>
                      <span className="font-bold text-green-600">94.2%</span>
                    </div>
                    <Progress value={94.2} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Qualidade dos Dados</span>
                      <span className="font-bold text-blue-600">91.8%</span>
                    </div>
                    <Progress value={91.8} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Velocidade Média</span>
                      <span className="font-bold text-purple-600">87.3%</span>
                    </div>
                    <Progress value={87.3} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Disponibilidade</span>
                      <span className="font-bold text-orange-600">99.1%</span>
                    </div>
                    <Progress value={99.1} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Utilização */}
        <TabsContent value="utilizacao">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>Uso de Recursos</span>
                </CardTitle>
                <CardDescription>Consumo por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { categoria: 'Geração de Conteúdo', uso: 45, cor: 'bg-blue-500' },
                    { categoria: 'Processamento de Dados', uso: 32, cor: 'bg-green-500' },
                    { categoria: 'Sincronização', uso: 15, cor: 'bg-yellow-500' },
                    { categoria: 'Backups', uso: 8, cor: 'bg-purple-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-32">
                        <p className="text-sm font-medium">{item.categoria}</p>
                      </div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.cor}`}
                            style={{ width: `${item.uso}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right">
                        <p className="text-sm font-bold">{item.uso}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Crescimento</span>
                </CardTitle>
                <CardDescription>Evolução mensal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metrica: 'Personas Criadas', atual: 247, anterior: 189, crescimento: '+30.7%' },
                    { metrica: 'Empresas Ativas', atual: 12, anterior: 9, crescimento: '+33.3%' },
                    { metrica: 'Scripts Executados', atual: 1847, anterior: 1423, crescimento: '+29.8%' },
                    { metrica: 'Dados Processados', atual: '2.1 GB', anterior: '1.6 GB', crescimento: '+31.3%' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.metrica}</p>
                        <p className="text-xs text-gray-600">Anterior: {item.anterior}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.atual}</p>
                        <p className="text-sm text-green-600">{item.crescimento}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Relatórios */}
        <TabsContent value="relatorios">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-blue-500" />
                  <span>Relatório Semanal</span>
                </CardTitle>
                <CardDescription>Resumo das atividades da semana</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-6 w-6 text-green-500" />
                  <span>Dashboard Executivo</span>
                </CardTitle>
                <CardDescription>Métricas para gestores</CardDescription>
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
                  <Calendar className="h-6 w-6 text-purple-500" />
                  <span>Relatório Mensal</span>
                </CardTitle>
                <CardDescription>Análise completa do mês</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Relatórios Automáticos</CardTitle>
              <CardDescription>Configure envios automáticos de relatórios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { tipo: 'Diário', destinatarios: '3 pessoas', status: 'Ativo', proxima: '08:00' },
                  { tipo: 'Semanal', destinatarios: '7 pessoas', status: 'Ativo', proxima: 'Segunda, 09:00' },
                  { tipo: 'Mensal', destinatarios: '12 pessoas', status: 'Pausado', proxima: 'Dia 1, 10:00' }
                ].map((relatorio, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Relatório {relatorio.tipo}</p>
                      <p className="text-sm text-gray-600">{relatorio.destinatarios} • Próximo: {relatorio.proxima}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={relatorio.status === 'Ativo' ? 'default' : 'secondary'}>
                        {relatorio.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
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