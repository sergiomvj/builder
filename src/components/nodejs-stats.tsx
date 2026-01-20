'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  PlayCircle,
  Activity 
} from 'lucide-react';

interface ScriptStats {
  totalScripts: number;
  completedToday: number;
  avgExecutionTime: number;
  successRate: number;
  lastCascadeRun?: string;
  totalCascadeRuns: number;
}

export function NodeJSStats() {
  const [stats, setStats] = useState<ScriptStats>({
    totalScripts: 7,
    completedToday: 0,
    avgExecutionTime: 0,
    successRate: 100,
    totalCascadeRuns: 0
  });

  const [recentActivity, setRecentActivity] = useState([
    { time: '14:30', action: 'Cascata completa executada', status: 'success' },
    { time: '13:45', action: 'Script 03_generate_rag.js executado', status: 'success' },
    { time: '12:20', action: 'Script 01_generate_competencias.js executado', status: 'success' }
  ]);

  useEffect(() => {
    // Carregamento inicial das estatísticas
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // TODO: Em produção, buscar do backend real
      setStats({
        totalScripts: 0,
        completedToday: 0,
        avgExecutionTime: 0,
        successRate: 0,
        lastCascadeRun: null,
        totalCascadeRuns: 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Estatísticas Principais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <span>Estatísticas dos Scripts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Total Scripts */}
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <PlayCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">{stats.totalScripts}</p>
              <p className="text-sm text-blue-600">Scripts Disponíveis</p>
            </div>

            {/* Execuções Hoje */}
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">{stats.completedToday}</p>
              <p className="text-sm text-green-600">Execuções Hoje</p>
            </div>

            {/* Tempo Médio */}
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-900">{stats.avgExecutionTime}s</p>
              <p className="text-sm text-yellow-600">Tempo Médio</p>
            </div>

            {/* Taxa de Sucesso */}
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-900">{stats.successRate}%</p>
              <p className="text-sm text-purple-600">Taxa de Sucesso</p>
            </div>
          </div>

          {/* Cascata Stats */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Cascatas Executadas</span>
              <Badge variant="outline">{stats.totalCascadeRuns}</Badge>
            </div>
            {stats.lastCascadeRun && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-medium text-gray-600">Última Cascata</span>
                <span className="text-sm text-gray-500">
                  {new Date(stats.lastCascadeRun).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-600" />
            <span>Atividade Recente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <Badge 
                  variant={activity.status === 'success' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {activity.status === 'success' ? 'OK' : 'Erro'}
                </Badge>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium text-gray-600 mb-2">Ações Rápidas</p>
            <div className="flex space-x-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-blue-50 text-blue-600 border-blue-300"
                onClick={() => window.location.reload()}
              >
                Atualizar Stats
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-green-50 text-green-600 border-green-300"
              >
                Ver Logs
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}