import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '..', '.env.local') });

const key = process.env.HUGGINGFACE_API_KEY2;
console.log('🔍 Verificando autenticação do HuggingFace...');
console.log('Chave presente:', !!key);

if (!key) {
  console.log('❌ Chave API não encontrada');
  process.exit(1);
}

try {
  console.log('Testando endpoint de autenticação...');
  const response = await fetch('https://huggingface.co/api/whoami-v2', {
    headers: { 'Authorization': `Bearer ${key}` }
  });

  console.log('Status da resposta:', response.status, response.statusText);

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Autenticação bem-sucedida!');
    console.log('Usuário:', data.name);
    console.log('Tipo:', data.type);
    console.log('ID:', data.id);

    // Verificar acesso ao modelo
    console.log('\n🔍 Verificando acesso ao modelo FLUX.1-schnell...');
    const modelResponse = await fetch('https://huggingface.co/api/models/blackforestlabs/FLUX.1-schnell', {
      headers: { 'Authorization': `Bearer ${key}` }
    });

    console.log('Status do modelo:', modelResponse.status);
    if (modelResponse.ok) {
      const modelData = await modelResponse.json();
      console.log('✅ Modelo acessível:', modelData.id);
      console.log('Tags:', modelData.tags?.join(', '));
      console.log('Gated:', modelData.gated);
      console.log('Private:', modelData.private);
    } else {
      console.log('❌ Erro ao acessar modelo:', await modelResponse.text());
    }

  } else {
    const errorText = await response.text();
    console.log('❌ Erro de autenticação:');
    console.log(errorText);
  }
} catch (error) {
  console.log('❌ Erro de conexão:', error.message);
}