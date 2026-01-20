import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VCM_SUPABASE_URL!
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Configurações de atribuições por cargo
const atribuicoesPorCargo: Record<string, any> = {
  'CEO': {
    tem_funcao_sdr: true,
    quota_sdr_diaria: 5,
    escopos_sdr: ['fechamento', 'prospeccao'],
    atribuicoes_principais: [
      'Definir visão estratégica e objetivos corporativos da empresa virtual',
      'Supervisionar operações e garantir alinhamento entre departamentos', 
      'Prospectar e fechar negócios de alto valor com clientes estratégicos',
      'Representar a empresa em networking executivo e parcerias',
      'Monitorar KPIs gerais e aprovar decisões de investimento'
    ],
    kpis_principais: ['Receita total', 'Crescimento MRR', 'Deals fechados VIP', 'ROI geral']
  },
  'Head de Vendas': {
    tem_funcao_sdr: true,
    quota_sdr_diaria: 20,
    escopos_sdr: ['prospeccao', 'qualificacao', 'fechamento'],
    atribuicoes_principais: [
      'Gerenciar toda operação comercial e estratégias de vendas',
      'Executar prospecção ativa em canais digitais e qualificar leads',
      'Supervisionar pipeline de vendas e otimizar taxa de conversão',
      'Treinar equipe comercial e definir processos de vendas',
      'Fechar negócios de médio e alto ticket'
    ],
    kpis_principais: ['Pipeline value', 'Conversão leads', 'Ticket médio', 'Quota mensal']
  },
  'CMO': {
    tem_funcao_sdr: true,
    quota_sdr_diaria: 15,
    escopos_sdr: ['prospeccao', 'aquecimento'],
    atribuicoes_principais: [
      'Definir estratégia de marketing e geração de demanda',
      'Executar prospecção em redes sociais e grupos específicos',
      'Criar campanhas de aquecimento e nurturing de leads',
      'Produzir conteúdo estratégico para atração de prospects',
      'Analisar comportamento de leads e otimizar funis'
    ],
    kpis_principais: ['Leads gerados', 'Custo por lead', 'Engajamento', 'Brand awareness']
  },
  'Assistente Executivo CEO': {
    tem_funcao_sdr: true,
    quota_sdr_diaria: 25,
    escopos_sdr: ['prospeccao', 'qualificacao'],
    atribuicoes_principais: [
      'Apoiar CEO em atividades estratégicas e administrativas',
      'Executar prospecção qualificada para pipeline executivo',
      'Realizar primeira qualificação de leads de alto potencial',
      'Gerenciar agenda e prioridades do CEO',
      'Coordenar comunicação entre departamentos'
    ],
    kpis_principais: ['Leads qualificados', 'Eficiência de agenda', 'Taxa de conversão', 'Satisfação CEO']
  },
  'Assistente Comercial': {
    tem_funcao_sdr: true,
    quota_sdr_diaria: 30,
    escopos_sdr: ['prospeccao', 'qualificacao', 'suporte_vendas'],
    atribuicoes_principais: [
      'Apoiar Head de Vendas em operações comerciais',
      'Executar prospecção ativa em canais digitais',
      'Qualificar leads e preparar pipeline para vendedores',
      'Dar suporte pós-venda e follow-up com clientes',
      'Manter CRM atualizado e organizar dados comerciais'
    ],
    kpis_principais: ['Leads qualificados/dia', 'Conversão pipeline', 'Satisfação cliente', 'Reuniões agendadas']
  },
  'Especialista em Conteúdo': {
    tem_funcao_sdr: false,
    atribuicoes_principais: [
      'Criar conteúdo estratégico para funis de vendas e marketing',
      'Desenvolver materiais de apoio para SDRs (scripts, templates)',
      'Produzir vídeos, artigos e posts para redes sociais',
      'Otimizar conteúdo para SEO e geração orgânica de leads',
      'Analisar performance de conteúdo e otimizar estratégias'
    ],
    kpis_principais: ['Conteúdos produzidos', 'Engajamento médio', 'Leads orgânicos', 'Conversão conteúdo']
  }
}

async function atualizarCompetenciasPersonas() {
  console.log('🔄 Iniciando atualização de competências das personas...')
  
  try {
    // Verificar se os novos campos existem
    const { data: testData, error: testError } = await supabase
      .from('competencias')
      .select('id, atribuicoes_detalhadas, escopo_sdr_hibrido')
      .limit(1)

    if (testError && testError.message.includes('atribuicoes_detalhadas')) {
      console.log('❌ Campos ainda não foram adicionados ao banco!')
      console.log('Execute primeiro os comandos SQL no painel do Supabase.')
      return
    }

    console.log('✅ Novos campos detectados no banco')

    // Buscar todas as personas com suas competências
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select(`
        id,
        full_name,
        role,
        competencias (
          id,
          tipo,
          nome,
          persona_id
        )
      `)

    if (personasError) {
      console.error('❌ Erro ao buscar personas:', personasError)
      return
    }

    console.log(`📝 Processando ${personas?.length || 0} personas...`)

    for (const persona of personas || []) {
      console.log(`\n🎭 Processando: ${persona.full_name} (${persona.role})`)
      
      const config = atribuicoesPorCargo[persona.role]
      if (!config) {
        console.log(`⚠️ Configuração não encontrada para cargo: ${persona.role}`)
        continue
      }

      // Gerar descrição detalhada das atribuições
      const atribuicoesDetalhadas = gerarAtribuicoesDetalhadas(config, persona.role)

      // Atualizar competência principal
      const competenciaPrincipal = persona.competencias?.find(c => c.tipo === 'principal')
      if (competenciaPrincipal) {
        const { error: updateError } = await supabase
          .from('competencias')
          .update({
            atribuicoes_detalhadas: atribuicoesDetalhadas,
            escopo_sdr_hibrido: config.tem_funcao_sdr || false
          })
          .eq('id', competenciaPrincipal.id)

        if (updateError) {
          console.error(`❌ Erro ao atualizar competência principal de ${persona.full_name}:`, updateError)
        } else {
          console.log(`✅ Competência principal atualizada para ${persona.full_name}`)
        }
      }

      // Atualizar competências técnicas
      const competenciasTecnicas = persona.competencias?.filter(c => c.tipo === 'tecnica') || []
      for (const comp of competenciasTecnicas) {
        const atribuicoesTecnica = `Aplicação de ${comp.nome} nas atividades de ${persona.role}. ${config.tem_funcao_sdr ? 'Suporte às funções SDR.' : ''}`
        
        const { error: updateTecnicaError } = await supabase
          .from('competencias')
          .update({
            atribuicoes_detalhadas: atribuicoesTecnica,
            escopo_sdr_hibrido: false // Competências técnicas não são SDR
          })
          .eq('id', comp.id)

        if (updateTecnicaError) {
          console.error(`❌ Erro ao atualizar competência técnica ${comp.nome}:`, updateTecnicaError)
        }
      }

      console.log(`✅ Todas as competências atualizadas para ${persona.full_name}`)
    }

    console.log('\n🎉 Atualização de competências concluída com sucesso!')

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

function gerarAtribuicoesDetalhadas(config: any, cargo: string): string {
  let atribuicoes = config.atribuicoes_principais.join('. ') + '. '
  
  if (config.tem_funcao_sdr) {
    atribuicoes += `FUNÇÃO SDR HÍBRIDA: Além das responsabilidades principais, atua como SDR com quota de ${config.quota_sdr_diaria} leads/dia nos escopos: ${config.escopos_sdr?.join(', ')}. `
  }
  
  atribuicoes += `KPIs: ${config.kpis_principais.join(', ')}. Relatórios semanais.`
  
  // Garantir que não exceda 1000 caracteres
  return atribuicoes.length > 1000 ? atribuicoes.substring(0, 997) + '...' : atribuicoes
}

// Executar
atualizarCompetenciasPersonas().then(() => {
  console.log('🏁 Processo concluído')
  process.exit(0)
})