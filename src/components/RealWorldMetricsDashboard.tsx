'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  BarChart3,
  Activity
} from 'lucide-react';
import { SupabaseSingleton } from '@/lib/supabase';

interface Intervention {
  id: string;
  user_id: string;
  user_email: string;
  intervention_type: string;
  command_template: string;
  target_task_id: string;
  status: string;
  expected_metrics: Record<string, any>;
  actual_metrics: Record<string, any>;
  metrics_confirmed: boolean;
  metrics_confirmed_at: string | null;
  created_at: string;
  processing_completed_at: string | null;
  target_persona_id: string;
}

interface MetricComparison {
  name: string;
  expected: number;
  actual: number;
  unit: string;
  achieved: number; // porcentagem
  status: 'above' | 'on-target' | 'below' | 'pending';
}

interface RealWorldMetricsDashboardProps {
  userId?: string;
  personaId?: string;
  empresaId?: string;
}

export function RealWorldMetricsDashboard({ 
  userId, 
  personaId, 
  empresaId 
}: RealWorldMetricsDashboardProps) {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadInterventions();
  }, [userId, personaId]);

  const loadInterventions = async () => {
    setLoading(true);
    try {
      // Usar API REST ao invés de query direta
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await fetch(`/api/interventions?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar intervenções');
      }

      setInterventions(data.interventions || []);
    } catch (error: any) {
      console.error('Error loading interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmMetrics = async (interventionId: string, actualMetrics: Record<string, any>) => {
    try {
      // Usar API REST ao invés de update direto
      const response = await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId || 'current-user',
          user_email: 'user@example.com', // TODO: Pegar do contexto
          intervention_type: 'confirm_metric',
          command_data: { actual_metrics: actualMetrics },
          target_task_id: interventionId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao confirmar métricas');
      }
      
      await loadInterventions();
      setSelectedIntervention(null);
    } catch (error: any) {
      console.error('Error confirming metrics:', error);
      alert(error.message || 'Erro ao confirmar métricas. Tente novamente.');
    }
  };

  const calculateMetricComparisons = (intervention: Intervention): MetricComparison[] => {
    if (!intervention.expected_metrics) return [];

    const comparisons: MetricComparison[] = [];

    Object.entries(intervention.expected_metrics).forEach(([key, expectedValue]) => {
      const actualValue = intervention.actual_metrics?.[key];
      
      let status: MetricComparison['status'] = 'pending';
      let achieved = 0;

      if (actualValue !== undefined && actualValue !== null) {
        achieved = (actualValue / expectedValue) * 100;
        
        if (achieved >= 100) status = 'above';
        else if (achieved >= 80) status = 'on-target';
        else status = 'below';
      }

      comparisons.push({
        name: key,
        expected: expectedValue,
        actual: actualValue || 0,
        unit: '', // TODO: extrair unidade do nome da métrica
        achieved,
        status
      });
    });

    return comparisons;
  };

  const filteredInterventions = interventions.filter(int => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'confirmed' && !int.metrics_confirmed) return false;
      if (filterStatus === 'pending' && int.metrics_confirmed) return false;
    }
    if (filterType !== 'all' && int.intervention_type !== filterType) return false;
    return true;
  });

  const stats = {
    total: interventions.length,
    confirmed: interventions.filter(i => i.metrics_confirmed).length,
    pending: interventions.filter(i => !i.metrics_confirmed && i.status === 'completed').length,
    avgAchievement: 0
  };

  // Calcula achievement médio
  const achievedInterventions = interventions.filter(i => i.metrics_confirmed);
  if (achievedInterventions.length > 0) {
    const totalAchievement = achievedInterventions.reduce((sum, int) => {
      const comparisons = calculateMetricComparisons(int);
      const avgAchieved = comparisons.reduce((s, c) => s + c.achieved, 0) / comparisons.length;
      return sum + avgAchieved;
    }, 0);
    stats.avgAchievement = totalAchievement / achievedInterventions.length;
  }

  const getStatusColor = (status: MetricComparison['status']) => {
    switch (status) {
      case 'above': return 'text-green-600';
      case 'on-target': return 'text-blue-600';
      case 'below': return 'text-red-600';
      case 'pending': return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: MetricComparison['status']) => {
    switch (status) {
      case 'above': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'on-target': return <Target className="w-4 h-4 text-blue-600" />;
      case 'below': return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Intervenções registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Métricas verificadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.avgAchievement.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Atingimento médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Métricas de Tarefas Reais</CardTitle>
              <CardDescription>
                Acompanhamento de resultados esperados vs reais
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="create_task">Criar Tarefa</SelectItem>
                  <SelectItem value="modify_task">Modificar Tarefa</SelectItem>
                  <SelectItem value="confirm_metric">Confirmar Métrica</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadInterventions} variant="outline">
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : filteredInterventions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Target className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhuma métrica encontrada</p>
              <p className="text-sm text-muted-foreground">
                Crie tarefas para começar a acompanhar métricas
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredInterventions.map((intervention) => {
                  const comparisons = calculateMetricComparisons(intervention);
                  const avgAchieved = comparisons.length > 0
                    ? comparisons.reduce((sum, c) => sum + c.achieved, 0) / comparisons.length
                    : 0;

                  return (
                    <Card
                      key={intervention.id}
                      className={`cursor-pointer transition-all hover:border-primary ${
                        selectedIntervention?.id === intervention.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedIntervention(intervention)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{intervention.command_template || intervention.intervention_type}</Badge>
                              {intervention.metrics_confirmed ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Confirmada
                                </Badge>
                              ) : intervention.status === 'completed' ? (
                                <Badge className="bg-orange-100 text-orange-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pendente
                                </Badge>
                              ) : (
                                <Badge variant="secondary">{intervention.status}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(intervention.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>

                          {intervention.metrics_confirmed && (
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${
                                avgAchieved >= 100 ? 'text-green-600' :
                                avgAchieved >= 80 ? 'text-blue-600' :
                                'text-red-600'
                              }`}>
                                {avgAchieved.toFixed(0)}%
                              </div>
                              <p className="text-xs text-muted-foreground">Atingimento</p>
                            </div>
                          )}
                        </div>

                        {/* Mini visualização das métricas */}
                        {comparisons.length > 0 && (
                          <div className="space-y-2">
                            {comparisons.slice(0, 3).map((comparison) => (
                              <div key={comparison.name} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="capitalize">{comparison.name.replace(/_/g, ' ')}</span>
                                  <span className={getStatusColor(comparison.status)}>
                                    {comparison.status === 'pending' ? (
                                      'Pendente'
                                    ) : (
                                      <>
                                        {comparison.actual} / {comparison.expected}
                                        {comparison.unit && ` ${comparison.unit}`}
                                      </>
                                    )}
                                  </span>
                                </div>
                                {comparison.status !== 'pending' && (
                                  <Progress 
                                    value={Math.min(100, comparison.achieved)} 
                                    className={`h-1 ${
                                      comparison.status === 'above' ? 'bg-green-100' :
                                      comparison.status === 'on-target' ? 'bg-blue-100' :
                                      'bg-red-100'
                                    }`}
                                  />
                                )}
                              </div>
                            ))}
                            {comparisons.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{comparisons.length - 3} métricas adicionais
                              </p>
                            )}
                          </div>
                        )}

                        {!intervention.metrics_confirmed && intervention.status === 'completed' && (
                          <Button 
                            size="sm" 
                            className="w-full mt-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIntervention(intervention);
                            }}
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Confirmar Métricas
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes / Confirmação */}
      {selectedIntervention && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Detalhes da Intervenção</CardTitle>
                  <CardDescription>
                    {selectedIntervention.command_template || selectedIntervention.intervention_type}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIntervention(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <Badge>{selectedIntervention.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Criado em</p>
                  <p className="font-medium">
                    {new Date(selectedIntervention.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                {selectedIntervention.metrics_confirmed && (
                  <div>
                    <p className="text-muted-foreground mb-1">Confirmado em</p>
                    <p className="font-medium">
                      {new Date(selectedIntervention.metrics_confirmed_at!).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-3">Métricas Comparadas</h4>
                <div className="space-y-4">
                  {calculateMetricComparisons(selectedIntervention).map((comparison) => (
                    <div key={comparison.name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(comparison.status)}
                          <span className="font-medium capitalize">
                            {comparison.name.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {comparison.status !== 'pending' && (
                          <Badge className={
                            comparison.status === 'above' ? 'bg-green-100 text-green-800' :
                            comparison.status === 'on-target' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {comparison.achieved.toFixed(0)}%
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <p className="text-muted-foreground">Esperado</p>
                          <p className="font-semibold text-lg">{comparison.expected}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Real</p>
                          <p className={`font-semibold text-lg ${getStatusColor(comparison.status)}`}>
                            {comparison.status === 'pending' ? '—' : comparison.actual}
                          </p>
                        </div>
                      </div>

                      {comparison.status !== 'pending' && (
                        <Progress value={Math.min(100, comparison.achieved)} className="h-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {!selectedIntervention.metrics_confirmed && selectedIntervention.status === 'completed' && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Esta funcionalidade de confirmação manual será implementada em versão futura.
                    Por enquanto, as métricas são confirmadas automaticamente pelo sistema.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      // TODO: Implementar formulário de confirmação manual
                      alert('Funcionalidade em desenvolvimento');
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmar Métricas Manualmente
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
