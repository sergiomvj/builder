'use client';

import { useState } from 'react';
import { AlertCircle, Brain, Database, CheckCircle, Clock, Loader2, RefreshCw } from 'lucide-react';

interface RAGStatus {
  recent_jobs: Array<{
    id: string;
    status: string;
    started_at: string;
    completed_at?: string;
    total_items?: number;
    success_items?: number;
    failed_items?: number;
  }>;
  stats: {
    total_documents?: number;
    total_chunks?: number;
    last_sync?: string;
  };
  last_sync?: string;
}

interface RAGIngestionResult {
  job_id: string;
  empresa_id: string;
  empresa_nome: string;
  biografias: number;
  competencias: number;
  workflows: number;
  knowledge: number;
  errors: string[];
}

export function RAGPanel() {
  const [empresaId, setEmpresaId] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [status, setStatus] = useState<RAGStatus | null>(null);
  const [lastResult, setLastResult] = useState<RAGIngestionResult | null>(null);

  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    // Simple alert for now - can be replaced with proper toast system later
    const message = `${title}: ${description}`;
    if (variant === 'destructive') {
      alert(`❌ ${message}`);
    } else {
      alert(`✅ ${message}`);
    }
  };

  const handleIngestRAG = async () => {
    if (!empresaId.trim()) {
      showToast("Erro", "Por favor, informe o ID da empresa", "destructive");
      return;
    }

    setIsIngesting(true);

    try {
      const response = await fetch('http://localhost:8000/api/rag/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresa_id: empresaId,
          force_update: forceUpdate,
        }),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Ingestão RAG Iniciada", `Processamento iniciado para empresa ${empresaId}`);
        
        // Aguardar um pouco e tentar obter o resultado
        setTimeout(async () => {
          try {
            const syncResponse = await fetch('http://localhost:8000/api/rag/ingest-sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                empresa_id: empresaId,
                force_update: forceUpdate,
              }),
            });

            const syncResult = await syncResponse.json();
            
            if (syncResult.success && syncResult.data) {
              setLastResult(syncResult.data);
              showToast("Ingestão RAG Concluída", `Processados: ${syncResult.data.biografias + syncResult.data.competencias + syncResult.data.workflows + syncResult.data.knowledge} itens`);
            }
          } catch (error) {
            console.error('Erro ao obter resultado da ingestão:', error);
          }
        }, 2000);

      } else {
        showToast("Erro na Ingestão", result.error || "Erro desconhecido", "destructive");
      }
    } catch (error) {
      console.error('Erro na ingestão RAG:', error);
      showToast("Erro de Conexão", "Erro ao conectar com a API", "destructive");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleGetStatus = async () => {
    if (!empresaId.trim()) {
      showToast("Erro", "Por favor, informe o ID da empresa", "destructive");
      return;
    }

    setIsLoadingStatus(true);

    try {
      const response = await fetch(`http://localhost:8000/api/rag/status/${empresaId}`);
      const result = await response.json();

      if (result.success) {
        setStatus(result.data);
        showToast("Status Atualizado", "Status RAG carregado com sucesso");
      } else {
        showToast("Erro ao Obter Status", result.error || "Erro desconhecido", "destructive");
      }
    } catch (error) {
      console.error('Erro ao obter status:', error);
      showToast("Erro de Conexão", "Erro ao conectar com a API", "destructive");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Sistema RAG</h3>
      </div>
      <p className="text-gray-600 mb-6">
        Ingestão de dados para Knowledge Base RAG no Supabase
      </p>
      
      <div className="space-y-6">
        {/* Formulário de Ingestão */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="empresa-id" className="block text-sm font-medium">ID da Empresa</label>
            <input
              id="empresa-id"
              type="text"
              placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="force-update"
              type="checkbox"
              checked={forceUpdate}
              onChange={(e) => setForceUpdate(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="force-update" className="text-sm">Forçar atualização (limpar dados existentes)</label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleIngestRAG}
              disabled={isIngesting || !empresaId.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isIngesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  Ingerir RAG
                </>
              )}
            </button>

            <button
              onClick={handleGetStatus}
              disabled={isLoadingStatus || !empresaId.trim()}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Resultado da Última Ingestão */}
        {lastResult && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Última Ingestão</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Empresa:</strong> {lastResult.empresa_nome}</p>
              <div className="grid grid-cols-2 gap-2">
                <p>📝 Biografias: {lastResult.biografias}</p>
                <p>🎯 Competências: {lastResult.competencias}</p>
                <p>⚙️ Workflows: {lastResult.workflows}</p>
                <p>📚 Knowledge: {lastResult.knowledge}</p>
              </div>
              {lastResult.errors.length > 0 && (
                <p className="text-red-600">❌ Erros: {lastResult.errors.length}</p>
              )}
            </div>
          </div>
        )}

        {/* Status da Empresa */}
        {status && (
          <div className="space-y-4">
            <h4 className="font-semibold">Status RAG da Empresa</h4>
            
            {/* Estatísticas */}
            {status.stats && (
              <div className="bg-gray-50 rounded-lg p-3">
                <h5 className="font-medium mb-2">Estatísticas</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>📄 Documentos: {status.stats.total_documents || 0}</p>
                  <p>🧩 Chunks: {status.stats.total_chunks || 0}</p>
                </div>
                {status.last_sync && (
                  <p className="text-xs text-gray-600 mt-2">
                    Última sincronização: {formatDate(status.last_sync)}
                  </p>
                )}
              </div>
            )}

            {/* Jobs Recentes */}
            {status.recent_jobs && status.recent_jobs.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium">Jobs Recentes</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {status.recent_jobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="capitalize">{job.status}</span>
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <p>{formatDate(job.started_at)}</p>
                        {job.total_items && (
                          <p>{job.success_items}/{job.total_items} itens</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}