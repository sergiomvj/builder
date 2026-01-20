import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '..', '.env.local') });

const key = process.env.HUGGINGFACE_API_KEY2;

async function checkInferenceEndpoints() {
  console.log('🔍 Verificando Inference Endpoints dedicados...\n');

  try {
    const response = await fetch('https://api.endpoints.huggingface.cloud/user', {
      headers: { 'Authorization': `Bearer ${key}` }
    });

    console.log('Status da API:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Inference Endpoints encontrados:', data.endpoints?.length || 0);

      if (data.endpoints && data.endpoints.length > 0) {
        console.log('\n📋 Seus Endpoints:');
        data.endpoints.forEach((ep, i) => {
          console.log(`${i + 1}. ${ep.name || ep.model.repository}`);
          console.log(`   Status: ${ep.status}`);
          console.log(`   Modelo: ${ep.model.repository}`);
          console.log(`   URL: https://${ep.url}`);
          console.log(`   Tipo: ${ep.type}`);
          console.log('');
        });

        // Testar o primeiro endpoint disponível
        const availableEndpoint = data.endpoints.find(ep => ep.status === 'running');
        if (availableEndpoint) {
          console.log('🧪 Testando endpoint disponível...');
          await testEndpoint(availableEndpoint);
        }
      } else {
        console.log('❌ Nenhum Inference Endpoint encontrado.');
        console.log('💡 Para criar um: https://ui.endpoints.huggingface.co/');
        console.log('   Modelo recomendado: stabilityai/stable-diffusion-xl-base-1.0');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na API:', errorText);

      if (response.status === 401) {
        console.log('🔐 Problema de autenticação - verifique sua chave API');
      } else if (response.status === 403) {
        console.log('🚫 Acesso negado - você pode não ter o plano PRO');
      }
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
  }
}

async function testEndpoint(endpoint) {
  try {
    const testResponse = await fetch(`https://${endpoint.url}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'Professional headshot of a business executive',
        parameters: { num_inference_steps: 20 }
      })
    });

    console.log(`📡 Status do teste: ${testResponse.status} ${testResponse.statusText}`);

    if (testResponse.ok) {
      console.log('🎉 Endpoint funcionando perfeitamente!');
      console.log('💡 Este endpoint pode ser usado no script 05b');
    } else {
      console.log('❌ Endpoint com problemas:', await testResponse.text());
    }
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

checkInferenceEndpoints();