/**
 * Componente visual para monitorar execução dos scripts em tempo real
 * Mostra status de cada script da cascade (01-09) + progresso total
 */

import { useScriptStatus, calculateScriptProgress, getNextScript } from '@/hooks/useScriptStatus';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface ScriptProgressMonitorProps {
  empresaId: string;
  className?: string;
}

export function ScriptProgressMonitor({ empresaId, className }: ScriptProgressMonitorProps) {
  const { data: status, isLoading } = useScriptStatus(empresaId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = calculateScriptProgress(status);
  const nextScript = getNextScript(status);

  const scripts = [
    { key: 'create_personas', label: '01 - Criar Personas', order: 1 },
    { key: 'biografias', label: '02 - Biografias', order: 2 },
    { key: 'atribuicoes', label: '03 - Atribuições', order: 3 },
    { key: 'competencias', label: '04 - Competências', order: 4 },
    { key: 'avatares', label: '05 - Avatares', order: 5 },
    { key: 'automation_analysis', label: '06 - Análise Automação', order: 6 },
    { key: 'workflows', label: '07 - Workflows', order: 7 },
    { key: 'machine_learning', label: '08 - Machine Learning', order: 8 },
    { key: 'auditoria', label: '09 - Auditoria', order: 9 },
  ] as const;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Progresso da Automação</span>
          <span className="text-2xl font-bold">{progress}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-3" />
        
        {nextScript && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm">
            <p className="font-medium text-blue-900">
              📌 Próximo script: {nextScript}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {scripts.map((script) => {
            const isCompleted = status?.[script.key as keyof typeof status];
            return (
              <div
                key={script.key}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 flex-shrink-0 text-gray-300" />
                )}
                <span className={`text-sm ${isCompleted ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                  {script.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Status atualizado automaticamente a cada 5 segundos
        </p>
      </CardContent>
    </Card>
  );
}
