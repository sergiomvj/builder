const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSpecificCompany() {
  try {
    console.log('🧪 TESTE ESPECÍFICO - EMPRESA COM ERRO');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Empresa que está dando erro no frontend
    const empresaId = '5c76cc60-75d5-42ab-a86c-44c123f7d84a';
    
    console.log(`🔍 Analisando empresa ${empresaId}...`);
    
    // 1. Verificar se empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();
      
    if (empresaError) {
      console.log('❌ Erro ao buscar empresa:', empresaError);
      return;
    }
    
    if (!empresa) {
      console.log('❌ Empresa não encontrada');
      return;
    }
    
    console.log('✅ Empresa encontrada:');
    console.log('   - Nome:', empresa.nome);
    console.log('   - Status:', empresa.status);
    console.log('   - Criada:', empresa.created_at);
    
    // 2. Verificar personas
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresaId);
      
    if (personasError) {
      console.log('❌ Erro ao buscar personas:', personasError);
    } else {
      console.log(`✅ Personas encontradas: ${personas?.length || 0}`);
      if (personas && personas.length > 0) {
        personas.forEach(p => {
          console.log(`   - ${p.full_name} (${p.role})`);
        });
      }
    }
    
    // 3. Tentar fazer uma chamada real para a API
    console.log('\n🌐 TESTANDO CHAMADA REAL PARA API...');
    
    try {
      // Primeiro testar soft delete
      console.log('\n🟡 TESTANDO SOFT DELETE...');
      let response = await fetch(`http://localhost:3001/api/empresas/${empresaId}?type=soft`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Status soft delete:', response.status);
      let result = await response.json();
      console.log('Resultado soft:', result);
      
      // Restaurar para testar hard delete
      console.log('\n🔄 RESTAURANDO PARA TESTAR HARD DELETE...');
      const restoreResponse = await fetch(`http://localhost:3001/api/empresas/${empresaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'ativa' })
      });
      
      console.log('Status restore:', restoreResponse.status);
      
      // Agora testar hard delete
      console.log('\n🔴 TESTANDO HARD DELETE...');
      response = await fetch(`http://localhost:3001/api/empresas/${empresaId}?type=hard`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Status hard delete:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Erro na hard delete:', errorText);
      } else {
        result = await response.json();
        console.log('✅ Hard delete sucesso:', result);
      }
      
    } catch (fetchError) {
      console.log('❌ Erro na chamada fetch:', fetchError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testSpecificCompany();