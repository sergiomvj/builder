// TESTE GOOGLE AI - VERIFICAR MODELOS DISPONÍVEIS
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '../../.env.local' });

const googleAIKey = process.env.GOOGLE_AI_API_KEY_2;

console.log('🔍 VERIFICANDO MODELOS GOOGLE AI DISPONÍVEIS');
console.log('=============================================');

async function testGemini() {
  if (!googleAIKey) {
    console.error('❌ GOOGLE_AI_API_KEY_2 não encontrada');
    return;
  }

  try {
    console.log('\n🧪 Testando Gemini (text generation)...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${googleAIKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello, just testing if this API key works'
          }]
        }]
      })
    });

    console.log(`📡 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ GEMINI FUNCIONA! A API key está válida');
      
      if (data.candidates && data.candidates[0]) {
        console.log('📝 Resposta:', data.candidates[0].content.parts[0].text.substring(0, 100));
      }
    } else {
      const errorText = await response.text();
      console.error(`❌ Erro Gemini:`, errorText);
    }

  } catch (error) {
    console.error('❌ Erro na requisição Gemini:', error.message);
  }
}

async function listModels() {
  try {
    console.log('\n📋 Listando modelos disponíveis...');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${googleAIKey}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 Modelos encontrados:');
      
      data.models?.forEach(model => {
        console.log(`  • ${model.name} - ${model.displayName || 'N/A'}`);
        if (model.name.includes('image') || model.name.includes('imagen') || model.name.includes('vision')) {
          console.log(`    🖼️ ^^ MODELO DE IMAGEM!`);
        }
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Erro ao listar modelos:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro na listagem:', error.message);
  }
}

async function runTests() {
  await testGemini();
  await listModels();
}

runTests();