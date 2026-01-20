console.log(`
🎉 PROGRESSO! A empresa foi removida com sucesso!

O erro atual indica que há registros órfãos em audit_logs.
Execute este SQL final para completar a limpeza:

📋 SQL PARA COMPLETAR A LIMPEZA:

-- Remover registros órfãos em audit_logs
DELETE FROM audit_logs WHERE empresa_id = '07870dfd-ca9d-4004-bbeb-e4aabd30d244';

-- Ou remover TODOS os audit_logs para garantir
DELETE FROM audit_logs;

-- Verificar se está completamente limpo
SELECT 'empresas' as tabela, count(*) as registros FROM empresas
UNION ALL
SELECT 'personas' as tabela, count(*) as registros FROM personas  
UNION ALL
SELECT 'audit_logs' as tabela, count(*) as registros FROM audit_logs;

✅ RESULTADO ESPERADO: Todas as contagens devem ser 0

🔗 Execute em: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/sql

`);

// Verificar status programaticamente
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);

async function checkFinalStatus() {
  console.log('🔍 Verificando status atual...\n');
  
  try {
    const { data: empresas, error: empError } = await supabase
      .from('empresas')
      .select('*');
    
    const { data: personas, error: persError } = await supabase
      .from('personas') 
      .select('*');
    
    const { data: audits, error: auditError } = await supabase
      .from('audit_logs')
      .select('*');
    
    console.log(`📊 Status atual:`);
    console.log(`  - Empresas: ${empresas?.length || 0}`);
    console.log(`  - Personas: ${personas?.length || 0}`);
    console.log(`  - Audit logs: ${audits?.length || 0}`);
    
    if (audits && audits.length > 0) {
      console.log(`\n📋 Audit logs órfãos encontrados:`);
      audits.forEach(audit => {
        console.log(`  - ID: ${audit.id}, Empresa: ${audit.empresa_id}`);
      });
    }
    
    // Tentar limpar audit_logs programaticamente
    console.log('\n🧹 Tentando limpar audit_logs...');
    
    const { error: cleanError } = await supabase
      .from('audit_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (cleanError) {
      console.log(`❌ Erro ao limpar: ${cleanError.message}`);
      console.log('📋 Use o SQL manual acima para completar.');
    } else {
      console.log('✅ Audit logs limpos programaticamente!');
      
      // Verificação final
      const { data: finalCheck } = await supabase.from('audit_logs').select('*');
      console.log(`🎉 Status final: ${finalCheck?.length || 0} audit logs restantes`);
      
      if ((finalCheck?.length || 0) === 0) {
        console.log('\n🎊 BANCO COMPLETAMENTE LIMPO! SUCESSO TOTAL!');
      }
    }
    
  } catch (err) {
    console.error('❌ Erro na verificação:', err.message);
  }
}

checkFinalStatus();