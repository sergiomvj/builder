require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkHistory() {
  const { data: personas } = await supabase
    .from('personas')
    .select('id, persona_code, full_name, email, genero, experiencia_anos, created_at, updated_at')
    .eq('empresa_id', '27470d32-9cce-4975-9a62-1d76f3ab77a4')
    .order('persona_code');

  console.log('\n📋 HISTÓRICO DE CRIAÇÃO/ATUALIZAÇÃO DAS PERSONAS:\n');
  console.log('Código       | Nome                      | Criado em           | Atualizado em       | Diff (min)');
  console.log('='.repeat(110));
  
  personas.forEach(p => {
    const created = new Date(p.created_at);
    const updated = new Date(p.updated_at);
    const diffMin = Math.floor((updated - created) / 1000 / 60);
    
    const createdStr = created.toISOString().slice(0, 19).replace('T', ' ');
    const updatedStr = updated.toISOString().slice(0, 19).replace('T', ' ');
    
    console.log(
      `${p.persona_code} | ${p.full_name.padEnd(25)} | ${createdStr} | ${updatedStr} | ${diffMin.toString().padStart(3)}min`
    );
  });

  // Verificar se alguma foi atualizada muito depois da criação
  const suspeitos = personas.filter(p => {
    const created = new Date(p.created_at);
    const updated = new Date(p.updated_at);
    const diffMin = Math.floor((updated - created) / 1000 / 60);
    return diffMin > 5; // Mais de 5 minutos entre criação e atualização
  });

  if (suspeitos.length > 0) {
    console.log('\n⚠️  PERSONAS COM ATUALIZAÇÃO SUSPEITA (>5min após criação):');
    suspeitos.forEach(p => {
      const created = new Date(p.created_at);
      const updated = new Date(p.updated_at);
      const diffMin = Math.floor((updated - created) / 1000 / 60);
      console.log(`   ${p.persona_code} - ${p.full_name}: ${diffMin} minutos depois`);
    });
  }

  // Verificar se Emily Carter foi criada/atualizada em horários diferentes
  const emilys = personas.filter(p => p.full_name === 'Emily Carter' || p.full_name === 'Emma Watson');
  
  if (emilys.length > 0) {
    console.log('\n🔍 ANÁLISE DAS "EMILYS":');
    emilys.forEach(p => {
      console.log(`\n${p.persona_code} - ${p.full_name}:`);
      console.log(`   Email: ${p.email}`);
      console.log(`   Criado: ${new Date(p.created_at).toISOString()}`);
      console.log(`   Atualizado: ${new Date(p.updated_at).toISOString()}`);
    });
  }

  process.exit(0);
}

checkHistory();
