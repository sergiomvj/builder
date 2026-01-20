const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);

async function nukeDatabase() {
  console.log('☢️ LIMPEZA NUCLEAR DO BANCO DE DADOS...\n');
  
  try {
    // Desabilitar triggers e constraints temporariamente via RPC
    console.log('🔧 Tentando executar SQL direto...');
    
    const sqlCommands = [
      // Limpar audit_logs primeiro
      "DELETE FROM audit_logs",
      
      // Limpar todas as outras tabelas
      "DELETE FROM sync_logs",
      "DELETE FROM metas_personas", 
      "DELETE FROM metas_globais",
      "DELETE FROM workflows",
      "DELETE FROM rag_knowledge",
      "DELETE FROM avatares_personas",
      "DELETE FROM personas_tech_specs",
      "DELETE FROM competencias", 
      "DELETE FROM personas_biografias",
      "DELETE FROM auditorias_compatibilidade",
      "DELETE FROM personas",
      
      // Finalmente limpar empresas
      "DELETE FROM empresas"
    ];
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const cmd = sqlCommands[i];
      console.log(`📋 Executando: ${cmd}`);
      
      try {
        // Tentar via RPC se existir
        const { data, error } = await supabase.rpc('exec_sql', { 
          query: cmd 
        });
        
        if (error) {
          console.log(`  ⚠️ Erro RPC: ${error.message}`);
          
          // Fallback: tentar via delete normal
          const tableName = cmd.replace('DELETE FROM ', '').split(' ')[0];
          const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          
          if (deleteError) {
            console.log(`  ❌ Erro DELETE: ${deleteError.message}`);
          } else {
            console.log(`  ✅ Sucesso via DELETE`);
          }
        } else {
          console.log(`  ✅ Sucesso via RPC`);
        }
      } catch (err) {
        console.log(`  ❌ Erro: ${err.message}`);
      }
    }
    
    // Verificação final
    console.log('\n🔍 Verificação final...');
    
    const { data: finalEmpresas, error: empError } = await supabase
      .from('empresas')
      .select('*');
    
    const { data: finalAudit, error: auditError } = await supabase
      .from('audit_logs')
      .select('*');
    
    console.log(`📊 Empresas restantes: ${finalEmpresas?.length || 0}`);
    console.log(`📋 Audit logs restantes: ${finalAudit?.length || 0}`);
    
    if ((finalEmpresas?.length || 0) === 0) {
      console.log('\n🎉 BANCO COMPLETAMENTE LIMPO!');
    } else {
      console.log('\n⚠️ Dados ainda presentes. Tentando última abordagem...');
      
      // Última tentativa: remover via update para NULL e depois delete
      try {
        // Tentar quebrar a referência primeiro
        await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('empresas').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        const { data: finalCheck } = await supabase.from('empresas').select('*');
        console.log(`📊 Resultado final: ${finalCheck?.length || 0} empresas`);
        
        if ((finalCheck?.length || 0) === 0) {
          console.log('✅ SUCESSO na última tentativa!');
        }
      } catch (err) {
        console.log('❌ Última tentativa falhou:', err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

nukeDatabase();