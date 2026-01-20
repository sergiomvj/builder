// ============================================================================
// SCRIPT 05b - GERAÇÃO DE IMAGENS VIA HUGGINGFACE SDXL + INFERENCE ENDPOINTS
// ============================================================================
// API: HuggingFace Inference API + Dedicated Endpoints + Pattern Matching
// Modelo: Stable Diffusion XL Base 1.0 (Stability AI)
// Custo: $9/mês PRO + $0.001/imagem (endpoint dedicado opcional)
// Qualidade: ⭐⭐⭐⭐⭐ Excelente qualidade profissional
// Fallback: Pollinations.ai (FREE) se HF falhar
//
// SUPORTE A PADRÕES:
// Configure HUGGINGFACE_SDXL_PATTERN=vc-sdxl-* para auto-detecção
// Configure HUGGINGFACE_SDXL_ENDPOINT=url para endpoint específico
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
setupConsoleEncoding();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY2 || process.env.HUGGINGFACE_API_KEY;
const PROGRESS_FILE = path.join(__dirname, 'script-progress.json');

// URLs de Inference Endpoints (configure no HuggingFace se tiver PRO)
const INFERENCE_ENDPOINTS = {
  sdxl: process.env.HUGGINGFACE_SDXL_ENDPOINT || null, // URL específica ou padrão com wildcard
  sdxl_pattern: process.env.HUGGINGFACE_SDXL_PATTERN || null, // Ex: "vc-sdxl-*" ou "my-sdxl-endpoint"
};

// Cache para endpoints encontrados (evita múltiplas chamadas API)
let endpointCache = null;
let endpointCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para encontrar endpoint disponível baseado no padrão
async function findAvailableEndpoint(pattern) {
  try {
    // Verificar cache
    const now = Date.now();
    if (endpointCache && (now - endpointCacheTime) < CACHE_DURATION) {
      const matching = findMatchingEndpoint(endpointCache, pattern);
      if (matching) return matching;
    }

    console.log(`  🔍 Procurando endpoint com padrão: ${pattern}`);

    // Buscar endpoints do usuário
    const response = await fetch('https://api.endpoints.huggingface.cloud/user', {
      headers: { 'Authorization': `Bearer ${HUGGINGFACE_API_KEY}` }
    });

    if (!response.ok) {
      console.log(`  ⚠️  Não foi possível buscar endpoints (status: ${response.status})`);
      return null;
    }

    const data = await response.json();
    endpointCache = data.endpoints || [];
    endpointCacheTime = now;

    console.log(`  📋 Encontrados ${endpointCache.length} endpoints no total`);

    // Encontrar endpoint que corresponda ao padrão e esteja running
    const matching = findMatchingEndpoint(endpointCache, pattern);

    if (matching) {
      console.log(`  ✅ Endpoint encontrado: ${matching.name} (${matching.status})`);
      return matching;
    } else {
      console.log(`  ❌ Nenhum endpoint encontrado com padrão: ${pattern}`);
      return null;
    }

  } catch (error) {
    console.log(`  ❌ Erro ao buscar endpoints: ${error.message}`);
    return null;
  }
}

// Função auxiliar para encontrar endpoint que corresponda ao padrão
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

console.log('🎨 SCRIPT 05b - GERAÇÃO DE IMAGENS VIA POLLINATIONS.AI');
console.log('===========================================================');
console.log('🚀 Serviço: Pollinations.ai SDXL');
console.log('🔄 Fallback: HuggingFace SDXL (se disponível)');
console.log('💰 Custo: 100% FREE (ilimitado)');
console.log('⏱️  Tempo: ~5-15s por imagem');
console.log('⭐ Qualidade: Excelente diversidade e qualidade');
console.log('===========================================================\n');

function updateProgress(status, current, total, currentPersona = '', errors = []) {
  const progress = {
    script: '05b_generate_images_pollinations',
    status,
    current,
    total,
    currentPersona,
    errors,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function gerarImagemHuggingFace(persona, avatarRecord) {
  const maxRetries = 3;
  let lastError = null;

  if (!HUGGINGFACE_API_KEY) {
    console.log('  ⚠️  HUGGINGFACE_API_KEY não configurada, usando fallback Pollinations');
    return gerarImagemPollinations(persona, avatarRecord);
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Estratégia de endpoint: 1) URL específica, 2) Padrão, 3) Router genérico
      let endpointUrl = null;
      let endpointType = 'router';

      if (attempt === 1) {
        // Primeira tentativa: endpoint específico
        if (INFERENCE_ENDPOINTS.sdxl) {
          endpointUrl = INFERENCE_ENDPOINTS.sdxl;
          endpointType = 'specific_endpoint';
        }
        // Segunda tentativa: padrão
        else if (INFERENCE_ENDPOINTS.sdxl_pattern) {
          const foundEndpoint = await findAvailableEndpoint(INFERENCE_ENDPOINTS.sdxl_pattern);
          if (foundEndpoint) {
            endpointUrl = `https://${foundEndpoint.url}`;
            endpointType = 'pattern_endpoint';
          }
        }
      }

      // Fallback para router se não encontrou endpoint dedicado
      if (!endpointUrl) {
        endpointUrl = 'https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-xl-base-1.0';
        endpointType = 'router';
      }

      console.log(`  🤖 Gerando imagem via HuggingFace (${endpointType})... (tentativa ${attempt}/${maxRetries})`);

      let basePrompt = avatarRecord.prompt_usado;
      if (!basePrompt) {
        throw new Error('Prompt não encontrado');
      }

      // Seed único baseado no ID da persona
      const personaSeed = parseInt(persona.id.replace(/[^0-9]/g, '').substring(0, 9));

      // Construir prompt otimizado para Stable Diffusion XL
      const sdxlPrompt = `Professional corporate headshot portrait, high quality photography: ${basePrompt}. Studio lighting, Canon EOS R5 85mm f/1.4, sharp focus, photorealistic, 8K quality, unique individual person, highly detailed face`;

      console.log(`  🎲 Seed: ${personaSeed}`);
      console.log(`  🔗 Endpoint: ${endpointUrl}`);

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      try {
        const response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: sdxlPrompt,
            parameters: {
              seed: personaSeed,
              num_inference_steps: 20,
              guidance_scale: 7.5
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HuggingFace API error ${response.status}: ${errorText}`);
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());

        if (imageBuffer.length === 0) {
          throw new Error('Imagem vazia retornada');
        }

        console.log(`  ✅ Imagem gerada com sucesso (${(imageBuffer.length / 1024).toFixed(2)} KB) via ${endpointType}`);

        // Salvar em arquivo temporário local
        const tempDir = path.join(__dirname, 'temp_avatars');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFilename = `${persona.id}_temp.jpg`;
        const tempFilePath = path.join(tempDir, tempFilename);
        fs.writeFileSync(tempFilePath, imageBuffer);

        console.log(`  💾 Salvo temporariamente: ${tempFilePath}`);

        // Atualizar banco
        const { error: updateError } = await supabase
          .from('personas_avatares')
          .update({
            avatar_url: tempFilePath,
            avatar_thumbnail_url: null,
            servico_usado: `huggingface_sdxl_${endpointType.replace('_', '')}`,
            ativo: true,
            metadatos: {
              ...avatarRecord.metadados,
              sdxl_generation: {
                model: 'stabilityai/stable-diffusion-xl-base-1.0',
                endpoint_type: endpointType,
                endpoint_url: endpointUrl,
                seed_used: personaSeed,
                generated_at: new Date().toISOString(),
                image_size: '1024x1024',
                temp_file: tempFilePath,
                file_size_kb: (imageBuffer.length / 1024).toFixed(2),
                inference_steps: 20,
                guidance_scale: 7.5,
                note: `Stable Diffusion XL via ${endpointType}`
              }
            }
          })
          .eq('persona_id', persona.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar banco: ${updateError.message}`);
        }

        console.log(`  ✅ Avatar SDXL salvo com sucesso!\n`);
        return { success: true, imageUrl: tempFilePath, service: `huggingface_sdxl_${endpointType.replace('_', '')}` };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error) {
      lastError = error;
      const errorMsg = error.name === 'AbortError' ? 'Timeout (60s)' : error.message;
      console.error(`  ❌ HuggingFace falhou (tentativa ${attempt}): ${errorMsg}`);

      if (attempt < maxRetries) {
        const waitTime = 3000 * Math.pow(2, attempt - 1);
        console.log(`  🔄 Aguardando ${waitTime / 1000}s antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.log(`  ⚠️  HuggingFace falhou após ${maxRetries} tentativas, usando fallback Pollinations`);
  return gerarImagemPollinations(persona, avatarRecord);
}async function gerarImagemPollinations(persona, avatarRecord) {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`  🎨 Gerando imagem via Pollinations.ai (FALLBACK)... (tentativa ${attempt}/${maxRetries})`);
      
      let basePrompt = avatarRecord.prompt_usado;
      if (!basePrompt) {
        throw new Error('Prompt não encontrado');
      }

      // Seed único baseado no ID da persona + timestamp para MÁXIMA aleatoriedade
      const personaSeed = parseInt(persona.id.replace(/[^0-9]/g, '').substring(0, 9)) + Date.now() % 10000;
      
      // DIVERSIDADE EXTREMA: Características físicas aleatórias mas consistentes por persona
      const seedVariation = personaSeed % 100;
      
      // Tom de pele (20 variações)
      const skinTones = [
        'fair porcelain', 'light beige', 'warm ivory', 'golden beige', 'tan olive',
        'medium bronze', 'caramel', 'deep brown', 'rich mahogany', 'dark ebony',
        'rosy fair', 'peachy light', 'honey tan', 'copper brown', 'chocolate',
        'amber golden', 'sienna', 'mocha', 'espresso', 'deep russet'
      ];
      
      // Formato de rosto (12 variações)
      const faceShapes = [
        'oval', 'round', 'square', 'heart-shaped', 'diamond', 'triangular',
        'oblong', 'rectangular', 'pear-shaped', 'round-oval', 'square-jaw', 'soft-round'
      ];
      
      // Cor e estilo de olhos (15 variações)
      const eyeStyles = [
        'deep brown almond eyes', 'bright blue round eyes', 'green hooded eyes',
        'hazel wide-set eyes', 'dark brown close-set eyes', 'amber upturned eyes',
        'gray blue eyes', 'honey brown eyes', 'black intense eyes',
        'light brown expressive eyes', 'blue-green eyes', 'dark hazel eyes',
        'warm brown eyes', 'steel blue eyes', 'olive green eyes'
      ];
      
      // Cabelo (20 variações)
      const hairStyles = [
        'short cropped dark hair', 'medium wavy brown hair', 'long straight black hair',
        'curly shoulder-length hair', 'sleek bob cut', 'buzz cut', 'fade haircut',
        'swept back hair', 'side-parted hair', 'textured short hair',
        'layered medium hair', 'straight long hair', 'natural curly hair',
        'slicked back hair', 'messy styled hair', 'neat professional cut',
        'wavy medium hair', 'straight shoulder-length', 'short professional style',
        'tapered sides hair'
      ];
      
      // Traços distintivos (15 variações)
      const distinctiveFeatures = [
        'strong jawline', 'soft features', 'prominent cheekbones', 'defined eyebrows',
        'gentle smile lines', 'angular features', 'round gentle features',
        'sharp nose bridge', 'full lips', 'thin elegant lips',
        'wide smile', 'subtle dimples', 'high forehead', 'narrow face',
        'broad shoulders visible'
      ];
      
      // Expressões (10 variações)
      const expressions = [
        'confident subtle smile', 'warm genuine smile', 'professional serious look',
        'friendly approachable smile', 'calm composed expression', 'engaging bright smile',
        'thoughtful slight smile', 'assured confident gaze', 'welcoming smile',
        'focused professional look'
      ];
      
      // Iluminação (8 variações)
      const lightings = [
        'soft natural window light', 'professional studio lighting', 'warm golden hour light',
        'bright even lighting', 'dramatic side lighting', 'soft diffused light',
        'natural daylight', 'professional portrait lighting'
      ];
      
      // Ângulo/Pose (8 variações)
      const poses = [
        'straight-on centered', 'slight left turn', 'slight right turn',
        'three-quarter view left', 'three-quarter view right', 'head tilted slightly',
        'forward-facing direct', 'casual professional pose'
      ];
      
      // Background (10 variações)
      const backgrounds = [
        'blurred modern office', 'soft gray backdrop', 'white clean background',
        'professional studio background', 'blurred corporate interior', 'neutral tone backdrop',
        'soft bokeh office', 'minimalist background', 'contemporary office blur',
        'professional plain background'
      ];
      
      // Selecionar características baseadas no seed (consistente por persona)
      const selectedSkin = skinTones[seedVariation % skinTones.length];
      const selectedFace = faceShapes[Math.floor(seedVariation / 5) % faceShapes.length];
      const selectedEyes = eyeStyles[Math.floor(seedVariation / 3) % eyeStyles.length];
      const selectedHair = hairStyles[Math.floor(seedVariation / 2) % hairStyles.length];
      const selectedFeature = distinctiveFeatures[seedVariation % distinctiveFeatures.length];
      const selectedExpression = expressions[Math.floor(seedVariation / 10) % expressions.length];
      const selectedLighting = lightings[seedVariation % lightings.length];
      const selectedPose = poses[Math.floor(seedVariation / 7) % poses.length];
      const selectedBackground = backgrounds[Math.floor(seedVariation / 4) % backgrounds.length];
      
      // Idade da persona
      const idade = persona.idade || avatarRecord.metadados?.idade || 30;
      
      // Construir prompt ULTRA ESPECÍFICO
      const enhancedPrompt = `Ultra detailed professional corporate headshot portrait: ${idade} year old ${persona.genero === 'feminino' ? 'woman' : 'man'}, ${persona.role}. Physical features: ${selectedSkin} skin, ${selectedFace} face, ${selectedEyes}, ${selectedHair}, ${selectedFeature}. Expression: ${selectedExpression}. Pose: ${selectedPose}. ${selectedLighting}, ${selectedBackground}. Photorealistic, high detail, sharp focus, Canon EOS R5 85mm f/1.4, professional headshot, unique individual person, HIGHLY DETAILED FACE, 8K quality`;
      
      // Negative prompt EXTREMO anti-similaridade
      const negativePrompt = 'IDENTICAL TWIN, same face, clone face, duplicate person, copy, similar person, generic face, stock photo face, template face, repeated features, lookalike, doppelganger, uniform appearance, standard face, cookie-cutter, blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, text, logo, cartoon, anime, illustration, painting, 3D render';
      
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const encodedNegative = encodeURIComponent(negativePrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${personaSeed}&nologo=true&negative=${encodedNegative}&enhance=true&model=flux`;
      
      console.log(`  📝 Features: ${selectedSkin} | ${selectedFace} | ${selectedEyes.substring(0,20)}...`);
      console.log(`  🎭 Expression: ${selectedExpression} | Pose: ${selectedPose}`);
      console.log(`  🎲 Seed: ${personaSeed} (variation: ${seedVariation})`);
      console.log(`  🔗 Baixando imagem... (tentativa ${attempt}/${maxRetries})`);

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

      try {
        // Baixar imagem com timeout
        const response = await fetch(imageUrl, { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());
        
        if (imageBuffer.length === 0) {
          throw new Error('Imagem vazia retornada');
        }

        console.log(`  ✅ Imagem gerada com sucesso (${(imageBuffer.length / 1024).toFixed(2)} KB)`);

        // Salvar em arquivo temporário local
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
            avatar_url: tempFilePath,
            avatar_thumbnail_url: null,
            servico_usado: 'pollinations_sdxl',
            ativo: true,
            metadados: {
              ...avatarRecord.metadados,
              pollinations_generation: {
                model: 'SDXL',
                seed_used: personaSeed,
                generated_at: new Date().toISOString(),
                image_size: '1024x1024',
                temp_file: tempFilePath,
                file_size_kb: (imageBuffer.length / 1024).toFixed(2),
                api_url: imageUrl
              }
            }
          })
          .eq('persona_id', persona.id);

        if (updateError) {
          throw new Error(`Erro ao atualizar banco: ${updateError.message}`);
        }

        console.log(`  ✅ Avatar salvo com sucesso!\n`);
        return { success: true, imageUrl: tempFilePath };

      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error) {
      lastError = error;
      const errorMsg = error.name === 'AbortError' ? 'Timeout (60s)' : error.message;
      console.error(`  ❌ Erro na tentativa ${attempt}: ${errorMsg}`);
      
      if (attempt < maxRetries) {
        // Backoff exponencial: 3s, 6s, 12s
        const waitTime = 3000 * Math.pow(2, attempt - 1);
        console.log(`  🔄 Aguardando ${waitTime / 1000}s antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error(`  ❌ Falhou após ${maxRetries} tentativas`);
  throw lastError;
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
      console.log('💡 Uso: node 05b_generate_images_pollinations.js --empresaId=ID [--retry-failed] [--force]');
      console.log('\n📝 Opções:');
      console.log('   --retry-failed: Tenta apenas personas que falharam anteriormente');
      console.log('   --force: Regenera TODAS as imagens (ignora existentes)');
      process.exit(1);
    }

    // Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError) throw new Error(`Empresa não encontrada: ${empresaError.message}`);

    console.log(`🏢 Empresa: ${empresa.nome}`);
    console.log(`🤖 Modelo Principal: Stable Diffusion XL (HuggingFace)`);
    console.log(`🔄 Fallback: SDXL (Pollinations.ai)`);
    console.log(`💰 Custo: $9/mês HF PRO (ilimitado)\n`);

    // Buscar personas
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      return;
    }

    // Buscar avatares que precisam de imagens
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
      avataresPendentes = avatares;
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
    console.log(`💰 CUSTO TOTAL: $0.00 (100% GRATUITO via Pollinations.ai)\n`);

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
        await gerarImagemHuggingFace(persona, avatarRecord);
        sucessos++;
      } catch (error) {
        erros++;
        errorList.push({
          persona: persona.full_name,
          error: error.message
        });
        console.error(`  ❌ Erro: ${error.message}`);
      }

      // Delay entre requisições (aumentado para evitar rate limit)
      if (i < avataresPendentes.length - 1) {
        const delaySeconds = 10; // Aumentado de 5s para 10s (Pollinations tem limites implícitos)
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
