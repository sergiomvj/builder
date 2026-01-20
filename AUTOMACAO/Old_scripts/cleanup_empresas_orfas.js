import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

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

// Função para perguntar confirmação
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function cleanupEmpresas() {
  console.log('\n🧹 LIMPEZA DE EMPRESAS ÓRFÃS\n');
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
  
  console.log(`\n📊 Total de empresas: ${empresas.length}\n`);
  
  // Identificar órfãs
  const orfas = [];
  const ativas = [];
  
  for (const empresa of empresas) {
    const { count } = await supabase
      .from('personas')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa.id);
    
    if (count === 0) {
      orfas.push(empresa);
    } else {
      ativas.push(empresa);
    }
  }
  
  console.log(`✅ Empresas ativas (com personas): ${ativas.length}`);
  ativas.forEach(e => {
    console.log(`   - ${e.nome || '(sem nome)'}`);
  });
  
  console.log(`\n🗑️  Empresas órfãs (sem personas): ${orfas.length}`);
  orfas.forEach(e => {
    console.log(`   - ${e.nome || '(sem nome)'} (ID: ${e.id.substring(0, 8)}...)`);
  });
  
  if (orfas.length === 0) {
    console.log('\n✨ Nenhuma empresa órfã encontrada! Banco limpo.\n');
    return;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  ATENÇÃO: Esta operação irá deletar permanentemente as empresas órfãs!');
  console.log('='.repeat(80));
  
  const answer = await askQuestion('\n❓ Deseja continuar com a exclusão? (sim/não): ');
  
  if (answer.toLowerCase() !== 'sim') {
    console.log('\n❌ Operação cancelada pelo usuário.\n');
    return;
  }
  
  // Deletar empresas órfãs
  console.log('\n🗑️  Deletando empresas órfãs...\n');
  
  let sucessos = 0;
  let falhas = 0;
  
  for (const empresa of orfas) {
    try {
      // Primeiro, deletar audit_logs relacionados
      const { error: auditError } = await supabase
        .from('audit_logs')
        .delete()
        .eq('empresa_id', empresa.id);
      
      if (auditError) {
        console.warn(`⚠️  Aviso ao deletar audit_logs de ${empresa.nome}: ${auditError.message}`);
      }
      
      // Agora deletar a empresa
      const { error: deleteError } = await supabase
        .from('empresas')
        .delete()
        .eq('id', empresa.id);
      
      if (deleteError) {
        console.error(`❌ Erro ao deletar ${empresa.nome}: ${deleteError.message}`);
        falhas++;
      } else {
        console.log(`✅ Deletada: ${empresa.nome || '(sem nome)'}`);
        sucessos++;
      }
    } catch (err) {
      console.error(`❌ Exceção ao deletar ${empresa.nome}:`, err);
      falhas++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTADO DA LIMPEZA\n');
  console.log(`   ✅ Deletadas com sucesso: ${sucessos}`);
  console.log(`   ❌ Falhas: ${falhas}`);
  console.log(`   📋 Restantes no banco: ${empresas.length - sucessos}`);
  console.log('='.repeat(80));
  
  console.log('\n✨ Limpeza concluída!\n');
}

cleanupEmpresas().catch(console.error);
