'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Mock data para desenvolvimento quando API não está disponível
const mockExecutionStatus = {
  biografia: { running: false, last_run: null, last_result: null },
  script_1: { running: false, last_run: null, last_result: null },
  script_2: { running: false, last_run: null, last_result: null },
  script_3: { running: false, last_run: null, last_result: null },
  script_4: { running: false, last_run: null, last_result: null },
  script_5: { running: false, last_run: null, last_result: null },
  cascade: { running: false, last_run: null, last_result: null },
};

const mockOutputs = {
  outputs: [],
  count: 0
};

// Função para verificar se a API está disponível
async function checkApiAvailability(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/health');
    return response.ok;
  } catch {
    return false;
  }
}

// Hook para health check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const isApiAvailable = await checkApiAvailability();
      if (!isApiAvailable) {
        return { status: 'API não conectada', api_connected: false };
      }
      const response = await fetch('http://localhost:8000/health');
      return response.json();
    },
    refetchInterval: 30000,
    retry: false,
  });
};

// Hook para status de execução
export const useExecutionStatus = () => {
  return useQuery({
    queryKey: ['execution-status'],
    queryFn: async () => {
      const isApiAvailable = await checkApiAvailability();
      if (!isApiAvailable) {
        return mockExecutionStatus;
      }
      const response = await fetch('http://localhost:8000/status');
      return response.json();
    },
    refetchInterval: 2000,
    retry: false,
  });
};

// Hook para gerar biografias
export const useGenerateBiografias = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: any) => {
      const isApiAvailable = await checkApiAvailability();
      if (!isApiAvailable) {
        throw new Error('API não está conectada. Inicie o servidor backend na porta 8000.');
      }
      const response = await fetch('http://localhost:8000/generate-biografias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution-status'] });
      queryClient.invalidateQueries({ queryKey: ['outputs'] });
    },
  });
};

// Hook para executar script específico
export const useRunScript = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ scriptNumber, forceRegenerate = false }: { scriptNumber: number; forceRegenerate?: boolean }) => {
      const isApiAvailable = await checkApiAvailability();
      if (!isApiAvailable) {
        throw new Error('API não está conectada. Inicie o servidor backend na porta 8000.');
      }
      const response = await fetch(`http://localhost:8000/run-script/${scriptNumber}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force_regenerate: forceRegenerate }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution-status'] });
      queryClient.invalidateQueries({ queryKey: ['outputs'] });
    },
  });
};

// Hook para executar cascata
export const useRunCascade = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const isApiAvailable = await checkApiAvailability();
      if (!isApiAvailable) {
        throw new Error('API não está conectada. Inicie o servidor backend na porta 8000.');
      }
      const response = await fetch('http://localhost:8000/run-cascade', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['execution-status'] });
      queryClient.invalidateQueries({ queryKey: ['outputs'] });
    },
  });
};

// Hook para listar outputs
export const useOutputs = () => {
  return useQuery({
    queryKey: ['outputs'],
    queryFn: async () => {
      const isApiAvailable = await checkApiAvailability();
      if (!isApiAvailable) {
        return mockOutputs;
      }
      const response = await fetch('http://localhost:8000/outputs');
      return response.json();
    },
    refetchInterval: 10000,
    retry: false,
  });
};