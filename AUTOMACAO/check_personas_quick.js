// Quick check de personas no banco
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const empresaId = '27470d32-9cce-4975-9a62-1d76f3ab77a4';

console.log('🔍 Verificando personas...\n');

const { data: personas, error } = await supabase
  .from('personas')
  .select('id, codigo, cargo, nivel_hierarquico, created_at')
  .eq('empresa_id', empresaId)
  .order('codigo');

if (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

console.log(`✅ ${personas.length} personas encontradas:\n`);
personas.forEach((p, i) => {
  console.log(`   ${i+1}. ${p.codigo} - ${p.cargo} (${p.nivel_hierarquico})`);
});
