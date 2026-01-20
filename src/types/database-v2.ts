// =====================================================
// BuildCorp Dashboard - Tipos TypeScript V2.0
// =====================================================
// Tipos para todas as novas funcionalidades

import { Empresa, Persona } from '@/lib/supabase';

// =====================================================
// SISTEMA DE OBJETIVOS E METAS
// =====================================================

export interface MetaGlobal {
  id: string;
  empresa_id: string;
  titulo: string;
  descricao: string;
  prazo: string; // ISO date string
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  categoria: 'crescimento' | 'operacional' | 'financeira' | 'inovacao' | 'sustentabilidade';
  progresso: number; // 0-100
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada';
  responsavel_principal?: string;
  indicadores_sucesso?: string[];
  budget_estimado?: number;
  roi_esperado?: number;
  created_at: string;
  updated_at: string;
}

export interface MetaPersona {
  id: string;
  meta_global_id: string;
  persona_id: string;
  titulo: string;
  descricao: string;
  tipo_persona: 'executivo' | 'especialista' | 'assistente';
  prazo: string; // ISO date string
  progresso: number; // 0-100
  alinhamento_score: number; // 0-100
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada';
  dependencias?: string[];
  recursos_necessarios?: string[];
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (populados via joins)
  meta_global?: MetaGlobal;
  persona?: Persona;
}

export interface Milestone {
  id: string;
  titulo: string;
  data_prevista: string;
  data_conclusao?: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  descricao?: string;
}

// =====================================================
// SISTEMA DE AUDITORIA
// =====================================================

export interface AuditoriaCompatibilidade {
  id: string;
  empresa_id: string;
  persona_id: string;
  workflow_reference: string;
  meta_global_id?: string;
  meta_persona_id?: string;
  compatibilidade_score: number; // 0-100
  compatibilidade_nivel: 'baixo' | 'medio' | 'alto' | 'excelente';
  analise_detalhada: AnaliseDetalhada;
  observacoes?: string;
  acoes_sugeridas?: string[];
  status_auditoria: 'pendente' | 'em_analise' | 'aprovado' | 'reprovado' | 'requer_ajuste';
  auditado_por?: string;
  auditado_em?: string;
  proxima_auditoria?: string; // ISO date string
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  empresa?: Empresa;
  persona?: Persona;
  meta_global?: MetaGlobal;
  meta_persona?: MetaPersona;
}

export interface AnaliseDetalhada {
  pontos_fortes: string[];
  pontos_fracos: string[];
  gaps_identificados: string[];
  recomendacoes: string[];
  impacto_estimado: 'baixo' | 'medio' | 'alto';
  esforco_estimado: 'baixo' | 'medio' | 'alto';
  prioridade_sugerida: 'baixa' | 'media' | 'alta' | 'critica';
}

// =====================================================
// SISTEMA DE AVATARES
// =====================================================

export interface AvatarPersona {
  id: string;
  persona_id: string;
  avatar_url: string;
  avatar_thumbnail_url?: string;
  prompt_usado: string;
  estilo: 'corporate' | 'casual' | 'creative' | 'formal';
  background_tipo: 'office' | 'home_office' | 'neutral' | 'custom';
  servico_usado: 'nano_banana' | 'dall_e' | 'midjourney' | 'custom';
  versao: number;
  ativo: boolean;
  metadados: AvatarMetadata;
  created_at: string;
  
  // Relacionamento
  persona?: Persona;
}

export interface AvatarMetadata {
  resolution?: string;
  format?: string;
  generation_time?: number; // segundos
  cost?: number;
  prompt_optimized?: string;
  style_transfer?: boolean;
  face_enhancement?: boolean;
  background_removed?: boolean;
}

// =====================================================
// EXPANSÃO DO SISTEMA DE PERSONAS
// =====================================================

export interface PersonaBiografia {
  id: string;
  persona_id: string;
  biografia_completa: string;
  historia_profissional?: string;
  motivacoes: Motivacoes;
  desafios: Desafios;
  objetivos_pessoais?: string[];
  soft_skills: SoftSkills;
  hard_skills: HardSkills;
  educacao: Educacao;
  certificacoes?: string[];
  idiomas_fluencia: IdiomasFluencia;
  experiencia_internacional: ExperienciaInternacional;
  redes_sociais: RedesSociais;
  created_at: string;
  updated_at: string;
  
  // Relacionamento
  persona?: Persona;
}

export interface PersonaTechSpecs {
  id: string;
  persona_id: string;
  ai_model: string;
  max_tokens: number;
  temperature: number;
  response_format: 'structured' | 'creative' | 'analytical' | 'conversational';
  priority_level: 'low' | 'medium' | 'high' | 'critical';
  decision_authority: 'none' | 'operational' | 'tactical' | 'strategic' | 'full';
  access_scope: string;
  tools_habilitadas: string[];
  integracoes_sistemas: string[];
  limitacoes: Limitacoes;
  configuracao_avancada: ConfiguracaoAvancada;
  created_at: string;
  updated_at: string;
  
  // Relacionamento
  persona?: Persona;
}

// =====================================================
// INTERFACES DE APOIO
// =====================================================

export interface Motivacoes {
  intrinsecas: string[]; // Motivações internas
  extrinsecas: string[]; // Motivações externas
  valores_principais: string[];
  drivers_carreira: string[];
}

export interface Desafios {
  tecnicos: string[];
  interpessoais: string[];
  organizacionais: string[];
  estrategicos: string[];
  pessoais: string[];
}

export interface SoftSkills {
  comunicacao: number; // 1-5
  lideranca: number;
  trabalho_equipe: number;
  resolucao_problemas: number;
  criatividade: number;
  adaptabilidade: number;
  empatia: number;
  negociacao: number;
}

export interface HardSkills {
  [categoria: string]: {
    skills: string[];
    nivel: 'basico' | 'intermediario' | 'avancado' | 'expert';
    certificado: boolean;
    anos_experiencia: number;
  };
}

export interface Educacao {
  formacao_superior: FormacaoSuperior[];
  cursos_complementares: Curso[];
  especializacoes: Especializacao[];
}

export interface FormacaoSuperior {
  instituicao: string;
  curso: string;
  nivel: 'graduacao' | 'pos_graduacao' | 'mestrado' | 'doutorado';
  status: 'completo' | 'cursando' | 'trancado';
  ano_inicio: number;
  ano_conclusao?: number;
  nota_media?: number;
}

export interface Curso {
  nome: string;
  instituicao: string;
  carga_horaria: number;
  certificado: boolean;
  data_conclusao: string;
  relevancia: 'alta' | 'media' | 'baixa';
}

export interface Especializacao {
  area: string;
  descricao: string;
  certificacoes: string[];
  projetos_relevantes: string[];
}

export interface IdiomasFluencia {
  [idioma: string]: {
    nivel: 'basico' | 'intermediario' | 'avancado' | 'fluente' | 'nativo';
    certificacao?: string;
    uso_profissional: boolean;
  };
}

export interface ExperienciaInternacional {
  paises_trabalho: string[];
  paises_estudo: string[];
  paises_projetos: string[];
  tempo_exterior_total: number; // meses
  adaptacao_cultural: number; // 1-5
}

export interface RedesSociais {
  linkedin?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  personal_website?: string;
  blog?: string;
}

export interface Limitacoes {
  horario_atendimento: string;
  tipos_tarefas_evitar: string[];
  nivel_confidencialidade: 'publico' | 'interno' | 'confidencial' | 'secreto';
  aprovacoes_necessarias: string[];
  budget_limite?: number;
}

export interface ConfiguracaoAvancada {
  custom_prompts: { [situacao: string]: string };
  fallback_strategies: string[];
  escalation_rules: EscalationRule[];
  integration_configs: { [sistema: string]: any };
  monitoring_enabled: boolean;
  logging_level: 'minimal' | 'standard' | 'detailed' | 'debug';
}

export interface EscalationRule {
  condicao: string;
  acao: string;
  destinatario: string;
  timeout_minutos: number;
}

// =====================================================
// PERSONA EXPANDIDA (ATUALIZADA)
// =====================================================

export interface PersonaExpandida extends Persona {
  biografia?: PersonaBiografia;
  tech_specs?: PersonaTechSpecs;
  avatar_ativo?: AvatarPersona;
  avatares_historico?: AvatarPersona[];
  metas?: MetaPersona[];
  auditorias?: AuditoriaCompatibilidade[];
}

// =====================================================
// EMPRESA EXPANDIDA (ATUALIZADA)
// =====================================================

export interface EmpresaExpandida extends Empresa {
  metas_globais?: MetaGlobal[];
  auditorias_geral?: {
    score_medio: number;
    total_workflows: number;
    workflows_alinhados: number;
    personas_auditadas: number;
  };
  personas_expandidas?: PersonaExpandida[];
}

// =====================================================
// FORMULÁRIOS E DTOs
// =====================================================

export interface CreateMetaGlobalData {
  titulo: string;
  descricao: string;
  prazo: string;
  prioridade: MetaGlobal['prioridade'];
  categoria: MetaGlobal['categoria'];
  responsavel_principal?: string;
  indicadores_sucesso?: string[];
  budget_estimado?: number;
  roi_esperado?: number;
}

export interface CreateAvatarData {
  estilo: AvatarPersona['estilo'];
  background_tipo: AvatarPersona['background_tipo'];
  prompt_personalizado?: string;
}

export interface AuditoriaSummary {
  empresa_id: string;
  total_personas: number;
  personas_auditadas: number;
  score_medio: number;
  workflows_total: number;
  workflows_alinhados: number;
  pendencias: number;
  ultima_auditoria: string;
}

// =====================================================
// FILTROS E QUERIES
// =====================================================

export interface MetasFilter {
  empresa_id?: string;
  status?: MetaGlobal['status'][];
  prioridade?: MetaGlobal['prioridade'][];
  categoria?: MetaGlobal['categoria'][];
  prazo_inicio?: string;
  prazo_fim?: string;
  progresso_min?: number;
  progresso_max?: number;
}

export interface AuditoriasFilter {
  empresa_id?: string;
  persona_id?: string;
  compatibilidade_min?: number;
  status?: AuditoriaCompatibilidade['status_auditoria'][];
  data_inicio?: string;
  data_fim?: string;
}

export interface PersonasFilter {
  empresa_id?: string;
  role?: string;
  department?: string;
  tem_avatar?: boolean;
  tem_biografia?: boolean;
  tem_tech_specs?: boolean;
  status?: string;
}