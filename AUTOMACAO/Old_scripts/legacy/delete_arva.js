require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VCM_SUPABASE_URL,
  process.env.VCM_SUPABASE_SERVICE_ROLE_KEY
);

async function archiveArvaForRecreation() {
  const empresaId = 'eef1a4e4-ef01-46e8-a955-ee53f2496734';
  
  console.log('🔄 ARQUIVANDO ARVA TECH PARA RECRIAÇÃO');
  console.log('====================================');
  
  try {
    // Arquivar empresa renomeando para liberar o nome original
    console.log('📝 Arquivando empresa...');
    
    const timestamp = Date.now();
    const { error: updateError } = await supabase
      .from('empresas')
      .update({
        nome: `ARVA Tech Solutions (ARCHIVED-${timestamp})`,
        codigo: `ARVA_OLD_${timestamp}`,
        status: 'inativa',
        updated_at: new Date().toISOString()
      })
      .eq('id', empresaId);
    
    if (updateError) {
      console.error('❌ Erro ao arquivar:', updateError.message);
      return false;
    }
    
    console.log('✅ ARVA Tech arquivada com sucesso!');
    console.log('');
    console.log('🎯 RESULTADO:');
    console.log('• Empresa renomeada e desativada');
    console.log('• Nome "ARVA Tech Solutions" liberado');
    console.log('• Dados históricos preservados');
    console.log('');
    console.log('💡 PRÓXIMO PASSO:');
    console.log('🚀 Acesse /create-strategic-company e recrie a ARVA Tech!');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  }
}

archiveArvaForRecreation().then(success => {
  if (success) {
    console.log('\n✨ Pronto para recriação limpa da ARVA Tech!');
  }
});