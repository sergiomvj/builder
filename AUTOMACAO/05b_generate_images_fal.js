// ============================================================================
// SCRIPT 05b - GERAÇÃO DE IMAGENS VIA POLLINATIONS.AI (100% FREE)
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 05a (prompts criados)
// 
// O QUE FAZ:
// - Busca prompts prontos da tabela personas_avatares
// - Chama Pollinations.ai API (Stable Diffusion XL)
// - Gera imagens fotorrealistas de alta qualidade
// - Baixa e salva imagens localmente em temp_avatars/
// 
// PRÓXIMO PASSO: Executar Script 05c para organizar imagens
// 
// CUSTO: 100% GRATUITO (sem rate limits)
// API: https://pollinations.ai/
// MODELO: SDXL Lightning (rápido e de alta qualidade)
// ============================================================================

import { HfInference } from '@huggingface/inference';
import { createClient } from '@supabase/supabase-js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules __dirname polyfill
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Configurar encoding do console
setupConsoleEncoding();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configurar encoding do console
setupConsoleEncoding();

const HUGGINGFACE_TOKEN = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_TOKEN;

if (!HUGGINGFACE_TOKEN) {
  console.error('❌ ERRO: HUGGINGFACE_API_KEY não configurado no .env.local');
  console.log('\n📝 Para obter token gratuito:');
  console.log('   1. Acesse: https://huggingface.co/settings/tokens');
  console.log('   2. Crie um token (Read) com permissões de Inference Providers');
  console.log('   3. Adicione ao .env.local: HUGGINGFACE_API_KEY=hf_...');
  process.exit(1);
}

// Inicializar cliente HuggingFace
const hf = new HfInference(HUGGINGFACE_TOKEN);

const PROGRESS_FILE = path.join(__dirname, 'script-progress.json');

// Modelos disponíveis (em ordem de prioridade)
const MODELS = [
  {
    id: 'black-forest-labs/FLUX.1-dev',
    name: 'FLUX.1-dev',
    description: 'Modelo avançado de geração de imagens, alta qualidade'
  },
  {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'SDXL Base 1.0',
    description: 'Modelo oficial Stability AI, equilibrado e confiável'
  },
  {
    id: 'SG161222/RealVisXL_V4.0',
    name: 'RealVisXL v4.0',
    description: 'Fotorrealismo extremo, melhor para rostos corporativos'
  },
  {
    id: 'RunDiffusion/Juggernaut-XL-v9',
    name: 'Juggernaut XL v9',
    description: 'Otimizado para retratos profissionais'
  }
];

const SELECTED_MODEL = MODELS[0]; // SDXL Base 1.0 (oficial e estável)

console.log('🎨 SCRIPT 05b - GERAÇÃO DE IMAGENS VIA HUGGINGFACE (SDXL)');
console.log('=========================================================');
console.log(`🚀 Serviço: HuggingFace Inference API (FREE)`);
console.log(`🤖 Modelo: ${SELECTED_MODEL.name}`);
console.log(`📝 Descrição: ${SELECTED_MODEL.description}`);
console.log('💰 Custo: $0.00 (100% GRATUITO)');
console.log('⏱️  Tempo: ~15-25s por imagem');
console.log('⚠️  Rate Limit: ~100 requisições/hora');
console.log('=========================================================\n');

function updateProgress(status, current, total, currentPersona = '', errors = []) {
  const progress = {
    script: '05b_generate_images_huggingface',
    status,
    current,
    total,
    currentPersona,
    errors,
    startedAt: status === 'running' && current === 0 ? new Date().toISOString() : null,
    completedAt: status === 'completed' ? new Date().toISOString() : null
  };
  
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (err) {
    console.error('⚠️  Erro ao atualizar progresso:', err.message);
  }
}

/**
 * Gera imagem via HuggingFace usando SDXL
 */
async function gerarImagemHuggingFace(persona, avatarRecord, modelConfig = SELECTED_MODEL) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`  🔄 Tentativa ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Espera 5s entre retries
      }

      console.log(`  🎨 Gerando imagem via HuggingFace (${modelConfig.name})...`);

      const prompt = avatarRecord.prompt_usado;
      
      if (!prompt) {
        throw new Error('Prompt não encontrado no avatar record');
      }

      // Extrair detalhes biométricos para melhorar qualidade
      const biometrics = avatarRecord.biometrics || {};
      const metadados = avatarRecord.metadados || {};
      
      // Criar seed ÚNICO baseado no ID da persona para garantir diversidade
      const personaSeed = parseInt(persona.id.replace(/[^0-9]/g, '').substring(0, 9)) || Math.floor(Math.random() * 2147483647);
      
      // Prompt negativo forte para evitar problemas comuns
      const negativePrompt = [
        'blurry', 'low quality', 'distorted', 'deformed', 'ugly', 'bad anatomy',
        'duplicate faces', 'clone', 'multiple people', 'watermark', 'text',
        'cartoon', 'anime', 'illustration', 'painting', 'drawing',
        'poorly drawn', 'extra limbs', 'disfigured', 'gross proportions',
        'malformed limbs', 'missing arms', 'missing legs', 'extra arms', 'extra legs',
        'mutated hands', 'fused fingers', 'too many fingers', 'long neck'
      ].join(', ');

      // Adicionar detalhes únicos ao prompt para garantir variação REAL
      const uniqueIdentifiers = [
        biometrics.skin_tone ? `${biometrics.skin_tone} skin tone` : '',
        biometrics.face_shape ? `${biometrics.face_shape} face structure` : '',
        biometrics.eye_color ? `${biometrics.eye_color} eyes` : '',
        biometrics.hair_style ? `${biometrics.hair_style} hairstyle` : '',
        biometrics.distinctive_features ? biometrics.distinctive_features : '',
        metadados.idade ? `${metadados.idade} years old` : '',
        metadados.genero === 'feminino' ? 'woman' : 'man'
      ].filter(Boolean).join(', ');

      // Prompt final otimizado para SDXL
      const finalPrompt = `${prompt}, ${uniqueIdentifiers}, professional corporate headshot, studio lighting, high resolution, 8k uhd, photorealistic, detailed facial features, sharp focus, canon eos r5`;

      console.log(`  📝 Prompt: ${finalPrompt.substring(0, 120)}...`);
      console.log(`  🎲 Seed único: ${personaSeed}`);

      const imageBlob = await hf.textToImage({
        model: modelConfig.id,
        inputs: finalPrompt,
        parameters: {
          negative_prompt: negativePrompt,
          num_inference_steps: 25, // Reduzido para velocidade
          guidance_scale: 7.5,
          width: 1024,
          height: 1024,
          seed: personaSeed
        }
      });

      // Converter blob para buffer
      const imageBuffer = Buffer.from(await imageBlob.arrayBuffer());

      console.log(`  ✅ Imagem gerada com sucesso (${(imageBuffer.length / 1024).toFixed(2)} KB)`);

      // Salvar em arquivo temporário local (será usado pelo Script 05c)
      const tempDir = path.join(__dirname, 'temp_avatars');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const tempFilename = `${persona.id}_temp.jpg`;
      const tempFilePath = path.join(tempDir, tempFilename);
      fs.writeFileSync(tempFilePath, imageBuffer);

      console.log(`  💾 Salvo temporariamente: ${tempFilePath}`);

      // Atualizar banco com caminho temporário e metadados
      const { error: updateError } = await supabase
        .from('personas_avatares')
        .update({
          avatar_url: tempFilePath, // Caminho local temporário (Script 05c fará upload permanente)
          avatar_thumbnail_url: null, // Thumbnail será gerado pelo 05c
          servico_usado: `huggingface_${modelConfig.id.split('/')[1]}`,
          ativo: true,
          metadados: {
            ...avatarRecord.metadados,
            huggingface_generation: {
              model: modelConfig.id,
              model_name: modelConfig.name,
              seed_used: personaSeed,
              generated_at: new Date().toISOString(),
              image_size: '1024x1024',
              inference_steps: 25,
              guidance_scale: 7.5,
              temp_file: tempFilePath,
              file_size_kb: (imageBuffer.length / 1024).toFixed(2)
            }
          }
        })
        .eq('persona_id', persona.id);

      if (updateError) {
        throw new Error(`Erro ao atualizar banco: ${updateError.message}`);
      }

      console.log(`  ✅ Avatar salvo com sucesso!\n`);
      return { success: true, imageUrl: tempFilePath };

    } catch (error) {
      lastError = error;
      console.error(`  ❌ Erro na tentativa ${attempt}:`, error.message);
      
      // Se não for erro de retry (rate limit ou loading), não tenta novamente
      if (!error.message.includes('retry')) {
        break;
      }
    }
  }

  throw lastError || new Error('Falha ao gerar imagem após múltiplas tentativas');
}


async function gerarImagensAvatares() {
  try {
    const args = process.argv.slice(2);
    let empresaId = null;
    let retryFailed = false;
    let forceRegenerate = false;
    
    for (const arg of args) {
      if (arg.startsWith('--empresaId=')) {
        empresaId = arg.split('=')[1];
      } else if (arg === '--retry-failed') {
        retryFailed = true;
      } else if (arg === '--force') {
        forceRegenerate = true;
      }
    }
    
    if (!empresaId) {
      console.error('❌ --empresaId não fornecido');
      console.log('💡 Uso: node 05b_generate_images_fal.js --empresaId=ID [--retry-failed] [--force]');
      console.log('\n📝 Opções:');
      console.log('   --retry-failed: Tenta apenas personas que falharam anteriormente');
      console.log('   --force: Regenera TODAS as imagens (ignora existentes)');
      process.exit(1);
    }

    // 1. Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError) throw new Error(`Empresa não encontrada: ${empresaError.message}`);

    console.log(`🏢 Empresa: ${empresa.nome}`);
    console.log(`🤖 Modelo: ${SELECTED_MODEL.name} (${SELECTED_MODEL.description})`);
    console.log(`💰 Custo total: $0.00 (100% GRATUITO)\n`);

    // 2. Buscar personas
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      return;
    }

    // 3. Buscar avatares que precisam de imagens
    const { data: avatares, error: avataresError } = await supabase
      .from('personas_avatares')
      .select('*')
      .in('persona_id', personas.map(p => p.id));

    if (avataresError) throw new Error(`Erro ao buscar avatares: ${avataresError.message}`);

    if (!avatares || avatares.length === 0) {
      console.log('⚠️  Nenhum prompt encontrado!');
      console.log('💡 Execute primeiro: node 05a_generate_avatar_prompts.js --empresaId=' + empresaId);
      return;
    }

    // Filtrar avatares que precisam de imagens
    let avataresPendentes;
    if (forceRegenerate) {
      avataresPendentes = avatares; // Regenerar todas
      console.log('🔄 Modo FORCE: Regenerando todas as imagens...\n');
    } else if (retryFailed) {
      avataresPendentes = avatares.filter(a => !a.avatar_url || a.avatar_url.includes('temp_'));
    } else {
      avataresPendentes = avatares.filter(a => !a.avatar_url);
    }

    if (avataresPendentes.length === 0 && !forceRegenerate) {
      console.log('✅ Todas as personas já têm imagens geradas!');
      console.log('💡 Use --retry-failed para regenerar falhas');
      console.log('💡 Use --force para regenerar todas\n');
      return;
    }

    console.log(`🎨 Gerando imagens para ${avataresPendentes.length} personas...\n`);
    console.log(`💰 CUSTO TOTAL: $0.00 (100% GRATUITO via HuggingFace)\n`);
    console.log(`⚠️  Rate Limit: ~100 imagens/hora (1-2 minutos de pausa se atingir)\n`);

    updateProgress('running', 0, avataresPendentes.length);

    let sucessos = 0;
    let erros = 0;
    const errorList = [];

    for (let i = 0; i < avataresPendentes.length; i++) {
      const avatarRecord = avataresPendentes[i];
      const persona = personas.find(p => p.id === avatarRecord.persona_id);

      if (!persona) {
        console.error(`⚠️  Persona não encontrada para avatar ${avatarRecord.persona_id}`);
        continue;
      }
      
      console.log(`\n[${i + 1}/${avataresPendentes.length}] ${persona.full_name} (${persona.role})`);
      updateProgress('running', i, avataresPendentes.length, persona.full_name, errorList);

      try {
        await gerarImagemHuggingFace(persona, avatarRecord, SELECTED_MODEL);
        sucessos++;
      } catch (error) {
        erros++;
        errorList.push({
          persona: persona.full_name,
          error: error.message
        });
        console.error(`  ❌ Erro: ${error.message}`);
      }

      // Delay entre requisições (respeitar rate limits e evitar sobrecarga)
      if (i < avataresPendentes.length - 1) {
        const delaySeconds = 3; // 3 segundos entre imagens
        console.log(`  ⏳ Aguardando ${delaySeconds}s para próxima imagem...`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }
    }

    updateProgress('completed', avataresPendentes.length, avataresPendentes.length, '', errorList);

    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`✅ Imagens geradas com sucesso: ${sucessos}`);
    console.log(`❌ Falhas: ${erros}`);
    console.log(`💰 Custo total: $0.00 (FREE)`);
    console.log(`💾 Imagens salvas em: AUTOMACAO/temp_avatars/`);
    console.log(`🗄️  Metadados salvos em: personas_avatares`);
    
    if (errorList.length > 0) {
      console.log('\n⚠️  ERROS ENCONTRADOS:');
      errorList.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.persona}: ${err.error}`);
      });
    }
    
    console.log('\n🎯 PRÓXIMO PASSO:');
    console.log(`   node 05c_download_avatares.js --empresaId=${empresaId}`);
    console.log('   (Este script organizará as imagens no diretório public/avatars/)\n');
    console.log('🎉 SCRIPT 05b CONCLUÍDO!');

  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error.message);
    console.error(error.stack);
    updateProgress('error', 0, 0, '', [{ error: error.message }]);
    process.exit(1);
  }
}

gerarImagensAvatares();
