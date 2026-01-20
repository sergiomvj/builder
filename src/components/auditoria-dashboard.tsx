"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Users,
  Workflow,
  Target,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AuditoriaService } from '@/lib/auditoria-service';
import { metricsCollector } from '@/lib/metrics-collector';
import { alertsEngine } from '@/lib/alerts-engine';
import type { 
  AuditoriaWorkflowMetrics, 
  AuditoriaTeamPerformance, 
  AuditoriaKPIAnalysis, 
  AuditoriaAlerta 
} from '@/types/auditoria';

interface AuditoriaDashboardProps {
  empresaId: string;
  empresaNome: string;
}

export default function AuditoriaDashboard({ empresaId, empresaNome }: AuditoriaDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Estados dos dados
  const [workflowMetrics, setWorkflowMetrics] = useState<AuditoriaWorkflowMetrics[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<AuditoriaTeamPerformance[]>([]);
  const [kpiAnalysis, setKpiAnalysis] = useState<AuditoriaKPIAnalysis[]>([]);
  const [alertas, setAlertas] = useState<AuditoriaAlerta[]>([]);
  const [collectionStatus, setCollectionStatus] = useState<any>({});

  const auditoriaService = new AuditoriaService();

  // ===================================================
  // CARREGAMENTO DE DADOS
  // ===================================================

  useEffect(() => {
    loadDashboardData();
    loadCollectionStatus();

    // Auto-refresh a cada 5 minutos
    const interval = setInterval(() => {
      loadDashboardData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [empresaId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      const [workflows, team, kpis, alerts] = await Promise.all([
        auditoriaService.getWorkflowMetrics(empresaId, 'semana'),
        auditoriaService.getTeamPerformance(empresaId, 'semana'),
        auditoriaService.getKPIAnalysis(empresaId),
        auditoriaService.getAlertas(empresaId)
      ]);

      setWorkflowMetrics(workflows);
      setTeamPerformance(team);
      setKpiAnalysis(kpis);
      setAlertas(alerts);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados da auditoria:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollectionStatus = async () => {
    try {
      const status = await metricsCollector.getCollectionStatus();
      setCollectionStatus(status);
    } catch (error) {
      console.error('Erro ao buscar status da coleta:', error);
    }
  };

  // ===================================================
  // MÉTRICAS CALCULADAS
  // ===================================================

  const overviewMetrics = {
    totalWorkflows: workflowMetrics.length,
    avgEfficiency: workflowMetrics.length > 0 ? 
      Math.round(workflowMetrics.reduce((acc, w) => acc + w.efficiency_score, 0) / workflowMetrics.length) : 0,
    totalPersonas: teamPerformance.length,
    avgTeamPerformance: teamPerformance.length > 0 ?
      Math.round(teamPerformance.reduce((acc, p) => acc + p.quality_score, 0) / teamPerformance.length) : 0,
    totalKPIs: kpiAnalysis.length,
    kpisOnTrack: kpiAnalysis.filter(k => k.performance_status === 'on_track').length,
    totalAlerts: alertas.length,
    criticalAlerts: alertas.filter(a => a.severidade === 'critical').length
  };

  const alertsByType = alertas.reduce((acc, alert) => {
    acc[alert.tipo] = (acc[alert.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trendData = workflowMetrics.slice(-7).map((metric, index) => ({
    day: `Dia ${index + 1}`,
    efficiency: metric.efficiency_score,
    productivity: metric.productivity_index * 10, // Scale for display
    success_rate: metric.success_rate * 100
  }));

  // ===================================================
  // HANDLERS
  // ===================================================

  const handleRefresh = () => {
    loadDashboardData();
    loadCollectionStatus();
  };

  const handleStartCollection = async () => {
    try {
      await metricsCollector.startAutomaticCollection(30); // 30 minutes
      loadCollectionStatus();
    } catch (error) {
      console.error('Erro ao iniciar coleta:', error);
    }
  };

  const handleStopCollection = async () => {
    try {
      await metricsCollector.stopAutomaticCollection();
      loadCollectionStatus();
    } catch (error) {
      console.error('Erro ao parar coleta:', error);
    }
  };

  const handleExportReport = () => {
    // Implementar export de relatório
    console.log('Exportando relatório...');
  };

  // ===================================================
  // CORES PARA GRÁFICOS
  // ===================================================

  const COLORS = {
    primary: '#2563eb',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0891b2'
  };

  const pieColors = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.error, COLORS.info];

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auditoria de Performance</h1>
          <p className="text-gray-500 mt-1">{empresaNome}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Status da Coleta */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Status da Coleta de Métricas
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant={collectionStatus.is_running ? "default" : "secondary"}>
                {collectionStatus.is_running ? 'Ativa' : 'Inativa'}
              </Badge>
              <span className="text-sm text-gray-600">
                Coleta automática de dados de performance
              </span>
            </div>
            
            <div className="flex space-x-2">
              {!collectionStatus.is_running ? (
                <Button size="sm" onClick={handleStartCollection}>
                  Iniciar Coleta
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleStopCollection}>
                  Parar Coleta
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Workflow className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Workflows</p>
                <p className="text-2xl font-bold">{overviewMetrics.totalWorkflows}</p>
                <p className="text-xs text-green-600">
                  {overviewMetrics.avgEfficiency}% eficiência média
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Equipe</p>
                <p className="text-2xl font-bold">{overviewMetrics.totalPersonas}</p>
                <p className="text-xs text-green-600">
                  {overviewMetrics.avgTeamPerformance}% performance média
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">KPIs</p>
                <p className="text-2xl font-bold">{overviewMetrics.kpisOnTrack}/{overviewMetrics.totalKPIs}</p>
                <p className="text-xs text-green-600">No prazo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Alertas</p>
                <p className="text-2xl font-bold">{overviewMetrics.totalAlerts}</p>
                <p className="text-xs text-red-600">
                  {overviewMetrics.criticalAlerts} críticos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Tendências */}
            <Card>
              <CardHeader>
                <CardTitle>Tendências de Performance</CardTitle>
                <CardDescription>
                  Evolução da eficiência e produtividade ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      name="Eficiência (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="productivity" 
                      stroke={COLORS.success} 
                      strokeWidth={2}
                      name="Produtividade"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="success_rate" 
                      stroke={COLORS.warning} 
                      strokeWidth={2}
                      name="Taxa de Sucesso (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição de Alertas */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Alertas</CardTitle>
                <CardDescription>
                  Alertas por categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(alertsByType).map(([type, count], index) => ({
                        name: type.replace('_', ' '),
                        value: count,
                        fill: pieColors[index % pieColors.length]
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {Object.entries(alertsByType).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Alertas Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Alertas Recentes</CardTitle>
              <CardDescription>
                Últimos alertas gerados pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertas.slice(0, 5).map((alerta) => (
                  <div key={alerta.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={
                        alerta.severidade === 'critical' ? 'destructive' :
                        alerta.severidade === 'error' ? 'destructive' :
                        alerta.severidade === 'warning' ? 'default' : 'secondary'
                      }>
                        {alerta.severidade}
                      </Badge>
                      <div>
                        <p className="font-medium">{alerta.titulo}</p>
                        <p className="text-sm text-gray-500">{alerta.descricao}</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {alerta.created_at.toLocaleString()}
                    </div>
                  </div>
                ))}
                
                {alertas.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Nenhum alerta ativo no momento
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Workflows */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {workflowMetrics.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{workflow.workflow_name}</CardTitle>
                  <CardDescription>{workflow.persona_name} - {workflow.departamento}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Eficiência</span>
                        <span>{workflow.efficiency_score}%</span>
                      </div>
                      <Progress value={workflow.efficiency_score} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Execuções:</span>
                        <span className="font-medium ml-1">{workflow.executions_total}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Sucesso:</span>
                        <span className="font-medium ml-1">{Math.round(workflow.success_rate * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tempo médio:</span>
                        <span className="font-medium ml-1">{Math.round(workflow.avg_execution_time_ms / 1000)}s</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tendência:</span>
                        <span className="font-medium ml-1 flex items-center">
                          {workflow.trend_direction === 'improving' ? (
                            <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                          ) : workflow.trend_direction === 'declining' ? (
                            <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                          ) : (
                            <span className="text-gray-400">Estável</span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {workflow.bottleneck_detected && (
                      <Badge variant="destructive" className="text-xs">
                        Gargalo detectado
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Equipe */}
        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {teamPerformance.map((member) => (
              <Card key={member.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Persona {member.persona_id.slice(0, 8)}</CardTitle>
                  <CardDescription>{member.departamento}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Qualidade</span>
                        <span>{Math.round(member.quality_score)}%</span>
                      </div>
                      <Progress value={member.quality_score} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Concluídas:</span>
                        <span className="font-medium ml-1">{member.tasks_completed}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Pendentes:</span>
                        <span className="font-medium ml-1">{member.tasks_pending}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Utilização:</span>
                        <span className="font-medium ml-1">{Math.round(member.workload_utilization * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Colaboração:</span>
                        <span className="font-medium ml-1">{member.collaboration_score}%</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {member.overload_risk && (
                        <Badge variant="destructive" className="text-xs">Sobrecarga</Badge>
                      )}
                      {member.underutilized && (
                        <Badge variant="secondary" className="text-xs">Subutilizado</Badge>
                      )}
                      {member.stress_indicator > 0.7 && (
                        <Badge variant="destructive" className="text-xs">Alto Stress</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: KPIs */}
        <TabsContent value="kpis" className="space-y-4">
          <div className="space-y-4">
            {kpiAnalysis.map((kpi) => (
              <Card key={kpi.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{kpi.meta_titulo}</CardTitle>
                      <CardDescription>{kpi.meta_descricao}</CardDescription>
                    </div>
                    <Badge variant={
                      kpi.performance_status === 'on_track' ? 'default' :
                      kpi.performance_status === 'at_risk' ? 'default' :
                      kpi.performance_status === 'off_track' ? 'destructive' : 'default'
                    }>
                      {kpi.performance_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progresso Atual</span>
                        <span>{kpi.meta_progresso_atual}% (esperado: {Math.round(kpi.meta_progresso_esperado)}%)</span>
                      </div>
                      <Progress value={kpi.meta_progresso_atual} className="h-3" />
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Prazo:</span>
                        <span className="font-medium ml-1">
                          {kpi.meta_prazo.toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Variância:</span>
                        <span className="font-medium ml-1">
                          {kpi.variance_percentage > 0 ? '+' : ''}{Math.round(kpi.variance_percentage)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Risco:</span>
                        <span className="font-medium ml-1">{kpi.risk_level}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Velocidade:</span>
                        <span className="font-medium ml-1">{kpi.velocity_score.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    {kpi.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Recomendações:</p>
                        <div className="space-y-1">
                          {kpi.recommendations.slice(0, 3).map((rec, index) => (
                            <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              {rec.action}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Alertas */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-3">
            {alertas.map((alerta) => (
              <Card key={alerta.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant={
                          alerta.severidade === 'critical' ? 'destructive' :
                          alerta.severidade === 'error' ? 'destructive' :
                          alerta.severidade === 'warning' ? 'default' : 'secondary'
                        }>
                          {alerta.severidade}
                        </Badge>
                        <span className="text-sm text-gray-500">{alerta.tipo.replace('_', ' ')}</span>
                      </div>
                      
                      <h3 className="font-medium mb-1">{alerta.titulo}</h3>
                      <p className="text-sm text-gray-600 mb-3">{alerta.descricao}</p>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-500">
                        <div>
                          <span>Métrica:</span>
                          <span className="font-medium ml-1">{alerta.metric_name}</span>
                        </div>
                        <div>
                          <span>Valor atual:</span>
                          <span className="font-medium ml-1">{alerta.current_value}</span>
                        </div>
                        <div>
                          <span>Threshold:</span>
                          <span className="font-medium ml-1">{alerta.threshold_value}</span>
                        </div>
                        <div>
                          <span>Confiança:</span>
                          <span className="font-medium ml-1">{Math.round(alerta.confidence_score * 100)}%</span>
                        </div>
                      </div>
                      
                      {alerta.recommended_actions.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium mb-1">Ações recomendadas:</p>
                          <div className="space-y-1">
                            {alerta.recommended_actions.slice(0, 2).map((action, index) => (
                              <div key={index} className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                                • {action}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400 ml-4">
                      {alerta.created_at.toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {alertas.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Nenhum alerta ativo</p>
                    <p className="text-sm">O sistema está funcionando normalmente.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}