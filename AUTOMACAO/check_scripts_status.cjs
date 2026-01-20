const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkScriptsStatus() {
  const empresaId = '27470d32-9cce-4975-9a62-1d76f3ab77a4';
  
  console.log('📊 Verificando status dos scripts para ARVA Tech Solutions\n');
  
  const { data: empresa, error } = await supabase
    .from('empresas')
    .select('nome, scripts_status')
    .eq('id', empresaId)
    .single();

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log(`🏢 Empresa: ${empresa.nome}\n`);
  console.log('📋 Status dos Scripts:\n');
  
  const status = empresa.scripts_status || {};
  
  // Mostrar JSON raw primeiro
  console.log('🔍 JSON Raw:');
  console.log(JSON.stringify(status, null, 2));
  console.log('\n');
  
  const scriptNames = {
    'script_01': '01 - Placeholders',
    'script_02': '02 - Biografias',
    'script_03': '03 - Atribuições',
    'script_04': '04 - Competências',
    'script_05': '05 - Avatares',
    'script_06': '06 - Automação',
    'script_06_5': '06.5 - RAG Recommendations',
    'script_07': '07 - Workflows',
    'script_08': '08 - ML Models',
    'script_09': '09 - Auditoria',
    'script_10': '10 - Knowledge Base',
    'script_11': '11 - RAG Test'
  };

  for (const [key, name] of Object.entries(scriptNames)) {
    const scriptStatus = status[key];
    if (scriptStatus) {
      const statusIcon = scriptStatus.status === 'completed' ? '✅' : 
                        scriptStatus.status === 'running' ? '🔄' : 
                        scriptStatus.status === 'error' ? '❌' : '⏸️';
      
      console.log(`${statusIcon} ${name}`);
      console.log(`   Status: ${scriptStatus.status}`);
      console.log(`   Última execução: ${new Date(scriptStatus.last_run).toLocaleString('pt-BR')}`);
      console.log(`   Sucessos: ${scriptStatus.successes || 0} | Erros: ${scriptStatus.errors || 0}\n`);
    } else {
      console.log(`⚪ ${name} - Não executado\n`);
    }
  }
}

checkScriptsStatus();
