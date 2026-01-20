/**
 * SOLUÇÃO DEFINITIVA: Remover Foreign Keys Temporariamente
 * Use este SQL no Supabase Dashboard
 */

console.log(`
🔧 SOLUÇÃO DEFINITIVA - SQL PARA SUPABASE DASHBOARD

Os triggers de sistema não podem ser desabilitados, mas podemos remover
temporariamente as foreign keys para fazer a limpeza:

📋 EXECUTE ESTE SQL NO SUPABASE DASHBOARD:

-- PASSO 1: Remover a foreign key constraint temporariamente
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_empresa_id_fkey;

-- PASSO 2: Limpar todos os dados na ordem correta
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

-- PASSO 3: Recriar a foreign key constraint
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_empresa_id_fkey 
FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;

-- PASSO 4: Verificar se está limpo
SELECT 
  'empresas' as tabela, 
  count(*) as registros 
FROM empresas
UNION ALL
SELECT 
  'personas' as tabela, 
  count(*) as registros 
FROM personas
UNION ALL
SELECT 
  'audit_logs' as tabela, 
  count(*) as registros 
FROM audit_logs;

✅ RESULTADO ESPERADO: Todas as contagens devem ser 0

🔗 Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/sql

`);

// Criar também uma abordagem programática usando CASCADE
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);

async function tryConstraintModification() {
  console.log('🔧 Tentando modificar constraints programaticamente...\n');
  
  try {
    // Tentar remover a constraint via SQL
    console.log('1. Removendo foreign key constraint...');
    
    const dropConstraintSQL = `
      ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_empresa_id_fkey;
    `;
    
    const { error: dropError } = await supabase.rpc('sql', { 
      query: dropConstraintSQL 
    });
    
    if (dropError) {
      console.log('⚠️ Erro ao remover constraint via RPC:', dropError.message);
    } else {
      console.log('✅ Constraint removida via RPC');
      
      // Agora tentar limpar dados
      console.log('2. Limpando dados...');
      
      const tables = [
        'audit_logs',
        'sync_logs', 
        'metas_personas',
        'metas_globais',
        'workflows',
        'rag_knowledge',
        'avatares_personas',
        'personas_tech_specs',
        'competencias',
        'personas_biografias',
        'auditorias_compatibilidade',
        'personas',
        'empresas'
      ];
      
      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
          console.log(`⚠️ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Limpo`);
        }
      }
      
      // Recriar constraint
      console.log('3. Recriando constraint...');
      const recreateConstraintSQL = `
        ALTER TABLE audit_logs 
        ADD CONSTRAINT audit_logs_empresa_id_fkey 
        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE;
      `;
      
      const { error: recreateError } = await supabase.rpc('sql', { 
        query: recreateConstraintSQL 
      });
      
      if (recreateError) {
        console.log('⚠️ Erro ao recriar constraint:', recreateError.message);
      } else {
        console.log('✅ Constraint recriada');
      }
    }
    
    // Verificação final
    const { data: finalCheck } = await supabase.from('empresas').select('*');
    console.log(`\n📊 Status final: ${finalCheck?.length || 0} empresas no banco`);
    
    if ((finalCheck?.length || 0) === 0) {
      console.log('🎉 LIMPEZA PROGRAMÁTICA BEM-SUCEDIDA!');
    } else {
      console.log('❌ Use a abordagem manual no SQL Editor acima.');
    }
    
  } catch (err) {
    console.error('❌ Erro na modificação de constraints:', err.message);
    console.log('\n📋 Use a abordagem manual no SQL Editor do Supabase Dashboard.');
  }
}

tryConstraintModification();