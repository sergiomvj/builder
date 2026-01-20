#!/usr/bin/env node
/**
 * 🎭 SCRIPT 06 - GERAR AVATARES MULTIMEDIA VIA IA
 * ===============================================
 * 
 * Gera imagens e vídeos de personas individuais ou em grupo
 * usando Midjourney, DALL-E 3 ou Fal.ai (Flux models)
 * 
 * Uso:
 *   node 06_generate_avatares_multimedia.js --empresaId=UUID --service=midjourney
 *   node 06_generate_avatares_multimedia.js --empresaId=UUID --service=dalle
 *   node 06_generate_avatares_multimedia.js --empresaId=UUID --service=fal
 * 
 * Parâmetros:
 *   --empresaId=UUID    ID da empresa
 *   --service=STRING    Serviço: midjourney | dalle | fal (padrão: fal)
 *   --type=STRING       Tipo: photo | video | animated_gif (padrão: photo)
 *   --personaId=UUID    (Opcional) Gerar apenas para uma persona específica
 *   --multi             (Flag) Gerar fotos de equipe (múltiplas personas)
 *   --style=STRING      Estilo: professional | casual | creative | corporate
 * 
 * Exemplos:
 *   # Fotos individuais profissionais via Fal.ai
 *   node 06_generate_avatares_multimedia.js --empresaId=xxx --service=fal --style=professional
 * 
 *   # Foto de equipe executiva via DALL-E
 *   node 06_generate_avatares_multimedia.js --empresaId=xxx --service=dalle --multi
 * 
 *   # Avatar específico via Midjourney
 *   node 06_generate_avatares_multimedia.js --empresaId=xxx --personaId=yyy --service=midjourney
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as fal from '@fal-ai/serverless-client';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config({ path: '../.env.local' });

// ============================================
// CONFIGURAÇÃO
// ============================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configurar Fal.ai
fal.config({
  credentials: process.env.FAL_KEY
});

const OUTPUT_DIR = './avatares_multimedia_output';

// ============================================
// UTILITÁRIOS
// ============================================

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    empresaId: null,
    service: 'fal', // padrão: Fal.ai
    type: 'photo',
    personaId: null,
    multi: false,
    style: 'professional'
  };

  args.forEach(arg => {
    if (arg.startsWith('--empresaId=')) {
      params.empresaId = arg.split('=')[1];
    } else if (arg.startsWith('--service=')) {
      params.service = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--type=')) {
      params.type = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--personaId=')) {
      params.personaId = arg.split('=')[1];
    } else if (arg === '--multi') {
      params.multi = true;
    } else if (arg.startsWith('--style=')) {
      params.style = arg.split('=')[1].toLowerCase();
    }
  });

  return params;
}

async function createOutputDirectory() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    console.error('❌ Erro ao criar diretório:', error.message);
  }
}

// ============================================
// BUSCA DE DADOS
// ============================================

async function buscarEmpresa(empresaId) {
  console.log('📊 Buscando dados da empresa...');
  
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar empresa: ${error.message}`);
  }

  console.log(`✅ Empresa encontrada: ${data.nome}`);
  return data;
}

async function buscarPersonas(empresaId, personaId = null) {
  console.log('👥 Buscando personas...');
  
  let query = supabase
    .from('personas')
    .select('id, full_name, role')
    .eq('empresa_id', empresaId);

  if (personaId) {
    query = query.eq('id', personaId);
  }

  const { data: personas, error } = await query;

  if (error) {
    throw new Error(`Erro ao buscar personas: ${error.message}`);
  }

  console.log('🔍 Personas encontradas:', personas?.length || 0);
  if (personas && personas.length > 0) {
    console.log('🔍 Primeiras personas:', personas.slice(0, 3).map(p => `${p.full_name} (${p.id})`));
  }

  // Buscar avatares_personas separadamente - tentar abordagem diferente
  const personaIds = personas.map(p => p.id);
  console.log('🔍 Persona IDs sendo buscados:', personaIds);

  // Tentar query individual para cada persona
  const avatares = [];
  for (const personaId of personaIds) {
    const { data, error } = await supabase
      .from('personas_avatares')
      .select('persona_id, biometrics, estilo')
      .eq('persona_id', personaId)
      .eq('ativo', true)
      .maybeSingle();

    if (error) {
      console.log(`⚠️ Erro ao buscar avatar para ${personaId}:`, error.message);
    } else if (data) {
      avatares.push(data);
      console.log(`✅ Avatar encontrado para ${personaId}`);
    } else {
      console.log(`⚠️ Nenhum avatar encontrado para ${personaId}`);
    }
  }

  console.log('🔍 Avatares encontrados (abordagem individual):', avatares.length);

  // Juntar os dados
  const personasComAvatares = personas.map(p => ({
    ...p,
    avatares_personas: avatares?.filter(a => a.persona_id === p.id) || []
  }));

  console.log(`✅ ${personasComAvatares.length} persona(s) encontrada(s)`);
  return personasComAvatares;
}

// ============================================
// GERAÇÃO DE PROMPTS
// ============================================

function buildPromptIndividual(persona, style) {
  const avatar = persona.avatares_personas?.[0] || {};

  // Parse biometrics data from script 05
  let biometrics = {};
  try {
    if (avatar.biometrics) {
      biometrics = typeof avatar.biometrics === 'string'
        ? JSON.parse(avatar.biometrics)
        : avatar.biometrics;
    }
  } catch (error) {
    console.warn(`⚠️ Erro ao parsear biometrics para ${persona.full_name}:`, error.message);
  }

  // DEBUG: Log biometrics data
  console.log(`🔍 Biometrics para ${persona.full_name}:`, JSON.stringify(biometrics, null, 2));

  // Extract appearance data from biometrics
  const appearance = biometrics.tipo_fisico || 'professional appearance';
  const age = biometrics.idade_aparente || '30-40';
  const ethnicity = biometrics.etnia || 'diverse';
  const gender = biometrics.genero || 'professional';

  // DEBUG: Log extracted values
  console.log(`📋 Valores extraídos - gênero: ${gender}, idade: ${age}, etnia: ${ethnicity}, aparência: ${appearance}`);

  // CRITICAL: Mapear gênero corretamente (male/female para man/woman)
  let genderTerm = 'person';
  if (gender.toLowerCase().includes('male') || gender.toLowerCase() === 'masculino') {
    genderTerm = 'man';
  } else if (gender.toLowerCase().includes('female') || gender.toLowerCase() === 'feminino') {
    genderTerm = 'woman';
  }

  // CRITICAL: Idade específica - incluindo jovens adultos
  const ageTerms = {
    '18-25': 'young adult aged 20-25',
    '20-30': 'young professional in their twenties',
    '25-35': 'professional in their late twenties to early thirties',
    '30-40': 'professional in their thirties',
    '40-50': 'experienced professional in their forties',
    '50-60': 'senior professional in their fifties',
    '60+': 'senior executive professional'
  };
  const ageTerm = ageTerms[age] || `adult professional aged ${age}`;

  const styleDescriptions = {
    professional: 'casual business attire, jeans and blazer, polo shirt, informal professional clothing',
    casual: 'smart casual clothing, jeans and t-shirt, casual button-up shirt, relaxed professional wear',
    creative: 'modern casual style, trendy informal clothing, artistic casual wear',
    corporate: 'business casual attire, khakis and dress shirt, informal office wear'
  };

  const styleDesc = styleDescriptions[style] || styleDescriptions.casual;

  // Add hair and eye details from biometrics
  const hairDesc = biometrics.cabelo_cor && biometrics.cabelo_comprimento
    ? `${biometrics.cabelo_cor} ${biometrics.cabelo_comprimento} hair`
    : '';
  const eyeDesc = biometrics.olhos_cor ? `${biometrics.olhos_cor} eyes` : '';
  const skinDesc = biometrics.pele_tom ? `${biometrics.pele_tom} skin tone` : '';

  // Build detailed appearance description
  const detailedAppearance = [appearance, hairDesc, eyeDesc, skinDesc]
    .filter(Boolean)
    .join(', ');

  // CRITICAL: Instruções explícitas - permite jovens adultos mas não adolescentes/crianças
  const safetyInstructions = 'IMPORTANT: adult professional only, minimum age 20, no teenagers under 18, no children, professional ${genderTerm}, realistic adult face, age-appropriate professional, workplace appropriate';

  const finalPrompt = `professional headshot portrait of a ${genderTerm}, ${ageTerm}, ${ethnicity} ethnicity, ${detailedAppearance}, wearing ${styleDesc}, neutral office background, natural lighting, front-facing portrait, realistic photography, high quality, professional corporate photo, ${safetyInstructions}`;

  console.log(`🎨 Prompt final para ${persona.full_name}: ${finalPrompt.substring(0, 200)}...`);

  return finalPrompt;
}

function buildPromptMultiPersona(personas, style) {
  const personaDescriptions = personas.map(p => {
    const avatar = p.avatares_personas?.[0] || {};
    
    // Parse biometrics data from script 05
    let biometrics = {};
    try {
      if (avatar.biometrics) {
        biometrics = typeof avatar.biometrics === 'string' 
          ? JSON.parse(avatar.biometrics) 
          : avatar.biometrics;
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao parsear biometrics para ${p.full_name}:`, error.message);
    }

    const age = biometrics.idade_aparente || '30-40';
    const ethnicity = biometrics.etnia || 'diverse';
    const gender = biometrics.genero || 'professional';
    
    // CRITICAL: Mapear gênero corretamente
    let genderTerm = 'person';
    if (gender.toLowerCase().includes('male') || gender.toLowerCase() === 'masculino') {
      genderTerm = 'man';
    } else if (gender.toLowerCase().includes('female') || gender.toLowerCase() === 'feminino') {
      genderTerm = 'woman';
    }
    
    return `${ethnicity} ${genderTerm} aged ${age}`;
  }).join(', ');

  const styleDescriptions = {
    professional: 'casual business team photo, informal professional clothing, jeans and blazers',
    casual: 'casual team photo, smart casual clothing, relaxed professional wear',
    creative: 'creative team portrait, modern casual styling, trendy informal office wear',
    corporate: 'business casual team photo, informal office attire, khakis and dress shirts'
  };

  const styleDesc = styleDescriptions[style] || styleDescriptions.casual;

  // CRITICAL: Instruções de segurança - permite jovens adultos
  const safetyInstructions = 'IMPORTANT: all adult professionals only, minimum age 20, no teenagers under 18, no children, professional team, realistic adult faces, age-appropriate professionals, workplace appropriate';

  return `${styleDesc}, group of ${personas.length} adult professionals: ${personaDescriptions}, diverse professional team, standing together in office, natural lighting, front-facing group portrait, realistic photography, high quality corporate photo, ${safetyInstructions}`;
}

// ============================================
// GERADORES DE IMAGEM
// ============================================

async function generateWithMidjourney(prompt, personaIds) {
  console.log('🎨 Midjourney: Este serviço requer integração via API externa (não disponível diretamente)');
  console.log('📝 Prompt gerado:', prompt);
  console.log('');
  console.log('Para usar Midjourney:');
  console.log('1. Copie o prompt acima');
  console.log('2. Use no Discord do Midjourney: /imagine prompt: [COLE AQUI]');
  console.log('3. Após gerar, salve a URL da imagem');
  console.log('4. Adicione manualmente ao banco de dados');
  console.log('');
  
  // Retorna estrutura simulada
  return {
    success: false,
    service: 'midjourney',
    prompt,
    message: 'Requer processo manual via Discord',
    manual_steps: true
  };
}

async function generateWithDalle(prompt, personaIds) {
  console.log('🤖 Gerando com DALL-E 3...');
  
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural" // ou "vivid"
    });

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt;

    console.log('✅ Imagem gerada com DALL-E 3');
    console.log('📝 Prompt revisado:', revisedPrompt.substring(0, 100) + '...');

    return {
      success: true,
      service: 'dalle',
      imageUrl,
      prompt,
      revisedPrompt,
      personaIds,
      metadata: {
        model: 'dall-e-3',
        size: '1024x1024',
        quality: 'hd'
      }
    };
  } catch (error) {
    console.error('❌ Erro ao gerar com DALL-E:', error.message);
    return {
      success: false,
      service: 'dalle',
      error: error.message
    };
  }
}

async function generateWithFal(prompt, personaIds, model = 'fal-ai/flux-pro') {
  console.log(`🚀 Gerando com Fal.ai (${model})...`);
  
  try {
    const result = await fal.subscribe(model, {
      input: {
        prompt: prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: "jpeg"
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log('⏳ Processando...', update.logs?.slice(-1)[0]);
        }
      },
    });

    const imageUrl = result.images[0].url;

    console.log('✅ Imagem gerada com Fal.ai');

    return {
      success: true,
      service: 'fal',
      imageUrl,
      prompt,
      personaIds,
      metadata: {
        model: model,
        size: 'landscape_16_9',
        seed: result.seed,
        inference_steps: 28
      }
    };
  } catch (error) {
    console.error('❌ Erro ao gerar com Fal.ai:', error.message);
    return {
      success: false,
      service: 'fal',
      error: error.message
    };
  }
}

// ============================================
// SALVAMENTO NO BANCO
// ============================================

async function salvarAvatarMultimedia(empresaId, generationResult, personas, type, style, avatarCategory) {
  if (!generationResult.success) {
    console.log('⚠️ Geração não foi bem-sucedida, não salvando no banco');
    return null;
  }

  const personaIds = personas.map(p => p.id);
  const personasMetadata = personas.map(p => ({
    persona_id: p.id,
    name: p.full_name,
    role: p.role,
    position: personas.length === 1 ? 'center' : 'group'
  }));

  const title = personas.length === 1 
    ? `${personas[0].full_name} - ${personas[0].role} ${style} portrait`
    : `Team Photo - ${personas.map(p => p.role).join(', ')}`;

  const useCases = personas.length === 1
    ? ['website_hero', 'linkedin_profile', 'email_signature']
    : ['website_about', 'team_page', 'press_kit'];

  console.log('💾 Salvando no banco de dados...');

  const { data, error } = await supabase
    .from('avatares_multimedia')
    .insert({
      empresa_id: empresaId,
      avatar_type: type,
      avatar_category: avatarCategory,
      personas_ids: personaIds,
      personas_metadata: personasMetadata,
      file_url: generationResult.imageUrl,
      title: title,
      description: generationResult.revisedPrompt || generationResult.prompt,
      prompt_used: generationResult.prompt,
      generation_metadata: generationResult.metadata,
      style: style,
      use_cases: useCases,
      status: 'completed',
      generation_service: generationResult.service,
      generation_completed_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao salvar no banco:', error.message);
    return null;
  }

  console.log('✅ Avatar salvo no banco de dados!');
  return data;
}

// ============================================
// FLUXO PRINCIPAL
// ============================================

async function generateAvatarIndividual(empresa, persona, service, style) {
  console.log('\n' + '='.repeat(60));
  console.log(`📸 Gerando avatar individual: ${persona.full_name}`);
  console.log('='.repeat(60));

  const prompt = buildPromptIndividual(persona, style);
  console.log('📝 Prompt:', prompt.substring(0, 150) + '...\n');

  let result;
  
  switch (service) {
    case 'midjourney':
      result = await generateWithMidjourney(prompt, [persona.id]);
      break;
    case 'dalle':
      result = await generateWithDalle(prompt, [persona.id]);
      break;
    case 'fal':
      result = await generateWithFal(prompt, [persona.id]);
      break;
    default:
      throw new Error(`Serviço desconhecido: ${service}`);
  }

  if (result.success) {
    await salvarAvatarMultimedia(
      empresa.id,
      result,
      [persona],
      'photo',
      style,
      'profile'
    );
  }

  return result;
}

async function generateAvatarMultiPersona(empresa, personas, service, style) {
  console.log('\n' + '='.repeat(60));
  console.log(`👥 Gerando foto de equipe: ${personas.length} personas`);
  console.log('='.repeat(60));

  const prompt = buildPromptMultiPersona(personas, style);
  console.log('📝 Prompt:', prompt.substring(0, 150) + '...\n');

  let result;
  
  switch (service) {
    case 'midjourney':
      result = await generateWithMidjourney(prompt, personas.map(p => p.id));
      break;
    case 'dalle':
      result = await generateWithDalle(prompt, personas.map(p => p.id));
      break;
    case 'fal':
      result = await generateWithFal(prompt, personas.map(p => p.id));
      break;
    default:
      throw new Error(`Serviço desconhecido: ${service}`);
  }

  if (result.success) {
    await salvarAvatarMultimedia(
      empresa.id,
      result,
      personas,
      'photo',
      style,
      'team'
    );
  }

  return result;
}

async function main() {
  console.log('🎭 GERADOR DE AVATARES MULTIMEDIA');
  console.log('='.repeat(60));

  const params = parseArgs();

  // Validações
  if (!params.empresaId) {
    console.error('❌ Parâmetro --empresaId é obrigatório');
    process.exit(1);
  }

  if (!['midjourney', 'dalle', 'fal'].includes(params.service)) {
    console.error('❌ Serviço inválido. Use: midjourney, dalle ou fal');
    process.exit(1);
  }

  // Validar API keys
  if (params.service === 'dalle' && !process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY não configurada');
    process.exit(1);
  }

  if (params.service === 'fal' && !process.env.FAL_KEY) {
    console.error('❌ FAL_KEY não configurada');
    process.exit(1);
  }

  await createOutputDirectory();

  try {
    // Buscar dados
    const empresa = await buscarEmpresa(params.empresaId);
    const personas = await buscarPersonas(params.empresaId, params.personaId);

    if (personas.length === 0) {
      console.log('⚠️ Nenhuma persona encontrada');
      return;
    }

    console.log(`\n🎨 Serviço selecionado: ${params.service.toUpperCase()}`);
    console.log(`🎭 Estilo: ${params.style}`);
    console.log(`📸 Tipo: ${params.type}`);

    const results = [];

    if (params.multi) {
      // Gerar foto de equipe
      const result = await generateAvatarMultiPersona(empresa, personas, params.service, params.style);
      results.push(result);
    } else {
      // Gerar avatares individuais
      for (const persona of personas) {
        const result = await generateAvatarIndividual(empresa, persona, params.service, params.style);
        results.push(result);
        
        // Pausa entre gerações (rate limiting)
        if (personas.indexOf(persona) < personas.length - 1) {
          console.log('\n⏸️ Aguardando 3 segundos...\n');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA EXECUÇÃO');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Sucessos: ${successful}`);
    console.log(`❌ Falhas: ${failed}`);
    console.log(`📁 Total: ${results.length}`);

    // Salvar log
    const logFile = path.join(OUTPUT_DIR, `log_${Date.now()}.json`);
    await fs.writeFile(logFile, JSON.stringify({
      empresa: empresa.nome,
      service: params.service,
      style: params.style,
      timestamp: new Date().toISOString(),
      results
    }, null, 2));

    console.log(`\n📄 Log salvo em: ${logFile}`);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
main();
