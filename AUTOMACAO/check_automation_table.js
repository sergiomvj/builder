import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAutomationTable() {
  console.log('🔍 Verificando tabelas de automação...\n');

  // Tentar automation_opportunities
  const { data: data1, error: error1 } = await supabase
    .from('automation_opportunities')
    .select('*')
    .limit(1);

  if (!error1) {
    console.log('✅ Tabela encontrada: automation_opportunities');
    console.log(`   Registros: ${data1?.length || 0}`);
  } else {
    console.log('❌ automation_opportunities:', error1.message);
  }

  // Tentar personas_automation_opportunities
  const { data: data2, error: error2 } = await supabase
    .from('personas_automation_opportunities')
    .select('*')
    .limit(1);

  if (!error2) {
    console.log('✅ Tabela encontrada: personas_automation_opportunities');
    console.log(`   Registros: ${data2?.length || 0}`);
  } else {
    console.log('❌ personas_automation_opportunities:', error2.message);
  }

  // Tentar personas_automation_oportunities (com typo)
  const { data: data3, error: error3 } = await supabase
    .from('personas_automation_oportunities')
    .select('*')
    .limit(1);

  if (!error3) {
    console.log('✅ Tabela encontrada: personas_automation_oportunities');
    console.log(`   Registros: ${data3?.length || 0}`);
  } else {
    console.log('❌ personas_automation_oportunities:', error3.message);
  }

  // Listar todas as tabelas disponíveis
  console.log('\n📋 Tentando descobrir tabelas disponíveis...');
  const { data: tables, error: tablesError } = await supabase
    .rpc('get_tables');
  
  if (tablesError) {
    console.log('ℹ️  Não foi possível listar tabelas via RPC');
  } else {
    console.log('Tabelas:', tables);
  }
}

checkAutomationTable();
