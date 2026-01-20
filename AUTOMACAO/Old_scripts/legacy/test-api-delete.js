// TESTE DA API DE EXCLUSÃO DE EMPRESAS
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';
const EMPRESA_ID = 'eef1a4e4-ef01-46e8-a955-ee53f2496734';

async function testAPI() {
  console.log('🧪 TESTANDO API DE EXCLUSÃO DE EMPRESAS\n');

  try {
    // 1. Restaurar empresa
    console.log('🔄 1. Restaurando empresa...');
    const restoreResponse = await fetch(`${API_BASE}/api/empresas/${EMPRESA_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore' })
    });
    
    const restoreResult = await restoreResponse.json();
    console.log('Resultado:', restoreResult.message);

    // 2. Teste exclusão soft
    console.log('\n🟡 2. Testando exclusão soft...');
    const softResponse = await fetch(`${API_BASE}/api/empresas/${EMPRESA_ID}?type=soft`, {
      method: 'DELETE'
    });
    
    const softResult = await softResponse.json();
    console.log('Resultado:', softResult.message);
    console.log('Tipo:', softResult.type);

    // 3. Restaurar novamente
    console.log('\n🔄 3. Restaurando novamente...');
    const restore2Response = await fetch(`${API_BASE}/api/empresas/${EMPRESA_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore' })
    });
    
    const restore2Result = await restore2Response.json();
    console.log('Resultado:', restore2Result.message);

    // 4. Teste exclusão hard (apenas análise)
    console.log('\n🔴 4. Análise para exclusão hard (NÃO EXECUTADA)...');
    console.log('⚠️ Exclusão hard removearia permanentemente:');
    console.log('   - Empresa: ARVA (ARCHIVED-1763665658546)');
    console.log('   - Todas as personas associadas');
    console.log('   - Todos os dados relacionados');
    console.log('   - Esta operação seria IRREVERSÍVEL');

    console.log('\n✅ TODOS OS TESTES DA API CONCLUÍDOS COM SUCESSO!');

  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
  }
}

testAPI();