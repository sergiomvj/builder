'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCcw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface RetryPanelProps {
  empresaId: string;
}

interface RetryStats {
  totalFailed: number;
  retriable: number;
  processed: number;
  successes: number;
  failures: number;
  skipped: number;
  duration: number;
}

const SCRIPTS = [
  { id: '02_generate_biografias', name: '02. Biografias' },
  { id: '03_generate_atribuicoes', name: '03. Atribuições' },
  { id: '04_generate_competencias', name: '04. Competências' },
  { id: '05_generate_avatares', name: '05. Avatares' },
  { id: '06_analyze_automation', name: '06. Análise Automação' },
  { id: '06.5_generate_communications', name: '06.5. Comunicações' },
  { id: '07_generate_workflows', name: '07. Workflows' },
  { id: '07.5_generate_supervision', name: '07.5. Supervisão' },
  { id: '08_generate_ml', name: '08. Machine Learning' },
  { id: '09_generate_auditoria', name: '09. Auditoria' },
  { id: 'ALL', name: 'TODOS OS SCRIPTS' }
];

export function RetryPanel({ empresaId }: RetryPanelProps) {
  const [selectedScript, setSelectedScript] = useState<string>('02_generate_biografias');
  const [isChecking, setIsChecking] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [reportData, setReportData] = useState<RetryStats | null>(null);
  const [retryResult, setRetryResult] = useState<RetryStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckFailures = async () => {
    setIsChecking(true);
    setError(null);
    setReportData(null);
    setRetryResult(null);

    try {
      const response = await fetch('/api/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId,
          script: selectedScript,
          reportOnly: true
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Erro ao verificar falhas');
        return;
      }

      setReportData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar com servidor');
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    setRetryResult(null);

    try {
      const response = await fetch('/api/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId,
          script: selectedScript,
          reportOnly: false,
          maxRetries: 3,
          delay: 2000,
          backoff: 2
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Erro ao executar retry');
        return;
      }

      setRetryResult(data.data);
      
      // Limpar report data após retry bem-sucedido
      if (data.data.successes > 0) {
        setReportData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao conectar com servidor');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCcw className="h-5 w-5" />
          <span>Sistema de Recuperação de Falhas</span>
        </CardTitle>
        <CardDescription>
          Identifique e reprocesse registros que falharam durante a execução dos scripts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção de Script */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Selecione o Script
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SCRIPTS.map((script) => (
              <Button
                key={script.id}
                variant={selectedScript === script.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedScript(script.id);
                  setReportData(null);
                  setRetryResult(null);
                  setError(null);
                }}
                className="justify-start text-xs"
              >
                {script.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2">
          <Button
            onClick={handleCheckFailures}
            disabled={isChecking || isRetrying}
            variant="outline"
            className="flex-1"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Verificar Falhas
              </>
            )}
          </Button>

          <Button
            onClick={handleRetry}
            disabled={isRetrying || isChecking || (reportData?.retriable === 0)}
            className="flex-1"
          >
            {isRetrying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reprocessando...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reprocessar Falhas
              </>
            )}
          </Button>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Erro</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Report de Falhas */}
        {reportData && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <h4 className="text-sm font-semibold text-blue-900">
                Relatório de Falhas Detectadas
              </h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600">Total de Falhas</p>
                <p className="text-2xl font-bold text-gray-900">{reportData.totalFailed}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100">
                <p className="text-xs text-gray-600">Falhas Retentáveis</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.retriable}</p>
              </div>
            </div>

            {reportData.retriable > 0 ? (
              <div className="flex items-center justify-between p-2 bg-blue-100 rounded-lg">
                <span className="text-xs font-medium text-blue-900">
                  {reportData.retriable} registro(s) podem ser reprocessados
                </span>
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
              </div>
            ) : (
              <div className="flex items-center justify-between p-2 bg-green-100 rounded-lg">
                <span className="text-xs font-medium text-green-900">
                  Nenhuma falha retentável encontrada
                </span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            )}
          </div>
        )}

        {/* Resultado do Retry */}
        {retryResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="text-sm font-semibold text-green-900">
                Reprocessamento Concluído
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2 rounded-lg border border-green-100 text-center">
                <p className="text-xs text-gray-600">Sucessos</p>
                <p className="text-xl font-bold text-green-600">{retryResult.successes}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-red-100 text-center">
                <p className="text-xs text-gray-600">Falhas</p>
                <p className="text-xl font-bold text-red-600">{retryResult.failures}</p>
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-100 text-center">
                <p className="text-xs text-gray-600">Pulados</p>
                <p className="text-xl font-bold text-gray-600">{retryResult.skipped}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-green-100">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-xs text-gray-700">Duração</span>
              </div>
              <Badge variant="outline">
                {(retryResult.duration / 1000).toFixed(1)}s
              </Badge>
            </div>

            {retryResult.successes > 0 && retryResult.failures === 0 && (
              <div className="flex items-center space-x-2 p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium text-green-900">
                  Taxa de sucesso: 100% ✨
                </span>
              </div>
            )}
          </div>
        )}

        {/* Informações de Uso */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-700">
            <strong>Como usar:</strong> Primeiro clique em "Verificar Falhas" para identificar 
            registros com problemas. Depois clique em "Reprocessar Falhas" para executar apenas 
            os registros que falharam, economizando tempo e custos com LLM.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
