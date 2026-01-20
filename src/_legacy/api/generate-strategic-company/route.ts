import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getNationalitiesForCountry } from '../../../lib/normalizeNationality'

// Usar as mesmas variáveis que o resto do sistema
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente Supabase não configuradas')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseServiceKey)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// 🎯 ESTRUTURA FIXA DE 15 PERSONAS
const ESTRUTURA_PERSONAS = {
  // Executivos (4) - TODOS OS CAMPOS ≤ 10 CARACTERES
  "ceo": { role: "CEO", specialty: "Liderança", department: "Executivo", nivel: "C-Level" },
  "cto": { role: "CTO", specialty: "Tecnologia", department: "Executivo", nivel: "C-Level" },
  "cfo": { role: "CFO", specialty: "Finanças", department: "Executivo", nivel: "C-Level" },
  "hr_manager": { role: "HR Manager", specialty: "RH", department: "Executivo", nivel: "Manager" },
  
  // SDR Team (4) - ROLES CORRIGIDOS
  "sdr_manager": { role: "SDR Mgr", specialty: "Vendas", department: "SDR", nivel: "Manager" },
  "sdr_senior": { role: "SDR Senior", specialty: "Prospecção", department: "SDR", nivel: "Senior" },
  "sdr_junior": { role: "SDR Junior", specialty: "Leads", department: "SDR", nivel: "Junior" },
  "sdr_analyst": { role: "SDR Analst", specialty: "Análise", department: "SDR", nivel: "Analyst" },
  
  // Marketing (3) - ROLES CORRIGIDOS 
  "youtube_manager": { role: "YT Manager", specialty: "YouTube", department: "Marketing", nivel: "Manager" },
  "social_media": { role: "Social Mkt", specialty: "Sociais", department: "Marketing", nivel: "Specialist" },
  "marketing_manager": { role: "Mkt Mgr", specialty: "Marketing", department: "Marketing", nivel: "Manager" },
  
  // Assistentes (4) - ROLES CORRIGIDOS
  "assistant_admin": { role: "Asst Admin", specialty: "Admin", department: "Assistente", nivel: "Assistant" },
  "assistant_finance": { role: "Asst Fin", specialty: "Finanças", department: "Assistente", nivel: "Assistant" },
  "assistant_hr": { role: "Asst RH", specialty: "RH", department: "Assistente", nivel: "Assistant" },
  "assistant_marketing": { role: "Asst Mkt", specialty: "Marketing", department: "Assistente", nivel: "Assistant" }
}

/**
 * POST /api/generate-strategic-company
 * 
 * ENDPOINTS:
 * 1. { action: 'analyze' } - Análise estratégica inicial
 * 2. { action: 'generate' } - Gerar biografias baseadas na análise
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, ...data } = body

    console.log(`🚀 API Strategic Company: ${action}`)

    switch (action) {
      case 'analyze':
        return await analyzeCompany(data)
      
      case 'generate':
        return await generateCompanyWithPersonas(data)
      
      default:
        return NextResponse.json({
          error: 'Ação inválida. Use "analyze" ou "generate"'
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ Erro na API strategic-company:', error)
    console.error('Detalhes do erro:', error.message)
    console.error('Stack:', error.stack)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error.message || 'Desconhecido'),
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

/**
 * 🧠 ANÁLISE ESTRATÉGICA DA EMPRESA
 */
async function analyzeCompany(data: any) {
  const { companyData } = data

  if (!companyData?.nome || !companyData?.industria) {
    return NextResponse.json({
      error: 'Nome e indústria da empresa são obrigatórios'
    }, { status: 400 })
  }

  console.log(`🧠 Analisando empresa: ${companyData.nome} - ${companyData.industria}`)

  // 🤖 ANÁLISE LLM ESTRATÉGICA - Mock estruturado
  const analise_estrategica = gerarAnaliseEstrategica(companyData)

  return NextResponse.json({
    success: true,
    analise_estrategica,
    estrutura_personas: ESTRUTURA_PERSONAS,
    total_personas_disponiveis: Object.keys(ESTRUTURA_PERSONAS).length,
    message: `Análise estratégica concluída para ${companyData.nome}`
  })
}

/**
 * 🎨 GERAR EMPRESA COMPLETA COM PERSONAS
 */
async function generateCompanyWithPersonas(data: any) {
  const { companyData, analise_estrategica, personas_escolhidas, idiomas_requeridos } = data

  if (!companyData?.nome || !personas_escolhidas?.length) {
    return NextResponse.json({
      error: 'Dados incompletos para geração'
    }, { status: 400 })
  }

  // Idiomas padrão se não especificados
  const idiomasEmpresa = idiomas_requeridos || (companyData.pais === 'Brasil' ? ['Português', 'Inglês'] : ['Inglês'])

  console.log(`🎨 Gerando empresa: ${companyData.nome} com ${personas_escolhidas.length} personas`)

  try {
    // 1. Criar empresa no banco (dados básicos primeiro)
    const codigoGerado = generateCompanyCode(companyData.nome)
    
    const companyCountryCode = (companyData.pais === 'Brasil' || companyData.pais === 'BR') ? 'BR' : (companyData.paisCodigo || undefined)

    const empresaData = {
      nome: (companyData.nome || '').substring(0, 255), // Limitar nome
      industry: (companyData.industria || 'tecnologia').substring(0, 100), // Limitar industry
      pais: (companyData.pais || 'Brasil').substring(0, 100), // Limitar país
      // If caller provided explicit nationalities use them, otherwise populate a sensible
      // set based on inferred country code so we don't default to a single 'Internacional'.
      nationalities: companyData.nationalities && companyData.nationalities.length > 0
        ? companyData.nationalities
        : getNationalitiesForCountry(companyCountryCode),
      descricao: (companyData.descricao || `Empresa criada estrategicamente com ${personas_escolhidas.length} personas`).substring(0, 500), // Limitar descrição
      codigo: codigoGerado, // Já limitado a 10 caracteres
      total_personas: personas_escolhidas.length,
      status: 'ativa'
    }

    console.log(`💾 Salvando empresa no banco...`)
    console.log(`📝 Código: "${codigoGerado}" (${codigoGerado.length} chars)`)
    console.log(`📝 Nome: "${empresaData.nome}" (${empresaData.nome.length} chars)`)

    const { data: empresaCriada, error: empresaError } = await supabase
      .from('empresas')
      .insert(empresaData)
      .select()
      .single()

    if (empresaError) {
      console.error('❌ Erro ao criar empresa:', empresaError)
      console.error('❌ Dados que causaram erro:', empresaData)
      throw new Error(`Erro Supabase: ${empresaError.message}`)
    }

    console.log(`✅ Empresa criada: ${empresaCriada.id}`)

    // 2. Gerar biografias personalizadas
    console.log(`🤖 Gerando biografias para ${personas_escolhidas.length} personas...`)
    const biografias = await gerarBiografias(personas_escolhidas, companyData, analise_estrategica, idiomasEmpresa)

    // 3. Salvar personas (todos os campos obrigatórios com validação de tamanho)
    const personasData = personas_escolhidas.map((personaCode: string, index: number) => {
      const biografia = biografias[personaCode]
      const estrutura = ESTRUTURA_PERSONAS[personaCode as keyof typeof ESTRUTURA_PERSONAS]
      const nomeCompleto = biografia.nome_completo || `${estrutura.role} da ${companyData.nome}`
      
      // Criar persona_code único para evitar conflitos - LIMITADO
      const baseCode = `${personaCode}_${empresaCriada.id.substring(0, 8)}_${index + 1}`
      const uniquePersonaCode = baseCode.substring(0, 50) // Limitar a 50 chars
      
      return {
        empresa_id: empresaCriada.id,
        persona_code: uniquePersonaCode,
        full_name: (nomeCompleto || '').substring(0, 255), // Limitar nome
        role: (estrutura.role || '').substring(0, 10),    // 🚨 LIMITADO A 10 CHARS
        specialty: (estrutura.specialty || '').substring(0, 10), // 🚨 LIMITADO A 10 CHARS  
        department: (estrutura.department || '').substring(0, 10), // 🚨 LIMITADO A 10 CHARS
        email: generateEmail(nomeCompleto, companyData.nome, uniquePersonaCode, index).substring(0, 255), // Limitar email
        whatsapp: generateWhatsApp().substring(0, 20), // Limitar whatsapp
        biografia_completa: (biografia.biografia_completa || '').substring(0, 2000), // Limitar biografia
        idiomas: biografia.idiomas || idiomasEmpresa, // Campo específico para idiomas
        personalidade: {
          idade: biografia.idade,
          nacionalidade: biografia.nacionalidade,
          formacao_academica: biografia.formacao_academica,
          anos_experiencia: biografia.anos_experiencia,
          experiencia_anterior: biografia.experiencia_anterior,
          personalidade: biografia.personalidade,
          habilidades_chave: biografia.habilidades_chave,
          conquistas: biografia.conquistas,
          motivacao_principal: biografia.motivacao_principal,
          estilo_trabalho: biografia.estilo_trabalho,
          especializacao_area: biografia.especializacao_area
        },
        experiencia_anos: biografia.anos_experiencia || 0
      }
    })

    console.log(`👥 Inserindo ${personasData.length} personas com todos os campos obrigatórios...`)
    
    // Log detalhado para debug - VERIFICAR CADA CAMPO QUE PODE CAUSAR ERRO
    personasData.forEach((persona: any, index: number) => {
      console.log(`🔍 PERSONA ${index + 1} DEBUG:`)
      console.log(`   empresa_id: "${persona.empresa_id}" (${persona.empresa_id?.length || 0} chars)`)
      console.log(`   persona_code: "${persona.persona_code}" (${persona.persona_code?.length || 0} chars)`)
      console.log(`   full_name: "${persona.full_name}" (${persona.full_name?.length || 0} chars)`)
      console.log(`   role: "${persona.role}" (${persona.role?.length || 0} chars)`)
      console.log(`   specialty: "${persona.specialty}" (${persona.specialty?.length || 0} chars)`)
      console.log(`   department: "${persona.department}" (${persona.department?.length || 0} chars)`)
      console.log(`   email: "${persona.email}" (${persona.email?.length || 0} chars)`)
      console.log(`   whatsapp: "${persona.whatsapp}" (${persona.whatsapp?.length || 0} chars)`)
      console.log(`   biografia_completa: "${(persona.biografia_completa || '').substring(0, 50)}..." (${persona.biografia_completa?.length || 0} chars)`)
      console.log(`   experiencia_anos: "${persona.experiencia_anos}" (type: ${typeof persona.experiencia_anos})`)
      
      // 🚨 VERIFICAR SE HÁ ALGUM CAMPO QUE PODE EXCEDER 10 CARACTERES
      const fieldsWith10CharLimit = []
      if (persona.persona_code && persona.persona_code.length > 10) fieldsWith10CharLimit.push(`persona_code(${persona.persona_code.length})`)
      if (persona.role && persona.role.length > 10) fieldsWith10CharLimit.push(`role(${persona.role.length})`)
      if (persona.specialty && persona.specialty.length > 10) fieldsWith10CharLimit.push(`specialty(${persona.specialty.length})`)
      if (persona.department && persona.department.length > 10) fieldsWith10CharLimit.push(`department(${persona.department.length})`)
      
      if (fieldsWith10CharLimit.length > 0) {
        console.log(`   🚨 CAMPOS QUE PODEM CAUSAR ERRO: ${fieldsWith10CharLimit.join(', ')}`)
      }
    })

    const { data: personasInseridas, error: personasError } = await supabase
      .from('personas')
      .insert(personasData)
      .select()

    if (personasError) {
      console.error('❌ Erro ao criar personas:', personasError)
      throw new Error(`Erro ao inserir personas: ${personasError.message}`)
    }

    console.log(`✅ Personas criadas com sucesso:`, personasInseridas?.length || 0)

    if (personasError) {
      console.error('Erro ao criar personas:', personasError)
      throw personasError
    }

    console.log(`🎉 Sucesso! Empresa criada com ${personasData.length} personas`)

    return NextResponse.json({
      success: true,
      empresa_id: empresaCriada.id,
      empresa_codigo: empresaCriada.codigo,
      personas_criadas: personasData.length,
      biografias: biografias,
      url_empresa: `/empresas/${empresaCriada.id}`,
      url_personas: `/personas?empresa=${empresaCriada.id}`,
      message: `Empresa ${empresaCriada.nome} criada com ${personasData.length} personas!`
    })

  } catch (error) {
    console.error('Erro ao criar empresa completa:', error)
    return NextResponse.json({
      error: `Erro ao salvar empresa: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }, { status: 500 })
  }
}

/**
 * 🧠 GERAR ANÁLISE ESTRATÉGICA (Mock estruturado)
 */
function gerarAnaliseEstrategica(empresa: any) {
  const industrias_config = {
    'tecnologia': {
      desafios: ['Concorrência acirrada', 'Inovação constante', 'Captação de talentos técnicos'],
      oportunidades: ['Transformação digital', 'Automação empresarial', 'IA e Machine Learning'],
      segmentos_alvo: ['Empresas 50-500 funcionários', 'Startups em crescimento', 'Indústrias tradicionais'],
      estrategia_prospeccao: 'Outbound técnico com demos práticas e POCs'
    },
    'consultoria': {
      desafios: ['Diferenciação no mercado', 'Escalabilidade', 'Gestão de conhecimento'],
      oportunidades: ['Consultoria digital', 'Processos remotos', 'Especialização setorial'],
      segmentos_alvo: ['Médias empresas', 'Empresas familiares', 'Setores regulados'],
      estrategia_prospeccao: 'Consultoria baseada em valor com case studies'
    },
    'e-commerce': {
      desafios: ['Logística', 'Experiência do cliente', 'Competição por preço'],
      oportunidades: ['Omnichannel', 'Personalização', 'Marketplaces'],
      segmentos_alvo: ['Varejo tradicional', 'Marcas próprias', 'B2B wholesalers'],
      estrategia_prospeccao: 'Demonstração de ROI e crescimento de vendas'
    }
  }

  const config = industrias_config[empresa.industria?.toLowerCase() as keyof typeof industrias_config] || industrias_config.tecnologia

  return {
    analise_empresa: {
      desafios: config.desafios,
      oportunidades: config.oportunidades,
      necessidades: [
        'Equipe qualificada',
        'Estratégia de vendas clara',
        'Presença digital forte'
      ]
    },
    proposta_valor: {
      diferenciais: [
        'Soluções customizadas',
        'Atendimento personalizado', 
        'Expertise setorial'
      ],
      estrategia_principal: `Foco em soluções B2B com alta personalização para o setor de ${empresa.industria}`,
      foco_atuacao: `Empresas de médio porte em ${empresa.pais} que precisam de ${empresa.industria.toLowerCase()}`
    },
    equipe_recomendada: {
      essenciais: ['ceo', 'cto', 'sdr_manager', 'sdr_senior', 'marketing_manager', 'assistant_admin'],
      opcionais: ['cfo', 'hr_manager', 'sdr_junior', 'sdr_analyst', 'youtube_manager', 'social_media', 'assistant_finance', 'assistant_hr', 'assistant_marketing'],
      justificativas: {
        'ceo': 'Liderança estratégica fundamental',
        'cto': `Essencial para empresa de ${empresa.industria}`,
        'sdr_manager': 'Coordenar estratégia de vendas B2B',
        'sdr_senior': 'Prospecção ativa e fechamento',
        'marketing_manager': 'Geração de demanda qualificada',
        'assistant_admin': 'Suporte operacional essencial'
      },
      prioridades: {
        'ceo': 10, 'cto': 10, 'sdr_manager': 9, 'sdr_senior': 8,
        'marketing_manager': 8, 'assistant_admin': 7, 'cfo': 6,
        'hr_manager': 5, 'sdr_junior': 6, 'sdr_analyst': 5
      }
    },
    estrategia_sdr: {
      segmentos_alvo: config.segmentos_alvo,
      estrategia_prospeccao: config.estrategia_prospeccao,
      especializacoes: {
        'sdr_manager': 'Estratégia geral e contas enterprise',
        'sdr_senior': 'Prospecção C-level e fechamento',
        'sdr_junior': 'Lead qualification e nurturing',
        'sdr_analyst': 'Análise de mercado e performance'
      }
    }
  }
}

/**
 * 🤖 GERAR BIOGRAFIAS PERSONALIZADAS COM IA REAL
 */
async function gerarBiografias(personas_escolhidas: string[], empresa: any, analise?: any, idiomasRequeridos?: string[]) {
  console.log('🤖 Iniciando geração de biografias com IA...')
  
  // Verificar se temos chave da Google AI
  const googleAiKey = process.env.GOOGLE_AI_API_KEY
  if (!googleAiKey) {
    console.warn('⚠️ GOOGLE_AI_API_KEY não configurada, usando biografias básicas')
    return gerarBiografiasBasicas(personas_escolhidas, empresa, analise, idiomasRequeridos)
  }

  const biografias: any = {}
  const nomes_brasileiros = {
    masculinos: ['Carlos Silva', 'João Santos', 'Roberto Costa', 'André Oliveira', 'Fernando Lima', 'Rafael Souza', 'Marcelo Ferreira', 'Paulo Rodrigues'],
    femininos: ['Ana Silva', 'Maria Santos', 'Carla Costa', 'Juliana Oliveira', 'Fernanda Lima', 'Patricia Souza', 'Luciana Ferreira', 'Camila Rodrigues']
  }
  const nomes_internacionais = {
    masculinos: ['John Smith', 'Michael Johnson', 'David Brown', 'James Wilson', 'Robert Davis', 'William Miller', 'Richard Garcia', 'Thomas Anderson'],
    femininos: ['Sarah Johnson', 'Jennifer Smith', 'Michelle Brown', 'Lisa Wilson', 'Amanda Davis', 'Jessica Miller', 'Ashley Garcia', 'Nicole Anderson']
  }
  const nomes = empresa.pais === 'Brasil' ? nomes_brasileiros : nomes_internacionais

  // Gerar biografias com IA para cada persona
  for (let i = 0; i < personas_escolhidas.length; i++) {
    const personaCode = personas_escolhidas[i]
    const estrutura = ESTRUTURA_PERSONAS[personaCode as keyof typeof ESTRUTURA_PERSONAS]
    const isExecutive = estrutura.department === 'Executivo'
    const isFemale = i % 3 === 0
    const nomeArray = isFemale ? nomes.femininos : nomes.masculinos
    const nome = nomeArray[i % nomeArray.length]

    try {
      console.log(`🎯 Gerando biografia IA para: ${nome} (${estrutura.role})`)
      
      const prompt = `
VOCÊ É UM ESPECIALISTA EM CRIAÇÃO DE PERSONAS EMPRESARIAIS REALÍSTICAS.

EMPRESA: ${empresa.nome}
SETOR: ${empresa.industria}
PAÍS: ${empresa.pais}
IDIOMAS REQUERIDOS: ${idiomasRequeridos?.join(', ') || 'Português, Inglês'}

PERSONA: ${nome}
CARGO: ${estrutura.role}
DEPARTAMENTO: ${estrutura.department}
ESPECIALIDADE: ${estrutura.specialty}
NÍVEL: ${estrutura.nivel}

ANÁLISE ESTRATÉGICA:
- Desafios: ${analise?.analise_empresa?.desafios?.join(', ') || 'Crescimento competitivo'}
- Oportunidades: ${analise?.analise_empresa?.oportunidades?.join(', ') || 'Inovação tecnológica'}

INSTRUÇÕES:
1. Crie uma biografia ÚNICA e PERSONALIZADA para esta persona
2. Torne o profissional REAL e HUMANO, com personalidade distinta
3. Adapte a experiência ao setor e desafios da empresa
4. Inclua detalhes específicos da área de especialização
5. Use tom profissional mas humanizado
6. Varie experiências, formações e estilos de trabalho
7. IMPORTANTE: Adapte idiomas falados pelos funcionários conforme requisitos da empresa

RESPONDA APENAS EM JSON válido com esta estrutura:
{
  "idade": número,
  "formacao_academica": "string detalhada e específica",
  "anos_experiencia": número,
  "experiencia_anterior": "string específica e única",
  "personalidade": "string única e específica para esta pessoa",
  "habilidades_chave": ["array", "de", "habilidades", "específicas"],
  "conquistas": ["array", "de", "conquistas", "específicas", "e", "únicas"],
  "biografia_completa": "biografia completa, única e detalhada (2-3 parágrafos com personalidade)",
  "motivacao_principal": "string específica e única",
  "estilo_trabalho": "string específica para esta pessoa",
  "idiomas": ${JSON.stringify(idiomasRequeridos || ['Português', 'Inglês'])}
}
`

      // Chamada para Google Gemini AI
      const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + googleAiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,
            topP: 0.8,
            maxOutputTokens: 1200,
          }
        })
      })

      if (!aiResponse.ok) {
        throw new Error(`AI API Error: ${aiResponse.status}`)
      }

      const aiData = await aiResponse.json()
      const aiText = aiData.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!aiText) {
        throw new Error('Resposta IA inválida')
      }

      // Parse da resposta JSON da IA
      let aiParsed
      try {
        aiParsed = JSON.parse(aiText.replace(/```json|```/g, '').trim())
      } catch (parseError) {
        console.error(`❌ Erro ao parsear JSON da IA para ${nome}:`, parseError)
        throw new Error('JSON inválido da IA')
      }
      
      biografias[personaCode] = {
        nome_completo: nome,
        nacionalidade: getNationalitiesForCountry(empresa.pais)?.[0] || 'Internacional',
        idiomas: idiomasRequeridos || (empresa.pais === 'Brasil' ? ['Português', 'Inglês'] : ['Inglês', 'Espanhol']),
        especializacao_area: estrutura.specialty,
        ...aiParsed
      }

      console.log(`✅ Biografia IA gerada para ${nome}`)
      
    } catch (error) {
      console.error(`❌ Erro ao gerar biografia IA para ${nome}:`, error)
      
      // Fallback para biografia básica em caso de erro
      biografias[personaCode] = gerarBiografiaBasica(nome, estrutura, empresa, i, isExecutive, analise, idiomasRequeridos)
    }
  }

  return biografias
}

/**
 * 📝 GERAR BIOGRAFIA BÁSICA (Fallback)
 */
function gerarBiografiaBasica(nome: string, estrutura: any, empresa: any, index: number, isExecutive: boolean, analise?: any, idiomasRequeridos?: string[]) {
  const especializacao_sdr = analise?.estrategia_sdr?.especializacoes?.[estrutura.code] || `Especialização em ${estrutura.specialty}`
  
  return {
    nome_completo: nome,
    idade: isExecutive ? 35 + (index % 15) : 25 + (index % 15),
    nacionalidade: getNationalitiesForCountry(empresa.pais)?.[0] || 'Internacional',
    formacao_academica: isExecutive 
      ? `MBA em ${estrutura.specialty} - Instituição de prestígio`
      : `Graduação em ${estrutura.specialty} com especialização`,
    especializacao_area: estrutura.specialty,
    anos_experiencia: isExecutive ? 10 + (index % 10) : 3 + (index % 7),
    experiencia_anterior: `${isExecutive ? 'Liderança' : 'Experiência'} sólida em ${estrutura.specialty} no setor de ${empresa.industria}`,
    personalidade: isExecutive ? 'Visionário e estratégico, focado em resultados' : 'Proativo, colaborativo e orientado a objetivos',
    habilidades_chave: [
      estrutura.specialty,
      'Comunicação eficaz',
      'Trabalho em equipe',
      'Orientação a resultados',
      ...(estrutura.department === 'SDR' ? ['Prospecção', 'Negociação'] : []),
      ...(isExecutive ? ['Liderança', 'Visão estratégica'] : [])
    ],
    conquistas: [
      `Especialista reconhecido em ${estrutura.specialty}`,
      `Experiência comprovada no setor de ${empresa.industria}`,
      ...(isExecutive ? ['Histórico de liderança de equipes'] : ['Resultados consistentes']),
      ...(estrutura.department === 'SDR' ? ['Performance de vendas acima da média'] : [])
    ],
    idiomas: idiomasRequeridos || (empresa.pais === 'Brasil' ? ['Português', 'Inglês'] : ['Inglês', 'Espanhol']),
    biografia_completa: `${nome} é ${estrutura.role} na ${empresa.nome}, trazendo vasta experiência em ${estrutura.specialty}. ${isExecutive ? 'Líder' : 'Profissional'} dedicado com foco em inovação e resultados, especializado em ${estrutura.specialty} para o setor de ${empresa.industria}. ${especializacao_sdr}`,
    motivacao_principal: `Contribuir para o crescimento exponencial da ${empresa.nome} através da excelência em ${estrutura.specialty}`,
    estilo_trabalho: isExecutive 
      ? 'Estratégico, visionário e orientado a resultados de longo prazo'
      : 'Colaborativo, ágil e focado na execução com qualidade'
  }
}

/**
 * 🔄 GERAR BIOGRAFIAS BÁSICAS (Compatibilidade)
 */
function gerarBiografiasBasicas(personas_escolhidas: string[], empresa: any, analise?: any, idiomasRequeridos?: string[]) {
  console.log('📝 Gerando biografias básicas (sem IA)')
  
  const nomes_brasileiros = {
    masculinos: [
      'Carlos Silva', 'João Santos', 'Roberto Costa', 'André Oliveira', 'Fernando Lima', 
      'Rafael Souza', 'Marcelo Ferreira', 'Paulo Rodrigues', 'Bruno Almeida', 'Diego Martins',
      'Lucas Pereira', 'Gabriel Costa', 'Thiago Santos', 'Ricardo Lima', 'Felipe Souza',
      'Gustavo Silva', 'Leonardo Oliveira', 'Rodrigo Carvalho', 'Vinicius Araújo', 'Eduardo Rocha'
    ],
    femininos: [
      'Ana Silva', 'Maria Santos', 'Carla Costa', 'Juliana Oliveira', 'Fernanda Lima', 
      'Patricia Souza', 'Luciana Ferreira', 'Camila Rodrigues', 'Beatriz Almeida', 'Larissa Martins',
      'Mariana Pereira', 'Isabela Costa', 'Gabriela Santos', 'Carolina Lima', 'Rafaela Souza',
      'Bianca Silva', 'Natalia Oliveira', 'Priscila Carvalho', 'Vanessa Araújo', 'Tatiane Rocha'
    ]
  }
  const nomes_internacionais = {
    masculinos: [
      'John Smith', 'Michael Johnson', 'David Brown', 'James Wilson', 'Robert Davis', 
      'William Miller', 'Richard Garcia', 'Thomas Anderson', 'Christopher Martinez', 'Daniel Taylor',
      'Matthew Moore', 'Andrew White', 'Joshua Harris', 'Ryan Clark', 'Nicholas Lewis',
      'Kevin Robinson', 'Brandon Walker', 'Samuel Hall', 'Eric Young', 'Benjamin King'
    ],
    femininos: [
      'Sarah Johnson', 'Jennifer Smith', 'Michelle Brown', 'Lisa Wilson', 'Amanda Davis', 
      'Jessica Miller', 'Ashley Garcia', 'Nicole Anderson', 'Emily Martinez', 'Stephanie Taylor',
      'Rachel Moore', 'Lauren White', 'Megan Harris', 'Kimberly Clark', 'Christina Lewis',
      'Amy Robinson', 'Melissa Walker', 'Rebecca Hall', 'Laura Young', 'Elizabeth King'
    ]
  }
  const nomes = empresa.pais === 'Brasil' ? nomes_brasileiros : nomes_internacionais
  
  // Criar um array de nomes embaralhados baseado no ID da empresa (para garantir unicidade)
  const empresaSeed = empresa.id ? parseInt(empresa.id.replace(/[^0-9]/g, '').substring(0, 8), 10) || 0 : Date.now();
  
  // Função de embaralhamento seeded (Fisher-Yates)
  function shuffleWithSeed(array: string[], seed: number): string[] {
    const shuffled = [...array];
    let currentSeed = seed;
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Gerar número pseudo-aleatório baseado no seed
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const j = Math.floor((currentSeed / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  const nomesEmbaralhados = {
    masculinos: shuffleWithSeed(nomes.masculinos, empresaSeed),
    femininos: shuffleWithSeed(nomes.femininos, empresaSeed + 1)
  };

  const biografias: any = {}

  personas_escolhidas.forEach((personaCode: string, index: number) => {
    const estrutura = ESTRUTURA_PERSONAS[personaCode as keyof typeof ESTRUTURA_PERSONAS]
    const isExecutive = estrutura.department === 'Executivo'
    const isFemale = index % 3 === 0
    const nomeArray = isFemale ? nomesEmbaralhados.femininos : nomesEmbaralhados.masculinos
    const nome = nomeArray[index % nomeArray.length]
    
    biografias[personaCode] = gerarBiografiaBasica(nome, estrutura, empresa, index, isExecutive, analise, idiomasRequeridos)
  })

  return biografias
}

/**
 * 🏷️ GERAR CÓDIGO DA EMPRESA
 */
function generateCompanyCode(nome: string): string {
  // Remover acentos e caracteres especiais
  const clean = nome
    .normalize('NFD') // Normalizar para separar acentos
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '') // Manter apenas letras e números
  
  // Garantir máximo 6 caracteres do nome (para deixar 2 para o número)
  const baseName = clean.length >= 3 ? clean.substring(0, 6) : (clean + 'EMP').substring(0, 6)
  
  const numero = Math.floor(10 + Math.random() * 90) // 2 dígitos (10-99)
  
  // CRÍTICO: Garantir que NUNCA exceda 8 caracteres total
  const finalCode = `${baseName}${numero}`.substring(0, 8)
  
  console.log(`📝 Código gerado: "${nome}" -> "${finalCode}" (${finalCode.length} chars) ✅`)
  return finalCode
}

/**
 * 📧 GERAR EMAIL PARA PERSONA
 */
function generateEmail(nomeCompleto: string, empresaNome: string, personaCode: string, index: number): string {
  // Pegar primeiro e último nome
  const nomes = nomeCompleto.toLowerCase().split(' ')
  const primeiroNome = nomes[0] || 'persona'
  const ultimoNome = nomes[nomes.length - 1] || 'user'
  
  // Gerar domínio baseado no nome da empresa
  const dominio = empresaNome
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 10) + '.com'
  
  // Adicionar persona_code e índice para garantir unicidade
  const emailBase = `${primeiroNome}.${ultimoNome}.${personaCode}.${index + 1}`
  
  return `${emailBase}@${dominio}`.substring(0, 255)
}

/**
 * 📱 GERAR WHATSAPP PARA PERSONA
 */
function generateWhatsApp(): string {
  // Gerar número brasileiro fictício
  const ddd = Math.floor(Math.random() * 89) + 11 // DDDs de 11 a 99
  const numero = Math.floor(Math.random() * 900000000) + 900000000 // 9 dígitos
  return `+55${ddd}${numero}`
}