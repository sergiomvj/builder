// TESTE NANO BANANA - MODELO CORRETO
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '../../.env.local' });

const googleAIKey = process.env.GOOGLE_AI_API_KEY_2;

console.log('🍌 TESTANDO NANO BANANA (MODELO CORRETO)');
console.log('========================================');

async function testNanoBanana() {
  if (!googleAIKey) {
    console.error('❌ GOOGLE_AI_API_KEY_2 não encontrada');
    return;
  }

  const modelsToTest = [
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-image-preview', 
    'gemini-3-pro-image-preview',
    'imagen-4.0-generate-preview-06-06'
  ];

  for (const model of modelsToTest) {
    try {
      console.log(`\n🧪 Testando: ${model}`);
      
      const prompt = 'Professional corporate headshot of a business executive, modern office background, high quality photography, professional lighting';
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleAIKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7
          }
        })
      });

      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCESSO!');
        console.log('📄 Resposta completa:', JSON.stringify(data, null, 2));
        
        // Procurar por URLs de imagem na resposta
        const responseText = JSON.stringify(data);
        if (responseText.includes('http') && (responseText.includes('image') || responseText.includes('.png') || responseText.includes('.jpg'))) {
          console.log('🖼️ Possível URL de imagem encontrada na resposta!');
        }
        
        return; // Parar no primeiro que funcionar
        
      } else {
        const errorText = await response.text();
        console.error(`❌ Erro:`, errorText.substring(0, 300));
      }

    } catch (error) {
      console.error('❌ Erro na requisição:', error.message);
    }
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testNanoBanana();