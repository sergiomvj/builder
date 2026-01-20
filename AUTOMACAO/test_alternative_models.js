import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '..', '.env.local') });

const key = process.env.HUGGINGFACE_API_KEY2;

async function testModel(modelId, description) {
  console.log(`\n🧪 Testando modelo: ${modelId} (${description})`);

  try {
    // Primeiro verificar se o modelo existe
    const modelCheck = await fetch(`https://huggingface.co/api/models/${modelId}`, {
      headers: { 'Authorization': `Bearer ${key}` }
    });

    if (!modelCheck.ok) {
      console.log(`❌ Modelo não encontrado ou inacessível: ${modelCheck.status}`);
      return false;
    }

    const modelData = await modelCheck.json();
    console.log(`✅ Modelo encontrado: ${modelData.id}`);
    console.log(`   Gated: ${modelData.gated}, Private: ${modelData.private}`);

    // Tentar inferência
    const inferenceResponse = await fetch(`https://router.huggingface.co/hf-inference/models/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: 'Professional headshot of a business executive, corporate portrait, high quality photography'
      })
    });

    console.log(`📡 Status da inferência: ${inferenceResponse.status} ${inferenceResponse.statusText}`);

    if (inferenceResponse.ok) {
      console.log(`🎉 SUCESSO! Modelo ${modelId} está funcionando!`);
      return true;
    } else {
      const errorText = await inferenceResponse.text();
      console.log(`❌ Erro na inferência: ${errorText.substring(0, 200)}...`);
      return false;
    }

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔍 Testando modelos alternativos do HuggingFace...\n');

  const modelsToTest = [
    // Modelos FLUX alternativos
    ['blackforestlabs/FLUX.1-dev', 'FLUX.1-dev (versão de desenvolvimento)'],
    ['ostris/Flex.1-alpha', 'Flex.1-alpha (alternativa ao FLUX)'],

    // Stable Diffusion XL
    ['stabilityai/stable-diffusion-xl-base-1.0', 'SDXL Base 1.0'],
    ['stabilityai/sdxl-turbo', 'SDXL Turbo (rápido)'],

    // Outros modelos de alta qualidade
    ['runwayml/stable-diffusion-v1-5', 'Stable Diffusion 1.5'],
    ['CompVis/stable-diffusion-v1-4', 'Stable Diffusion 1.4'],
    ['prompthero/openjourney', 'OpenJourney (Midjourney style)'],
    ['wavymulder/Analog-Diffusion', 'Analog Diffusion'],
  ];

  const workingModels = [];

  for (const [modelId, description] of modelsToTest) {
    const works = await testModel(modelId, description);
    if (works) {
      workingModels.push(modelId);
    }

    // Pequena pausa para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 RESUMO DOS TESTES:');
  console.log(`Modelos funcionais encontrados: ${workingModels.length}`);
  workingModels.forEach(model => console.log(`✅ ${model}`));

  if (workingModels.length > 0) {
    console.log(`\n💡 Recomendação: Use ${workingModels[0]} como alternativa ao FLUX.1-schnell`);
  } else {
    console.log('\n😞 Nenhum modelo alternativo funcionou. Considere usar apenas Pollinations.ai');
  }
}

main().catch(console.error);