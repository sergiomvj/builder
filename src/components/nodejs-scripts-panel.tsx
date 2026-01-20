'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap,
  Brain,
  Cog,
  Database,
  GitBranch,
  Workflow
} from 'lucide-react';

interface ScriptStatus {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'idle' | 'running' | 'success' | 'error';
  description: string;
  output?: string;
  duration?: number;
  progress?: number;
}

interface CascadeExecution {
  isRunning: boolean;
  currentScript: number;
  totalScripts: number;
  startTime?: Date;
  results: Record<string, any>;
}

export function NodeJSScriptsPanel() {
  const [empresaCodigo, setEmpresaCodigo] = useState('LIFEWAY');
  const [cascade, setCascade] = useState<CascadeExecution>({
    isRunning: false,
    currentScript: 0,
    totalScripts: 5,
    results: {}
  });

  const [scripts, setScripts] = useState<ScriptStatus[]>([
    {
      id: 'competencias',
      name: 'Script 1 - Competências',
      icon: <Brain className="h-5 w-5" />,
      status: 'idle',
      description: 'Análise de competências técnicas e comportamentais das personas'
    },
    {
      id: 'tech-specs',
      name: 'Script 2 - Tech Specs',
      icon: <Cog className="h-5 w-5" />,
      status: 'idle',
      description: 'Especificações técnicas para sistemas e ferramentas'
    },
    {
      id: 'rag-database',
      name: 'Script 3 - RAG Database',
      icon: <Database className="h-5 w-5" />,
      status: 'idle',
      description: 'Base de conhecimento para busca semântica'
    },
    {
      id: 'fluxos-analise',
      name: 'Script 4 - Análise Fluxos',
      icon: <GitBranch className="h-5 w-5" />,
      status: 'idle',
      description: 'Mapeamento de processos e colaborações'
    },
    {
      id: 'workflows-n8n',
      name: 'Script 5 - Workflows N8N',
      icon: <Workflow className="h-5 w-5" />,
      status: 'idle',
      description: 'Geração automática de workflows executáveis'
    }
  ]);

  // Executar script individual
  const executeScript = useCallback(async (scriptId: string) => {
    setScripts(prev => prev.map(script => 
      script.id === scriptId 
        ? { ...script, status: 'running', progress: 0 }
        : script
    ));

    try {
      const response = await fetch('/api/nodejs-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId, empresaCodigo })
      });

      const result = await response.json();

      if (result.success) {
        setScripts(prev => prev.map(script => 
          script.id === scriptId 
            ? { 
                ...script, 
                status: 'success', 
                output: `✅ ${script.name} executado com sucesso!\n\n${result.output}`,
                duration: 3.2,
                progress: 100
              }
            : script
        ));
      } else {
        setScripts(prev => prev.map(script => 
          script.id === scriptId 
            ? { 
                ...script, 
                status: 'error', 
                output: `❌ Erro na execução: ${result.error}`,
                progress: 0
              }
            : script
        ));
      }

    } catch (error) {
      setScripts(prev => prev.map(script => 
        script.id === scriptId 
          ? { 
              ...script, 
              status: 'error', 
              output: `❌ Erro na comunicação com API: ${error}`,
              progress: 0
            }
          : script
      ));
    }
  }, [empresaCodigo]);

  // Executar cascata completa
  const executeCascade = useCallback(async () => {
    if (!empresaCodigo.trim()) {
      alert('Por favor, informe o código da empresa');
      return;
    }

    setCascade({
      isRunning: true,
      currentScript: 0,
      totalScripts: 5,
      startTime: new Date(),
      results: {}
    });

    // Reset todos os scripts
    setScripts(prev => prev.map(script => ({ 
      ...script, 
      status: 'idle', 
      output: undefined,
      progress: 0
    })));

    try {
      const response = await fetch('/api/cascade-nodejs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaCodigo })
      });

      const result = await response.json();

      if (result.success) {
        // Atualizar status dos scripts baseado nos resultados
        result.results.forEach((scriptResult: any) => {
          setScripts(prev => prev.map(script => 
            script.id === scriptResult.scriptId
              ? {
                  ...script,
                  status: scriptResult.success ? 'success' : 'error',
                  output: scriptResult.success 
                    ? `✅ ${scriptResult.name} executado com sucesso!\n\n${scriptResult.output}`
                    : `❌ Erro: ${scriptResult.error}`,
                  duration: scriptResult.duration / 1000,
                  progress: scriptResult.success ? 100 : 0
                }
              : script
          ));
        });

        setCascade(prev => ({ 
          ...prev, 
          isRunning: false,
          currentScript: result.summary.successfulScripts,
          results: {
            success: true,
            totalTime: result.summary.totalDuration,
            summary: result.summary
          }
        }));
      } else {
        setCascade(prev => ({ 
          ...prev, 
          isRunning: false,
          results: { success: false, error: result.error }
        }));
      }

    } catch (error) {
      setCascade(prev => ({ 
        ...prev, 
        isRunning: false,
        results: { success: false, error: String(error) }
      }));
    }
  }, [empresaCodigo]);

  // Parar execução
  const stopExecution = useCallback(() => {
    setCascade(prev => ({ 
      ...prev, 
      isRunning: false 
    }));
    setScripts(prev => prev.map(script => 
      script.status === 'running' 
        ? { ...script, status: 'idle', progress: 0 }
        : script
    ));
  }, []);

  const getStatusIcon = (status: ScriptStatus['status']) => {
    switch (status) {
      case 'running':
        return <Clock className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: ScriptStatus['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary">Executando</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Aguardando</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Scripts Node.js - Cascata de Processamento
            </CardTitle>
            <CardDescription>
              Execução automatizada dos 5 scripts de processamento de personas em Node.js
            </CardDescription>
          </div>
          {cascade.isRunning && (
            <div className="text-sm text-gray-500">
              {cascade.currentScript}/{cascade.totalScripts} scripts
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Configuração da Empresa */}
        <div className="space-y-2">
          <Label htmlFor="empresa-codigo">Código da Empresa</Label>
          <div className="flex gap-3">
            <Input
              id="empresa-codigo"
              value={empresaCodigo}
              onChange={(e) => setEmpresaCodigo(e.target.value.toUpperCase())}
              placeholder="Ex: LIFEWAY"
              className="uppercase"
              disabled={cascade.isRunning}
            />
            <Button
              onClick={executeCascade}
              disabled={cascade.isRunning || !empresaCodigo.trim()}
              className="min-w-[120px]"
            >
              {cascade.isRunning ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Executando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Executar Cascata
                </>
              )}
            </Button>
            {cascade.isRunning && (
              <Button
                variant="outline"
                onClick={stopExecution}
              >
                <Square className="h-4 w-4 mr-2" />
                Parar
              </Button>
            )}
          </div>
        </div>

        {/* Progress da Cascata */}
        {cascade.isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso da Cascata</span>
              <span>{Math.round((cascade.currentScript / cascade.totalScripts) * 100)}%</span>
            </div>
            <Progress 
              value={(cascade.currentScript / cascade.totalScripts) * 100} 
              className="h-2"
            />
          </div>
        )}

        {/* Scripts Individuais */}
        <div className="space-y-4">
          {scripts.map((script, index) => (
            <div 
              key={script.id}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                cascade.isRunning && cascade.currentScript === index + 1
                  ? 'border-blue-300 bg-blue-50'
                  : script.status === 'success'
                  ? 'border-green-300 bg-green-50'
                  : script.status === 'error'
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {script.icon}
                    <span className="font-medium">{script.name}</span>
                  </div>
                  {getStatusIcon(script.status)}
                </div>
                <div className="flex items-center gap-3">
                  {script.duration && (
                    <span className="text-sm text-gray-500">
                      {script.duration}s
                    </span>
                  )}
                  {getStatusBadge(script.status)}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => executeScript(script.id)}
                    disabled={cascade.isRunning || script.status === 'running'}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-2">{script.description}</p>
              
              {script.progress !== undefined && script.status === 'running' && (
                <div className="mt-3 space-y-1">
                  <Progress value={script.progress} className="h-1" />
                  <div className="text-xs text-gray-500">{script.progress}%</div>
                </div>
              )}
              
              {script.output && (
                <Alert className="mt-3">
                  <AlertDescription className="text-sm">
                    {script.output}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ))}
        </div>

        {/* Resultado da Cascata */}
        {!cascade.isRunning && cascade.results.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              ✅ Cascata executada com sucesso em {Math.round((cascade.results.totalTime || 0) / 1000)}s! 
              {cascade.results.summary && (
                <span> ({cascade.results.summary.successfulScripts}/{cascade.results.summary.totalScripts} scripts concluídos)</span>
              )}
              <br />
              Todos os scripts Node.js foram processados para a empresa {empresaCodigo}.
            </AlertDescription>
          </Alert>
        )}

        {!cascade.isRunning && cascade.results.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ❌ Erro na execução da cascata: {cascade.results.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Informações Técnicas */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Informações Técnicas:</h4>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <strong>Tecnologia:</strong> Node.js
            </div>
            <div>
              <strong>Runtime:</strong> Async/Await
            </div>
            <div>
              <strong>Output:</strong> JSON estruturado
            </div>
            <div>
              <strong>Logs:</strong> Console + Arquivo
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}