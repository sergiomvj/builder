// =====================================================
// SCRIPT: Validar se Tabelas V5.0 Existem
// DESCRIÇÃO: Valida criação das 4 tabelas novas
// VERSÃO: 1.0
// DATA: 07/12/2025
// =====================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Configuração Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('   Certifique-se que .env.local contém:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function validateTables() {
  console.log('=========================================');
  console.log('VCM V5.0 - Validação de Tabelas');
  console.log('=========================================');
  console.log(`📡 Conectando em: ${SUPABASE_URL}`);
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log('');
  
  const expectedTables = [
    'personas_communications',
    'task_supervision_chains',
    'task_supervision_logs',
    'user_interventions'
  ];
  
  const results = {
    existing: [],
    missing: []
  };
  
  for (const tableName of expectedTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(0);
      
      if (error) {
        console.log(`   ❌ ${tableName}: NÃO EXISTE`);
        results.missing.push(tableName);
      } else {
        console.log(`   ✅ ${tableName}: OK`);
        results.existing.push(tableName);
      }
    } catch (err) {
      console.log(`   ❌ ${tableName}: ERRO - ${err.message}`);
      results.missing.push(tableName);
    }
  }
  
  console.log('');
  console.log('=========================================');
  console.log('📊 RESUMO');
  console.log('=========================================');
  console.log(`✅ Tabelas existentes: ${results.existing.length}`);
  console.log(`❌ Tabelas ausentes: ${results.missing.length}`);
  console.log('=========================================');
  
  if (results.missing.length === 0) {
    console.log('\n🎉 Todas as tabelas V5.0 foram criadas!\n');
    console.log('📋 Próximos passos:');
    console.log('   1. Executar Scripts 04-05 V5.0 (competências + avatares)');
    console.log('   2. Executar Script 06.5 (matriz de comunicação)');
    console.log('   3. Executar Script 07.5 (cadeias de supervisão)');
    console.log('');
  } else {
    console.log('\n⚠️  AÇÃO NECESSÁRIA:\n');
    console.log('As seguintes tabelas precisam ser criadas manualmente no Supabase SQL Editor:');
    console.log('');
    for (const table of results.missing) {
      const sqlFile = {
        'personas_communications': 'SQL/create_personas_communications.sql',
        'task_supervision_chains': 'SQL/create_task_supervision.sql',
        'task_supervision_logs': 'SQL/create_task_supervision.sql',
        'user_interventions': 'SQL/create_user_interventions.sql'
      }[table];
      console.log(`   📄 ${table} → Execute: ${sqlFile}`);
    }
    console.log('');
    console.log('👉 Abra o Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/sql');
    console.log('');
    console.log('👉 Cole o conteúdo de cada arquivo SQL e execute.');
    console.log('');
  }
  
  return results;
}

async function main() {
  const results = await validateTables();
  process.exit(results.missing.length === 0 ? 0 : 1);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
