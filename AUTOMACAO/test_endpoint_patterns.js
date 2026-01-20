import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '..', '.env.local') });

const key = process.env.HUGGINGFACE_API_KEY2;

// Simular a função findMatchingEndpoint para teste
function findMatchingEndpoint(endpoints, pattern) {
  if (!pattern || !endpoints) return null;

  // Se não tem wildcard, procurar por nome exato
  if (!pattern.includes('*')) {
    return endpoints.find(ep =>
      ep.name === pattern &&
      ep.status === 'running' &&
      ep.model?.repository === 'stabilityai/stable-diffusion-xl-base-1.0'
    );
  }

  // Se tem wildcard, converter para regex
  // * no início: ^.*padrão
  // * no fim: padrão.*$
  // * no meio: dividir e juntar
  let regexPattern;
  if (pattern.startsWith('*') && pattern.endsWith('*')) {
    // *padrão* -> contém
    const middle = pattern.slice(1, -1);
    regexPattern = `.*${middle}.*`;
  } else if (pattern.startsWith('*')) {
    // *padrão -> termina com
    const end = pattern.slice(1);
    regexPattern = `.*${end}$`;
  } else if (pattern.endsWith('*')) {
    // padrão* -> começa com
    const start = pattern.slice(0, -1);
    regexPattern = `^${start}.*`;
  } else {
    // wildcard no meio, dividir por *
    const parts = pattern.split('*');
    regexPattern = `^${parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`;
  }

  const regex = new RegExp(regexPattern, 'i');

  return endpoints.find(ep =>
    regex.test(ep.name) &&
    ep.status === 'running' &&
    ep.model?.repository === 'stabilityai/stable-diffusion-xl-base-1.0'
  );
}

async function testPatterns() {
  console.log('🧪 Testando padrões de endpoint...\n');

  try {
    // Buscar endpoints reais
    const response = await fetch('https://api.endpoints.huggingface.cloud/user', {
      headers: { 'Authorization': `Bearer ${key}` }
    });

    if (!response.ok) {
      console.log('❌ Não foi possível buscar endpoints reais. Usando dados de teste...\n');

      // Dados de teste
      const mockEndpoints = [
        { name: 'vc-sdxl-prod', status: 'running', model: { repository: 'stabilityai/stable-diffusion-xl-base-1.0' }, url: 'vc-sdxl-prod.aws.endpoints.huggingface.cloud' },
        { name: 'vc-sdxl-dev', status: 'running', model: { repository: 'stabilityai/stable-diffusion-xl-base-1.0' }, url: 'vc-sdxl-dev.aws.endpoints.huggingface.cloud' },
        { name: 'my-sdxl-endpoint', status: 'running', model: { repository: 'stabilityai/stable-diffusion-xl-base-1.0' }, url: 'my-sdxl-endpoint.aws.endpoints.huggingface.cloud' },
        { name: 'other-endpoint', status: 'running', model: { repository: 'runwayml/stable-diffusion-v1-5' }, url: 'other-endpoint.aws.endpoints.huggingface.cloud' },
        { name: 'vc-sdxl-stopped', status: 'stopped', model: { repository: 'stabilityai/stable-diffusion-xl-base-1.0' }, url: 'vc-sdxl-stopped.aws.endpoints.huggingface.cloud' }
      ];

      const testPatterns = [
        'vc-sdxl-*',
        'vc-sdxl-prod',
        'my-sdxl-endpoint',
        '*sdxl*',
        'nonexistent-*',
        'vc-sdxl-stopped'
      ];

      console.log('📋 Testando padrões com dados mock:\n');

      for (const pattern of testPatterns) {
        const result = findMatchingEndpoint(mockEndpoints, pattern);
        if (result) {
          console.log(`✅ "${pattern}" → Encontrado: ${result.name} (${result.status})`);
        } else {
          console.log(`❌ "${pattern}" → Nenhum endpoint encontrado`);
        }
      }

      return;
    }

    const data = await response.json();
    const endpoints = data.endpoints || [];

    console.log(`📋 Encontrados ${endpoints.length} endpoints reais:\n`);

    // Mostrar endpoints disponíveis
    endpoints.forEach(ep => {
      console.log(`- ${ep.name} (${ep.status}) - ${ep.model?.repository}`);
    });

    // Testar padrões comuns
    const testPatterns = [
      'vc-sdxl-*',
      'sdxl-*',
      '*sdxl*',
      '*-prod',
      '*-dev'
    ];

    console.log('\n🧪 Testando padrões:\n');

    for (const pattern of testPatterns) {
      const result = findMatchingEndpoint(endpoints, pattern);
      if (result) {
        console.log(`✅ "${pattern}" → Encontrado: ${result.name} (${result.status})`);
      } else {
        console.log(`❌ "${pattern}" → Nenhum endpoint encontrado`);
      }
    }

  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testPatterns();