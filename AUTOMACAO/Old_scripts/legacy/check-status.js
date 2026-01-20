const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkStatusConstraint() {
  try {
    console.log('🔍 VERIFICANDO CONSTRAINT DE STATUS');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const empresaId = '5c76cc60-75d5-42ab-a86c-44c123f7d84a';
    
    // Testar diferentes status para ver quais são aceitos
    const statusToTest = [
      'ativa',
      'inativa', 
      'processando',
      'arquivada',
      'excluida',
      'removida',
      'deletada'
    ];
    
    for (const status of statusToTest) {
      try {
        console.log(`🔍 Testando status: ${status}`);
        
        const { error } = await supabase
          .from('empresas')
          .update({ status: status })
          .eq('id', empresaId);
          
        if (error) {
          console.log(`❌ ${status}: ${error.message}`);
        } else {
          console.log(`✅ ${status}: aceito`);
          // Reverter para inativa para próximo teste
          if (status !== 'inativa') {
            await supabase
              .from('empresas')
              .update({ status: 'inativa' })
              .eq('id', empresaId);
          }
        }
        
      } catch (err) {
        console.log(`❌ ${status}: erro de conexão`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkStatusConstraint();