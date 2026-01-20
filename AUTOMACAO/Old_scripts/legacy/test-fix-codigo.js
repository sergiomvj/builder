const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testarCorrecaoCodigo() {
  try {
    console.log('🧪 TESTANDO CORREÇÃO DO CÓDIGO DA EMPRESA\n');
    
    // Teste com nome longo que pode causar problema
    const dadosTeste = {
      action: 'generate',
      companyData: {
        nome: 'TechSolutions Enterprise Global Innovation Company TESTE MUITO LONGO',
        industria: 'tecnologia avançada e consultoria empresarial',
        pais: 'Brasil',
        descricao: 'Uma empresa de teste para validar se o código está sendo gerado corretamente sem exceder limites do banco de dados'
      },
      personas_escolhidas: ['ceo', 'cto'], // Só 2 personas para teste rápido
      idiomas_requeridos: ['Português', 'Inglês']
    };
    
    console.log('📋 DADOS DE TESTE:');
    console.log(`   Nome: "${dadosTeste.companyData.nome}" (${dadosTeste.companyData.nome.length} chars)`);
    console.log(`   Indústria: "${dadosTeste.companyData.industria}" (${dadosTeste.companyData.industria.length} chars)`);
    
    console.log('\n🔄 TESTANDO API...');
    const response = await fetch('http://localhost:3001/api/generate-strategic-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosTeste)
    });
    
    const resultado = await response.json();
    
    if (response.ok && resultado.success) {
      console.log('✅ SUCESSO! Empresa criada:');
      console.log(`   📝 Código: ${resultado.empresa_codigo}`);
      console.log(`   🆔 ID: ${resultado.empresa_id}`);
      console.log(`   👥 Personas: ${resultado.personas_criadas}`);
      console.log('\n🎉 PROBLEMA RESOLVIDO - Código gerado corretamente!');
      
      // Cleanup
      console.log('\n🧹 Removendo dados de teste...');
      const deleteResponse = await fetch(`http://localhost:3001/api/empresas/${resultado.empresa_id}`, {
        method: 'DELETE'
      });
      if (deleteResponse.ok) {
        console.log('✅ Dados de teste removidos');
      }
      
    } else {
      console.log('❌ ERRO PERSISTENTE:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Erro: ${JSON.stringify(resultado, null, 2)}`);
    }
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
  }
}

testarCorrecaoCodigo();