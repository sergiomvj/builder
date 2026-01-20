// Serviço para buscar empresas do sistema
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4Nzk1NzcsImV4cCI6MjA0NzQ1NTU3N30.nCOPGmZHTppXgFz6_QqCNYEUu4QVRGZHKCYlKWLwbmo';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface Empresa {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  pais: string;
  industria: string;
  status: 'ativa' | 'inativa' | 'processando';
  total_personas: number;
  created_at: string;
  updated_at: string;
}

export class EmpresaService {
  
  static async getEmpresas(): Promise<Empresa[]> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('status', 'ativa')
        .order('nome', { ascending: true });

      if (error) {
        console.error('Erro ao buscar empresas:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço de empresas:', error);
      throw error;
    }
  }

  static async getEmpresaById(id: string): Promise<Empresa | null> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar empresa por ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço de empresa por ID:', error);
      throw error;
    }
  }

  static async getPersonasCount(empresaId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('personas')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId)
        .eq('status', 'active');

      if (error) {
        console.error('Erro ao contar personas:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Erro no serviço de contagem de personas:', error);
      return 0;
    }
  }

  static async getEmpresaStats(empresaId: string) {
    try {
      const [personasCount, auditoriasCount, packagesCount] = await Promise.all([
        this.getPersonasCount(empresaId),
        this.getAuditoriasCount(empresaId),
        this.getPackagesCount(empresaId)
      ]);

      return {
        personas: personasCount,
        auditorias: auditoriasCount,
        packages: packagesCount
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas da empresa:', error);
      return {
        personas: 0,
        auditorias: 0,
        packages: 0
      };
    }
  }

  private static async getAuditoriasCount(empresaId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('auditorias')
        .select('*', { count: 'exact', head: true })
        .eq('empresa_id', empresaId);

      if (error) {
        console.error('Erro ao contar auditorias:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Erro no serviço de contagem de auditorias:', error);
      return 0;
    }
  }

  private static async getPackagesCount(empresaId: string): Promise<number> {
    // Como não temos uma tabela específica de packages, vamos simular
    // Você pode implementar isso conforme sua estrutura de dados
    return Math.floor(Math.random() * 50) + 10;
  }
}