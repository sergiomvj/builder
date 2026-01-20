const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testCleanup() {
  try {
    console.log('🧹 TESTE DE LIMPEZA MANUAL');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const empresaId = '5c76cc60-75d5-42ab-a86c-44c123f7d84a';
    
    // 1. Verificar quantos registros existem em audit_logs
    console.log('🔍 Verificando audit_logs ANTES da limpeza...');
    const { data: before, error: beforeError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('empresa_id', empresaId);
      
    if (beforeError) {
      console.log('❌ Erro:', beforeError);
      return;
    }
    
    console.log(`📊 Registros encontrados: ${before?.length || 0}`);
    
    // 2. Tentar limpar manualmente
    console.log('🧹 Tentando limpar audit_logs...');
    const { error: cleanError } = await supabase
      .from('audit_logs')
      .delete()
      .eq('empresa_id', empresaId);
      
    if (cleanError) {
      console.log('❌ Erro na limpeza:', cleanError);
    } else {
      console.log('✅ Limpeza bem-sucedida');
    }
    
    // 3. Verificar novamente
    console.log('🔍 Verificando audit_logs APÓS limpeza...');
    const { data: after, error: afterError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('empresa_id', empresaId);
      
    if (afterError) {
      console.log('❌ Erro:', afterError);
    } else {
      console.log(`📊 Registros restantes: ${after?.length || 0}`);
    }
    
    // 4. Agora testar exclusão da empresa
    console.log('🗑️ Tentando excluir empresa...');
    const { error: deleteError } = await supabase
      .from('empresas')
      .delete()
      .eq('id', empresaId);
      
    if (deleteError) {
      console.log('❌ Erro na exclusão da empresa:', deleteError);
    } else {
      console.log('✅ Empresa excluída com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCleanup();