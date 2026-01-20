// TESTE DIRETO COM NOVA API KEY
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '../../.env.local' });

const googleAIKey = process.env.GOOGLE_AI_API_KEY_2;

console.log('🔑 TESTANDO NOVA API KEY');
console.log('========================');
console.log(`API Key: ${googleAIKey ? googleAIKey.substring(0, 20) + '...' : 'NÃO ENCONTRADA'}`);

async function testNewKey() {
  try {
    // Primeiro testar se a key funciona com Gemini normal
    console.log('\n🧪 Teste 1: Gemini texto simples...');
    
    const response1 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${googleAIKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Say hello in one word'
          }]
        }]
      })
    });

    console.log(`Status: ${response1.status} ${response1.statusText}`);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ API KEY FUNCIONA! Resposta:', data1.candidates[0].content.parts[0].text);
    } else {
      const error1 = await response1.text();
      console.error('❌ Erro Gemini:', error1);
      return;
    }

    // Agora testar geração de imagem
    console.log('\n🍌 Teste 2: Nano Banana geração de imagem...');
    
    const response2 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${googleAIKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Generate a professional corporate headshot of a business executive with office background'
          }]
        }]
      })
    });

    console.log(`Status: ${response2.status} ${response2.statusText}`);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('🎉 NANO BANANA FUNCIONOU!');
      console.log('Resposta completa:', JSON.stringify(data2, null, 2));
    } else {
      const error2 = await response2.text();
      console.error('❌ Erro Nano Banana:', error2.substring(0, 500));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testNewKey();