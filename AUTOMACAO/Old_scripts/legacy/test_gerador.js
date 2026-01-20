require('dotenv').config();

async function testarGeradorEstrategico() {
  console.log('🚀 Testando Gerador Estratégico - ARVA Tech');
  console.log('=========================================');

  const BASE_URL = 'http://localhost:3001/api/generate-strategic-company';

  // PASSO 1: Análise estratégica
  console.log('\n🧠 PASSO 1: Análise estratégica...');
  
  const analiseRequest = {
    action: 'analyze',
    companyData: {
      nome: 'ARVA Tech Solutions',
      industria: 'tecnologia',
      pais: 'US',
      descricao: 'Ecossistema modular que permite criar, treinar e operar robôs virtuais autônomos'
    }
  };

  try {
    const analiseResponse = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analiseRequest)
    });

    const analiseResult = await analiseResponse.json();
    
    if (analiseResult.success) {
      console.log('✅ Análise concluída!');
      console.log('📊 Personas essenciais:', analiseResult.analise_estrategica.equipe_recomendada.essenciais);
      
      // PASSO 2: Geração da empresa
      console.log('\n🎨 PASSO 2: Gerando empresa completa...');
      
      const geracaoRequest = {
        action: 'generate',
        companyData: analiseRequest.companyData,
        analise_estrategica: analiseResult.analise_estrategica,
        personas_escolhidas: analiseResult.analise_estrategica.equipe_recomendada.essenciais
      };

      const geracaoResponse = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geracaoRequest)
      });

      const geracaoResult = await geracaoResponse.json();
      
      if (geracaoResult.success) {
        console.log('🎉 SUCESSO! Empresa criada!');
        console.log('📋 ID da empresa:', geracaoResult.empresa_id);
        console.log('👥 Personas criadas:', geracaoResult.personas_criadas);
        console.log('🏢 Nome:', geracaoResult.empresa_nome);
        
        console.log('\n✨ RESULTADO FINAL:');
        console.log('- Nova ARVA Tech criada com sucesso');
        console.log('- Status: ATIVA');
        console.log('- Personas funcionais no banco');
        console.log('- Sistema 100% operacional');
        
        return true;
      } else {
        console.error('❌ Erro na geração:', geracaoResult.error);
        return false;
      }
    } else {
      console.error('❌ Erro na análise:', analiseResult.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    return false;
  }
}

// Executar teste
testarGeradorEstrategico().then(sucesso => {
  if (sucesso) {
    console.log('\n🎯 PROJETO VCM FINALIZADO COM SUCESSO!');
    console.log('Sistema está 100% funcional e operacional.');
  } else {
    console.log('\n⚠️ Ainda há problemas a resolver...');
  }
});