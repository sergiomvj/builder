const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testar15Personas() {
  try {
    console.log('🧪 TESTANDO COM 15 PERSONAS (CENÁRIO REAL)\n');
    
    const todasPersonas = [
      'ceo', 'cto', 'cfo', 'hr_manager',
      'sdr_manager', 'sdr_senior', 'sdr_junior', 'sdr_analyst',
      'youtube_manager', 'social_media', 'marketing_manager',
      'assistant_admin', 'assistant_finance', 'assistant_hr', 'assistant_marketing'
    ];
    
    const dadosCompletos = {
      action: 'generate',
      companyData: {
        nome: 'ARVA Complete Test',
        industria: 'tecnologia',
        pais: 'Brasil',
        descricao: 'Teste completo com 15 personas'
      },
      personas_escolhidas: todasPersonas,
      idiomas_requeridos: ['Português', 'Inglês']
    };
    
    console.log(`📋 TESTANDO COM ${todasPersonas.length} PERSONAS:`);
    console.log(`   ${todasPersonas.join(', ')}`);
    
    const startTime = Date.now();
    console.log('\n🔄 ENVIANDO REQUISIÇÃO...');
    
    const response = await fetch('http://localhost:3001/api/generate-strategic-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosCompletos)
    });
    
    const endTime = Date.now();
    const resultado = await response.json();
    
    console.log(`\n⏱️  TEMPO DE RESPOSTA: ${endTime - startTime}ms`);
    console.log(`📊 STATUS: ${response.status}`);
    
    if (response.ok && resultado.success) {
      console.log('\n✅ SUCESSO COM 15 PERSONAS!');
      console.log(`   📝 Código: ${resultado.empresa_codigo}`);
      console.log(`   🆔 ID: ${resultado.empresa_id}`);
      console.log(`   👥 Personas criadas: ${resultado.personas_criadas}`);
      
      // Cleanup
      console.log('\n🧹 Removendo dados de teste...');
      const deleteResponse = await fetch(`http://localhost:3001/api/empresas/${resultado.empresa_id}`, {
        method: 'DELETE'
      });
      if (deleteResponse.ok) {
        console.log('✅ Dados removidos');
      }
      
    } else {
      console.log('\n❌ ERRO COM 15 PERSONAS:');
      console.log(`   Erro: ${resultado.error}`);
      
      if (resultado.error && resultado.error.includes('value too long')) {
        console.log('\n🔍 ANALISANDO ERRO DE CAMPO LONGO:');
        console.log('   Este é o erro que precisamos corrigir!');
        console.log('   Verificando logs do servidor para mais detalhes...');
      }
    }
    
  } catch (error) {
    console.error('❌ ERRO NA REQUISIÇÃO:', error);
  }
}

testar15Personas();