const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function criarEmpresaTesteDashboard() {
  try {
    console.log('🏢 CRIANDO EMPRESA DE TESTE PARA DASHBOARD\n');
    
    const dadosEmpresa = {
      action: 'generate',
      companyData: {
        nome: 'VCM Demo Company',
        industria: 'tecnologia',
        pais: 'Brasil',
        descricao: 'Empresa de demonstração para validar dashboard'
      },
      personas_escolhidas: ['ceo', 'cto', 'sdr_manager'],
      idiomas_requeridos: ['Português', 'Inglês']
    };
    
    console.log('📋 Criando empresa:', dadosEmpresa.companyData.nome);
    
    const response = await fetch('http://localhost:3001/api/generate-strategic-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosEmpresa)
    });
    
    const resultado = await response.json();
    
    if (response.ok && resultado.success) {
      console.log('✅ EMPRESA CRIADA COM SUCESSO!');
      console.log(`   📝 Código: ${resultado.empresa_codigo}`);
      console.log(`   🆔 ID: ${resultado.empresa_id}`);
      console.log(`   👥 Personas: ${resultado.personas_criadas}`);
      console.log(`   🔗 URL: ${resultado.url_empresa}`);
      
      // Aguardar um momento para o banco processar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Testar as estatísticas agora
      console.log('\n📊 TESTANDO ESTATÍSTICAS DO DASHBOARD...');
      
      const statsResponse = await fetch('http://localhost:3001/api/dashboard/stats');
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('✅ Estatísticas obtidas via API:');
        console.log(`   Empresas: ${stats.totalEmpresas}`);
        console.log(`   Personas: ${stats.totalPersonas}`);
        console.log(`   Auditorias: ${stats.activeAudits}`);
        console.log(`   Alertas: ${stats.activeAlerts}`);
      } else {
        // Testar diretamente no banco
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const empresasAtivas = await supabase
          .from('empresas')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ativa');
        
        const todasPersonas = await supabase
          .from('personas')
          .select('id', { count: 'exact', head: true });
        
        console.log('✅ Estatísticas obtidas diretamente do banco:');
        console.log(`   Empresas ativas: ${empresasAtivas.count || 0}`);
        console.log(`   Total personas: ${todasPersonas.count || 0}`);
      }
      
      console.log('\n🎉 DASHBOARD PRONTO PARA TESTE!');
      console.log('   Acesse: http://localhost:3001');
      console.log('   As estatísticas agora devem mostrar dados corretos');
      
      return resultado;
      
    } else {
      console.error('❌ ERRO AO CRIAR EMPRESA:', resultado.error);
    }
    
  } catch (error) {
    console.error('❌ ERRO GERAL:', error);
  }
}

criarEmpresaTesteDashboard();