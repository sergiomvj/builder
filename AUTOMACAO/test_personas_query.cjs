const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPersonasQuery() {
  const empresaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
  
  console.log(`🔍 Testando query de personas para empresa ${empresaId}\n`);
  
  // Query 1: Apenas personas
  const { data: personas, error: error1 } = await supabase
    .from('personas')
    .select('id')
    .eq('empresa_id', empresaId);

  console.log('✅ Query 1 (apenas personas):');
  console.log(`   Total: ${personas?.length || 0}`);
  if (error1) console.error('   Erro:', error1.message);
  
  // Query 2: Personas com biografias
  const { data: personasBio, error: error2 } = await supabase
    .from('personas')
    .select(`
      id,
      personas_biografias(biografia_estruturada)
    `)
    .eq('empresa_id', empresaId);

  console.log('\n✅ Query 2 (personas + biografias):');
  console.log(`   Total: ${personasBio?.length || 0}`);
  if (error2) console.error('   Erro:', error2.message);
  
  if (personasBio && personasBio.length > 0) {
    console.log('\n📋 Exemplo do primeiro registro:');
    console.log(JSON.stringify(personasBio[0], null, 2));
  }
}

testPersonasQuery();
