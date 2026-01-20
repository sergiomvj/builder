/**
 * SOLUÇÃO MANUAL PARA LIMPEZA COMPLETA
 * Use este guia para limpar via Supabase Dashboard
 */

console.log(`
🚨 GUIA DE LIMPEZA MANUAL VIA SUPABASE DASHBOARD

O banco possui triggers automáticos que impedem a exclusão normal.
Siga estes passos para limpeza manual:

📋 PASSO 1: Acesse o Supabase Dashboard
   🔗 https://supabase.com/dashboard/project/${process.env.VCM_SUPABASE_URL?.split('//')[1]?.split('.')[0]}

📋 PASSO 2: Vá para "SQL Editor"

📋 PASSO 3: Execute este SQL:

-- Desabilitar todos os triggers temporariamente
ALTER TABLE audit_logs DISABLE TRIGGER ALL;
ALTER TABLE empresas DISABLE TRIGGER ALL;

-- Limpar todos os dados
DELETE FROM audit_logs;
DELETE FROM sync_logs;
DELETE FROM metas_personas;
DELETE FROM metas_globais;
DELETE FROM workflows;
DELETE FROM rag_knowledge;
DELETE FROM avatares_personas;
DELETE FROM personas_tech_specs;
DELETE FROM competencias;
DELETE FROM personas_biografias;
DELETE FROM auditorias_compatibilidade;
DELETE FROM personas;
DELETE FROM empresas;

-- Reabilitar triggers
ALTER TABLE audit_logs ENABLE TRIGGER ALL;
ALTER TABLE empresas ENABLE TRIGGER ALL;

📋 PASSO 4: Confirme que está limpo:
SELECT 'empresas' as tabela, count(*) as registros FROM empresas
UNION ALL
SELECT 'personas' as tabela, count(*) as registros FROM personas
UNION ALL
SELECT 'audit_logs' as tabela, count(*) as registros FROM audit_logs;

✅ RESULTADO ESPERADO: Todas as contagens devem ser 0

🔗 Link direto para SQL Editor:
https://supabase.com/dashboard/project/${process.env.VCM_SUPABASE_URL?.split('//')[1]?.split('.')[0]}/sql

`);

// Tentar uma última abordagem programática
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);

async function tryAlternativeApproach() {
  console.log('🔄 Tentando abordagem alternativa...\n');
  
  try {
    // Tentar atualizar empresa para quebrar referências
    console.log('1. Tentando quebrar referências...');
    
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id');
    
    if (empresas && empresas.length > 0) {
      const empresaId = empresas[0].id;
      console.log(`📋 Empresa encontrada: ${empresaId}`);
      
      // Tentar múltiplas remoções sequenciais
      for (let i = 0; i < 5; i++) {
        console.log(`🔄 Tentativa ${i + 1}/5...`);
        
        // Limpar audit_logs primeiro
        await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Tentar remover empresa
        const { error } = await supabase
          .from('empresas')
          .delete()
          .eq('id', empresaId);
        
        if (!error) {
          console.log('✅ SUCESSO na remoção!');
          break;
        } else {
          console.log(`⚠️ Tentativa ${i + 1} falhou: ${error.message}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // Verificação final
    const { data: finalCheck } = await supabase.from('empresas').select('*');
    console.log(`\n📊 Status final: ${finalCheck?.length || 0} empresas no banco`);
    
    if ((finalCheck?.length || 0) === 0) {
      console.log('🎉 BANCO FINALMENTE LIMPO!');
    } else {
      console.log('❌ Limpeza programática falhou. Use a limpeza manual acima.');
    }
    
  } catch (err) {
    console.error('❌ Erro na abordagem alternativa:', err.message);
  }
}

tryAlternativeApproach();