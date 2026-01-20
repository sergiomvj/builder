/**
 * 🎯 TESTE DIRETO: Reproduzir o erro exato do usuário
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function testDirectGeneration() {
  console.log('🎯 TESTANDO GERAÇÃO DIRETA DE EMPRESA')
  console.log('=' .repeat(60))
  
  try {
    const response = await fetch('http://localhost:3001/api/generate-strategic-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate',
        companyData: {
          nome: 'ARVA Tech Solutions',
          industria: 'tecnologia',
          pais: 'Brasil',
          idiomas: ['português'],
          descricao: 'Empresa teste'
        },
        personas_escolhidas: ['ceo', 'cto', 'cfo'],  // Só 3 para teste rápido
        idiomas_requeridos: ['português']
      })
    })
    
    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers))
    
    const result = await response.text()
    console.log('📋 RESULTADO COMPLETO:')
    console.log(result)
    
    if (result.includes('character varying(10)')) {
      console.log('\n🎯 ERRO ENCONTRADO! Analisando...')
      
      // Extrair linhas que mencionam o erro
      const lines = result.split('\n')
      for (const line of lines) {
        if (line.includes('character varying') || line.includes('value too long')) {
          console.log('🔍 LINHA PROBLEMÁTICA:', line.trim())
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Erro na requisição:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Aguardar um pouco para o servidor estar pronto
setTimeout(testDirectGeneration, 2000)