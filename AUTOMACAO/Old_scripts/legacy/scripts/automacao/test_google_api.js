// TESTE ESPECÍFICO - GOOGLE NANO BANANA API
// Testando diretamente a API do Google AI Imagen

import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '../../.env.local' });

const googleAIKey = process.env.GOOGLE_AI_API_KEY_2;

console.log('🧪 TESTE DA API GOOGLE NANO BANANA');
console.log('===================================');

async function testGoogleNanoBananaAPI() {
  try {
    console.log(`🔑 API Key: ${googleAIKey ? googleAIKey.substring(0, 20) + '...' : 'NÃO ENCONTRADA'}`);
    
    if (!googleAIKey) {
      throw new Error('GOOGLE_AI_API_KEY_2 não encontrada');
    }
    
    // Teste 1: Verificar diferentes endpoints
    const endpoints = [
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage',
      'https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-001:generateImage',
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateImage',
      'https://ai.googleapis.com/v1/models/imagen-3.0-generate-001:generateImage'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testando endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${googleAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'A professional business person in an office',
            safetyFilterLevel: 'BLOCK_ONLY_HIGH',
            aspectRatio: 'ASPECT_RATIO_1_1',
            outputOptions: {
              outputFormat: 'JPEG'
            }
          })
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`   Erro: ${errorText.substring(0, 200)}...`);
        } else {
          console.log(`   ✅ SUCESSO! Este endpoint funciona`);
          const data = await response.json();
          console.log(`   Resposta: ${JSON.stringify(data).substring(0, 200)}...`);
          return endpoint;
        }
        
      } catch (error) {
        console.log(`   ❌ Erro na requisição: ${error.message}`);
      }
    }
    
    // Teste 2: Listar modelos disponíveis
    console.log(`\n📋 Listando modelos disponíveis...`);
    
    const listResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
      headers: {
        'Authorization': `Bearer ${googleAIKey}`
      }
    });
    
    if (listResponse.ok) {
      const models = await listResponse.json();
      console.log('📋 Modelos encontrados:');
      models.models?.forEach(model => {
        if (model.name.includes('imagen') || model.name.includes('vision')) {
          console.log(`   - ${model.name}`);
        }
      });
    } else {
      console.log(`❌ Não foi possível listar modelos: ${listResponse.status}`);
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    return null;
  }
}

// Teste 3: Verificar se a API key tem as permissões corretas
async function testAPIKeyPermissions() {
  try {
    console.log(`\n🔐 Testando permissões da API key...`);
    
    // Testar endpoint básico do Gemini
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Hello' }]
        }]
      })
    });
    
    console.log(`   Gemini API Status: ${response.status}`);
    
    if (response.ok) {
      console.log(`   ✅ API key válida para Gemini`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Problema com API key: ${errorText.substring(0, 100)}...`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de permissões:', error.message);
  }
}

async function runAllTests() {
  const workingEndpoint = await testGoogleNanoBananaAPI();
  await testAPIKeyPermissions();
  
  console.log('\n🏁 CONCLUSÃO');
  console.log('=============');
  
  if (workingEndpoint) {
    console.log(`✅ Endpoint funcional encontrado: ${workingEndpoint}`);
  } else {
    console.log(`❌ Nenhum endpoint de geração de imagem está funcionando`);
    console.log(`💡 Possíveis soluções:`);
    console.log(`   1. Verificar se a API key tem permissão para Imagen`);
    console.log(`   2. Testar com endpoint diferente`);
    console.log(`   3. Usar apenas DiceBear como solução`);
  }
}

runAllTests();