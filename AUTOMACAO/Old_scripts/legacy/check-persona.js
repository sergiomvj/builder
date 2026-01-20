require('dotenv').config({path:'.env.local'});
const {createClient} = require('@supabase/supabase-js');

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkPersona() {
  try {
    // Primeiro buscar empresa TechIA
    const { data: empresas } = await s.from('empresas').select('id, nome').ilike('nome', '%TechIA%').limit(1);
    
    if (!empresas || empresas.length === 0) {
      console.log('❌ Empresa TechIA não encontrada');
      return;
    }

    const empresaId = empresas[0].id;
    console.log('🏢 Empresa:', empresas[0].nome, 'ID:', empresaId);

    // Buscar personas desta empresa
    const { data: personas, error } = await s.from('personas').select('*').eq('empresa_id', empresaId).limit(1);
    
    if (error) {
      console.log('❌ ERRO:', error.message);
      return;
    }

    if (personas && personas.length > 0) {
      console.log('👤 PERSONA COMPLETA:');
      console.log(JSON.stringify(personas[0], null, 2));
    } else {
      console.log('❌ Nenhuma persona encontrada');
    }
  } catch (e) {
    console.log('❌ ERRO:', e.message);
  }
}

checkPersona();