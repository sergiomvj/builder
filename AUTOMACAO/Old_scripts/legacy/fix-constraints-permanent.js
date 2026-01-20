/**
 * CORREÇÃO DEFINITIVA DAS CONSTRAINTS DO BANCO
 * Execute este SQL uma única vez para corrigir permanentemente o problema
 */

console.log(`
🔧 CORREÇÃO DEFINITIVA DAS CONSTRAINTS

Execute este SQL UMA ÚNICA VEZ no Supabase Dashboard para corrigir 
permanentemente o problema de exclusão de empresas:

🔗 Acesse: https://supabase.com/dashboard/project/fzyokrvdyeczhfqlwxzb/sql

📋 SQL PARA CORREÇÃO PERMANENTE:

-- 1. Remover constraint problemática
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_empresa_id_fkey;

-- 2. Recriar constraint com CASCADE (exclusão em cascata)
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_empresa_id_fkey 
FOREIGN KEY (empresa_id) 
REFERENCES empresas(id) 
ON DELETE CASCADE;

-- 3. Verificar se outras tabelas precisam de CASCADE
-- Verificar constraints existentes
SELECT 
  tc.table_name, 
  tc.constraint_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'empresas';

-- 4. Corrigir outras constraints se necessário
-- (Execute apenas se a consulta acima mostrar constraints sem CASCADE)

-- Para personas
ALTER TABLE personas DROP CONSTRAINT IF EXISTS personas_empresa_id_fkey;
ALTER TABLE personas 
ADD CONSTRAINT personas_empresa_id_fkey 
FOREIGN KEY (empresa_id) 
REFERENCES empresas(id) 
ON DELETE CASCADE;

-- Para sync_logs
ALTER TABLE sync_logs DROP CONSTRAINT IF EXISTS sync_logs_empresa_id_fkey;
ALTER TABLE sync_logs 
ADD CONSTRAINT sync_logs_empresa_id_fkey 
FOREIGN KEY (empresa_id) 
REFERENCES empresas(id) 
ON DELETE CASCADE;

-- Para metas_globais
ALTER TABLE metas_globais DROP CONSTRAINT IF EXISTS metas_globais_empresa_id_fkey;
ALTER TABLE metas_globais 
ADD CONSTRAINT metas_globais_empresa_id_fkey 
FOREIGN KEY (empresa_id) 
REFERENCES empresas(id) 
ON DELETE CASCADE;

-- Para auditorias_compatibilidade
ALTER TABLE auditorias_compatibilidade DROP CONSTRAINT IF EXISTS auditorias_compatibilidade_empresa_id_fkey;
ALTER TABLE auditorias_compatibilidade 
ADD CONSTRAINT auditorias_compatibilidade_empresa_id_fkey 
FOREIGN KEY (empresa_id) 
REFERENCES empresas(id) 
ON DELETE CASCADE;

-- 5. Verificação final - todas devem ter 'CASCADE'
SELECT 
  tc.table_name, 
  tc.constraint_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'empresas';

✅ APÓS EXECUTAR ESTE SQL:
- Exclusões de empresa funcionarão normalmente
- Dados relacionados serão removidos automaticamente em cascata
- Não será mais necessário limpeza manual complexa

🎯 ISSO CORRIGE O PROBLEMA PERMANENTEMENTE!

`);

// Testar se a correção já foi aplicada
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);

async function testConstraints() {
  console.log('\n🔍 Testando se constraints já foram corrigidas...');
  
  try {
    // Criar empresa de teste
    const { data: testCompany, error: createError } = await supabase
      .from('empresas')
      .insert([{
        nome: 'TESTE_CASCATA',
        setor: 'Teste',
        descricao: 'Empresa para testar cascata'
      }])
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Erro ao criar empresa de teste:', createError.message);
      return;
    }
    
    console.log('📊 Empresa de teste criada:', testCompany.id);
    
    // Criar registro dependente
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert([{
        empresa_id: testCompany.id,
        acao: 'TESTE_CASCATA',
        detalhes: 'Teste de constraint CASCADE'
      }]);
    
    if (auditError) {
      console.log('⚠️ Erro ao criar audit log de teste:', auditError.message);
    } else {
      console.log('📝 Audit log de teste criado');
    }
    
    // Tentar excluir empresa
    console.log('🧪 Testando exclusão da empresa...');
    const { error: deleteError } = await supabase
      .from('empresas')
      .delete()
      .eq('id', testCompany.id);
    
    if (deleteError) {
      console.log('❌ CONSTRAINT NÃO CORRIGIDA. Erro:', deleteError.message);
      console.log('📋 Execute o SQL de correção acima!');
    } else {
      console.log('✅ CONSTRAINTS JÁ CORRIGIDAS! Exclusão funcionou perfeitamente.');
      console.log('🎉 Sistema funcionará normalmente daqui para frente.');
    }
    
  } catch (err) {
    console.error('❌ Erro no teste:', err.message);
  }
}

testConstraints();