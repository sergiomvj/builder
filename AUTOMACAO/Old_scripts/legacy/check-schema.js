const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkDatabaseSchema() {
  try {
    console.log('🔍 VERIFICANDO SCHEMA DO BANCO DE DADOS');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar quais tabelas existem e têm relação com empresa_id
    const tablesToCheck = [
      'audit_logs',
      'sync_logs', 
      'metas_globais',
      'auditorias_compatibilidade',
      'metas_personas',
      'workflows',
      'rag_knowledge',
      'avatares_personas',
      'personas_tech_specs',
      'competencias',
      'personas_biografias'
    ];
    
    const empresaId = '5c76cc60-75d5-42ab-a86c-44c123f7d84a';
    
    for (const table of tablesToCheck) {
      try {
        console.log(`\n🔍 Testando tabela: ${table}`);
        
        // Testar se tabela existe com empresa_id
        const { data: empresaData, error: empresaError } = await supabase
          .from(table)
          .select('id')
          .eq('empresa_id', empresaId);
          
        if (!empresaError) {
          console.log(`✅ ${table} - existe com empresa_id - ${empresaData?.length || 0} registros`);
        } else if (empresaError.message.includes('does not exist')) {
          console.log(`⚪ ${table} - tabela não existe`);
        } else if (empresaError.message.includes('column "empresa_id" does not exist')) {
          // Testar se tem persona_id
          const { data: personaData, error: personaError } = await supabase
            .from(table)
            .select('id')
            .limit(1);
            
          if (!personaError) {
            console.log(`⚠️ ${table} - existe mas sem empresa_id - pode ter persona_id`);
          } else {
            console.log(`❌ ${table} - erro: ${personaError.message}`);
          }
        } else {
          console.log(`❌ ${table} - erro: ${empresaError.message}`);
        }
        
      } catch (err) {
        console.log(`❌ ${table} - erro de conexão: ${err.message}`);
      }
    }
    
    // Verificar especificamente audit_logs
    console.log('\n🔥 ANÁLISE ESPECÍFICA: audit_logs');
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('empresa_id', empresaId);
        
      if (!error) {
        console.log(`✅ audit_logs encontrada com ${data?.length || 0} registros para esta empresa`);
        if (data && data.length > 0) {
          console.log('📋 Primeiros registros:', data.slice(0, 2));
        }
      } else {
        console.log(`❌ Erro em audit_logs: ${error.message}`);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar audit_logs: ${err.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkDatabaseSchema();