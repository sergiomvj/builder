import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: variáveis NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEmpresas() {
  console.log('\n🔍 VERIFICANDO TODAS AS EMPRESAS NO BANCO\n');
  console.log('='.repeat(80));
  
  // Buscar todas as empresas
  const { data: empresas, error } = await supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao buscar empresas:', error);
    return;
  }
  
  console.log(`\n📊 Total de empresas encontradas: ${empresas.length}\n`);
  
  // Verificar quantas têm personas
  for (const empresa of empresas) {
    const { data: personas, error: pError } = await supabase
      .from('personas')
      .select('id', { count: 'exact', head: true })
      .eq('empresa_id', empresa.id);
    
    const personaCount = pError ? 0 : (personas?.length || 0);
    
    // Usar HEAD request para contar
    const { count } = await supabase
      .from('personas')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa.id);
    
    const status = count > 0 ? '✅' : '🗑️';
    const date = new Date(empresa.created_at).toLocaleDateString('pt-BR');
    
    console.log(`${status} ${empresa.nome || '(sem nome)'}`);
    console.log(`   ID: ${empresa.id}`);
    console.log(`   Personas: ${count || 0}`);
    console.log(`   Criada em: ${date}`);
    console.log('   ' + '-'.repeat(76));
  }
  
  // Resumo
  const empresasComPersonas = empresas.filter(async e => {
    const { count } = await supabase
      .from('personas')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', e.id);
    return count > 0;
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`📊 RESUMO:`);
  console.log(`   Total: ${empresas.length}`);
  console.log(`   Com personas: (verificar manualmente acima)`);
  console.log(`   Órfãs (candidatas a exclusão): (verificar manualmente acima)`);
  console.log('='.repeat(80));
  
  // Perguntar se quer excluir
  console.log('\n💡 Para excluir empresas órfãs, execute:');
  console.log('   node AUTOMACAO/cleanup_empresas_orfas.js');
}

checkEmpresas().catch(console.error);
