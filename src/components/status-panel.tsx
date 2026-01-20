'use client';

import { useExecutionStatus } from '@/lib/hooks';
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
  status: 'running' | 'success' | 'error' | 'idle' | 'pending';
  label: string;
  lastRun?: string | null;
}

function StatusBadge({ status, label, lastRun }: StatusBadgeProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'running':
        return { icon: Loader2, color: 'text-blue-600 bg-blue-100', spin: true };
      case 'success':
        return { icon: CheckCircle, color: 'text-green-600 bg-green-100', spin: false };
      case 'error':
        return { icon: XCircle, color: 'text-red-600 bg-red-100', spin: false };
      case 'pending':
        return { icon: Clock, color: 'text-yellow-600 bg-yellow-100', spin: false };
      default:
        return { icon: AlertTriangle, color: 'text-gray-600 bg-gray-100', spin: false };
    }
  };

  const { icon: Icon, color, spin } = getStatusInfo();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      <Icon size={16} className={spin ? 'animate-spin' : ''} />
      <span>{label}</span>
      {lastRun && (
        <span className="text-xs opacity-75">
          {new Date(lastRun).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

interface ScriptStatus {
  running: boolean;
  last_result?: string | null;
  last_run?: string | null;
}

export function StatusPanel() {
  const { data: statusData, isLoading } = useExecutionStatus();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Status dos Scripts</h3>
        <div className="flex items-center gap-2">
          <Loader2 size={20} className="animate-spin" />
          <span>Carregando status...</span>
        </div>
      </div>
    );
  }

  if (!statusData) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Status dos Scripts</h3>
        <div className="text-red-600">Erro ao carregar status</div>
      </div>
    );
  }

  // Compatibilidade: se os dados vêm diretamente ou aninhados em execution_status
  const execution_status = (statusData as any).execution_status || statusData;

  const getStatus = (scriptStatus: ScriptStatus) => {
    if (scriptStatus.running) return 'running';
    if (scriptStatus.last_result === 'success') return 'success';
    if (scriptStatus.last_result === 'error') return 'error';
    return 'idle';
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Status dos Scripts</h3>
      
      <div className="space-y-3">
        {/* Biografia Script */}
        {execution_status.biografia && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium">Biografia</span>
            </div>
            <StatusBadge
              status={getStatus(execution_status.biografia)}
              label={execution_status.biografia.last_result === 'success' ? 'OK' : 'Aguardando'}
              lastRun={execution_status.biografia.last_run}
            />
          </div>
        )}

        {/* Script 0: Avatares */}
        {execution_status.avatares && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-sm font-medium">Script 0: Avatares</span>
            </div>
            <StatusBadge
              status={getStatus(execution_status.avatares)}
              label={execution_status.avatares.last_result === 'success' ? 'OK' : 'Aguardando'}
              lastRun={execution_status.avatares.last_run}
            />
          </div>
        )}

        {/* Scripts 1-5 renumerados */}
        {[1, 2, 3, 4, 5].map((num) => {
          const scriptKey = `script_${num}` as keyof typeof execution_status;
          const scriptStatus = execution_status[scriptKey];
          const scriptNames = {
            1: 'Competências',
            2: 'Tech Specs', 
            3: 'RAG Database',
            4: 'Fluxos',
            5: 'N8N Workflows'
          };

          if (!scriptStatus) return null;

          return (
            <div key={num} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-sm">Script {num}: {scriptNames[num as keyof typeof scriptNames]}</span>
              </div>
              <StatusBadge
                status={getStatus(scriptStatus)}
                label={scriptStatus.last_result === 'success' ? 'OK' : 'Aguardando'}
                lastRun={scriptStatus.last_run}
              />
            </div>
          );
        })}

        {/* Cascata */}
        {execution_status.cascade && (
          <div className="flex items-center justify-between py-2 border-t mt-3 pt-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Sistema Completo</span>
            </div>
            <StatusBadge
              status={getStatus(execution_status.cascade)}
              label={execution_status.cascade.last_result === 'success' ? 'Completo' : 'Pendente'}
              lastRun={execution_status.cascade.last_run}
            />
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Atualização automática a cada 2 segundos
      </div>
    </div>
  );
}