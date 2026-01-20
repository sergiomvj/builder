/**
 * Hook para monitorar status de execução dos scripts em tempo real
 * Busca scripts_status do banco a cada 5 segundos durante execução
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface ScriptsStatus {
  create_personas: boolean;
  biografias: boolean;
  atribuicoes: boolean;
  competencias: boolean;
  avatares: boolean;
  automation_analysis: boolean;  // personas_automation_opportunities
  workflows: boolean;             // personas_workflows
  machine_learning: boolean;      // personas_machine_learning
  auditoria: boolean;             // personas_auditorias
}

export function useScriptStatus(empresaId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ['script-status', empresaId],
    queryFn: async () => {
      if (!empresaId) return null;

      const { data, error } = await supabase
        .from('empresas')
        .select('scripts_status')
        .eq('id', empresaId)
        .single();

      if (error) throw error;
      
      return (data?.scripts_status || {}) as ScriptsStatus;
    },
    enabled: enabled && !!empresaId,
    refetchInterval: 5000, // Recarrega a cada 5 segundos
    refetchIntervalInBackground: false,
  });
}

/**
 * Calcula progresso percentual baseado no scripts_status
 */
export function calculateScriptProgress(status: ScriptsStatus | null | undefined): number {
  if (!status) return 0;
  
  const scripts = [
    'create_personas',
    'biografias',
    'atribuicoes',
    'competencias',
    'avatares',
    'automation_analysis',
    'workflows',
    'machine_learning',
    'auditoria',
  ] as const;

  const completed = scripts.filter(script => status[script]).length;
  return Math.round((completed / scripts.length) * 100);
}

/**
 * Retorna o próximo script a ser executado
 */
export function getNextScript(status: ScriptsStatus | null | undefined): string | null {
  if (!status) return '01_create_personas';

  const scriptOrder = [
    { key: 'create_personas', name: '01 - Criar Personas' },
    { key: 'biografias', name: '02 - Biografias' },
    { key: 'atribuicoes', name: '03 - Atribuições' },
    { key: 'competencias', name: '04 - Competências' },
    { key: 'avatares', name: '05 - Avatares' },
    { key: 'automation_analysis', name: '06 - Análise Automação' },
    { key: 'workflows', name: '07 - Workflows' },
    { key: 'machine_learning', name: '08 - Machine Learning' },
    { key: 'auditoria', name: '09 - Auditoria' },
  ] as const;

  for (const script of scriptOrder) {
    if (!status[script.key]) {
      return script.name;
    }
  }

  return null; // Todos concluídos
}
