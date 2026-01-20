require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VCM_SUPABASE_URL,
  process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
);

async function verificarEmpresas() {
  try {
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('id, nome, status, total_personas')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }

    console.log('📊 EMPRESAS NO BANCO:');
    console.log('=====================');
    
    if (empresas.length === 0) {
      console.log('⚠️ Nenhuma empresa encontrada');
    } else {
      empresas.forEach((emp, index) => {
        console.log((index + 1) + '. ' + emp.nome);
        console.log('   Status: ' + emp.status);  
        console.log('   Personas: ' + emp.total_personas);
        console.log('   ID: ' + emp.id);
        console.log('');
      });
    }

    const ativas = empresas.filter(e => e.status === 'ativa');
    const inativas = empresas.filter(e => e.status === 'inativa');
    
    console.log('📈 RESUMO:');
    console.log('✅ Ativas: ' + ativas.length);
    console.log('🚫 Inativas: ' + inativas.length);
    console.log('📊 Total: ' + empresas.length);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

verificarEmpresas();