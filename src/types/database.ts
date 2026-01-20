// =====================================================
// BuildCorp Dashboard - Database Types V2.0
// =====================================================
// Tipos TypeScript para todas as entidades do sistema

export interface Empresa {
  id: string;
  nome: string;
  descricao: string;
  dominio?: string; // Nova field - URL do site
  industria: 'tecnologia' | 'saude' | 'financas' | 'educacao' | 'varejo' | 'servicos' | 'manufatura' | 'energia' | 'telecomunicacoes' | 'agronegocio';
  created_at: string;
  updated_at: string;
}

export interface Persona {
  id: string;
  empresa_id: string;
  nome: string;
  cargo: string;
  departamento: string;
  nivel_hierarquico: 'junior' | 'pleno' | 'senior' | 'coordenador' | 'gerente' | 'diretor' | 'vice_presidente' | 'presidente';
  is_ceo: boolean;
  tipo: 'executivo' | 'especialista' | 'assistente';
  idade: number;
  genero: 'masculino' | 'feminino' | 'outros';
  nacionalidade: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// NOVAS ENTIDADES - METAS E OBJETIVOS
// =====================================================

export interface MetaGlobal {
  id: string;
  empresa_id: string;
  titulo: string;
  descricao: string;
  prazo: string; // Date ISO string
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
  prazo: string; // Date ISO string
  progresso: number; // 0-100
  alinhamento_score: number; // 0-100
  status: 'ativa' | 'pausada' | 'concluida' | 'cancelada';
  dependencias?: string[];
  recursos_necessarios?: string[];
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
  
  // Relacionamentos populados
  meta_global?: MetaGlobal;
  persona?: Persona;
}

export interface Milestone {
  id: string;
  titulo: string;
  prazo: string;
  concluido: boolean;
  data_conclusao?: string;
}

// =====================================================
// AUDITORIA E COMPATIBILIDADE
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
  proxima_auditoria?: string; // Date ISO string
  created_at: string;
  updated_at: string;
  
  // Relacionamentos populados
  empresa?: Empresa;
  persona?: Persona;
  meta_global?: MetaGlobal;
  meta_persona?: MetaPersona;
}

export interface AnaliseDetalhada {
  pontos_fortes?: string[];
  pontos_fracos?: string[];
  riscos_identificados?: string[];
  oportunidades_melhoria?: string[];
  alinhamento_objetivos?: number;
  eficiencia_workflow?: number;
  qualidade_outputs?: number;
  consistencia_comportamento?: number;
}

// =====================================================
// AVATARES E VISUAL
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
  metadados: AvatarMetadados;
  created_at: string;
  
  // Relacionamento
  persona?: Persona;
}

export interface AvatarMetadados {
  resolucao?: string;
  formato?: string;
  tamanho_arquivo?: number;
  seed_usado?: string;
  parametros_geracao?: Record<string, any>;
  tempo_geracao?: number;
  custo_estimado?: number;
}

// =====================================================
// BIOGRAFIAS EXPANDIDAS
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

export interface Motivacoes {
  intrinsecas?: string[];
  extrinsecas?: string[];
  valores_pessoais?: string[];
  paixoes?: string[];
}

export interface Desafios {
  profissionais?: string[];
  pessoais?: string[];
  tecnologicos?: string[];
  interpessoais?: string[];
}

export interface SoftSkills {
  comunicacao?: number; // 1-10
  lideranca?: number;
  trabalho_equipe?: number;
  resolucao_problemas?: number;
  criatividade?: number;
  adaptabilidade?: number;
  inteligencia_emocional?: number;
  pensamento_critico?: number;
}

export interface HardSkills {
  tecnologicas?: Record<string, number>; // skill: level (1-10)
  ferramentas?: string[];
  metodologias?: string[];
  areas_conhecimento?: string[];
}

export interface Educacao {
  formacao_superior?: string[];
  pos_graduacao?: string[];
  cursos_complementares?: string[];
  instituicoes?: string[];
}

export interface IdiomasFluencia {
  nativo?: string[];
  fluente?: string[];
  intermediario?: string[];
  basico?: string[];
}

export interface ExperienciaInternacional {
  paises_trabalhou?: string[];
  projetos_globais?: string[];
  clientes_internacionais?: boolean;
  culturas_conhece?: string[];
}

export interface RedesSociais {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website_pessoal?: string;
  outros?: Record<string, string>;
}

// =====================================================
// ESPECIFICAÇÕES TÉCNICAS EXPANDIDAS
// =====================================================

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
  tools_habilitadas: ToolConfig[];
  integracoes_sistemas: IntegracaoSistema[];
  limitacoes: Limitacoes;
  configuracao_avancada: ConfiguracaoAvancada;
  created_at: string;
  updated_at: string;
  
  // Relacionamento
  persona?: Persona;
}

export interface ToolConfig {
  nome: string;
  ativo: boolean;
  configuracao?: Record<string, any>;
  restricoes?: string[];
}

export interface IntegracaoSistema {
  sistema: string;
  tipo: 'leitura' | 'escrita' | 'leitura_escrita';
  endpoint?: string;
  autenticacao?: string;
  permissoes?: string[];
}

export interface Limitacoes {
  tempo_resposta_max?: number;
  requests_por_minuto?: number;
  dominios_permitidos?: string[];
  acoes_bloqueadas?: string[];
  horario_funcionamento?: {
    inicio: string;
    fim: string;
    dias_semana: number[];
  };
}

export interface ConfiguracaoAvancada {
  memory_context?: number;
  conversation_history?: boolean;
  learning_enabled?: boolean;
  feedback_processing?: boolean;
  custom_prompts?: Record<string, string>;
  fallback_behavior?: string;
}

// =====================================================
// TIPOS AUXILIARES E UTILITIES
// =====================================================

export type PersonaCompleta = Persona & {
  biografia?: PersonaBiografia;
  tech_specs?: PersonaTechSpecs;
  avatares?: AvatarPersona[];
  metas?: MetaPersona[];
  auditorias?: AuditoriaCompatibilidade[];
};

export type EmpresaCompleta = Empresa & {
  personas?: PersonaCompleta[];
  metas_globais?: MetaGlobal[];
  auditorias?: AuditoriaCompatibilidade[];
};

// =====================================================
// FORM TYPES E DTOs
// =====================================================

export interface CreateMetaGlobalDto {
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

export interface CreateMetaPersonaDto {
  meta_global_id: string;
  persona_id: string;
  titulo: string;
  descricao: string;
  prazo: string;
  dependencias?: string[];
  recursos_necessarios?: string[];
}

export interface CreateAvatarDto {
  persona_id: string;
  prompt_usado: string;
  estilo: AvatarPersona['estilo'];
  background_tipo: AvatarPersona['background_tipo'];
  servico_usado?: AvatarPersona['servico_usado'];
}

export interface UpdateBiografiaDto {
  biografia_completa?: string;
  historia_profissional?: string;
  motivacoes?: Motivacoes;
  desafios?: Desafios;
  objetivos_pessoais?: string[];
  soft_skills?: SoftSkills;
  hard_skills?: HardSkills;
  educacao?: Educacao;
  certificacoes?: string[];
  idiomas_fluencia?: IdiomasFluencia;
  experiencia_internacional?: ExperienciaInternacional;
  redes_sociais?: RedesSociais;
}

export interface UpdateTechSpecsDto {
  ai_model?: string;
  max_tokens?: number;
  temperature?: number;
  response_format?: PersonaTechSpecs['response_format'];
  priority_level?: PersonaTechSpecs['priority_level'];
  decision_authority?: PersonaTechSpecs['decision_authority'];
  access_scope?: string;
  tools_habilitadas?: ToolConfig[];
  integracoes_sistemas?: IntegracaoSistema[];
  limitacoes?: Limitacoes;
  configuracao_avancada?: ConfiguracaoAvancada;
}