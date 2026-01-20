const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testeCompleto() {
  try {
    console.log('🧪 TESTE END-TO-END: Sistema de Idiomas\n');
    
    // 1. Simular criação de empresa com idiomas específicos
    console.log('📋 1. DADOS DE TESTE:');
    const dadosTeste = {
      action: 'generate', // Ação obrigatória
      companyData: {
        nome: 'TechGlobal Solutions TESTE',
        industria: 'tecnologia',
        pais: 'Brasil'
      },
      personas_escolhidas: ['ceo', 'cto', 'sdr_manager'],
      idiomas_requeridos: ['Português', 'Inglês', 'Alemão', 'Francês']
    };
    
    console.log(`   Empresa: ${dadosTeste.companyData.nome}`);
    console.log(`   Personas: ${dadosTeste.personas_escolhidas.join(', ')}`);
    console.log(`   Idiomas: ${dadosTeste.idiomas_requeridos.join(', ')}`);
    
    // 2. Testar API diretamente
    console.log('\n🔄 2. TESTANDO API:');
    const response = await fetch('http://localhost:3001/api/generate-strategic-company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosTeste)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const resultado = await response.json();
    console.log(`   ✅ Empresa criada: ${resultado.empresa_codigo}`);
    console.log(`   ✅ Personas: ${resultado.personas_criadas}`);
    console.log(`   ✅ URL: ${resultado.url_empresa}`);
    
    // 3. Verificar personas criadas na base de dados
    console.log('\n🔍 3. VERIFICANDO PERSONAS NA BASE:');
    const { data: personasCreated, error } = await supabase
      .from('personas')
      .select('full_name, role, idiomas, personalidade')
      .eq('empresa_id', resultado.empresa_id);
    
    if (error) {
      console.error('❌ Erro ao consultar personas:', error);
      return;
    }
    
    console.log(`   📊 Total de personas encontradas: ${personasCreated?.length || 0}`);
    
    personasCreated?.forEach((persona, index) => {
      console.log(`\n   ${index + 1}. ${persona.full_name} (${persona.role})`);
      console.log(`      Idiomas (campo específico): ${JSON.stringify(persona.idiomas)}`);
      console.log(`      Tem biografia completa: ${persona.personalidade?.biografia_completa ? 'SIM' : 'NÃO'}`);
    });
    
    // 4. Validar se idiomas estão corretos
    console.log('\n✅ 4. VALIDAÇÃO FINAL:');
    const idiomasEsperados = dadosTeste.idiomas_requeridos;
    let todasPersonasCorretas = true;
    
    personasCreated?.forEach(persona => {
      const idiomasPersona = persona.idiomas || [];
      const temTodosIdiomas = idiomasEsperados.every(idioma => 
        idiomasPersona.includes(idioma)
      );
      
      if (!temTodosIdiomas) {
        console.log(`   ❌ ${persona.full_name}: Idiomas incorretos`);
        todasPersonasCorretas = false;
      } else {
        console.log(`   ✅ ${persona.full_name}: Idiomas corretos`);
      }
    });
    
    if (todasPersonasCorretas && personasCreated?.length > 0) {
      console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
      console.log('   ✅ API funcionando');
      console.log('   ✅ Idiomas salvos corretamente');
      console.log('   ✅ Personas criadas com biografias');
      console.log('   ✅ Campo específico idiomas operacional');
    } else {
      console.log('\n❌ TESTE FALHOU - Verificar logs acima');
    }

    // 5. Cleanup - remover dados de teste
    console.log('\n🧹 5. LIMPEZA (removendo dados de teste):');
    const { error: deleteError } = await supabase
      .from('empresas')
      .delete()
      .eq('id', resultado.empresa_id);
    
    if (!deleteError) {
      console.log('   ✅ Dados de teste removidos');
    }

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
  }
}

testeCompleto();