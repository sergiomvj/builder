/**
 * Limpeza Forçada via SQL - Para casos extremos
 * Use apenas quando a limpeza normal falhar
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VCM_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Force delete usando SQL direto
 */
export async function forceDeleteCompany(companyId: string) {
  console.log('💥 INICIANDO EXCLUSÃO FORÇADA VIA SQL...');
  console.log('🏢 Empresa ID:', companyId);
  
  try {
    // SQL que desabilita temporariamente as verificações de foreign key
    // e remove tudo relacionado à empresa
    const sqlScript = `
      BEGIN;
      
      -- Desabilitar verificações de foreign key temporariamente
      SET session_replication_role = replica;
      
      -- Remover todos os dados relacionados à empresa
      DELETE FROM audit_logs WHERE empresa_id = '${companyId}';
      DELETE FROM sync_logs WHERE empresa_id = '${companyId}';
      DELETE FROM metas_personas WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}');
      DELETE FROM metas_globais WHERE empresa_id = '${companyId}';
      DELETE FROM workflows WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}');
      DELETE FROM rag_knowledge WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}');
      DELETE FROM avatares_personas WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}');
      DELETE FROM personas_tech_specs WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}');
      DELETE FROM competencias WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}');
      DELETE FROM personas_biografias WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}');
      DELETE FROM auditorias_compatibilidade WHERE empresa_id = '${companyId}';
      DELETE FROM personas WHERE empresa_id = '${companyId}';
      DELETE FROM empresas WHERE id = '${companyId}';
      
      -- Reabilitar verificações de foreign key
      SET session_replication_role = DEFAULT;
      
      COMMIT;
    `;
    
    console.log('🔧 Executando SQL de limpeza forçada...');
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlScript 
    });
    
    if (error) {
      console.error('❌ Erro na execução do SQL:', error);
      
      // Fallback: tentar com comandos individuais
      console.log('🔄 Tentando com comandos individuais...');
      
      const commands = [
        `DELETE FROM audit_logs WHERE empresa_id = '${companyId}'`,
        `DELETE FROM sync_logs WHERE empresa_id = '${companyId}'`,
        `DELETE FROM metas_personas WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}')`,
        `DELETE FROM metas_globais WHERE empresa_id = '${companyId}'`,
        `DELETE FROM workflows WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}')`,
        `DELETE FROM rag_knowledge WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}')`,
        `DELETE FROM avatares_personas WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}')`,
        `DELETE FROM personas_tech_specs WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}')`,
        `DELETE FROM competencias WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}')`,
        `DELETE FROM personas_biografias WHERE persona_id IN (SELECT id FROM personas WHERE empresa_id = '${companyId}')`,
        `DELETE FROM auditorias_compatibilidade WHERE empresa_id = '${companyId}'`,
        `DELETE FROM personas WHERE empresa_id = '${companyId}'`,
        `DELETE FROM empresas WHERE id = '${companyId}'`
      ];
      
      for (const cmd of commands) {
        try {
          console.log(`  🔧 Executando: ${cmd.substring(0, 50)}...`);
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: cmd });
          if (cmdError) {
            console.warn(`    ⚠️ Aviso:`, cmdError.message);
          } else {
            console.log(`    ✅ Comando executado com sucesso`);
          }
        } catch (err) {
          console.warn(`    ⚠️ Erro no comando:`, err);
        }
      }
      
    } else {
      console.log('✅ SQL executado com sucesso!');
      console.log('📋 Resultado:', data);
    }
    
    console.log('💥 EXCLUSÃO FORÇADA CONCLUÍDA!');
    
  } catch (err) {
    console.error('❌ Erro crítico na exclusão forçada:', err);
    throw err;
  }
}

// Se executado diretamente
if (require.main === module) {
  const companyId = process.argv[2];
  if (!companyId) {
    console.error('❌ Uso: node force-delete.js <company-id>');
    process.exit(1);
  }
  
  forceDeleteCompany(companyId)
    .then(() => {
      console.log('🎉 Exclusão forçada concluída com sucesso!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Falha na exclusão forçada:', err);
      process.exit(1);
    });
}