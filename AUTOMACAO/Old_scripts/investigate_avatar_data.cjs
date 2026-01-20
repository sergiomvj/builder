// Verificar onde os dados dos avatares estão sendo salvos
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateAvatarData() {
  console.log('🔍 INVESTIGANDO ONDE OS DADOS DOS AVATARES ESTÃO...\n');
  
  const empresaId = '58234085-d661-4171-8664-4149b5559a3c';
  
  // 1. Verificar tabela personas_avatares
  console.log('1️⃣ Verificando tabela personas_avatares:');
  const { data: avatares, error: avataresError, count: avataresCount } = await supabase
    .from('personas_avatares')
    .select('*', { count: 'exact' });
  
  if (avataresError) {
    console.log(`   ❌ Erro: ${avataresError.message}\n`);
  } else {
    console.log(`   📊 Total de registros: ${avataresCount || 0}`);
    if (avatares && avatares.length > 0) {
      console.log(`   ✅ Primeiros registros encontrados:`);
      avatares.slice(0, 3).forEach(a => {
        console.log(`      - ID: ${a.id}, persona_id: ${a.persona_id}`);
      });
    } else {
      console.log(`   ⚠️  Tabela está vazia!`);
    }
    console.log('');
  }
  
  // 2. Verificar tabela personas (pode ter campos de avatar diretamente)
  console.log('2️⃣ Verificando tabela personas (campos relacionados a avatar):');
  const { data: personas, error: personasError } = await supabase
    .from('personas')
    .select('id, full_name, avatar_url, system_prompt')
    .eq('empresa_id', empresaId)
    .limit(3);
  
  if (personasError) {
    console.log(`   ❌ Erro: ${personasError.message}\n`);
  } else {
    console.log(`   📊 Total verificado: ${personas?.length || 0}`);
    if (personas && personas.length > 0) {
      personas.forEach(p => {
        console.log(`   \n   👤 ${p.full_name}`);
        console.log(`      - avatar_url: ${p.avatar_url || 'NULL'}`);
        console.log(`      - system_prompt: ${p.system_prompt ? 'Presente (JSON)' : 'NULL'}`);
      });
    }
    console.log('');
  }
  
  // 3. Verificar script 00_generate_avatares.js para ver onde ele salva
  console.log('3️⃣ Analisando script 00_generate_avatares.js...');
  const scriptPath = path.join(__dirname, '00_generate_avatares.js');
  const fs = require('fs');
  
  if (fs.existsSync(scriptPath)) {
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Procurar por .from('...')
    const fromMatches = scriptContent.match(/\.from\(['"]([^'"]+)['"]\)/g);
    if (fromMatches) {
      const tables = [...new Set(fromMatches)].map(m => m.match(/\.from\(['"]([^'"]+)['"]\)/)[1]);
      console.log(`   📋 Tabelas usadas no script:`);
      tables.forEach(t => console.log(`      - ${t}`));
    }
    
    // Verificar se salva em avatares_personas ou personas_avatares
    if (scriptContent.includes("'avatares_personas'")) {
      console.log(`   ⚠️  Script usa 'avatares_personas' (nome invertido!)`);
    }
    if (scriptContent.includes("'personas_avatares'")) {
      console.log(`   ✅ Script usa 'personas_avatares' (correto)`);
    }
  }
  console.log('');
  
  // 4. Listar todas as tabelas disponíveis no schema public
  console.log('4️⃣ Verificando se existe tabela com nome similar:');
  const { data: allTables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .like('table_name', '%avatar%');
  
  if (!tablesError && allTables && allTables.length > 0) {
    console.log(`   📋 Tabelas com 'avatar' no nome:`);
    allTables.forEach(t => console.log(`      - ${t.table_name}`));
  } else {
    console.log(`   ⚠️  Não foi possível listar tabelas ou nenhuma tabela com 'avatar' encontrada`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 CONCLUSÃO:');
  console.log('='.repeat(60));
  console.log('Se personas_avatares está vazia, os dados podem estar:');
  console.log('1. Na própria tabela personas (campos avatar_url, system_prompt)');
  console.log('2. Em uma tabela com nome diferente (avatares_personas)');
  console.log('3. Não foram executados os scripts de geração ainda');
  console.log('='.repeat(60));
}

investigateAvatarData();
