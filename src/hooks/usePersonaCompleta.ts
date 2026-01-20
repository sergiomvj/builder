import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PersonaCompleta {
  // Dados básicos da persona
  id: string;
  persona_code: string;
  full_name: string;
  role: string;
  specialty?: string;
  department?: string;
  email: string;
  empresa_id: string;
  
  // Biografia estruturada
  biografia?: {
    biografia_completa: string;
    historia_profissional?: string;
    motivacoes?: any;
    desafios?: any;
    objetivos_pessoais?: string[];
    soft_skills?: any;
    hard_skills?: any;
    educacao?: any;
    certificacoes?: string[];
    idiomas_fluencia?: any;
    experiencia_internacional?: any;
    redes_sociais?: any;
  };
  
  // Competências
  competencias?: Array<{
    id: string;
    tipo: string;
    nome: string;
    nivel: string;
    categoria?: string;
  }>;
  
  // Tech Specs
  tech_specs?: {
    id: string;
    role: string;
    tools: string[];
    technologies: string[];
    methodologies: string[];
    sales_enablement: string[];
  };
}

export function usePersonaCompleta(personaId?: string) {
  return useQuery({
    queryKey: ['persona-completa', personaId],
    queryFn: async () => {
      if (!personaId) return null;
      
      console.log('🔍 Buscando dados completos da persona:', personaId);
      
      // 1. Buscar dados básicos da persona
      const { data: persona, error: personaError } = await supabase
        .from('personas')
        .select('*')
        .eq('id', personaId)
        .single();
        
      if (personaError) {
        console.error('Erro ao buscar persona:', personaError);
        throw personaError;
      }
      
      // 2. Buscar competências
      const { data: competencias, error: competenciasError } = await supabase
        .from('competencias')
        .select('*')
        .eq('persona_id', personaId);
        
      if (competenciasError) {
        console.error('Erro ao buscar competências:', competenciasError);
      }
      
      // 3. Buscar tech specs (opcional - pode não existir)
      let techSpecs = null;
      try {
        const { data: techSpecsData, error: techSpecsError } = await supabase
          .from('tech_specifications')
          .select('*')
          .eq('persona_id', personaId)
          .single();
        
        if (!techSpecsError) {
          techSpecs = techSpecsData;
        }
      } catch (e) {
        console.warn('Tech specs não encontradas para persona:', personaId);
      }
      
      // Combinar dados - biografia vem da coluna biografia_completa da tabela personas
      const personaCompleta: PersonaCompleta = {
        ...persona,
        biografia: {
          biografia_completa: persona.biografia_completa || '',
          historia_profissional: '',
          hard_skills: competencias?.filter(c => c.tipo === 'hard_skill' || c.tipo === 'tecnica') || [],
          soft_skills: competencias?.filter(c => c.tipo === 'soft_skill') || [],
        },
        competencias: competencias || [],
        tech_specs: techSpecs || undefined
      };
      
      console.log('✅ Dados completos da persona carregados:', personaCompleta);
      return personaCompleta;
    },
    enabled: !!personaId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}