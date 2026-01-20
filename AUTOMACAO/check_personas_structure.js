import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPersonasTable() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA personas');
  console.log('===========================================');

  // Buscar alguns registros para ver a estrutura
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('*')
    .limit(3);

  if (personasError) {
    console.error('❌ Erro ao buscar personas:', personasError.message);
    return;
  }

  if (!personas || personas.length === 0) {
    console.log('❌ Nenhum registro encontrado na tabela personas');
    return;
  }

  console.log(`📊 Encontrados ${personas.length} registros. Estrutura da tabela:`);
  console.log('Colunas encontradas:');
  Object.keys(personas[0]).forEach(col => {
    const value = personas[0][col];
    const type = Array.isArray(value) ? 'array' : typeof value;
    const preview = typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : String(value);
    console.log(`   ${col}: (${type}) ${preview}`);
  });

  console.log('\n🔍 Procurando por campos relacionados a nome:');
  const nameFields = Object.keys(personas[0]).filter(col =>
    col.toLowerCase().includes('nome') ||
    col.toLowerCase().includes('name') ||
    col.toLowerCase().includes('first') ||
    col.toLowerCase().includes('last')
  );

  if (nameFields.length > 0) {
    console.log('Campos relacionados encontrados:');
    nameFields.forEach(field => {
      console.log(`   ✅ ${field}`);
    });
  } else {
    console.log('   ❌ Nenhum campo relacionado a nome encontrado');
  }

  // Verificar dados de exemplo
  console.log('\n📝 Exemplos de dados:');
  personas.forEach((persona, index) => {
    console.log(`\nPersona ${index + 1}:`);
    nameFields.forEach(field => {
      if (persona[field]) {
        console.log(`   ${field}: ${persona[field]}`);
      }
    });
  });
}

checkPersonasTable().catch(console.error);