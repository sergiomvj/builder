// Debug: Verificar personas no banco
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

console.log('\n🔍 DEBUG - Verificando conexão e personas\n');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Definida' : '❌ Não definida');
console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const empresaId = '27470d32-9cce-4975-9a62-1d76f3ab77a4';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 1. Verificar empresa
console.log('1️⃣ Verificando empresa...\n');
const { data: empresa, error: empresaError } = await supabase
  .from('empresas')
  .select('id, nome, codigo')
  .eq('id', empresaId)
  .single();

if (empresaError) {
  console.error('❌ Erro ao buscar empresa:', empresaError);
  process.exit(1);
}

console.log('✅ Empresa encontrada:');
console.log('   Nome:', empresa.nome);
console.log('   Código:', empresa.codigo);
console.log('   ID:', empresa.id);

// 2. Contar personas
console.log('\n2️⃣ Contando personas...\n');
const { count, error: countError } = await supabase
  .from('personas')
  .select('*', { count: 'exact', head: true })
  .eq('empresa_id', empresaId);

if (countError) {
  console.error('❌ Erro ao contar personas:', countError);
  process.exit(1);
}

console.log(`✅ Total de personas: ${count}`);

// 3. Buscar primeiras 5 personas (usando SELECT *)
if (count > 0) {
  console.log('\n3️⃣ Buscando primeiras 5 personas...\n');
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId)
    .limit(5);

  if (personasError) {
    console.error('❌ Erro ao buscar personas:', personasError);
    process.exit(1);
  }

  console.log('✅ Personas encontradas:');
  personas.forEach((p, i) => {
    console.log(`\n   ${i+1}. ID: ${p.id}`);
    console.log(`      Campos disponíveis:`, Object.keys(p).join(', '));
    console.log(`      Cargo: ${p.cargo}`);
    console.log(`      Código Persona: ${p.codigo_persona || 'N/A'}`);
  });
} else {
  console.log('\n⚠️  Nenhuma persona encontrada no banco!');
  console.log('   Execute: node 01_create_personas_from_structure_v5.js --empresaId=' + empresaId);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
