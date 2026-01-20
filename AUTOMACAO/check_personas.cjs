require('dotenv').config({path:'.env.local'});
const {createClient} = require('@supabase/supabase-js');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: personas, error } = await sb
    .from('personas')
    .select('id, full_name, email, experiencia_anos, role')
    .eq('empresa_id', 'b356b561-cd43-4760-8377-98a0cc1463ad')
    .order('role');
  
  if (error) {
    console.log('Error:', error);
    return;
  }
  
  console.log('\n✅ PERSONAS NO BANCO (Total:', personas.length, '):\n');
  personas.forEach((p, i) => {
    console.log(`${i+1}. ${p.full_name || '[SEM NOME]'} | ${p.email || '[SEM EMAIL]'} | ${p.experiencia_anos || 0} anos | ${p.role}`);
  });
  
  // Verificar biografias
  const { data: bios, error: bioError } = await sb
    .from('personas_biografias')
    .select('persona_id')
    .in('persona_id', personas.map(p => p.id));
  
  console.log('\n📝 BIOGRAFIAS: ', bios?.length || 0, 'de', personas.length);
}

check();
