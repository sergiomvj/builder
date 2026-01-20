import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '..', '.env.local') });

const key = process.env.HUGGINGFACE_API_KEY2;
console.log('Testando chave API do HuggingFace...');
console.log('Chave presente:', !!key);

if (!key) {
  console.log('❌ Chave API não encontrada');
  process.exit(1);
}

try {
  console.log('Testando diferentes endpoints e modelos...');

  // Teste 1: Modelo com namespace completo
  console.log('Teste 1: blackforestlabs/FLUX.1-schnell');
  const response1 = await fetch('https://router.huggingface.co/hf-inference/models/blackforestlabs/FLUX.1-schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: 'test prompt for professional headshot'
    })
  });
  console.log('Status:', response1.status, response1.statusText);

  // Teste 2: Apenas FLUX.1-schnell
  console.log('Teste 2: FLUX.1-schnell');
  const response2 = await fetch('https://router.huggingface.co/hf-inference/models/FLUX.1-schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: 'test prompt for professional headshot'
    })
  });
  console.log('Status:', response2.status, response2.statusText);

  // Teste 3: Modelo dev
  console.log('Teste 3: blackforestlabs/FLUX.1-schnell (dev)');
  const response3 = await fetch('https://router.huggingface.co/hf-inference/models/blackforestlabs/FLUX.1-schnell-dev', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: 'test prompt for professional headshot'
    })
  });
  console.log('Status:', response3.status, response3.statusText);

} catch (error) {
  console.log('❌ Erro de conexão:', error.message);
}