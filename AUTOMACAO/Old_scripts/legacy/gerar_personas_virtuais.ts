import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Importar o gerador (precisamos adaptar o caminho)
class PersonasVirtuaisGenerator {
  
  private empresaId: string
  private empresaNome: string
  private industria: string
  private supabase: any

  constructor(empresaId: string, empresaNome: string, industria: string = 'tecnologia') {
    dotenv.config()
    this.empresaId = empresaId
    this.empresaNome = empresaNome
    this.industria = industria
    
    const supabaseUrl = process.env.VCM_SUPABASE_URL!
    const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY!
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // Configurações padrão para empresas virtuais com SDR híbrido
  private getPersonasConfigPadrao() {
    return [
      // 1. CEO - Executivo com visão SDR estratégica
      {
        tipo_persona: 'executivo',
        cargo_principal: 'CEO',
        departamento: 'Executivo',
        nivel_hierarquia: 1,
        tem_funcao_sdr: true,
        escopos_sdr: ['fechamento', 'prospeccao'],
        quota_sdr_diaria: 5,
        atribuicoes_principais: [
          'Definir visão estratégica e objetivos corporativos da empresa virtual',
          'Supervisionar operações e garantir alinhamento entre departamentos',
          'Prospectar e fechar negócios de alto valor com clientes estratégicos',
          'Representar a empresa em networking executivo e parcerias',
          'Monitorar KPIs gerais e aprovar decisões de investimento'
        ],
        competencias_chave: ['liderança estratégica', 'vendas executivas', 'networking', 'tomada de decisão'],
        kpis_principais: ['Receita total', 'Crescimento MRR', 'Deals fechados VIP', 'ROI geral'],
        frequencia_relatorio: 'semanal'
      },

      // 2. Head de Vendas
      {
        tipo_persona: 'executivo',
        cargo_principal: 'Head de Vendas',
        departamento: 'Comercial',
        nivel_hierarquia: 2,
        tem_funcao_sdr: true,
        escopos_sdr: ['prospeccao', 'qualificacao', 'fechamento'],
        quota_sdr_diaria: 20,
        atribuicoes_principais: [
          'Gerenciar toda operação comercial e estratégias de vendas',
          'Executar prospecção ativa em canais digitais e qualificar leads',
          'Supervisionar pipeline de vendas e otimizar taxa de conversão',
          'Treinar equipe comercial e definir processos de vendas',
          'Fechar negócios de médio e alto ticket'
        ],
        competencias_chave: ['gestão comercial', 'prospecção ativa', 'qualificação de leads', 'fechamento'],
        kpis_principais: ['Pipeline value', 'Conversão leads', 'Ticket médio', 'Quota mensal'],
        frequencia_relatorio: 'semanal'
      },

      // 3. CMO
      {
        tipo_persona: 'executivo',
        cargo_principal: 'CMO',
        departamento: 'Marketing',
        nivel_hierarquia: 2,
        tem_funcao_sdr: true,
        escopos_sdr: ['prospeccao', 'aquecimento'],
        quota_sdr_diaria: 15,
        atribuicoes_principais: [
          'Definir estratégia de marketing e geração de demanda',
          'Executar prospecção em redes sociais e grupos específicos',
          'Criar campanhas de aquecimento e nurturing de leads',
          'Produzir conteúdo estratégico para atração de prospects',
          'Analisar comportamento de leads e otimizar funis'
        ],
        competencias_chave: ['estratégia de marketing', 'social selling', 'content marketing', 'lead nurturing'],
        kpis_principais: ['Leads gerados', 'Custo por lead', 'Engajamento', 'Brand awareness'],
        frequencia_relatorio: 'semanal'
      },

      // 4. Assistente Executivo CEO
      {
        tipo_persona: 'assistente',
        cargo_principal: 'Assistente Executivo CEO',
        departamento: 'Executivo',
        nivel_hierarquia: 3,
        tem_funcao_sdr: true,
        escopos_sdr: ['prospeccao', 'qualificacao'],
        quota_sdr_diaria: 25,
        atribuicoes_principais: [
          'Apoiar CEO em atividades estratégicas e administrativas',
          'Executar prospecção qualificada para pipeline executivo',
          'Realizar primeira qualificação de leads de alto potencial',
          'Gerenciar agenda e prioridades do CEO',
          'Coordenar comunicação entre departamentos'
        ],
        competencias_chave: ['organização executiva', 'prospecção qualificada', 'comunicação', 'análise de dados'],
        kpis_principais: ['Leads qualificados', 'Eficiência de agenda', 'Taxa de conversão', 'Satisfação CEO'],
        frequencia_relatorio: 'semanal'
      },

      // 5. Assistente Comercial
      {
        tipo_persona: 'assistente',
        cargo_principal: 'Assistente Comercial',
        departamento: 'Comercial',
        nivel_hierarquia: 3,
        tem_funcao_sdr: true,
        escopos_sdr: ['prospeccao', 'qualificacao', 'suporte_vendas'],
        quota_sdr_diaria: 30,
        atribuicoes_principais: [
          'Apoiar Head de Vendas em operações comerciais',
          'Executar prospecção ativa em canais digitais',
          'Qualificar leads e preparar pipeline para vendedores',
          'Dar suporte pós-venda e follow-up com clientes',
          'Manter CRM atualizado e organizar dados comerciais'
        ],
        competencias_chave: ['SDR operations', 'CRM management', 'lead qualification', 'customer success'],
        kpis_principais: ['Leads qualificados/dia', 'Conversão pipeline', 'Satisfação cliente', 'Reuniões agendadas'],
        frequencia_relatorio: 'semanal'
      },

      // 6. Especialista em Conteúdo
      {
        tipo_persona: 'especialista',
        cargo_principal: 'Especialista em Conteúdo',
        departamento: 'Marketing',
        nivel_hierarquia: 4,
        tem_funcao_sdr: false,
        atribuicoes_principais: [
          'Criar conteúdo estratégico para funis de vendas e marketing',
          'Desenvolver materiais de apoio para SDRs (scripts, templates)',
          'Produzir vídeos, artigos e posts para redes sociais',
          'Otimizar conteúdo para SEO e geração orgânica de leads',
          'Analisar performance de conteúdo e otimizar estratégias'
        ],
        competencias_chave: ['content marketing', 'copywriting', 'SEO', 'video production'],
        kpis_principais: ['Conteúdos produzidos', 'Engajamento médio', 'Leads orgânicos', 'Conversão conteúdo'],
        frequencia_relatorio: 'semanal'
      }
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

  private async criarPersonaComAtribuicoes(config: any): Promise<void> {
    try {
      // Gerar nome baseado no cargo
      const nomePersona = this.gerarNomePersona(config.cargo_principal)
      const personaCode = this.gerarCodigoPersona(nomePersona, config.tipo_persona)
      
      console.log(`📝 Criando persona: ${nomePersona} (${config.cargo_principal})`)
      
      // Criar persona básica
      const { data: persona, error: personaError } = await this.supabase
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

      console.log(`✅ Persona criada: ${nomePersona}`)

      // Criar competências com atribuições detalhadas
      await this.criarCompetenciasComAtribuicoes(persona.id, config)

    } catch (error) {
      console.error('❌ Erro geral ao criar persona:', error)
    }
  }

  private async criarCompetenciasComAtribuicoes(personaId: string, config: any): Promise<void> {
    // Gerar descrição detalhada das atribuições
    const atribuicoesDetalhadas = this.gerarAtribuicoesDetalhadas(config)
    
    // Competência principal com atribuições
    const competenciaPrincipal = {
      persona_id: personaId,
      tipo: 'principal',
      nome: config.cargo_principal,
      descricao: `Responsabilidades principais como ${config.cargo_principal}`,
      nivel: 'avancado',
      categoria: config.departamento,
      atribuicoes_detalhadas: atribuicoesDetalhadas,
      escopo_sdr_hibrido: config.tem_funcao_sdr
    }

    // Competências técnicas específicas
    const competenciasTecnicas = config.competencias_chave.map((competencia: string) => ({
      persona_id: personaId,
      tipo: 'tecnica',
      nome: competencia,
      descricao: `Competência técnica em ${competencia}`,
      nivel: 'avancado',
      categoria: config.departamento,
      atribuicoes_detalhadas: `Aplicação de ${competencia} nas atividades de ${config.cargo_principal}`,
      escopo_sdr_hibrido: false
    }))

    // Inserir todas as competências
    const todasCompetencias = [competenciaPrincipal, ...competenciasTecnicas]
    
    const { error } = await this.supabase
      .from('competencias')
      .insert(todasCompetencias)

    if (error) {
      console.error('❌ Erro ao criar competências:', error)
      console.error('Dados enviados:', JSON.stringify(todasCompetencias, null, 2))
    } else {
      console.log(`✅ ${todasCompetencias.length} competências criadas para ${config.cargo_principal}`)
    }
  }

  private gerarAtribuicoesDetalhadas(config: any): string {
    let atribuicoes = config.atribuicoes_principais.join('. ') + '. '
    
    if (config.tem_funcao_sdr) {
      atribuicoes += `FUNÇÃO SDR HÍBRIDA: Além das responsabilidades principais, atua como SDR com quota de ${config.quota_sdr_diaria} leads/dia nos escopos: ${config.escopos_sdr?.join(', ')}. `
    }
    
    atribuicoes += `KPIs: ${config.kpis_principais.join(', ')}. Relatórios ${config.frequencia_relatorio}s.`
    
    // Garantir que não exceda 1000 caracteres
    return atribuicoes.length > 1000 ? atribuicoes.substring(0, 997) + '...' : atribuicoes
  }

  private gerarNomePersona(cargo: string): string {
    const nomes: Record<string, string> = {
      'CEO': 'Maria Elena Rodriguez',
      'Head de Vendas': 'Carlos Alberto Santos',
      'CMO': 'Ana Beatriz Silva',
      'Assistente Executivo CEO': 'Juliana Costa',
      'Assistente Comercial': 'Pedro Henrique Lima',
      'Assistente de Marketing': 'Sofia Mendes',
      'Especialista em Conteúdo': 'Lucas Gabriel Pereira'
    }
    
    return nomes[cargo] || `Persona ${cargo}`
  }

  private gerarCodigoPersona(nome: string, tipo: string): string {
    const iniciais = nome.split(' ').map(n => n[0]).join('')
    return `${iniciais}_${tipo.toUpperCase()}_${Date.now()}`
  }

  private gerarWhatsApp(): string {
    return `+55 11 9${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`
  }
}

// Função principal
async function main() {
  try {
    // Buscar empresas ativas
    dotenv.config()
    const supabaseUrl = process.env.VCM_SUPABASE_URL!
    const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('id, nome, codigo')
      .eq('status', 'ativa')
      .limit(1)

    if (error || !empresas?.length) {
      console.log('❌ Nenhuma empresa ativa encontrada')
      return
    }

    const empresa = empresas[0]
    console.log(`🏢 Gerando personas para: ${empresa.nome} (${empresa.codigo})`)

    const generator = new PersonasVirtuaisGenerator(empresa.id, empresa.nome)
    await generator.gerarPersonasVirtuais()

    console.log('🏁 Geração completa de personas virtuais finalizada!')

  } catch (error) {
    console.error('❌ Erro na execução:', error)
  }
}

// Executar
main().then(() => process.exit(0))