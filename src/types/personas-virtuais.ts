// Tipos atualizados para o sistema de personas com atribuições
export interface PersonaComAtribuicoes {
  id: string
  persona_code: string
  full_name: string
  role: string
  specialty?: string
  department: string
  email: string
  whatsapp: string
  empresa_id: string
  biografia_completa?: string
  
  // Competências com atribuições detalhadas
  competencias: CompetenciaComAtribuicoes[]
  
  // Status e configurações
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
}

export interface CompetenciaComAtribuicoes {
  id: string
  persona_id: string
  tipo: 'principal' | 'tecnica' | 'soft_skill'
  nome: string
  descricao?: string
  nivel: 'basico' | 'intermediario' | 'avancado' | 'expert'
  categoria?: string
  
  // NOVOS CAMPOS
  atribuicoes_detalhadas: string  // Máximo 1000 caracteres
  escopo_sdr_hibrido: boolean     // Se tem funções híbridas SDR
  
  created_at: string
}

// Tipos específicos para empresas virtuais
export enum TipoPersonaVirtual {
  EXECUTIVO = 'executivo',
  ASSISTENTE = 'assistente', 
  ESPECIALISTA = 'especialista',
  SUPORTE = 'suporte'
}

export enum EscopoSDR {
  PROSPECCAO = 'prospeccao',
  QUALIFICACAO = 'qualificacao',
  AQUECIMENTO = 'aquecimento',
  FECHAMENTO = 'fechamento',
  SUPORTE_VENDAS = 'suporte_vendas'
}

export interface PersonaVirtualConfig {
  tipo_persona: TipoPersonaVirtual
  cargo_principal: string
  departamento: string
  nivel_hierarquia: 1 | 2 | 3 | 4  // 1=CEO, 2=Diretores, 3=Gerentes, 4=Operacional
  
  // Configuração SDR híbrido
  tem_funcao_sdr: boolean
  escopos_sdr?: EscopoSDR[]
  quota_sdr_diaria?: number
  
  // Atribuições principais
  atribuicoes_principais: string[]
  competencias_chave: string[]
  
  // Métricas e KPIs
  kpis_principais: string[]
  frequencia_relatorio: 'diario' | 'semanal' | 'mensal' | 'trimestral'
}