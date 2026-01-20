/**
 * Monitor de execução em tempo real
 * Mostra progresso detalhado do script que está rodando AGORA
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ExecutionProgress {
  status: 'idle' | 'starting' | 'running' | 'completed' | 'error';
  scriptName: string;
  empresaId: string;
  message: string;
  itemName?: string;
  progress: number;
  current: number;
  total: number;
  startTime: string;
  endTime?: string;
  successes: number;
  errors: Array<{message: string; timestamp: string}>;
}

export function LiveExecutionMonitor() {
  const [progress, setProgress] = useState<ExecutionProgress | null>(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/automation/progress');
        const data = await response.json();
        if (data.success) {
          setProgress(data);
        }
      } catch (error) {
        console.error('Erro ao buscar progresso:', error);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 2000); // A cada 2 segundos

    return () => clearInterval(interval);
  }, []);

  if (!progress || progress.status === 'idle') {
    return null; // Não mostra nada se não há script rodando
  }

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'running':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (progress.status) {
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const elapsedTime = progress.startTime 
    ? Math.round((new Date().getTime() - new Date(progress.startTime).getTime()) / 1000)
    : 0;

  return (
    <Card className={`${getStatusColor()} border-2 shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="font-semibold">{progress.scriptName}</div>
            <div className="text-xs text-muted-foreground font-normal">
              {progress.status === 'running' && `Executando há ${elapsedTime}s`}
              {progress.status === 'completed' && 'Concluído'}
              {progress.status === 'error' && 'Erro na execução'}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {progress.status === 'running' && (
          <>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {progress.current} de {progress.total}
                </span>
                <span className="font-semibold">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
            </div>

            {progress.itemName && (
              <div className="text-sm">
                <span className="text-muted-foreground">Processando: </span>
                <span className="font-medium">{progress.itemName}</span>
              </div>
            )}

            {progress.message && (
              <div className="text-xs text-muted-foreground">
                {progress.message}
              </div>
            )}
          </>
        )}

        {progress.status === 'completed' && (
          <div className="space-y-2">
            <div className="text-sm text-green-700 font-medium">
              {progress.message}
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-green-600">✓ Sucessos: {progress.successes}</span>
              {progress.errors?.length > 0 && (
                <span className="text-red-600">✗ Erros: {progress.errors.length}</span>
              )}
            </div>
          </div>
        )}

        {progress.status === 'error' && (
          <div className="space-y-2">
            <div className="text-sm text-red-700 font-medium">
              {progress.message}
            </div>
            {progress.errors?.length > 0 && (
              <div className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto">
                {progress.errors.slice(-3).map((err, i) => (
                  <div key={i} className="border-l-2 border-red-300 pl-2">
                    {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
          <span>Sucessos: {progress.successes || 0}</span>
          <span>Erros: {progress.errors?.length || 0}</span>
        </div>
      </CardContent>
    </Card>
  );
}
