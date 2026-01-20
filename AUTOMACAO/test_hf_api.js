// Teste rápido da API HuggingFace
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const key = process.env.HUGGINGFACE_API_KEY2 || process.env.HUGGINGFACE_API_KEY;
console.log('🔑 Testando chave API HuggingFace...');

if (!key) {
  console.error('❌ Nenhuma chave API encontrada');
  process.exit(1);
}

console.log('📡 Fazendo chamada de teste...');

try {
  const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: 'test prompt for image generation'
    })
  });

  console.log('📊 Status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ Erro da API:', errorText);
  } else {
    console.log('✅ API funcionando!');
  }
} catch (error) {
  console.error('💥 Erro de conexão:', error.message);
}