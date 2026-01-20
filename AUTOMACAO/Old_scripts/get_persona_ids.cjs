const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getPersonaIds() {
  const { data: personas } = await supabase
    .from('personas')
    .select('id, full_name, role')
    .eq('empresa_id', '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17')
    .order('full_name');

  console.log('\n👥 PERSONAS COM IDS:\n');
  personas.forEach(p => {
    console.log(`${p.full_name} (${p.role}): ${p.id}`);
  });
}

getPersonaIds().catch(console.error);
