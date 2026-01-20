const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 TESTANDO API DE GERAÇÃO DIRETAMENTE');
    
    const testData = {
      action: 'generate',
      companyData: {
        nome: 'EmpresaTeste API Debug',
        industria: 'Tecnologia',
        pais: 'Brasil',
        descricao: 'Empresa criada para teste da API'
      },
      analise_estrategica: {
        visao_geral: 'Teste direto da API',
        areas_prioritarias: ['tecnologia', 'marketing']
      },
      personas_escolhidas: ['ceo', 'cto', 'sdr_manager'] // Array de 3 personas
    };
    
    console.log('📋 Dados de teste:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3001/api/generate-strategic-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('🌐 Status da resposta:', response.status);
    
    const result = await response.json();
    console.log('📊 Resultado:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.log('❌ ERRO DETALHADO:', result);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testAPI();