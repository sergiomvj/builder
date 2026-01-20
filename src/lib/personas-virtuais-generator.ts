import { createClient } from '@supabase/supabase-js'
import { PersonaVirtualConfig, TipoPersonaVirtual, EscopoSDR } from '../types/personas-virtuais'

let supabaseClient: any | null = null

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl =
    process.env.VCM_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.VCM_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Configuração do Supabase ausente no ambiente')
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey)
  return supabaseClient
}

export class PersonasVirtuaisGenerator {
  
  private empresaId: string
  private empresaNome: string
  private industria: string

  constructor(empresaId: string, empresaNome: string, industria: string = 'tecnologia') {
    this.empresaId = empresaId
    this.empresaNome = empresaNome
    this.industria = industria
  }

  // Configurações padrão para empresas virtuais com SDR híbrido
  private getPersonasConfigPadrao(): PersonaVirtualConfig[] {
    return [
      // 1. CEO - Executivo com visão SDR estratégica
      {
        tipo_persona: TipoPersonaVirtual.EXECUTIVO,
        cargo_principal: 'CEO',
        departamento: 'Executivo',
        nivel_hierarquia: 1,
        tem_funcao_sdr: true,
        escopos_sdr: [EscopoSDR.FECHAMENTO, EscopoSDR.PROSPECCAO],
        quota_sdr_diaria: 5, // Leads VIP/estratégicos
        atribuicoes_principais: [
          'Definir visão estratégica e objetivos corporativos da empresa virtual',
          'Supervisionar operações e garantir alinhamento entre departamentos',
          'Prospectar e fechar negócios de alto valor com clientes estratégicos',
          'Representar a empresa em networking executivo e parcerias',
          'Monitorar KPIs gerais e aprovar decisões de investimento',
          'Liderar reuniões executivas e definir prioridades organizacionais'
        ],
        competencias_chave: ['liderança estratégica', 'vendas executivas', 'networking', 'tomada de decisão'],
        kpis_principais: ['Receita total', 'Crescimento MRR', 'Deals fechados VIP', 'ROI geral'],
        frequencia_relatorio: 'semanal'
      },

      // 2. Head de Vendas - Executivo focado em SDR
      {
        tipo_persona: TipoPersonaVirtual.EXECUTIVO,
        cargo_principal: 'Head de Vendas',
        departamento: 'Comercial',
        nivel_hierarquia: 2,
        tem_funcao_sdr: true,
        escopos_sdr: [EscopoSDR.PROSPECCAO, EscopoSDR.QUALIFICACAO, EscopoSDR.FECHAMENTO],
        quota_sdr_diaria: 20,
        atribuicoes_principais: [
          'Gerenciar toda operação comercial e estratégias de vendas',
          'Executar prospecção ativa em canais digitais e qualificar leads',
          'Supervisionar pipeline de vendas e otimizar taxa de conversão',
          'Treinar equipe comercial e definir processos de vendas',
          'Fechar negócios de médio e alto ticket',
          'Analisar métricas comerciais e reportar resultados'
        ],
        competencias_chave: ['gestão comercial', 'prospecção ativa', 'qualificação de leads', 'fechamento'],
        kpis_principais: ['Pipeline value', 'Conversão leads', 'Ticket médio', 'Quota mensal'],
        frequencia_relatorio: 'semanal'
      },

      // 3. CMO - Executivo com foco em leads marketing
      {
        tipo_persona: TipoPersonaVirtual.EXECUTIVO,
        cargo_principal: 'CMO',
        departamento: 'Marketing',
        nivel_hierarquia: 2,
        tem_funcao_sdr: true,
        escopos_sdr: [EscopoSDR.PROSPECCAO, EscopoSDR.AQUECIMENTO],
        quota_sdr_diaria: 15,
        atribuicoes_principais: [
          'Definir estratégia de marketing e geração de demanda',
          'Executar prospecção em redes sociais e grupos específicos',
          'Criar campanhas de aquecimento e nurturing de leads',
          'Produzir conteúdo estratégico para atração de prospects',
          'Analisar comportamento de leads e otimizar funis',
          'Gerenciar presença digital e branding da empresa'
        ],
        competencias_chave: ['estratégia de marketing', 'social selling', 'content marketing', 'lead nurturing'],
        kpis_principais: ['Leads gerados', 'Custo por lead', 'Engajamento', 'Brand awareness'],
        frequencia_relatorio: 'semanal'
      },

      // 4-6. Assistentes Executivos com SDR híbrido
      {
        tipo_persona: TipoPersonaVirtual.ASSISTENTE,
        cargo_principal: 'Assistente Executivo CEO',
        departamento: 'Executivo',
        nivel_hierarquia: 3,
        tem_funcao_sdr: true,
        escopos_sdr: [EscopoSDR.PROSPECCAO, EscopoSDR.QUALIFICACAO],
        quota_sdr_diaria: 25,
        atribuicoes_principais: [
          'Apoiar CEO em atividades estratégicas e administrativas',
          'Executar prospecção qualificada para pipeline executivo',
          'Realizar primeira qualificação de leads de alto potencial',
          'Gerenciar agenda e prioridades do CEO',
          'Coordenar comunicação entre departamentos',
          'Preparar relatórios e análises para tomada de decisão'
        ],
        competencias_chave: ['organização executiva', 'prospecção qualificada', 'comunicação', 'análise de dados'],
        kpis_principais: ['Leads qualificados', 'Eficiência de agenda', 'Taxa de conversão', 'Satisfação CEO'],
        frequencia_relatorio: 'semanal'
      },

      {
        tipo_persona: TipoPersonaVirtual.ASSISTENTE,
        cargo_principal: 'Assistente Comercial',
        departamento: 'Comercial', 
        nivel_hierarquia: 3,
        tem_funcao_sdr: true,
        escopos_sdr: [EscopoSDR.PROSPECCAO, EscopoSDR.QUALIFICACAO, EscopoSDR.SUPORTE_VENDAS],
        quota_sdr_diaria: 30,
        atribuicoes_principais: [
          'Apoiar Head de Vendas em operações comerciais',
          'Executar prospecção ativa em canais digitais',
          'Qualificar leads e preparar pipeline para vendedores',
          'Dar suporte pós-venda e follow-up com clientes',
          'Manter CRM atualizado e organizar dados comerciais',
          'Agendar reuniões e demos para equipe de vendas'
        ],
        competencias_chave: ['SDR operations', 'CRM management', 'lead qualification', 'customer success'],
        kpis_principais: ['Leads qualificados/dia', 'Conversão pipeline', 'Satisfação cliente', 'Reuniões agendadas'],
        frequencia_relatorio: 'semanal'
      },

      {
        tipo_persona: TipoPersonaVirtual.ASSISTENTE,
        cargo_principal: 'Assistente de Marketing',
        departamento: 'Marketing',
        nivel_hierarquia: 3, 
        tem_funcao_sdr: true,
        escopos_sdr: [EscopoSDR.PROSPECCAO, EscopoSDR.AQUECIMENTO],
        quota_sdr_diaria: 20,
        atribuicoes_principais: [
          'Apoiar CMO em campanhas de marketing e geração de demanda',
          'Executar prospecção em redes sociais e grupos de interesse',
          'Desenvolver sequências de aquecimento para leads frios',
          'Criar e postar conteúdo para engajamento',
          'Monitorar métricas de marketing digital',
          'Gerenciar relacionamento com influenciadores e parceiros'
        ],
        competencias_chave: ['social media', 'content creation', 'lead warming', 'community management'],
        kpis_principais: ['Engajamento social', 'Leads aquecidos', 'Reach orgânico', 'Conversão conteúdo'],
        frequencia_relatorio: 'semanal'
      },

      // 7-10. Especialistas com foco em suporte à operação SDR
      {
        tipo_persona: TipoPersonaVirtual.ESPECIALISTA,
        cargo_principal: 'Especialista em Conteúdo',
        departamento: 'Marketing',
        nivel_hierarquia: 4,
        tem_funcao_sdr: false,
        atribuicoes_principais: [
          'Criar conteúdo estratégico para funis de vendas e marketing',
          'Desenvolver materiais de apoio para SDRs (scripts, templates)',
          'Produzir vídeos, artigos e posts para redes sociais',
          'Otimizar conteúdo para SEO e geração orgânica de leads',
          'Analisar performance de conteúdo e otimizar estratégias',
          'Colaborar com vendas para criar materiais de fechamento'
        ],
        competencias_chave: ['content marketing', 'copywriting', 'SEO', 'video production'],
        kpis_principais: ['Conteúdos produzidos', 'Engajamento médio', 'Leads orgânicos', 'Conversão conteúdo'],
        frequencia_relatorio: 'semanal'
      }

      // Adicionar mais especialistas conforme necessário...
    ]
  }

  async gerarPersonasVirtuais(): Promise<void> {
    console.log(`🎭 Iniciando geração de personas virtuais para ${this.empresaNome}...`)
    
    const configs = this.getPersonasConfigPadrao()
    
    for (const config of configs) {
      await this.criarPersonaComAtribuicoes(config)
    }
    
    console.log('✅ Todas as personas virtuais foram criadas!')
  }

  private async criarPersonaComAtribuicoes(config: PersonaVirtualConfig): Promise<void> {
    try {
      const supabase = getSupabaseClient()

      // Gerar nome baseado no cargo
      const nomePersona = this.gerarNomePersona(config.cargo_principal)
      const personaCode = this.gerarCodigoPersona(nomePersona, config.tipo_persona)
      
      // Criar persona básica
      const { data: persona, error: personaError } = await supabase
        .from('personas')
        .insert({
          persona_code: personaCode,
          full_name: nomePersona,
          role: config.cargo_principal,
          specialty: config.competencias_chave.join(', '),
          department: config.departamento,
          email: `${personaCode.toLowerCase()}@${this.empresaNome.toLowerCase().replace(/\s+/g, '')}.com`,
          whatsapp: this.gerarWhatsApp(),
          empresa_id: this.empresaId,
          status: 'active'
        })
        .select()
        .single()

      if (personaError) {
        console.error('❌ Erro ao criar persona:', personaError)
        return
      }

      console.log(`✅ Persona criada: ${nomePersona} (${config.cargo_principal})`)

      // Criar competências com atribuições detalhadas
      await this.criarCompetenciasComAtribuicoes(persona.id, config)

    } catch (error) {
      console.error('❌ Erro geral ao criar persona:', error)
    }
  }

  private async criarCompetenciasComAtribuicoes(personaId: string, config: PersonaVirtualConfig): Promise<void> {
    const supabase = getSupabaseClient()

    // Gerar descrição detalhada das atribuições
    const atribuicoesDetalhadas = this.gerarAtribuicoesDetalhadas(config)
    
    // Competência principal com atribuições
    const competenciaPrincipal = {
      persona_id: personaId,
      tipo: 'principal' as const,
      nome: config.cargo_principal,
      descricao: `Responsabilidades principais como ${config.cargo_principal}`,
      nivel: 'avancado' as const,
      categoria: config.departamento,
      atribuicoes_detalhadas: atribuicoesDetalhadas,
      escopo_sdr_hibrido: config.tem_funcao_sdr
    }

    // Competências técnicas específicas
    const competenciasTecnicas = config.competencias_chave.map(competencia => ({
      persona_id: personaId,
      tipo: 'tecnica' as const,
      nome: competencia,
      descricao: `Competência técnica em ${competencia}`,
      nivel: 'avancado' as const,
      categoria: config.departamento,
      atribuicoes_detalhadas: `Aplicação de ${competencia} nas atividades de ${config.cargo_principal}`,
      escopo_sdr_hibrido: false
    }))

    // Inserir todas as competências
    const todasCompetencias = [competenciaPrincipal, ...competenciasTecnicas]
    
    const { error } = await supabase
      .from('competencias')
      .insert(todasCompetencias)

    if (error) {
      console.error('❌ Erro ao criar competências:', error)
    } else {
      console.log(`✅ Competências criadas para ${config.cargo_principal}`)
    }
  }

  private gerarAtribuicoesDetalhadas(config: PersonaVirtualConfig): string {
    let atribuicoes = config.atribuicoes_principais.join('. ') + '. '
    
    if (config.tem_funcao_sdr) {
      atribuicoes += `FUNÇÃO SDR HÍBRIDA: Além das responsabilidades principais, atua como SDR com quota de ${config.quota_sdr_diaria} leads/dia nos escopos: ${config.escopos_sdr?.join(', ')}. `
    }
    
    atribuicoes += `KPIs: ${config.kpis_principais.join(', ')}. Relatórios ${config.frequencia_relatorio}s.`
    
    // Garantir que não exceda 1000 caracteres
    return atribuicoes.length > 1000 ? atribuicoes.substring(0, 997) + '...' : atribuicoes
  }

  private gerarNomePersona(cargo: string): string {
    const nomes = {
      'CEO': 'Maria Elena Rodriguez',
      'Head de Vendas': 'Carlos Alberto Santos', 
      'CMO': 'Ana Beatriz Silva',
      'Assistente Executivo CEO': 'Juliana Costa',
      'Assistente Comercial': 'Pedro Henrique Lima',
      'Assistente de Marketing': 'Sofia Mendes',
      'Especialista em Conteúdo': 'Lucas Gabriel Pereira'
    }
    
    return nomes[cargo as keyof typeof nomes] || `Persona ${cargo}`
  }

  private gerarCodigoPersona(nome: string, tipo: TipoPersonaVirtual): string {
    const iniciais = nome.split(' ').map(n => n[0]).join('')
    return `${iniciais}_${tipo.toUpperCase()}_${Date.now()}`
  }

  private gerarWhatsApp(): string {
    return `+55 11 9${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`
  }
}

// Função para executar a geração
export async function gerarPersonasVirtuaisCompletas(empresaId: string, empresaNome: string): Promise<void> {
  const generator = new PersonasVirtuaisGenerator(empresaId, empresaNome)
  await generator.gerarPersonasVirtuais()
}
