const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function testarArvaComDebug() {
  try {
    console.log('🧪 TESTANDO CRIAÇÃO DA ARVA TECH SOLUTIONS\n');
    
    const dadosArva = {
      action: 'generate',
      companyData: {
        nome: 'ARVA Tech Solutions',
        industria: 'tecnologia',
        pais: 'Brasil',
        descricao: 'Empresa de tecnologia ARVA com soluções inovadoras'
      },
      personas_escolhidas: ['ceo', 'cto', 'sdr_manager'], // Só 3 personas para teste
      idiomas_requeridos: ['Português', 'Inglês']
    };
    
    console.log('📋 DADOS DO TESTE:');
    console.log(`   Nome: "${dadosArva.companyData.nome}" (${dadosArva.companyData.nome.length} chars)`);
    console.log(`   Indústria: "${dadosArva.companyData.industria}" (${dadosArva.companyData.industria.length} chars)`);
    console.log(`   Descrição: "${dadosArva.companyData.descricao}" (${dadosArva.companyData.descricao.length} chars)`);
    console.log(`   Personas: ${dadosArva.personas_escolhidas.join(', ')}`);
    
    console.log('\n🔄 ENVIANDO REQUISIÇÃO...');
    
    const response = await fetch('http://localhost:3001/api/generate-strategic-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosArva)
    });
    
    const resultado = await response.json();
    
    console.log(`\n📊 RESPOSTA (${response.status}):`);
    console.log(JSON.stringify(resultado, null, 2));
    
    if (response.ok && resultado.success) {
      console.log('\n✅ SUCESSO! ARVA Tech Solutions criada:');
      console.log(`   📝 Código: ${resultado.empresa_codigo}`);
      console.log(`   🆔 ID: ${resultado.empresa_id}`);
      console.log(`   👥 Personas: ${resultado.personas_criadas}`);
    } else {
      console.log('\n❌ ERRO DETECTADO:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Erro: ${resultado.error}`);
    }
    
  } catch (error) {
    console.error('❌ ERRO NA REQUISIÇÃO:', error);
  }
}

testarArvaComDebug();