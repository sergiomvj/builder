// Teste da nova API de execução de scripts
const testAPI = async () => {
  try {
    console.log('🔄 Testando API execute-script...');
    
    const response = await fetch('http://localhost:3001/api/execute-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_id: '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
        script_name: 'generate_biografias'
      })
    });
    
    const result = await response.json();
    console.log('✅ Resposta da API:', result);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
};

// Execute apenas via browser console ou node
if (typeof window !== 'undefined') {
  // Running in browser
  testAPI();
} else {
  // Running in Node.js
  import('node-fetch').then(({ default: fetch }) => {
    global.fetch = fetch;
    testAPI();
  });
}