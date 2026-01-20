// TESTE GOOGLE AI IMAGEN API
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '../../.env.local' });

const googleAIKey = process.env.GOOGLE_AI_API_KEY_2;

console.log('🧪 TESTANDO GOOGLE AI IMAGEN API');
console.log('================================');
console.log(`🔑 API Key: ${googleAIKey ? googleAIKey.substring(0, 20) + '...' : 'NÃO ENCONTRADA'}`);

async function testGoogleAI() {
  if (!googleAIKey) {
    console.error('❌ GOOGLE_AI_API_KEY_2 não encontrada');
    return;
  }

  const endpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage',
    'https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-001:generateImage',
    'https://generativelanguage.googleapis.com/v1beta/models/imagegeneration-005:generateImage',
    'https://ai.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage'
  ];

  try {
    const prompt = 'Professional corporate headshot of a business executive';
    
    for (const endpoint of endpoints) {
      console.log(`\n🧪 Testando endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          safetyFilterLevel: 'BLOCK_ONLY_HIGH',
          aspectRatio: 'ASPECT_RATIO_1_1',
          outputOptions: {
            outputFormat: 'JPEG'
          }
        })
      });

      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        const data = await response.json();
        console.log('✅ SUCESSO! Endpoint funcionando:', endpoint);
        console.log('📄 Resposta:', JSON.stringify(data, null, 2));
        return;
      } else if (response.status !== 404) {
        const errorText = await response.text();
        console.log(`⚠️ Erro ${response.status}:`, errorText.substring(0, 200));
      } else {
        console.log('❌ 404 - Endpoint não encontrado');
      }
      
      // Pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n❌ Nenhum endpoint funcionou');

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testGoogleAI();