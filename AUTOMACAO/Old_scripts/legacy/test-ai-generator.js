/**
 * 🤖 TESTE DO GERADOR ESTRATÉGICO COM IA REAL
 */
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MzI2NDEsImV4cCI6MjA0ODIwODY0MX0.R1EhPGzDdWMdaIz5n1_9jIbSxGFmPZQ1xXIx9sR_KJY'

async function testAIGenerator() {
  console.log('🎯 TESTANDO GERADOR ESTRATÉGICO COM IA REAL\n')
  
  try {
    // 1. Análise Estratégica
    console.log('📊 1. Fazendo análise estratégica...')
    const analysisResponse = await fetch('http://localhost:3001/api/generate-strategic-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'analyze',
        companyData: {
          nome: 'TechIA Soluções',
          industria: 'tecnologia',
          pais: 'Brasil',
          descricao: 'Empresa de soluções em IA para automação empresarial'
        }
      })
    })

    if (!analysisResponse.ok) {
      throw new Error(`Análise falhou: ${analysisResponse.status}`)
    }

    const analysis = await analysisResponse.json()
    console.log('✅ Análise concluída:', analysis.message)
    console.log(`📈 Personas disponíveis: ${analysis.total_personas_disponiveis}`)

    // 2. Geração com IA Real
    console.log('\n🤖 2. Gerando empresa com IA...')
    const generateResponse = await fetch('http://localhost:3001/api/generate-strategic-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate',
        companyData: {
          nome: 'TechIA Soluções',
          industria: 'tecnologia',
          pais: 'Brasil',
          descricao: 'Empresa de soluções em IA para automação empresarial'
        },
        analise_estrategica: analysis.analise_estrategica,
        personas_escolhidas: ['ceo', 'cto', 'sdr_manager', 'marketing_manager', 'assistant_admin'],
        idiomas_requeridos: ['Português', 'Inglês', 'Espanhol']
      })
    })

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text()
      throw new Error(`Geração falhou: ${generateResponse.status} - ${errorText}`)
    }

    const result = await generateResponse.json()
    console.log('✅ Empresa criada:', result.message)
    console.log(`🏢 ID da empresa: ${result.empresa_id}`)

    // 3. Verificar biografias geradas
    console.log('\n📋 3. Verificando biografias geradas...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const { data: personas, error } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', result.empresa_id)

    if (error) {
      throw new Error(`Erro ao buscar personas: ${error.message}`)
    }

    console.log(`\n🎭 ${personas.length} PERSONAS COM IA:`)
    personas.forEach((persona, index) => {
      console.log(`\n${index + 1}. ${persona.nome_completo} (${persona.role})`)
      console.log(`   📧 Email: ${persona.email}`)
      console.log(`   🎂 Idade: ${persona.idade}`)
      console.log(`   📚 Formação: ${persona.formacao_academica}`)
      console.log(`   💼 Experiência: ${persona.anos_experiencia} anos`)
      console.log(`   🎯 Personalidade: ${persona.personalidade}`)
      console.log(`   📖 Biografia: ${persona.biografia_completa.substring(0, 200)}...`)
      
      // Verificar se a biografia é única (não template)
      const isTemplate = persona.biografia_completa.includes('trazendo vasta experiência') && 
                        persona.biografia_completa.includes('dedicado com foco em inovação')
      
      if (isTemplate) {
        console.log('   ⚠️  BIOGRAFIA TEMPLATE - IA NÃO FUNCIONOU!')
      } else {
        console.log('   ✅ BIOGRAFIA ÚNICA COM IA!')
      }
    })

    console.log('\n🎯 TESTE CONCLUÍDO COM SUCESSO!')
    return true

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message)
    return false
  }
}

// Executar teste
if (require.main === module) {
  testAIGenerator()
    .then(success => {
      console.log(success ? '\n✅ TESTE PASSOU' : '\n❌ TESTE FALHOU')
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('\n💥 ERRO CRÍTICO:', error)
      process.exit(1)
    })
}

module.exports = { testAIGenerator }