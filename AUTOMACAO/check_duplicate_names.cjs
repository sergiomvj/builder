require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  console.log('🔍 Verificando personas da ARVA...\n');
  
  const { data: personas, error } = await supabase
    .from('personas')
    .select('id, persona_code, full_name, email, role, specialty, department, empresa_id')
    .eq('empresa_id', '27470d32-9cce-4975-9a62-1d76f3ab77a4')
    .order('persona_code');

  if (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }

  console.log('📋 TODAS AS PERSONAS:\n');
  personas.forEach(p => {
    const cargo = p.role || p.specialty || p.department || 'Sem cargo';
    console.log(`${p.persona_code} | ${p.full_name.padEnd(25)} | ${cargo}`);
  });

  // Detectar duplicatas
  const nameCount = {};
  personas.forEach(p => {
    nameCount[p.full_name] = (nameCount[p.full_name] || 0) + 1;
  });

  const duplicates = Object.entries(nameCount).filter(([_, count]) => count > 1);

  if (duplicates.length > 0) {
    console.log('\n⚠️  NOMES DUPLICADOS ENCONTRADOS:\n');
    duplicates.forEach(([name, count]) => {
      console.log(`❌ "${name}" aparece ${count}x`);
      const dupes = personas.filter(p => p.full_name === name);
      dupes.forEach(p => {
        console.log(`   - ${p.persona_code} | ${p.email} | ${p.role || p.specialty || p.department}`);
      });
      console.log('');
    });
  } else {
    console.log('\n✅ Nenhum nome duplicado encontrado!');
  }

  process.exit(0);
}

checkDuplicates();
