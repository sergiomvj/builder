require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function analyzeEmilyCarter() {
  console.log('🔍 ANÁLISE DETALHADA DO CASO "EMILY CARTER"\n');
  console.log('='.repeat(80));

  // Buscar todas as personas
  const { data: personas } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', '27470d32-9cce-4975-9a62-1d76f3ab77a4')
    .order('persona_code');

  // Analisar timestamps
  console.log('\n📅 ANÁLISE DE TIMESTAMPS:\n');
  
  const pos005 = personas.find(p => p.persona_code === 'ARVA01-POS005');
  const pos015 = personas.find(p => p.persona_code === 'ARVA01-POS015');

  console.log('ARVA01-POS005 (Emily Carter):');
  console.log(`  Criada em:     ${new Date(pos005.created_at).toLocaleString('pt-BR')}`);
  console.log(`  Atualizada em: ${new Date(pos005.updated_at).toLocaleString('pt-BR')}`);
  console.log(`  Nome: ${pos005.full_name}`);
  console.log(`  Email: ${pos005.email}`);
  console.log(`  Role: ${pos005.role}`);
  console.log(`  Department: ${pos005.department}`);
  console.log(`  Nationality: ${pos005.nacionalidade}`);
  console.log(`  Gender: ${pos005.genero}`);

  console.log('\nARVA01-POS015 (ex-Emily, agora Emma):');
  console.log(`  Criada em:     ${new Date(pos015.created_at).toLocaleString('pt-BR')}`);
  console.log(`  Atualizada em: ${new Date(pos015.updated_at).toLocaleString('pt-BR')}`);
  console.log(`  Nome atual: ${pos015.full_name}`);
  console.log(`  Email: ${pos015.email}`);
  console.log(`  Role: ${pos015.role}`);
  console.log(`  Department: ${pos015.department}`);
  console.log(`  Nationality: ${pos015.nacionalidade}`);
  console.log(`  Gender: ${pos015.genero}`);

  // Análise de probabilidade
  console.log('\n📊 ANÁLISE DE PROBABILIDADE:\n');
  
  const allNames = personas.map(p => p.full_name);
  const uniqueNames = new Set(allNames);
  
  console.log(`Total de personas: ${personas.length}`);
  console.log(`Nomes únicos gerados: ${uniqueNames.size}`);
  console.log(`Duplicatas encontradas: ${personas.length - uniqueNames.size}`);
  
  // Verificar nacionalidades
  const sameNationality = pos005.nacionalidade === pos015.nacionalidade;
  console.log(`\nMesma nacionalidade? ${sameNationality ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`  POS005: ${pos005.nacionalidade}`);
  console.log(`  POS015: ${pos015.nacionalidade}`);

  // Verificar gênero
  const sameGender = pos005.genero === pos015.genero;
  console.log(`\nMesmo gênero? ${sameGender ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`  POS005: ${pos005.genero}`);
  console.log(`  POS015: ${pos015.genero}`);

  // Buscar biografias
  const { data: bios } = await supabase
    .from('personas_biografias')
    .select('*')
    .in('persona_id', [pos005.id, pos015.id]);

  console.log('\n📚 BIOGRAFIAS:\n');
  bios.forEach(bio => {
    const persona = personas.find(p => p.id === bio.persona_id);
    console.log(`${persona.persona_code}:`);
    console.log(`  Created: ${new Date(bio.created_at).toLocaleString('pt-BR')}`);
    console.log(`  Updated: ${new Date(bio.updated_at).toLocaleString('pt-BR')}`);
    if (bio.biografia_estruturada?.biografia_completa) {
      console.log(`  Biografia: ${bio.biografia_estruturada.biografia_completa.slice(0, 100)}...`);
    }
    console.log('');
  });

  // Conclusão
  console.log('\n🎯 CONCLUSÃO:\n');
  
  const timeDiff = Math.abs(new Date(pos005.created_at) - new Date(pos015.created_at));
  const secondsDiff = timeDiff / 1000;
  
  console.log(`Tempo entre criações: ${secondsDiff.toFixed(1)} segundos`);
  
  if (sameNationality && sameGender && secondsDiff < 10) {
    console.log('\n⚠️  CAUSA PROVÁVEL: LLM gerou nome duplicado');
    console.log('   - Mesma nacionalidade (americana)');
    console.log('   - Mesmo gênero (feminino)');
    console.log('   - Criadas com poucos segundos de diferença');
    console.log('   - Temperature 0.8 não foi suficiente para evitar duplicação');
    console.log('\n💡 SOLUÇÃO: Aumentar temperature para 0.95 no Script 02');
  } else if (Math.abs(new Date(pos005.updated_at) - new Date(pos015.updated_at)) < 60000) {
    console.log('\n⚠️  CAUSA PROVÁVEL: Script executado 2x no mesmo dia');
    console.log('   - Ambas atualizadas no mesmo horário aproximado');
  } else {
    console.log('\n❓ Causa incerta - requer mais investigação');
  }

  process.exit(0);
}

analyzeEmilyCarter();
