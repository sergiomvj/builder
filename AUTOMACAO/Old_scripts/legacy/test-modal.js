const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testModalFunctionality() {
  try {
    console.log('🧪 TESTE DE FUNCIONALIDADE DO MODAL');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Verificar se existem empresas ativas para teste
    console.log('🔍 Verificando empresas ativas...');
    
    const { data: empresas, error } = await supabase
      .from('empresas')
      .select('id, nome, status')
      .eq('status', 'ativa')
      .limit(3);
      
    if (error) {
      console.log('❌ Erro ao buscar empresas:', error);
      return;
    }
    
    if (!empresas || empresas.length === 0) {
      console.log('❌ Nenhuma empresa ativa encontrada');
      return;
    }
    
    console.log(`✅ ${empresas.length} empresa(s) ativa(s) encontrada(s):`);
    empresas.forEach((emp, index) => {
      console.log(`   ${index + 1}. ${emp.nome} (${emp.id})`);
    });
    
    // 2. Testar se os endpoints da API estão funcionando
    console.log('\n🌐 Testando endpoints da API...');
    
    const testEmpresa = empresas[0];
    
    // Teste soft delete
    console.log('🟡 Testando soft delete...');
    const softResponse = await fetch(`http://localhost:3001/api/empresas/${testEmpresa.id}?type=soft`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    
    console.log('Status soft delete:', softResponse.status);
    
    if (softResponse.ok) {
      const result = await softResponse.json();
      console.log('✅ Soft delete funcionou:', result.message);
      
      // Restaurar
      console.log('🔄 Restaurando empresa...');
      const restoreResponse = await fetch(`http://localhost:3001/api/empresas/${testEmpresa.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ativa' })
      });
      
      if (restoreResponse.ok) {
        console.log('✅ Restauração funcionou');
      }
    }
    
    // 3. Verificar se há problemas de CORS ou outras issues
    console.log('\n🔧 Verificando possíveis problemas...');
    
    // Testar se o servidor está respondendo corretamente
    const healthResponse = await fetch('http://localhost:3001/api/health');
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Servidor saudável:', health);
    } else {
      console.log('❌ Problema no servidor');
    }
    
    console.log('\n📋 DIAGNÓSTICO CONCLUÍDO');
    console.log('Se o modal não aparece, pode ser:');
    console.log('1. Problema de hidratação do React');
    console.log('2. CSS/Tailwind não carregando');
    console.log('3. JavaScript sendo bloqueado');
    console.log('4. Estado do React não sincronizando');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testModalFunctionality();