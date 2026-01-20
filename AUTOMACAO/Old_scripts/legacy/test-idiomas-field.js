const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testarCampoIdiomas() {
  try {
    console.log('=== TESTANDO CAMPO IDIOMAS ===\n');
    
    // 1. Verificar estrutura da tabela
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, full_name, role, idiomas, personalidade')
      .limit(3);

    if (error) {
      console.error('❌ Erro ao consultar personas:', error);
      return;
    }

    console.log('📋 PERSONAS EXISTENTES:');
    personas.forEach((persona, index) => {
      console.log(`\n${index + 1}. ${persona.full_name} (${persona.role})`);
      console.log(`   ID: ${persona.id}`);
      console.log(`   Idiomas (campo específico): ${JSON.stringify(persona.idiomas)}`);
      console.log(`   Idiomas (em personalidade): ${JSON.stringify(persona.personalidade?.idiomas || 'N/A')}`);
    });

    // 2. Testar atualização de idiomas
    if (personas.length > 0) {
      const primeiraPersona = personas[0];
      const novosIdiomas = ['Português', 'Inglês', 'Espanhol'];
      
      console.log(`\n🔄 TESTANDO ATUALIZAÇÃO DE IDIOMAS para: ${primeiraPersona.full_name}`);
      
      const { error: updateError } = await supabase
        .from('personas')
        .update({ idiomas: novosIdiomas })
        .eq('id', primeiraPersona.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar idiomas:', updateError);
      } else {
        console.log('✅ Idiomas atualizados com sucesso!');
        
        // Verificar a atualização
        const { data: personaAtualizada } = await supabase
          .from('personas')
          .select('full_name, idiomas')
          .eq('id', primeiraPersona.id)
          .single();
        
        console.log(`📝 Novos idiomas salvos: ${JSON.stringify(personaAtualizada?.idiomas)}`);
      }
    }

    // 3. Verificar consulta por idiomas (sintaxe JSONB correta)
    console.log('\n🔍 TESTANDO CONSULTA POR IDIOMAS (personas que falam Inglês):');
    const { data: personasIngles, error: searchError } = await supabase
      .from('personas')
      .select('full_name, role, idiomas')
      .filter('idiomas', 'cs', '["Inglês"]'); // cs = contains (jsonb)

    if (searchError) {
      console.error('❌ Erro na consulta por idiomas:', searchError);
    } else {
      console.log(`📊 Encontradas ${personasIngles?.length || 0} personas que falam Inglês:`);
      personasIngles?.forEach(p => {
        console.log(`   - ${p.full_name} (${p.role}): ${JSON.stringify(p.idiomas)}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testarCampoIdiomas();