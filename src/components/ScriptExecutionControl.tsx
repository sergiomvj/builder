'use client'

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Square, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface ExecutionStatus {
  id: string;
  status: 'running' | 'completed' | 'error' | 'idle';
  startTime: Date;
  endTime?: Date;
  currentPhase: string;
  progress: {
    current: number;
    total: number;
  };
  logs: string[];
  empresaId: string;
}

interface ScriptExecutionControlProps {
  scriptName: string;
  scriptDescription: string;
  apiEndpoint: string;
  empresaId: string;
}

/**
 * 🎯 COMPONENTE DE CONTROLE DE EXECUÇÃO DE SCRIPTS
 * ==============================================
 * 
 * Sistema completo para monitorar execução de scripts em tempo real
 * com logs, progresso e controle de estado
 */

export default function ScriptExecutionControl({ 
  scriptName, 
  scriptDescription, 
  apiEndpoint, 
  empresaId 
}: ScriptExecutionControlProps) {
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Polling do status a cada 2 segundos quando em execução
  useEffect(() => {
    if (executionStatus?.status === 'running' && !isPolling) {
      setIsPolling(true);
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`${apiEndpoint}?empresaId=${empresaId}&action=status`);
          const data = await response.json();
          
          if (data.found && data.status) {
            setExecutionStatus(data.status);
            
            // Parar polling se concluído ou erro
            if (data.status.status !== 'running') {
              clearInterval(interval);
              setIsPolling(false);
            }
          }
        } catch (error) {
          console.error('Erro ao consultar status:', error);
        }
      }, 2000);

      return () => {
        clearInterval(interval);
        setIsPolling(false);
      };
    }
  }, [executionStatus?.status, apiEndpoint, empresaId, isPolling]);

  // Executar script
  const handleExecute = async () => {
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ empresaId }),
      });

      const data = await response.json();

      if (data.success) {
        setExecutionStatus(data.status);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao executar script:', error);
      alert('Erro ao executar script');
    }
  };

  // Resetar status
  const handleReset = () => {
    setExecutionStatus(null);
  };

  // Calcular duração
  const getDuration = () => {
    if (!executionStatus?.startTime) return '';
    
    const end = executionStatus.endTime || new Date();
    const duration = Math.floor((end.getTime() - new Date(executionStatus.startTime).getTime()) / 1000);
    
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    
    return `${minutes}m ${seconds}s`;
  };

  // Status badge
  const getStatusBadge = () => {
    if (!executionStatus) {
      return <Badge variant="secondary">Idle</Badge>;
    }

    switch (executionStatus.status) {
      case 'running':
        return (
          <Badge className="bg-blue-500 text-white">
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
            Executando
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluído
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500 text-white">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  // Progresso percentual
  const getProgressPercentage = () => {
    if (!executionStatus?.progress) return 0;
    return Math.round((executionStatus.progress.current / executionStatus.progress.total) * 100);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold">{scriptName}</span>
            <p className="text-sm text-gray-600 mt-1">{scriptDescription}</p>
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex gap-2">
          <Button
            onClick={handleExecute}
            disabled={executionStatus?.status === 'running'}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {executionStatus?.status === 'running' ? 'Executando...' : 'Executar'}
          </Button>

          {executionStatus && executionStatus.status !== 'running' && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Resetar
            </Button>
          )}
        </div>

        {/* Informações de execução */}
        {executionStatus && (
          <div className="space-y-4">
            {/* Progresso */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso: {executionStatus.progress.current}/{executionStatus.progress.total}</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="w-full" />
            </div>

            {/* Status atual */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Fase Atual:</span>
                <p className="text-gray-600">{executionStatus.currentPhase}</p>
              </div>
              <div>
                <span className="font-semibold">Duração:</span>
                <p className="text-gray-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getDuration()}
                </p>
              </div>
            </div>

            {/* Logs */}
            {executionStatus.logs.length > 0 && (
              <div>
                <span className="font-semibold text-sm">Logs de Execução:</span>
                <ScrollArea className="h-32 w-full border rounded-md p-2 mt-2 bg-gray-50">
                  <div className="space-y-1">
                    {executionStatus.logs.map((log, index) => (
                      <div key={index} className="text-xs font-mono text-gray-700">
                        {log}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        {/* Estado idle */}
        {!executionStatus && (
          <div className="text-center py-6 text-gray-500">
            <Play className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Pronto para executar</p>
            <p className="text-xs">Clique em "Executar" para iniciar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}