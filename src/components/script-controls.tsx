'use client';

import { useState } from 'react';
import { useRunScript, useRunCascade } from '@/lib/hooks';
import { Play, Loader2, CheckCircle, XCircle, Zap } from 'lucide-react';

export function ScriptControls() {
  const [showOutput, setShowOutput] = useState<{ [key: string]: boolean }>({});
  const runScriptMutation = useRunScript();
  const runCascadeMutation = useRunCascade();

  const handleRunScript = (scriptNumber: number) => {
    runScriptMutation.mutate({ scriptNumber });
    setShowOutput(prev => ({ ...prev, [`script_${scriptNumber}`]: true }));
  };

  const handleRunCascade = () => {
    runCascadeMutation.mutate();
    setShowOutput(prev => ({ ...prev, cascade: true }));
  };

  const scripts = [
    { id: 0, name: 'Avatares', description: 'Gerar avatares visuais para personas', color: 'bg-purple-600 hover:bg-purple-700' },
    { id: 1, name: 'Competências', description: 'Gerar competências técnicas e comportamentais', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 2, name: 'Tech Specs', description: 'Especificações técnicas das personas', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 3, name: 'RAG Database', description: 'Criar base de conhecimento RAG', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 4, name: 'Fluxos de Análise', description: 'Análise de fluxos de trabalho', color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 5, name: 'Workflows N8N', description: 'Gerar workflows automáticos', color: 'bg-blue-600 hover:bg-blue-700' }
  ];

  const isScriptRunning = (scriptId: number) => {
    return runScriptMutation.isPending && runScriptMutation.variables?.scriptNumber === scriptId;
  };

  return (
    <div className="space-y-6">
      {/* Scripts Individuais */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Scripts de Processamento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map((script) => (
            <div key={script.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">
                  {script.id === 0 ? 'Script 0' : `Script ${script.id}`}
                </h4>
                <button
                  onClick={() => handleRunScript(script.id)}
                  disabled={runScriptMutation.isPending || runCascadeMutation.isPending}
                  className={`flex items-center gap-1 text-white px-3 py-1 rounded text-sm ${script.color || 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isScriptRunning(script.id) ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  Executar
                </button>
              </div>
              
              <h5 className="font-medium text-sm text-blue-600 mb-1">{script.name}</h5>
              <p className="text-sm text-gray-600">{script.description}</p>
              
              {showOutput[`script_${script.id}`] && runScriptMutation.data && 
               runScriptMutation.variables?.scriptNumber === script.id && (
                <div className="mt-3 p-3 border rounded text-sm">
                  <div className="flex items-center gap-2 mb-2">
                    {runScriptMutation.data.success ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <XCircle size={16} className="text-red-600" />
                    )}
                    <span className={`font-medium ${runScriptMutation.data.success ? 'text-green-600' : 'text-red-600'}`}>
                      {runScriptMutation.data.message}
                    </span>
                  </div>
                  
                  {runScriptMutation.data.execution_time && (
                    <div className="text-xs text-gray-600">
                      Tempo: {runScriptMutation.data.execution_time.toFixed(2)}s
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cascata Completa */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Execução em Cascata</h3>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-600 mb-2">
              Executa todos os scripts (0-5) em sequência automaticamente.
            </p>
            <p className="text-sm text-yellow-600">
              ⚠️ Certifique-se de que as biografias foram geradas primeiro.
            </p>
            <p className="text-xs text-purple-600 mt-1">
              📋 Sequência: Avatares → Competências → Tech Specs → RAG → Fluxos → Workflows
            </p>
          </div>
          
          <button
            onClick={handleRunCascade}
            disabled={runScriptMutation.isPending || runCascadeMutation.isPending}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {runCascadeMutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Zap size={20} />
            )}
            {runCascadeMutation.isPending ? 'Executando Cascata...' : 'Executar Cascata Completa'}
          </button>
        </div>

        {showOutput.cascade && runCascadeMutation.data && (
          <div className="mt-4 p-4 border rounded-md">
            <div className="flex items-center gap-2 mb-2">
              {runCascadeMutation.data.success ? (
                <CheckCircle size={20} className="text-green-600" />
              ) : (
                <XCircle size={20} className="text-red-600" />
              )}
              <span className={`font-medium ${runCascadeMutation.data.success ? 'text-green-600' : 'text-red-600'}`}>
                {runCascadeMutation.data.message}
              </span>
            </div>

            {(() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const cascadeData = runCascadeMutation.data.data as any;
              if (!cascadeData) return null;
              
              return (
                <div className="mt-3">
                  <div className="text-sm text-gray-600 mb-2">
                    Scripts executados: {cascadeData.scripts_executed || 0}/5
                  </div>
                  
                  {cascadeData.results && (
                    <div className="space-y-1">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(cascadeData.results as any[]).map((result: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {result.status === 'success' ? (
                            <CheckCircle size={16} className="text-green-600" />
                          ) : (
                            <XCircle size={16} className="text-red-600" />
                          )}
                          <span>Script {result.script}: {result.status}</span>
                          {result.execution_time && (
                            <span className="text-gray-500">({result.execution_time.toFixed(2)}s)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {runCascadeMutation.data.execution_time && (
                    <div className="mt-2 text-sm text-gray-600">
                      Tempo total: {runCascadeMutation.data.execution_time.toFixed(2)}s
                    </div>
                  )}
                </div>
              );
            })()}

            {runCascadeMutation.data.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {runCascadeMutation.data.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}