// Verificar modelos disponíveis no router HuggingFace
import fetch from 'node-fetch';

console.log('🔍 Verificando modelos disponíveis no router.huggingface.co...');

try {
  const response = await fetch('https://router.huggingface.co/hf-inference/models');
  const data = await response.json();

  console.log('📊 Status:', response.status);

  if (Array.isArray(data)) {
    const fluxModels = data.filter(model =>
      model.id && (model.id.includes('flux') || model.id.includes('FLUX'))
    );
    console.log('🎨 Modelos FLUX disponíveis:', fluxModels.map(m => m.id));
  } else {
    console.log('📋 Resposta:', JSON.stringify(data, null, 2));
  }
} catch (error) {
  console.error('❌ Erro:', error.message);
}