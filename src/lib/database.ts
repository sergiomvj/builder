import { createClient } from '@supabase/supabase-js'
import { normalizeNationality } from './normalizeNationality';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database service functions
export class DatabaseService {
  // Empresas
  static async getEmpresas() {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('status', 'ativa')
      .not('nome', 'like', '[DELETED-%')
      .not('nome', 'like', '[EXCLUÍDA]%')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getEmpresaById(id: string) {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createEmpresa(empresa: any) {
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresa)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateEmpresa(id: string, updates: any) {
    const { data, error } = await supabase
      .from('empresas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteEmpresa(id: string) {
    // Primeiro, deletar todas as personas relacionadas
    const { error: personasError } = await supabase
      .from('personas')
      .delete()
      .eq('empresa_id', id);

    if (personasError) throw personasError;

    // Depois, deletar a empresa
    const { data, error } = await supabase
      .from('empresas')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }  // Personas
  static async getPersonas(empresaId?: string) {
    console.log('🔍 DatabaseService.getPersonas chamado:', { empresaId });
    
    try {
      let query = supabase
        .from('personas')
        .select(`
          *,
          empresas!inner(id, nome, codigo, status),
          personas_avatares(*),
          personas_biografias(*),
          personas_atribuicoes(*),
          personas_competencias(*)
        `)
        .eq('empresas.status', 'ativa')
        .not('empresas.nome', 'like', '[DELETED-%')
        .not('empresas.nome', 'like', '[EXCLUÍDA]%')
        .order('created_at', { ascending: false });
      
      if (empresaId) {
        query = query.eq('empresa_id', empresaId);
      }
      
      const { data, error } = await query;
      
      console.log('📊 Resultado da query:', { 
        count: data?.length || 0, 
        error: error?.message || 'sem erro',
        sample: data?.[0] ? { 
          name: data[0].full_name, 
          empresa: data[0].empresas?.nome 
        } : 'nenhuma persona'
      });
      
      if (error) {
        console.error('❌ Erro na query:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('❌ Erro inesperado em getPersonas:', err);
      throw err;
    }
  }

  static async getPersonaById(id: string) {
    const { data, error } = await supabase
      .from('personas')
      .select(`
        *,
        empresas!inner(id, nome, codigo),
        personas_avatares(*),
        personas_biografias(*),
        personas_atribuicoes(*),
        personas_competencias(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createPersona(personaData: any) {
    // Normalize nationality before inserting. If personaData contains empresa_id,
    // use the company's country as fallback when needed.
    try {
      let countryCode: string | undefined = undefined;
      if (personaData.empresa_id) {
        try {
          const empresa = await DatabaseService.getEmpresaById(personaData.empresa_id);
          countryCode = empresa?.pais;
        } catch (err) {
          // ignore: we'll fallback to provided nationality or international
        }
      }
      personaData.nacionalidade = normalizeNationality(personaData.nacionalidade, countryCode);
    } catch (err) {
      // Keep original if normalization fails
    }

    const { data, error } = await supabase
      .from('personas')
      .insert(personaData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePersona(id: string, personaData: any) {
    const { data, error } = await supabase
      .from('personas')
      .update(personaData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePersona(id: string) {
    // Deletar dados relacionados primeiro
    await supabase.from('personas_biografias').delete().eq('persona_id', id);
    await supabase.from('competencias').delete().eq('persona_id', id);
    await supabase.from('personas_tech_specs').delete().eq('persona_id', id);
    await supabase.from('rag_knowledge').delete().eq('persona_id', id);
    await supabase.from('workflows').delete().eq('persona_id', id);
    await supabase.from('personas_atribuicoes').delete().eq('persona_id', id);

    // Deletar a persona
    const { data, error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createPersonaBiografia(biografiaData: any) {
    const { data, error } = await supabase
      .from('personas_biografias')
      .insert(biografiaData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createCompetencia(competenciaData: any) {
    const { data, error } = await supabase
      .from('competencias')
      .insert(competenciaData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createPersonaTechSpecs(techSpecsData: any) {
    const { data, error } = await supabase
      .from('personas_tech_specs')
      .insert(techSpecsData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createRagKnowledge(ragData: any) {
    const { data, error } = await supabase
      .from('rag_knowledge')
      .insert(ragData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createWorkflow(workflowData: any) {
    const { data, error } = await supabase
      .from('workflows')
      .insert(workflowData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Analytics
  static async getAnalyticsMetrics(empresaId?: string) {
    let query = supabase
      .from('analytics_metrics')
      .select('*')
      .order('date', { ascending: false });
    
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async getDashboards(empresaId?: string) {
    let query = supabase
      .from('analytics_dashboards')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  // Auditoria
  static async getAuditLogs(empresaId?: string, limit: number = 100) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(limit);
    
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async getAuditorias(empresaId?: string) {
    let query = supabase
      .from('auditorias')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async getComplianceAudit(empresaId?: string) {
    let query = supabase
      .from('compliance_audit')
      .select('*')
      .order('assessed_at', { ascending: false });
    
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  // Workflows
  static async getN8nWorkflows(empresaId?: string) {
    let query = supabase
      .from('n8n_workflows')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async getTechSpecifications(personaId?: string) {
    let query = supabase
      .from('tech_specifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (personaId) {
      query = query.eq('persona_id', personaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  // Status & System
  static async getSystemAlerts() {
    const { data, error } = await supabase
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data;
  }

  static async getPerformanceMetrics(empresaId?: string) {
    let query = supabase
      .from('performance_metrics')
      .select('*')
      .order('metric_date', { ascending: false });
    
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  // Configurations
  static async getSystemConfigurations() {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getConfigurationAudit() {
    const { data, error } = await supabase
      .from('configuration_audit')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    return data;
  }

  // Generic dashboard stats
  static async getDashboardStats() {
    try {
      // Contar empresas ativas (incluindo as que foram criadas nos testes)
      const empresasQuery = await supabase
        .from('empresas')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'ativa');
      
      // Se não há empresas ativas, contar empresas que não foram explicitamente deletadas
      let empresasCount = empresasQuery.count || 0;
      
      if (empresasCount === 0) {
        const empresasNaoDeletedas = await supabase
          .from('empresas')
          .select('id', { count: 'exact', head: true })
          .not('nome', 'like', '[DELETED-%')
          .not('nome', 'like', '[EXCLUÍDA]%');
        
        empresasCount = empresasNaoDeletedas.count || 0;
      }

      // Contar todas as personas do sistema (para dar uma visão geral)
      const personasQuery = await supabase
        .from('personas')
        .select('id', { count: 'exact', head: true });

      return {
        totalEmpresas: empresasCount,
        totalPersonas: personasQuery.count || 0,
        activeAudits: 0, // Será implementado quando a tabela auditorias for usada
        activeAlerts: 0  // Será implementado quando a tabela system_alerts for usada
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalEmpresas: 0,
        totalPersonas: 0,
        activeAudits: 0,
        activeAlerts: 0
      };
    }
  }
}