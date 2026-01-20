// SCRIPT DE TESTE - Valida que placeholders são criados SEM nomes

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? '✓ Configurado' : '❌ Não encontrado');
console.log('Supabase Key:', supabaseKey ? '✓ Configurado' : '❌ Não encontrado');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Variáveis de ambiente não encontradas!');
  console.log('Tentando ler de ../env...');
  dotenv.config({ path: '../.env' });
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 TESTE DE VALIDAÇÃO - Placeholders sem nomes\n');

async function validarPlaceholders() {
  // Buscar todas as personas
  const { data: personas, error } = await supabase
    .from('personas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Erro ao buscar personas:', error.message);
    return;
  }

  console.log(`📊 Analisando ${personas.length} personas mais recentes...\n`);

  let placeholders = 0;
  let completas = 0;
  let problemasEncontrados = [];

  personas.forEach((persona, index) => {
    const temNome = !!persona.full_name;
    const temEmail = !!persona.email;
    const temGenero = !!persona.genero;
    const temNacionalidade = !!persona.nacionalidade;

    if (!temNome && !temEmail && !temGenero && temNacionalidade) {
      // Placeholder correto
      placeholders++;
      console.log(`✅ [${index + 1}] PLACEHOLDER correto`);
      console.log(`   Cargo: ${persona.role}`);
      console.log(`   Nacionalidade: ${persona.nacionalidade}`);
      console.log(`   Nome: NULL, Email: NULL, Gênero: NULL ✓\n`);
    } else if (temNome && temEmail) {
      // Persona completa
      completas++;
      console.log(`✓  [${index + 1}] Persona completa: ${persona.full_name}`);
      console.log(`   Cargo: ${persona.role}`);
      console.log(`   Nacionalidade: ${persona.nacionalidade}\n`);
    } else {
      // Estado inconsistente
      problemasEncontrados.push({
        id: persona.id,
        full_name: persona.full_name,
        email: persona.email,
        genero: persona.genero,
        role: persona.role
      });
      console.log(`⚠️  [${index + 1}] ESTADO INCONSISTENTE`);
      console.log(`   Nome: ${persona.full_name || 'NULL'}`);
      console.log(`   Email: ${persona.email || 'NULL'}`);
      console.log(`   Gênero: ${persona.genero || 'NULL'}`);
      console.log(`   Cargo: ${persona.role}\n`);
    }
  });

  console.log('\n📊 RESULTADO DA VALIDAÇÃO');
  console.log('==========================');
  console.log(`✅ Placeholders corretos: ${placeholders}`);
  console.log(`✓  Personas completas: ${completas}`);
  console.log(`⚠️  Estados inconsistentes: ${problemasEncontrados.length}`);

  if (problemasEncontrados.length > 0) {
    console.log('\n⚠️  PROBLEMAS ENCONTRADOS:');
    problemasEncontrados.forEach(p => {
      console.log(`   - ID: ${p.id}`);
      console.log(`     Nome: ${p.full_name || 'NULL'}`);
      console.log(`     Email: ${p.email || 'NULL'}`);
      console.log(`     Cargo: ${p.role}\n`);
    });
  }

  if (placeholders > 0 && problemasEncontrados.length === 0) {
    console.log('\n🎉 VALIDAÇÃO PASSOU! Placeholders estão corretos (sem nomes mockados)');
  } else if (problemasEncontrados.length > 0) {
    console.log('\n❌ VALIDAÇÃO FALHOU! Encontrados estados inconsistentes');
  }
}

validarPlaceholders();
