import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

// =====================================================
// TIPOS DE DADOS
// =====================================================

export interface MetaGlobal {
  id: string;
  empresa_id: string;
  titulo: string;
  descricao: string;
  categoria: 'crescimento' | 'operacional' | 'financeira' | 'inovacao' | 'sustentabilidade';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  prazo: string;
  responsavel_principal: string;
  indicadores_sucesso: string[];
  budget_estimado: number;
  roi_esperado: number;
  progresso: number;
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada';
  created_at: string;
  updated_at: string;
}

export interface MetaPersona {
  id: string;
  meta_global_id: string;
  persona_id: string;
  titulo: string;
  descricao: string;
  prazo: string;
  progresso: number;
  status: 'ativa' | 'pausada' | 'concluida' | 'atrasada';
  alinhamento_score: number;
  dependencias?: string[];
  recursos_necessarios?: string[];
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  meta_persona_id: string;
  titulo: string;
  descricao?: string;
  prazo: string;
  concluido: boolean;
  created_at: string;
  updated_at: string;
}

// =====================================================
// METAS GLOBAIS - HOOKS
// =====================================================

// Listar todas as metas globais de uma empresa
export function useMetasGlobais(empresaId?: string) {
  return useQuery({
    queryKey: ['metas-globais', empresaId],
    queryFn: async () => {
      console.log('Executando query para metas globais. EmpresaId:', empresaId);
      
      let query = supabase
        .from('metas_globais')
        .select('*')
        .order('created_at', { ascending: false });

      if (empresaId && empresaId !== 'todas') {
        query = query.eq('empresa_id', empresaId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar metas globais:', error);
        throw error;
      }

      console.log('Metas globais encontradas:', data);
      return data as MetaGlobal[];
    },
    enabled: !!empresaId
  });
}

// Buscar uma meta global específica
export function useMetaGlobal(metaId: string) {
  return useQuery({
    queryKey: ['meta-global', metaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_globais')
        .select('*')
        .eq('id', metaId)
        .single();

      if (error) {
        console.error('Erro ao buscar meta global:', error);
        throw error;
      }

      return data as MetaGlobal;
    },
    enabled: !!metaId
  });
}

// Criar nova meta global
export function useCreateMetaGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (novaMeta: Omit<MetaGlobal, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('Iniciando criação de meta no Supabase:', novaMeta);
      
      const metaParaInserir = {
        ...novaMeta,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Meta preparada para inserção:', metaParaInserir);
      
      const { data, error } = await supabase
        .from('metas_globais')
        .insert([metaParaInserir])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar meta global:', error);
        throw error;
      }

      console.log('Meta criada com sucesso no Supabase:', data);
      return data as MetaGlobal;
    },
    onSuccess: (_, variables) => {
      // Invalidar cache das metas globais
      queryClient.invalidateQueries({ queryKey: ['metas-globais'] });
      queryClient.invalidateQueries({ queryKey: ['metas-globais', variables.empresa_id] });
    }
  });
}

// Atualizar meta global
export function useUpdateMetaGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<MetaGlobal> & { id: string }) => {
      const { data, error } = await supabase
        .from('metas_globais')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar meta global:', error);
        throw error;
      }

      return data as MetaGlobal;
    },
    onSuccess: (data) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: ['metas-globais'] });
      queryClient.invalidateQueries({ queryKey: ['metas-globais', data.empresa_id] });
      queryClient.invalidateQueries({ queryKey: ['meta-global', data.id] });
    }
  });
}

// Deletar meta global
export function useDeleteMetaGlobal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metaId: string) => {
      const { error } = await supabase
        .from('metas_globais')
        .delete()
        .eq('id', metaId);

      if (error) {
        console.error('Erro ao deletar meta global:', error);
        throw error;
      }

      return metaId;
    },
    onSuccess: () => {
      // Invalidar todas as queries de metas
      queryClient.invalidateQueries({ queryKey: ['metas-globais'] });
    }
  });
}

// =====================================================
// METAS POR PERSONA - HOOKS
// =====================================================

// Listar metas de uma persona específica
export function useMetasPersona(personaId: string) {
  return useQuery({
    queryKey: ['metas-persona', personaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_personas')
        .select(`
          *,
          meta_global:metas_globais(titulo, categoria),
          persona:personas(nome, cargo, tipo)
        `)
        .eq('persona_id', personaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar metas da persona:', error);
        throw error;
      }

      return data as MetaPersona[];
    },
    enabled: !!personaId
  });
}

// Listar todas as metas por persona de uma empresa
export function useMetasTodasPersonas(empresaId: string) {
  return useQuery({
    queryKey: ['metas-todas-personas', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas_personas')
        .select(`
          *,
          meta_global:metas_globais!inner(titulo, categoria, empresa_id),
          persona:personas(nome, cargo, tipo, avatar)
        `)
        .eq('meta_global.empresa_id', empresaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar todas as metas por personas:', error);
        throw error;
      }

      return data as MetaPersona[];
    },
    enabled: !!empresaId
  });
}

// Criar meta para persona
export function useCreateMetaPersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (novaMeta: Omit<MetaPersona, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('metas_personas')
        .insert([{
          ...novaMeta,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar meta para persona:', error);
        throw error;
      }

      return data as MetaPersona;
    },
    onSuccess: (data) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: ['metas-persona', data.persona_id] });
      queryClient.invalidateQueries({ queryKey: ['metas-todas-personas'] });
    }
  });
}

// Atualizar progresso de meta da persona
export function useUpdateMetaPersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<MetaPersona> & { id: string }) => {
      const { data, error } = await supabase
        .from('metas_personas')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar meta da persona:', error);
        throw error;
      }

      return data as MetaPersona;
    },
    onSuccess: (data) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: ['metas-persona', data.persona_id] });
      queryClient.invalidateQueries({ queryKey: ['metas-todas-personas'] });
    }
  });
}

// =====================================================
// MILESTONES - HOOKS
// =====================================================

// Listar milestones de uma meta de persona
export function useMilestones(metaPersonaId: string) {
  return useQuery({
    queryKey: ['milestones', metaPersonaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('meta_persona_id', metaPersonaId)
        .order('prazo', { ascending: true });

      if (error) {
        console.error('Erro ao buscar milestones:', error);
        throw error;
      }

      return data as Milestone[];
    },
    enabled: !!metaPersonaId
  });
}

// Atualizar status de milestone
export function useUpdateMilestone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Milestone> & { id: string }) => {
      const { data, error } = await supabase
        .from('milestones')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar milestone:', error);
        throw error;
      }

      return data as Milestone;
    },
    onSuccess: (data) => {
      // Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: ['milestones', data.meta_persona_id] });
    }
  });
}

// =====================================================
// ANALYTICS - HOOKS
// =====================================================

// Buscar estatísticas gerais de metas de uma empresa
export function useMetasAnalytics(empresaId: string) {
  return useQuery({
    queryKey: ['metas-analytics', empresaId],
    queryFn: async () => {
      // Buscar dados agregados de metas globais
      const { data: metasGlobais, error: errorGlobais } = await supabase
        .from('metas_globais')
        .select('status, progresso, categoria, roi_esperado, budget_estimado')
        .eq('empresa_id', empresaId);

      if (errorGlobais) {
        console.error('Erro ao buscar analytics de metas globais:', errorGlobais);
        throw errorGlobais;
      }

      // Calcular estatísticas
      const totalMetas = metasGlobais?.length || 0;
      const metasConcluidas = metasGlobais?.filter(m => m.status === 'concluida').length || 0;
      const metasAtivas = metasGlobais?.filter(m => m.status === 'ativa').length || 0;
      const progressoMedio = metasGlobais?.reduce((acc, meta) => acc + meta.progresso, 0) / totalMetas || 0;
      const roiMedio = metasGlobais?.reduce((acc, meta) => acc + meta.roi_esperado, 0) / totalMetas || 0;

      return {
        totalMetas,
        metasConcluidas,
        metasAtivas,
        progressoMedio: Math.round(progressoMedio),
        roiMedio: Math.round(roiMedio),
        distribuicaoPorCategoria: metasGlobais?.reduce((acc: any, meta) => {
          acc[meta.categoria] = (acc[meta.categoria] || 0) + 1;
          return acc;
        }, {}) || {}
      };
    },
    enabled: !!empresaId && empresaId !== 'todas'
  });
}