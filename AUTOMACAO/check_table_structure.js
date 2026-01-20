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

async function checkTableStructure() {
  console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA personas_avatares');
  console.log('===================================================');

  // Buscar alguns registros para ver a estrutura (sem filtros)
  const { data: avatares, error: avataresError } = await supabase
    .from('personas_avatares')
    .select('*')
    .limit(3);

  if (avataresError) {
    console.error('❌ Erro ao buscar avatares:', avataresError.message);
    return;
  }

  if (!avatares || avatares.length === 0) {
    console.log('❌ Nenhum registro encontrado na tabela personas_avatares');
    return;
  }

  console.log(`📊 Encontrados ${avatares.length} registros. Estrutura da tabela:`);
  console.log('Colunas encontradas:');
  Object.keys(avatares[0]).forEach(col => {
    const value = avatares[0][col];
    const type = Array.isArray(value) ? 'array' : typeof value;
    const preview = typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : String(value);
    console.log(`   ${col}: (${type}) ${preview}`);
  });

  console.log('\n🔍 Procurando por campos relacionados a prompts:');
  const promptFields = Object.keys(avatares[0]).filter(col =>
    col.toLowerCase().includes('prompt') ||
    col.toLowerCase().includes('avatar') ||
    col.toLowerCase().includes('image')
  );

  if (promptFields.length > 0) {
    console.log('Campos relacionados encontrados:');
    promptFields.forEach(field => {
      console.log(`   ✅ ${field}`);
    });
  } else {
    console.log('   ❌ Nenhum campo relacionado a prompts encontrado');
  }

  // Verificar se há dados em metadata
  if (avatares[0].metadata) {
    console.log('\n📦 Verificando campo metadata:');
    console.log('Conteúdo do metadata:');
    Object.keys(avatares[0].metadata).forEach(key => {
      const value = avatares[0].metadata[key];
      const preview = typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : String(value);
      console.log(`   ${key}: ${preview}`);
    });
  }

  // Verificar relação com personas
  console.log('\n🔗 Verificando relação com personas:');
  const personaId = avatares[0].persona_id;
  if (personaId) {
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('id, nome_completo, empresa_id')
      .eq('id', personaId)
      .single();

    if (!personaError && persona) {
      console.log(`   Persona relacionada: ${persona.nome_completo}`);
      console.log(`   Empresa ID: ${persona.empresa_id}`);

      // Verificar empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('nome')
        .eq('id', persona.empresa_id)
        .single();

      if (!empresaError && empresa) {
        console.log(`   Empresa: ${empresa.nome}`);
      }
    }
  }
}checkTableStructure().catch(console.error);