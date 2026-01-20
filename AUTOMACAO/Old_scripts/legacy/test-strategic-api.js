// TESTE DA API GENERATE-STRATEGIC-COMPANY
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

async function testStrategicCompanyAPI() {
  console.log('🧪 TESTANDO API GENERATE-STRATEGIC-COMPANY\n');

  try {
    console.log('🔍 1. Testando análise estratégica...');
    
    const analyzeResponse = await fetch(`${API_BASE}/api/generate-strategic-company`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'analyze',
        companyData: {
          nome: 'TechSolutions Test',
          industria: 'Tecnologia',
          pais: 'Brasil',
          descricao: 'Empresa de teste para validação da API'
        }
      })
    });
    
    console.log('Status da resposta:', analyzeResponse.status);
    
    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error('❌ Erro na análise:', errorText);
      return;
    }
    
    const analyzeResult = await analyzeResponse.json();
    console.log('✅ Análise concluída:');
    console.log('- Success:', analyzeResult.success);
    console.log('- Total personas disponíveis:', analyzeResult.total_personas_disponiveis);
    console.log('- Personas essenciais:', analyzeResult.analise_estrategica?.equipe_recomendada?.essenciais?.length || 0);
    
    // Teste de geração (só se análise funcionou)
    if (analyzeResult.success) {
      console.log('\n🎨 2. Testando geração de empresa...');
      
      const generateResponse = await fetch(`${API_BASE}/api/generate-strategic-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          companyData: {
            nome: 'TechSolutions Test',
            industria: 'Tecnologia',
            pais: 'Brasil',
            descricao: 'Empresa de teste para validação da API'
          },
          analise_estrategica: analyzeResult.analise_estrategica,
          personas_escolhidas: analyzeResult.analise_estrategica.equipe_recomendada.essenciais.slice(0, 5) // Só 5 personas para teste
        })
      });
      
      console.log('Status da geração:', generateResponse.status);
      
      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('❌ Erro na geração:', errorText);
        return;
      }
      
      const generateResult = await generateResponse.json();
      console.log('✅ Empresa gerada:');
      console.log('- Success:', generateResult.success);
      console.log('- Empresa ID:', generateResult.empresa_id);
      console.log('- Personas criadas:', generateResult.personas_criadas);
      console.log('- URL empresa:', generateResult.url_empresa);
    }

    console.log('\n🎉 TESTE DA API CONCLUÍDO COM SUCESSO!');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
  }
}

testStrategicCompanyAPI();