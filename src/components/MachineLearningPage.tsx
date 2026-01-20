'use client';

import { useState, useEffect } from 'react';
import { Brain, Activity, BarChart3, Settings, Play, Square, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Clock, Zap, Info, Target, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MLMetrics {
  total_patterns: number;
  active_patterns: number;
  applied_optimizations: number;
  system_health: 'healthy' | 'warning' | 'error';
  learning_enabled: boolean;
  auto_optimization: boolean;
  last_cycle: string;
  efficiency_score: number;
}

interface Pattern {
  id: string;
  pattern_type: string;
  pattern_name: string;
  confidence: number;
  status: 'detected' | 'applied' | 'failed';
  impact: number;
  detected_at: string;
}

interface Optimization {
  id: string;
  optimization_name: string;
  status: 'planned' | 'implementing' | 'successful' | 'failed';
  improvement: number;
  applied_at: string;
  target_scope: string;
}

export function MachineLearningPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<MLMetrics>({
    total_patterns: 0,
    active_patterns: 0,
    applied_optimizations: 0,
    system_health: 'healthy',
    learning_enabled: true,
    auto_optimization: false,
    last_cycle: '',
    efficiency_score: 0
  });
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  // Simular dados para demonstração
  useEffect(() => {
    // Simular métricas
    setMetrics({
      total_patterns: 47,
      active_patterns: 23,
      applied_optimizations: 15,
      system_health: 'healthy',
      learning_enabled: true,
      auto_optimization: true,
      last_cycle: new Date().toLocaleString('pt-BR'),
      efficiency_score: 87.5
    });

    // Simular padrões detectados
    setPatterns([
      {
        id: '1',
        pattern_type: 'workload_balance',
        pattern_name: 'Distribuição de Tarefas Otimizada',
        confidence: 0.92,
        status: 'applied',
        impact: 15.3,
        detected_at: '2025-11-17 10:30:00'
      },
      {
        id: '2',
        pattern_type: 'efficiency_improvement',
        pattern_name: 'Otimização de Subsistemas',
        confidence: 0.87,
        status: 'detected',
        impact: 12.7,
        detected_at: '2025-11-17 11:15:00'
      },
      {
        id: '3',
        pattern_type: 'timing_optimization',
        pattern_name: 'Agendamento Inteligente',
        confidence: 0.94,
        status: 'applied',
        impact: 18.9,
        detected_at: '2025-11-17 09:45:00'
      }
    ]);

    // Simular otimizações
    setOptimizations([
      {
        id: '1',
        optimization_name: 'Rebalanceamento de Carga - Marketing',
        status: 'successful',
        improvement: 23.5,
        applied_at: '2025-11-17 10:45:00',
        target_scope: 'department'
      },
      {
        id: '2',
        optimization_name: 'Ajuste de Complexidade - Tarefas Administrativas',
        status: 'implementing',
        improvement: 0,
        applied_at: '',
        target_scope: 'task_type'
      },
      {
        id: '3',
        optimization_name: 'Otimização Temporal - Reuniões',
        status: 'planned',
        improvement: 0,
        applied_at: '',
        target_scope: 'global'
      }
    ]);

    // Simular logs
    setLogs([
      '[11:45:23] 🧠 Sistema de ML iniciado com sucesso',
      '[11:45:25] 🔍 Analisando padrões de workload...',
      '[11:45:28] ✅ 3 novos padrões detectados',
      '[11:45:30] ⚡ Aplicando otimização: Rebalanceamento de Carga',
      '[11:45:32] 📊 Melhoria de 23.5% na eficiência detectada',
      '[11:45:35] 🎯 Ciclo de aprendizado concluído'
    ]);
  }, []);

  const runMLCycle = async () => {
    setIsRunning(true);
    setLogs(['[' + new Date().toLocaleTimeString() + '] 🧠 Iniciando ciclo de aprendizado...']);

    // Simular execução
    const steps = [
      'Analisando dados de execução de tarefas...',
      'Detectando padrões de eficiência...',
      'Calculando otimizações potenciais...',
      'Aplicando melhorias automáticas...',
      'Medindo impacto das mudanças...',
      'Ciclo concluído com sucesso!'
    ];

    for (let i = 0; i < steps.length; i++) {
      setTimeout(() => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${steps[i]}`]);
        
        if (i === steps.length - 1) {
          setIsRunning(false);
          // Atualizar métricas
          setMetrics(prev => ({
            ...prev,
            last_cycle: new Date().toLocaleString('pt-BR'),
            efficiency_score: Math.min(100, prev.efficiency_score + Math.random() * 5)
          }));
        }
      }, (i + 1) * 1000);
    }
  };

  const stopMLCycle = () => {
    setIsRunning(false);
    setLogs(prev => [...prev, '[' + new Date().toLocaleTimeString() + '] ⏹️ Sistema pausado pelo usuário']);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'applied': case 'successful': return 'bg-green-100 text-green-800';
      case 'warning': case 'detected': case 'implementing': return 'bg-yellow-100 text-yellow-800';
      case 'error': case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': case 'applied': case 'successful': return <CheckCircle size={16} />;
      case 'warning': case 'detected': case 'implementing': return <Clock size={16} />;
      case 'error': case 'failed': return <AlertTriangle size={16} />;
      default: return <Activity size={16} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="text-purple-600" size={32} />
            Machine Learning
          </h1>
          <p className="text-gray-600 mt-2">
            Sistema de aprendizado contínuo e otimização automática das personas virtuais
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={runMLCycle}
            disabled={isRunning}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isRunning ? (
              <>
                <RefreshCw size={20} className="mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              <>
                <Play size={20} className="mr-2" />
                Executar Ciclo ML
              </>
            )}
          </Button>
          
          {isRunning && (
            <Button
              onClick={stopMLCycle}
              variant="outline"
              className="text-red-600 border-red-300"
            >
              <Square size={20} className="mr-2" />
              Parar
            </Button>
          )}
        </div>
      </div>

      {/* Explicação do Sistema ML */}
      <Alert className="border-purple-200 bg-purple-50">
        <Info className="h-4 w-4 text-purple-600" />
        <AlertTitle className="text-purple-800">Como o Machine Learning funciona no VCM</AlertTitle>
        <AlertDescription className="text-purple-700">
          O sistema de ML analisa continuamente o comportamento das personas virtuais, detecta padrões de eficiência, 
          e aplica otimizações automáticas para melhorar a performance do sistema. Isso inclui: redistribuição de tarefas, 
          ajustes de complexidade, otimização de timing e balanceamento de carga de trabalho.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="patterns">Padrões</TabsTrigger>
          <TabsTrigger value="optimizations">Otimizações</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Status do Sistema</CardTitle>
                <Activity className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getStatusIcon(metrics.system_health)}
                  <Badge className={getStatusColor(metrics.system_health)}>
                    {metrics.system_health === 'healthy' ? 'Saudável' : 'Com Problemas'}
                  </Badge>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Último ciclo: {metrics.last_cycle}
                </p>
                <div className="mt-3 text-xs text-green-700">
                  <div className="flex items-center gap-1">
                    <div className="animate-pulse bg-green-500 rounded-full w-2 h-2"></div>
                    Sistema ativo e aprendendo
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Score de Eficiência</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-700">
                  {metrics.efficiency_score.toFixed(1)}%
                </div>
                <Progress value={metrics.efficiency_score} className="mt-2" />
                <p className="text-xs text-blue-600 mt-2">
                  +2.3% desde ontem
                </p>
                <div className="mt-2 text-xs text-blue-700">
                  Baseado na performance das personas e otimizações aplicadas
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Padrões Ativos</CardTitle>
                <Brain className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-700">{metrics.active_patterns}</div>
                <p className="text-xs text-purple-600">
                  de {metrics.total_patterns} detectados
                </p>
                <div className="mt-2 text-xs text-purple-700">
                  Padrões identificados no comportamento das personas
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">Otimizações Aplicadas</CardTitle>
                <Zap className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-700">{metrics.applied_optimizations}</div>
                <p className="text-xs text-orange-600">
                  Última aplicação: hoje
                </p>
                <div className="mt-2 text-xs text-orange-700">
                  Melhorias automáticas implementadas pelo sistema
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Como Funciona */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="text-yellow-500" size={20} />
                Como o Sistema Aprende
              </CardTitle>
              <CardDescription>
                Processo detalhado de aprendizado e otimização do VCM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <div className="mx-auto mb-3 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Target className="text-blue-600" size={20} />
                  </div>
                  <h3 className="font-semibold text-blue-800 mb-2">1. Coleta de Dados</h3>
                  <p className="text-xs text-blue-700">
                    Monitora execução de tarefas, tempos, eficiência e interações das personas
                  </p>
                </div>

                <div className="text-center p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                  <div className="mx-auto mb-3 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="text-purple-600" size={20} />
                  </div>
                  <h3 className="font-semibold text-purple-800 mb-2">2. Análise de Padrões</h3>
                  <p className="text-xs text-purple-700">
                    Identifica padrões de comportamento, gargalos e oportunidades de melhoria
                  </p>
                </div>

                <div className="text-center p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <div className="mx-auto mb-3 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Zap className="text-green-600" size={20} />
                  </div>
                  <h3 className="font-semibold text-green-800 mb-2">3. Otimização</h3>
                  <p className="text-xs text-green-700">
                    Gera e aplica automaticamente melhorias baseadas nos padrões detectados
                  </p>
                </div>

                <div className="text-center p-4 border-2 border-orange-200 rounded-lg bg-orange-50">
                  <div className="mx-auto mb-3 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="text-orange-600" size={20} />
                  </div>
                  <h3 className="font-semibold text-orange-800 mb-2">4. Medição</h3>
                  <p className="text-xs text-orange-700">
                    Avalia o impacto das mudanças e ajusta continuamente o sistema
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} className="text-purple-600" />
                Padrões Detectados pelo ML
              </CardTitle>
              <CardDescription>
                Padrões de comportamento identificados automaticamente nas personas virtuais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patterns.map((pattern) => (
                  <div key={pattern.id} className="flex items-center justify-between p-4 border-2 border-purple-100 rounded-lg bg-purple-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-purple-800">{pattern.pattern_name}</h4>
                        <Badge className={getStatusColor(pattern.status)} variant="secondary">
                          {pattern.status === 'applied' ? 'Aplicado' : 
                           pattern.status === 'detected' ? 'Detectado' : 'Falhado'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm text-purple-700">
                          <span className="flex items-center gap-1">
                            <CheckCircle size={14} />
                            Confiança: {(pattern.confidence * 100).toFixed(1)}%
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp size={14} />
                            Impacto: +{pattern.impact}% de melhoria
                          </span>
                        </div>
                        <Progress value={pattern.confidence * 100} className="h-2" />
                        <p className="text-xs text-purple-600">
                          {pattern.pattern_type === 'workload_balance' ? 
                            'Otimiza a distribuição de tarefas entre personas para balancear a carga de trabalho' :
                          pattern.pattern_type === 'efficiency_improvement' ?
                            'Identifica gargalos em subsistemas e sugere melhorias automáticas' :
                            'Ajusta horários e prioridades para maximizar a eficiência temporal'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-purple-600 ml-4">
                      <div>Detectado em:</div>
                      <div className="font-mono">{new Date(pattern.detected_at).toLocaleString('pt-BR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={20} className="text-orange-600" />
                Otimizações Automáticas
              </CardTitle>
              <CardDescription>
                Melhorias aplicadas automaticamente pelo sistema de Machine Learning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizations.map((opt) => (
                  <div key={opt.id} className="flex items-center justify-between p-4 border-2 border-orange-100 rounded-lg bg-orange-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-orange-800">{opt.optimization_name}</h4>
                        <Badge className={getStatusColor(opt.status)} variant="secondary">
                          {opt.status === 'successful' ? 'Sucesso' :
                           opt.status === 'implementing' ? 'Implementando' :
                           opt.status === 'planned' ? 'Planejado' : 'Falhado'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm text-orange-700">
                          <span className="flex items-center gap-1">
                            <Target size={14} />
                            Escopo: {opt.target_scope === 'department' ? 'Departamento' : 
                                   opt.target_scope === 'task_type' ? 'Tipo de Tarefa' : 'Global'}
                          </span>
                          {opt.improvement > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <TrendingUp size={14} />
                              +{opt.improvement}% melhoria
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-orange-600">
                          {opt.status === 'successful' ? 'Otimização aplicada com sucesso e melhorias mensuradas' :
                           opt.status === 'implementing' ? 'Otimização sendo implementada gradualmente nas personas' :
                           'Otimização planejada baseada em padrões detectados'}
                        </p>
                      </div>
                    </div>
                    {opt.applied_at && (
                      <div className="text-right text-xs text-orange-600 ml-4">
                        <div>Aplicado em:</div>
                        <div className="font-mono">{new Date(opt.applied_at).toLocaleString('pt-BR')}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={20} className="text-green-600" />
                Logs de Execução em Tempo Real
              </CardTitle>
              <CardDescription>
                Acompanhe as operações do sistema de ML em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto border-2 border-green-200">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1 flex items-center gap-2">
                    <span className="text-green-500">•</span>
                    {log}
                  </div>
                ))}
                {isRunning && (
                  <div className="flex items-center gap-2 mt-3 p-2 bg-green-900 rounded">
                    <div className="animate-pulse bg-green-400 rounded-full w-2 h-2"></div>
                    <span className="text-green-300">Sistema executando ciclo de ML...</span>
                  </div>
                )}
                {!isRunning && logs.length > 0 && (
                  <div className="flex items-center gap-2 mt-3 p-2 bg-blue-900 rounded">
                    <CheckCircle size={16} className="text-blue-300" />
                    <span className="text-blue-300">Sistema em standby - Pronto para novo ciclo</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={20} className="text-gray-600" />
                Configurações do Sistema ML
              </CardTitle>
              <CardDescription>
                Configurações principais que controlam o comportamento do aprendizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <div>
                    <h4 className="font-semibold text-green-800 flex items-center gap-2">
                      <Brain size={16} />
                      Aprendizado Ativo
                    </h4>
                    <p className="text-sm text-green-600 mt-1">Detectar padrões automaticamente</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                    <CheckCircle size={12} />
                    {metrics.learning_enabled ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <div>
                    <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                      <Zap size={16} />
                      Otimização Automática
                    </h4>
                    <p className="text-sm text-blue-600 mt-1">Aplicar melhorias automaticamente</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                    <CheckCircle size={12} />
                    {metrics.auto_optimization ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                  <div>
                    <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                      <Target size={16} />
                      Threshold de Confiança
                    </h4>
                    <p className="text-sm text-purple-600 mt-1">Mínimo para aplicar mudanças</p>
                  </div>
                  <Badge variant="outline" className="border-purple-300 text-purple-800">80%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}