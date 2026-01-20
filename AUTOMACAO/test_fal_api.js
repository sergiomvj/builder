import * as fal from '@fal-ai/serverless-client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env.local') });

async function testFalApi() {
  console.log('🧪 TESTANDO API DO FAL.AI');
  console.log('========================');

  const falKey = process.env.FAL_KEY;
  console.log(`🔑 FAL_KEY configurada: ${falKey ? 'SIM' : 'NÃO'}`);

  if (!falKey) {
    console.error('❌ FAL_KEY não encontrada no ambiente');
    return;
  }

  // Configurar cliente Fal.ai
  try {
    fal.config({
      credentials: falKey
    });
    console.log('✅ Cliente Fal.ai configurado');
  } catch (error) {
    console.error('❌ Erro ao configurar cliente Fal.ai:', error.message);
    return;
  }

  // Tentar fazer uma requisição simples
  try {
    console.log('📡 Testando conexão com Fal.ai...');

    // Fazer uma requisição de teste simples
    const result = await fal.subscribe('fal-ai/flux-pro', {
      input: {
        prompt: 'A simple test image of a blue circle',
        image_size: 'square_hd',
        num_inference_steps: 1, // Mínimo para teste rápido
        guidance_scale: 1.0
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`📊 Status: ${update.status}`);
      }
    });

    console.log('✅ API do Fal.ai está funcionando!');
    console.log('📊 Resultado:', result);

  } catch (error) {
    console.error('❌ Erro na API do Fal.ai:', error.message);
    console.error('🔍 Detalhes do erro:', error);

    if (error.message.includes('Unauthorized')) {
      console.log('\n💡 POSSÍVEIS CAUSAS:');
      console.log('   - Chave da API expirada');
      console.log('   - Chave sem créditos suficientes');
      console.log('   - Chave inválida');
      console.log('   - Conta Fal.ai suspensa');
      console.log('\n🔧 SOLUÇÕES:');
      console.log('   - Verificar créditos em https://fal.ai');
      console.log('   - Gerar nova chave da API');
      console.log('   - Usar apenas Pollinations.ai (gratuito)');
    }
  }
}

testFalApi().catch(console.error);