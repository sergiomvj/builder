import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, Empresa, SystemConfiguration, Persona, TABLES } from './supabase';

// =====================
// AVATARES HOOKS
// =====================

export const useAvatarPersonas = () => {
  return useQuery({
    queryKey: ['avatares-personas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avatares_personas')
        .select(`
          *,
          personas!avatares_personas_persona_id_fkey (
            id,
            nome,
            cargo,
            empresa_id,
            empresas!personas_empresa_id_fkey (
              nome
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const usePersonaAvatars = (personaId: string) => {
  return useQuery({
    queryKey: ['persona-avatars', personaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('avatares_personas')
        .select('*')
        .eq('persona_id', personaId)
        .order('versao', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!personaId,
  });
};

export const useCreateAvatar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (avatar: {
      persona_id: string;
      avatar_url: string;
      avatar_thumbnail_url?: string;
      prompt_usado: string;
      estilo: string;
      background_tipo: string;
      servico_usado: string;
      metadados?: any;
    }) => {
      // Buscar a última versão para incrementar
      const { data: existingAvatars } = await supabase
        .from('avatares_personas')
        .select('versao')
        .eq('persona_id', avatar.persona_id)
        .order('versao', { ascending: false })
        .limit(1);
      
      const nextVersion = (existingAvatars?.[0]?.versao || 0) + 1;
      
      // Desativar avatares anteriores
      await supabase
        .from('avatares_personas')
        .update({ ativo: false })
        .eq('persona_id', avatar.persona_id);
      
      // Inserir novo avatar
      const { data, error } = await supabase
        .from('avatares_personas')
        .insert({
          ...avatar,
          versao: nextVersion,
          ativo: true
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao salvar avatar: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatares-personas'] });
      queryClient.invalidateQueries({ queryKey: ['persona-avatars'] });
    }
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ avatarId, updates }: { avatarId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('avatares_personas')
        .update(updates)
        .eq('id', avatarId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar avatar: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatares-personas'] });
      queryClient.invalidateQueries({ queryKey: ['persona-avatars'] });
    }
  });
};

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (avatarId: string) => {
      const { error } = await supabase
        .from('avatares_personas')
        .delete()
        .eq('id', avatarId);

      if (error) {
        throw new Error(`Erro ao deletar avatar: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatares-personas'] });
      queryClient.invalidateQueries({ queryKey: ['persona-avatars'] });
    }
  });
};

export const useSetActiveAvatar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ personaId, avatarId }: { personaId: string; avatarId: string }) => {
      // Desativar todos os avatares da persona
      await supabase
        .from('avatares_personas')
        .update({ ativo: false })
        .eq('persona_id', personaId);
      
      // Ativar o avatar selecionado
      const { data, error } = await supabase
        .from('avatares_personas')
        .update({ ativo: true })
        .eq('id', avatarId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao ativar avatar: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatares-personas'] });
      queryClient.invalidateQueries({ queryKey: ['persona-avatars'] });
    }
  });
};

// =====================
// PERSONAS HOOKS 
// =====================

export const useUpdatePersona = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ personaId, updates }: { personaId: string; updates: any }) => {
      const { data, error } = await supabase
        .from(TABLES.PERSONAS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', personaId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar persona: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      // Invalida as queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      queryClient.invalidateQueries({ queryKey: ['personas-empresa'] });
    }
  });
};

// =====================
// EMPRESAS HOOKS (using existing table)
// =====================

export const useEmpresas = () => {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.EMPRESAS)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Empresa[];
    },
  });
};

export const useEmpresa = (id: string) => {
  return useQuery({
    queryKey: ['empresa', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.EMPRESAS)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Empresa;
    },
    enabled: !!id,
  });
};

export const useCreateEmpresa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (empresa: Partial<Empresa>) => {
      console.log('🔧 HOOK - ========= INÍCIO useCreateEmpresa =========');
      console.log('🔧 HOOK - Dados recebidos RAW:', empresa);
      console.log('🔧 HOOK - Tipo dos dados:', typeof empresa);
      console.log('🔧 HOOK - Keys dos dados:', Object.keys(empresa || {}));
      
      // Log detalhado de cada campo
      console.log('🔧 HOOK - Análise campo por campo:');
      Object.entries(empresa || {}).forEach(([key, value]) => {
        console.log(`🔧 HOOK - ${key}:`, {
          value: value,
          type: typeof value,
          length: typeof value === 'string' ? value.length : 'N/A',
          isArray: Array.isArray(value),
          isNull: value === null,
          isUndefined: value === undefined
        });
        
        if (typeof value === 'string' && value.length > 10) {
          console.error(`🚨 HOOK - CAMPO > 10 chars: ${key} = '${value}' (${value.length})`);
        }
      });
      
      const finalData = {
        ...empresa,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('🔧 HOOK - Dados finais para Supabase:', finalData);
      console.log('🔧 HOOK - JSON final:', JSON.stringify(finalData, null, 2));
      
      // Verificar novamente campos > 10 nos dados finais
      console.log('🔧 HOOK - Verificação final campos > 10:');
      Object.entries(finalData).forEach(([key, value]) => {
        if (typeof value === 'string' && value.length > 10) {
          console.error(`🚨 HOOK FINAL - CAMPO > 10: ${key} = '${value}' (${value.length})`);
        }
      });

      console.log('🔧 HOOK - Iniciando operação Supabase...');
      const { data, error } = await supabase
        .from(TABLES.EMPRESAS)
        .insert([finalData])
        .select()
        .single();

      if (error) {
        console.error('🔧 HOOK - ========= ERRO SUPABASE DETALHADO =========');
        console.error('🔧 HOOK - Error object completo:', error);
        console.error('🔧 HOOK - Error message:', error?.message);
        console.error('🔧 HOOK - Error code:', error?.code);
        console.error('🔧 HOOK - Error details:', error?.details);
        console.error('🔧 HOOK - Error hint:', error?.hint);
        console.error('🔧 HOOK - Error keys:', Object.keys(error || {}));
        
        // Log específico dos dados que causaram o erro
        console.error('🔧 HOOK - Dados que causaram erro:', finalData);
        
        // Se for o erro de character varying(10), investigar mais
        if (error?.message?.includes?.('character varying(10)')) {
          console.error('🎯 HOOK - ERRO CONFIRMADO: character varying(10)');
          console.error('🔍 HOOK - Análise dos campos suspeitos:');
          
          Object.entries(finalData).forEach(([key, value]) => {
            if (typeof value === 'string') {
              const length = value.length;
              const status = length > 10 ? '❌ SUSPEITO' : '✅ OK';
              console.error(`🔍 HOOK - ${key}: '${value}' (${length}) ${status}`);
            }
          });
        }
        
        console.error('🔧 HOOK - ========= FIM ERRO SUPABASE =========');
        throw error;
      }
      
      console.log('🔧 HOOK - ✅ Sucesso! Dados retornados:', data);
      return data as Empresa;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
    },
  });
};

export const useUpdateEmpresa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Empresa> & { id: string }) => {
      const { data, error } = await supabase
        .from(TABLES.EMPRESAS)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Empresa;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['empresa', data.id] });
    },
  });
};

export const useDeleteEmpresa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ Iniciando exclusão da empresa:', id);
      
      // 1. Excluir avatares relacionados
      console.log('  🖼️ Excluindo avatares...');
      const { error: avatarError } = await supabase
        .from('avatares_multimedia')
        .delete()
        .eq('empresa_id', id);
      
      if (avatarError) {
        console.error('❌ Erro ao excluir avatares:', avatarError.message);
        throw new Error(`Falha ao excluir avatares: ${avatarError.message}`);
      }
      
      // 2. Excluir fluxos SDR relacionados (se existir a tabela)
      console.log('  📊 Excluindo fluxos SDR...');
      const { error: fluxosError } = await supabase
        .from('fluxos_sdr')
        .delete()
        .eq('empresa_id', id);
      
      if (fluxosError && !fluxosError.message.includes('does not exist')) {
        console.error('❌ Erro ao excluir fluxos:', fluxosError.message);
        throw new Error(`Falha ao excluir fluxos: ${fluxosError.message}`);
      }
      
      // 3. Excluir personas relacionadas
      console.log('  👤 Excluindo personas...');
      const { error: personasError } = await supabase
        .from(TABLES.PERSONAS)
        .delete()
        .eq('empresa_id', id);
      
      if (personasError) {
        console.error('❌ Erro ao excluir personas:', personasError.message);
        throw new Error(`Falha ao excluir personas: ${personasError.message}`);
      }
      
      // 4. Excluir a empresa
      console.log('  🏢 Excluindo empresa...');
      const { error } = await supabase
        .from(TABLES.EMPRESAS)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Erro ao excluir empresa:', error.message);
        throw error;
      }
      
      console.log('✅ Empresa excluída com sucesso (incluindo avatares e fluxos)');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
};

// =====================
// CONFIGURATIONS HOOKS
// =====================

export const useConfigurations = (category?: string) => {
  return useQuery({
    queryKey: ['configurations', category],
    queryFn: async () => {
      let query = supabase
        .from(TABLES.CONFIGURATIONS)
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });
      
      if (category) {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as SystemConfiguration[];
    },
  });
};

export const useConfiguration = (id: string) => {
  return useQuery({
    queryKey: ['configuration', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.CONFIGURATIONS)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as SystemConfiguration;
    },
    enabled: !!id,
  });
};

export const useCreateConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: Omit<SystemConfiguration, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from(TABLES.CONFIGURATIONS)
        .insert([{
          ...config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data as SystemConfiguration;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] });
    },
  });
};

export const useUpdateConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SystemConfiguration> & { id: string }) => {
      const { data, error } = await supabase
        .from(TABLES.CONFIGURATIONS)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as SystemConfiguration;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] });
      queryClient.invalidateQueries({ queryKey: ['configuration', data.id] });
    },
  });
};

export const useDeleteConfiguration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(TABLES.CONFIGURATIONS)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configurations'] });
    },
  });
};

// =====================
// PERSONAS HOOKS (for empresa management)
// =====================

export const useEmpresaPersonas = (empresaId: string) => {
  return useQuery({
    queryKey: ['personas', empresaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.PERSONAS)
        .select('*')
        .eq('empresa_id', empresaId)
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      return data as Persona[];
    },
    enabled: !!empresaId,
  });
};

export const usePersonasByEmpresa = (empresaId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['personas', empresaId],
    queryFn: async () => {
      if (!empresaId) return [];

      // CORREÇÃO: Fazer JOIN com todas as tabelas relacionadas
      const { data, error } = await supabase
        .from(TABLES.PERSONAS)
        .select(`
          *,
          empresas:empresa_id(id, nome, codigo),
          personas_biografias(*),
          personas_atribuicoes(*),
          personas_competencias(*),
          personas_avatares(*),
          personas_automation_opportunities(*),
          personas_workflows(*),
          personas_machine_learning(*),
          personas_auditorias(*)
        `)
        .eq('empresa_id', empresaId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as Persona[];
    },
    enabled: enabled && !!empresaId,
  });
};

export const useAllPersonas = () => {
  return useQuery({
    queryKey: ['personas', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLES.PERSONAS)
        .select(`
          *,
          empresas:empresa_id(id, nome, codigo),
          personas_biografias(*),
          personas_atribuicoes(*),
          personas_competencias(*),
          personas_avatares(*),
          personas_automation_opportunities(*),
          personas_workflows(*),
          personas_machine_learning(*),
          personas_auditorias(*)
        `)
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as Persona[];
    },
  });
};// Legacy hooks for backward compatibility (mapping to new names)
export const useCompanies = useEmpresas;
export const useCompany = useEmpresa;
export const useCreateCompany = useCreateEmpresa;
export const useUpdateCompany = useUpdateEmpresa;
export const useDeleteCompany = useDeleteEmpresa;
export const useCompanyPersonas = useEmpresaPersonas;