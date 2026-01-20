'use client';

import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Target,
  Calendar, Users, DollarSign, Clock,
  Activity, Award, AlertCircle, CheckCircle,
  Filter, Download, RefreshCw, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MetricCard {
  titulo: string;
  valor: string;
  variacao: number;
  icon: React.ComponentType<any>;
  color: string;
  descricao: string;
}

interface GraficoData {
  periodo: string;
  concluidas: number;
  emProgresso: number;
  atrasadas: number;
  roi: number;
}

export function Analytics() {
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>('trimestre');
  const [metaSelecionada, setMetaSelecionada] = useState<string>('todas');

  const metricas: MetricCard[] = [
    {
      titulo: 'Taxa de Conclusão',
      valor: '78%',
      variacao: 12,
      icon: CheckCircle,
      color: 'text-green-600',
      descricao: 'Metas concluídas vs planejadas'
    },
    {
      titulo: 'Performance Geral',
      valor: '85%',
      variacao: 8,
      icon: TrendingUp,
      color: 'text-blue-600',
      descricao: 'Pontuação média de performance'
    },
    {
      titulo: 'ROI Médio',
      valor: '340%',
      variacao: 25,
      icon: DollarSign,
      color: 'text-purple-600',
      descricao: 'Retorno sobre investimento'
    },
    {
      titulo: 'Tempo Médio',
      valor: '89 dias',
      variacao: -15,
      icon: Clock,
      color: 'text-orange-600',
      descricao: 'Prazo médio de conclusão'
    }
  ];

  const dadosGrafico: GraficoData[] = [
    { periodo: 'Q1 2024', concluidas: 12, emProgresso: 8, atrasadas: 2, roi: 280 },
    { periodo: 'Q2 2024', concluidas: 15, emProgresso: 10, atrasadas: 1, roi: 320 },
    { periodo: 'Q3 2024', concluidas: 18, emProgresso: 12, atrasadas: 3, roi: 340 },
    { periodo: 'Q4 2024', concluidas: 22, emProgresso: 15, atrasadas: 2, roi: 385 }
  ];

  const topPerformers = [
    { nome: 'Maria Silva (CEO)', metasConcluidas: 8, taxa: 92, roi: 450 },
    { nome: 'João Santos (CMO)', metasConcluidas: 6, taxa: 89, roi: 380 },
    { nome: 'Carlos Tech (CTO)', metasConcluidas: 7, taxa: 85, roi: 320 },
    { nome: 'Sofia RH (Head RH)', metasConcluidas: 5, taxa: 83, roi: 290 },
    { nome: 'Ana Dev (Tech Lead)', metasConcluidas: 4, taxa: 80, roi: 275 }
  ];

  const alertas = [
    {
      tipo: 'warning',
      titulo: 'Meta em Risco',
      descricao: 'Crescimento 300% pode atrasar 15 dias',
      urgencia: 'media'
    },
    {
      tipo: 'info',
      titulo: 'Milestone Próximo',
      descricao: 'MVP deve ser entregue em 5 dias',
      urgencia: 'baixa'
    },
    {
      tipo: 'success',
      titulo: 'Meta Antecipada',
      descricao: 'Expansão da equipe 20% à frente do cronograma',
      urgencia: 'baixa'
    }
  ];

  const renderMetricCard = (metrica: MetricCard) => {
    const IconComponent = metrica.icon;
    return (
      <Card key={metrica.titulo}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gray-50`}>
                <IconComponent className={`h-6 w-6 ${metrica.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{metrica.titulo}</p>
                <p className={`text-2xl font-bold ${metrica.color}`}>{metrica.valor}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center ${metrica.variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrica.variacao >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(metrica.variacao)}%
                </span>
              </div>
              <p className="text-xs text-gray-500">vs mês anterior</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{metrica.descricao}</p>
        </CardContent>
      </Card>
    );
  };

  const renderBarChart = () => {
    const maxValue = Math.max(...dadosGrafico.map(d => d.concluidas + d.emProgresso + d.atrasadas));
    
    return (
      <div className="space-y-4">
        {dadosGrafico.map((data, index) => (
          <div key={data.periodo} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{data.periodo}</span>
              <div className="flex items-center space-x-4 text-xs">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                  Concluídas: {data.concluidas}
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                  Em progresso: {data.emProgresso}
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                  Atrasadas: {data.atrasadas}
                </span>
              </div>
            </div>
            
            <div className="flex h-8 bg-gray-100 rounded-lg overflow-hidden">
              <div 
                className="bg-green-500 transition-all duration-500"
                style={{ width: `${(data.concluidas / maxValue) * 100}%` }}
              ></div>
              <div 
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${(data.emProgresso / maxValue) * 100}%` }}
              ></div>
              <div 
                className="bg-red-500 transition-all duration-500"
                style={{ width: `${(data.atrasadas / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderROIChart = () => {
    const maxROI = Math.max(...dadosGrafico.map(d => d.roi));
    
    return (
      <div className="space-y-4">
        {dadosGrafico.map((data, index) => (
          <div key={data.periodo} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{data.periodo}</span>
              <span className="text-sm font-semibold text-purple-600">{data.roi}%</span>
            </div>
            <Progress 
              value={(data.roi / maxROI) * 100} 
              className="h-3"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics e Relatórios</h2>
          <p className="text-gray-600">Análise detalhada da performance das metas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Última Semana</SelectItem>
                <SelectItem value="mes">Último Mês</SelectItem>
                <SelectItem value="trimestre">Último Trimestre</SelectItem>
                <SelectItem value="ano">Último Ano</SelectItem>
              </SelectContent>
            </Select>

            <Select value={metaSelecionada} onValueChange={setMetaSelecionada}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Meta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Metas</SelectItem>
                <SelectItem value="1">Crescimento 300% em 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricas.map(renderMetricCard)}
      </div>

      {/* Alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Alertas e Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertas.map((alerta, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded-full ${
                    alerta.tipo === 'warning' ? 'bg-orange-100' :
                    alerta.tipo === 'info' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {alerta.tipo === 'warning' && <AlertCircle className="h-4 w-4 text-orange-600" />}
                    {alerta.tipo === 'info' && <Eye className="h-4 w-4 text-blue-600" />}
                    {alerta.tipo === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{alerta.titulo}</p>
                    <p className="text-gray-600 text-xs">{alerta.descricao}</p>
                  </div>
                </div>
                <Badge variant={
                  alerta.urgencia === 'alta' ? 'destructive' :
                  alerta.urgencia === 'media' ? 'secondary' : 'outline'
                }>
                  {alerta.urgencia}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos e Análises */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="previsoes">Previsões</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução das Metas por Período</CardTitle>
            </CardHeader>
            <CardContent>
              {renderBarChart()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do ROI</CardTitle>
            </CardHeader>
            <CardContent>
              {renderROIChart()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.nome} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="font-semibold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{performer.nome}</p>
                        <p className="text-sm text-gray-600">{performer.metasConcluidas} metas concluídas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                        <p className="font-semibold text-green-600">{performer.taxa}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ROI Médio</p>
                        <p className="font-semibold text-purple-600">{performer.roi}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="previsoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Previsões e Projeções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-blue-200">
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Projeção Q1 2025</p>
                    <p className="text-xl font-bold text-blue-600">95%</p>
                    <p className="text-xs text-gray-500">Taxa de conclusão esperada</p>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Meta Principal</p>
                    <p className="text-xl font-bold text-green-600">280%</p>
                    <p className="text-xs text-gray-500">Crescimento atual vs meta 300%</p>
                  </CardContent>
                </Card>

                <Card className="border-purple-200">
                  <CardContent className="p-4 text-center">
                    <Award className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">ROI Projetado</p>
                    <p className="text-xl font-bold text-purple-600">420%</p>
                    <p className="text-xs text-gray-500">Retorno esperado em 2025</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}