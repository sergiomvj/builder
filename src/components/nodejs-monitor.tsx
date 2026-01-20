'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  PlayCircle, 
  StopCircle, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText,
  RefreshCw
} from 'lucide-react';

interface ScriptStatus {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  lastRun?: Date;
  duration?: number;
  output?: string;
  error?: string;
}

export function NodeJSMonitor() {
  const [scripts, setScripts] = useState<ScriptStatus[]>([
    { id: 'competencias', name: '01_generate_competencias.js', status: 'idle' },
    { id: 'techspecs', name: '02_generate_tech_specs.js', status: 'idle' },
    { id: 'rag', name: '03_generate_rag.js', status: 'idle' },
    { id: 'fluxos', name: '04_generate_fluxos_analise.js', status: 'idle' },
    { id: 'workflows', name: '05_generate_workflows_n8n.js', status: 'idle' },
    { id: 'biografia', name: '05_auto_biografia_generator.js', status: 'idle' },
    { id: 'api', name: 'api_bridge.js', status: 'idle' }
  ]);

  const [isMonitoring, setIsMonitoring] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 animate-pulse text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <PlayCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const refreshStatus = async () => {
    try {
      setIsMonitoring(true);
      const response = await fetch('/api/nodejs-scripts/status');
      if (response.ok) {
        const data = await response.json();
        if (data.scripts) {
          setScripts(data.scripts);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 5000); // Atualiza a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Monitor Scripts Node.js</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={isMonitoring}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${isMonitoring ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(script.status)}
                <div>
                  <p className="font-medium text-sm">{script.name}</p>
                  {script.lastRun && (
                    <p className="text-xs text-gray-500">
                      Última execução: {script.lastRun.toLocaleString()}
                    </p>
                  )}
                  {script.duration && (
                    <p className="text-xs text-gray-500">
                      Duração: {script.duration}s
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(script.status)}>
                  {script.status === 'idle' && 'Parado'}
                  {script.status === 'running' && 'Executando'}
                  {script.status === 'completed' && 'Concluído'}
                  {script.status === 'error' && 'Erro'}
                </Badge>
                
                {script.status === 'running' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <StopCircle className="h-3 w-3 mr-1" />
                    Parar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {scripts.filter(s => s.status === 'idle').length}
              </p>
              <p className="text-xs text-gray-500">Parados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {scripts.filter(s => s.status === 'running').length}
              </p>
              <p className="text-xs text-gray-500">Executando</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {scripts.filter(s => s.status === 'completed').length}
              </p>
              <p className="text-xs text-gray-500">Concluídos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {scripts.filter(s => s.status === 'error').length}
              </p>
              <p className="text-xs text-gray-500">Com Erro</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}