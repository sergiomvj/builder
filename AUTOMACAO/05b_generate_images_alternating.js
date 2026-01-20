// ============================================================================
// SCRIPT 05b - GERAÇÃO DE IMAGENS VIA POLLINATIONS.AI + FAL.AI (ALTERNADO)
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 05a (prompts criados)
//
// O QUE FAZ:
// - Busca prompts prontos da tabela personas_avatares
// - Alterna entre Pollinations.ai (FREE) e Fal.ai (pago mas melhor qualidade)
// - Gera imagens fotorrealistas de alta qualidade
// - Baixa e salva imagens localmente em temp_avatars/
// - Salva URLs no banco para Script 05c
//
// PRÓXIMO PASSO: Executar Script 05c para organizar imagens
//
// SERVIÇOS:
// - Pollinations.ai: 100% GRATUITO, qualidade boa, limites implícitos
// - Fal.ai: Pago ($0.03/imagem), qualidade superior, sem limites
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as fal from '@fal-ai/serverless-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
setupConsoleEncoding();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Configurar Fal.ai
fal.config({
  credentials: process.env.FAL_KEY
});

const PROGRESS_FILE = path.join(__dirname, 'script-progress.json');

// Diretório temporário para imagens
const TEMP_AVATARS_DIR = path.join(__dirname, '..', 'temp_avatars');

// ============================================
// UTILITÁRIOS
// ============================================

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {
    empresaId: null,
    retryFailed: false,
    force: false
  };

  args.forEach(arg => {
    if (arg.startsWith('--empresaId=')) {
      params.empresaId = arg.split('=')[1];
    } else if (arg === '--retry-failed') {
      params.retryFailed = true;
    } else if (arg === '--force') {
      params.force = true;
    }
  });

  if (!params.empresaId) {
    console.error('❌ ERRO: --empresaId é obrigatório');
    console.log('\n💡 Uso: node 05b_generate_images_alternating.js --empresaId=ID [--retry-failed] [--force]');
    console.log('   --empresaId=ID: ID da empresa (obrigatório)');
    console.log('   --retry-failed: Tenta apenas personas que falharam anteriormente');
    console.log('   --force: Força regeneração de todas as imagens');
    process.exit(1);
  }

  return params;
}

function updateProgress(status, current, total, currentPersona = '', errors = []) {
  const progress = {
    script: '05b_generate_images_alternating',
    status,
    current,
    total,
    currentPersona,
    errors,
    timestamp: new Date().toISOString()
  };

  try {
    fsSync.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error) {
    console.warn('⚠️  Não foi possível salvar progresso:', error.message);
  }
}

async function ensureTempDirectory() {
  try {
    await fs.mkdir(TEMP_AVATARS_DIR, { recursive: true });
  } catch (error) {
    console.error('❌ Erro ao criar diretório temp_avatars:', error.message);
    throw error;
  }
}

// ============================================
// GERAÇÃO DE IMAGENS - POLLINATIONS.AI
// ============================================

async function gerarImagemPollinations(persona, avatarRecord, attempt = 1) {
  const maxRetries = 3;
  const personaSeed = Math.floor(Math.random() * 1000000) + 100000;

  try {
    console.log(`  🎨 Gerando imagem via Pollinations.ai... (tentativa ${attempt}/${maxRetries})`);

    const prompt = avatarRecord.prompt_usado;
    if (!prompt) {
      throw new Error('Prompt não encontrado no registro do avatar');
    }

    // Negative prompt para melhorar qualidade
    const negativePrompt = 'blurry, low quality, distorted, ugly, deformed, cartoon, anime, sketch, painting, drawing, watermark, text, signature, multiple faces, extra limbs, bad anatomy, poorly drawn face, poorly drawn hands, disfigured, mutation, mutated, extra limbs, extra arms, extra legs, fused fingers, too many fingers, long neck, cross-eyed, wall-eyed, crooked teeth, big forehead, big chin, small chin, double chin, no chin, low forehead, high forehead, narrow face, wide face, small eyes, big eyes, bulging eyes, squinted eyes, closed eyes, asymmetric eyes, asymmetric face, lopsided face, crooked face, crooked nose, big nose, small nose, pointed nose, hooked nose, crooked mouth, small mouth, big mouth, thin lips, thick lips, no lips, crooked teeth, missing teeth, extra teeth, buck teeth, rabbit teeth, horse teeth, donkey teeth, monkey teeth, rodent teeth, fangs, tusks, horns, antlers, ears, fur, scales, feathers, wings, tail, paws, claws, hooves, tentacles, slime, goo, blood, gore, violence, weapons, armor, clothing, accessories, jewelry, glasses, hats, helmets, masks, scarves, ties, belts, shoes, boots, pants, shirts, jackets, coats, dresses, skirts, shorts, underwear, swimsuits, bikinis, lingerie, nudity, naked, nude, sexual, erotic, pornographic, obscene, indecent, offensive, inappropriate, racist, sexist, homophobic, transphobic, ableist, ageist, fatphobic, ugly, fat, skinny, muscular, athletic, fit, healthy, sick, ill, injured, wounded, dead, corpse, skeleton, zombie, ghost, monster, demon, angel, god, devil, alien, robot, cyborg, android, clone, twin, identical, similar, same, duplicate, copy, fake, artificial, synthetic, plastic, doll, mannequin, puppet, marionette, ventriloquist dummy, wax figure, statue, sculpture, painting, drawing, cartoon, anime, manga, comic, graphic novel, illustration, digital art, pixel art, vector art, clip art, icon, emoji, symbol, logo, brand, trademark, copyright, patent, intellectual property, confidential, secret, hidden, invisible, transparent, translucent, opaque, shiny, glossy, matte, metallic, wooden, stone, brick, concrete, glass, plastic, metal, fabric, leather, fur, hair, skin, flesh, bone, muscle, organ, tissue, cell, molecule, atom, particle, wave, energy, light, shadow, darkness, brightness, color, hue, saturation, value, tone, tint, shade, contrast, balance, harmony, discord, chaos, order, symmetry, asymmetry, pattern, texture, surface, material, substance, matter, element, compound, mixture, solution, suspension, emulsion, colloid, gas, liquid, solid, plasma, fire, water, earth, air, wind, weather, climate, season, time, day, night, morning, afternoon, evening, dawn, dusk, sunrise, sunset, moon, sun, star, planet, galaxy, universe, space, vacuum, void, nothing, emptiness, fullness, abundance, scarcity, plenty, lack, excess, deficiency, balance, imbalance, equality, inequality, justice, injustice, freedom, slavery, peace, war, love, hate, joy, sadness, anger, fear, surprise, disgust, contempt, guilt, shame, pride, envy, jealousy, greed, generosity, kindness, cruelty, compassion, indifference, empathy, sympathy, apathy, interest, boredom, excitement, calm, anxiety, stress, relaxation, tension, ease, difficulty, simplicity, complexity, clarity, confusion, truth, lie, honesty, dishonesty, trust, distrust, faith, doubt, belief, disbelief, knowledge, ignorance, wisdom, foolishness, intelligence, stupidity, genius, idiot, talent, incompetence, skill, clumsiness, expertise, amateurism, professionalism, amateur, expert, novice, master, apprentice, teacher, student, parent, child, adult, elderly, young, old, male, female, man, woman, boy, girl, baby, infant, toddler, teenager, adult, senior, citizen, person, human, animal, plant, object, thing, place, location, position, direction, orientation, movement, stillness, speed, slowness, fast, slow, quick, gradual, sudden, immediate, delayed, early, late, on time, punctual, tardy, prompt, leisurely, hasty, careful, careless, precise, inaccurate, exact, approximate, perfect, imperfect, complete, incomplete, whole, partial, total, partial, full, empty, open, closed, locked, unlocked, free, bound, loose, tight, hard, soft, rough, smooth, hot, cold, warm, cool, wet, dry, clean, dirty, new, old, fresh, stale, alive, dead, real, fake, true, false, good, bad, right, wrong, positive, negative, active, passive, strong, weak, big, small, tall, short, long, short, wide, narrow, thick, thin, heavy, light, high, low, deep, shallow, far, near, close, distant, inside, outside, above, below, left, right, front, back, top, bottom, center, edge, corner, side, middle, end, beginning, start, finish, continuation, interruption, connection, separation, union, division, addition, subtraction, multiplication, division, calculation, measurement, count, number, quantity, quality, size, shape, form, structure, organization, system, network, web, chain, link, connection, relationship, interaction, communication, language, word, sentence, paragraph, page, book, library, school, university, company, organization, government, country, city, town, village, house, apartment, room, street, road, path, bridge, river, lake, ocean, mountain, hill, valley, forest, desert, island, continent, planet, star, galaxy, universe';

    const encodedPrompt = encodeURIComponent(prompt);
    const encodedNegative = encodeURIComponent(negativePrompt);

    // Usar modelo FLUX para melhor qualidade
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${personaSeed}&nologo=true&negative=${encodedNegative}&enhance=true&model=flux`;

    console.log(`  📡 Fazendo requisição para Pollinations.ai...`);

    // Fazer download da imagem
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Salvar imagem localmente
    const filename = `avatar_${persona.id}_${Date.now()}.png`;
    const filepath = path.join(TEMP_AVATARS_DIR, filename);

    await fs.writeFile(filepath, buffer);
    console.log(`  💾 Imagem salva: ${filename}`);

    // Atualizar banco de dados
    const { error: updateError } = await supabase
      .from('personas_avatares')
      .update({
        avatar_url: imageUrl, // URL da API (para referência)
        avatar_local_path: filepath, // Caminho local
        servico_usado: 'pollinations_flux',
        updated_at: new Date().toISOString(),
        metadados: {
          ...avatarRecord.metadados,
          pollinations_generation: {
            prompt: prompt,
            negative_prompt: negativePrompt,
            seed: personaSeed,
            model: 'flux',
            width: 1024,
            height: 1024,
            timestamp: new Date().toISOString()
          }
        }
      })
      .eq('id', avatarRecord.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar banco:', updateError.message);
      throw updateError;
    }

    console.log(`  ✅ Imagem gerada com sucesso via Pollinations.ai`);
    return { success: true, service: 'pollinations', filepath };

  } catch (error) {
    console.error(`  ❌ Erro na tentativa ${attempt}/${maxRetries}:`, error.message);

    if (attempt < maxRetries) {
      const delaySeconds = 5;
      console.log(`  ⏳ Tentando novamente em ${delaySeconds}s...`);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      return gerarImagemPollinations(persona, avatarRecord, attempt + 1);
    }

    throw error;
  }
}

// ============================================
// GERAÇÃO DE IMAGENS - FAL.AI
// ============================================

async function gerarImagemFal(persona, avatarRecord, attempt = 1) {
  const maxRetries = 3;

  try {
    console.log(`  🎨 Gerando imagem via Fal.ai... (tentativa ${attempt}/${maxRetries})`);

    const prompt = avatarRecord.prompt_usado;
    if (!prompt) {
      throw new Error('Prompt não encontrado no registro do avatar');
    }

    console.log(`  📡 Fazendo requisição para Fal.ai...`);

    // Usar modelo Flux Pro para melhor qualidade
    const result = await fal.subscribe('fal-ai/flux-pro', {
      input: {
        prompt: prompt,
        image_size: 'portrait_4_3', // 1024x768 (melhor para retratos)
        num_inference_steps: 28,
        guidance_scale: 3.5,
        seed: Math.floor(Math.random() * 1000000) + 100000
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`  🔄 Progresso: ${update.logs?.[0] || 'Processando...'}`);
        }
      }
    });

    console.log(`  📊 Resultado bruto do Fal.ai:`, JSON.stringify(result, null, 2));

    if (!result || !result.images || result.images.length === 0) {
      console.error(`  ❌ Estrutura do resultado:`, {
        hasResult: !!result,
        hasImages: !!(result && result.images),
        imagesLength: result && result.images ? result.images.length : 'N/A',
        resultKeys: result ? Object.keys(result) : 'N/A'
      });
      throw new Error('Fal.ai não retornou imagens');
    }

    const imageUrl = result.images[0].url;

    // Fazer download da imagem
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Salvar imagem localmente
    const filename = `avatar_${persona.id}_${Date.now()}.png`;
    const filepath = path.join(TEMP_AVATARS_DIR, filename);

    await fs.writeFile(filepath, buffer);
    console.log(`  💾 Imagem salva: ${filename}`);

    // Atualizar banco de dados
    const { error: updateError } = await supabase
      .from('personas_avatares')
      .update({
        avatar_url: imageUrl, // URL do Fal.ai
        avatar_local_path: filepath, // Caminho local
        servico_usado: 'fal_flux_pro',
        updated_at: new Date().toISOString(),
        metadados: {
          ...avatarRecord.metadados,
          fal_generation: {
            prompt: prompt,
            model: 'fal-ai/flux-pro',
            image_size: 'portrait_4_3',
            num_inference_steps: 28,
            guidance_scale: 3.5,
            timestamp: new Date().toISOString()
          }
        }
      })
      .eq('id', avatarRecord.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar banco:', updateError.message);
      throw updateError;
    }

    console.log(`  ✅ Imagem gerada com sucesso via Fal.ai`);
    return { success: true, service: 'fal', filepath };

  } catch (error) {
    console.error(`  ❌ Erro na tentativa ${attempt}/${maxRetries}:`, error.message);

    if (attempt < maxRetries) {
      const delaySeconds = 3;
      console.log(`  ⏳ Tentando novamente em ${delaySeconds}s...`);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      return gerarImagemFal(persona, avatarRecord, attempt + 1);
    }

    throw error;
  }
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

async function main() {
  const params = parseArgs();

  console.log('🎨 SCRIPT 05b - GERAÇÃO DE IMAGENS VIA POLLINATIONS.AI + FAL.AI');
  console.log('================================================================');
  console.log('🚀 Serviços: Pollinations.ai (FREE) + Fal.ai (Premium)');
  console.log('🤖 Modelos: FLUX (Pollinations) + Flux Pro (Fal.ai)');
  console.log('💰 Custo: Pollinations = $0.00 | Fal.ai = ~$0.03/imagem');
  console.log('⏱️  Tempo: ~10-30s por imagem');
  console.log('🔄 Alternância: Persona ímpar = Pollinations | Par = Fal.ai');
  console.log('================================================================\n');

  try {
    // Verificar se empresa existe
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('id, nome, scripts_status')
      .eq('id', params.empresaId)
      .single();

    if (empresaError || !empresa) {
      throw new Error(`Empresa não encontrada: ${params.empresaId}`);
    }

    console.log(`🏢 Empresa: ${empresa.nome}`);
    console.log(`📊 ID: ${empresa.id}\n`);

    // Buscar personas da empresa
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, full_name, email')
      .eq('empresa_id', params.empresaId)
      .order('full_name');

    if (personasError) {
      throw new Error(`Erro ao buscar personas: ${personasError.message}`);
    }

    if (!personas || personas.length === 0) {
      throw new Error('Nenhuma persona encontrada para esta empresa');
    }

    console.log(`👥 Total de personas: ${personas.length}\n`);

    // Buscar apenas avatares das personas desta empresa
    const personaIds = personas.map(p => p.id);
    const { data: avatares, error: avataresError } = await supabase
      .from('personas_avatares')
      .select('id, persona_id, prompt_usado, servico_usado, metadados')
      .in('persona_id', personaIds);

    if (avataresError) {
      throw new Error(`Erro ao buscar avatares: ${avataresError.message}`);
    }

    // Verificar se todas as personas têm avatares
    const personasComAvatares = avatares.map(a => a.persona_id);
    const personasSemAvatares = personaIds.filter(id => !personasComAvatares.includes(id));

    if (personasSemAvatares.length > 0) {
      console.log('⚠️  ALERTA: Algumas personas não têm registros de avatares:');
      personasSemAvatares.forEach(personaId => {
        const persona = personas.find(p => p.id === personaId);
        console.log(`   - ${persona.full_name} (${persona.email})`);
      });
      console.log('💡 Execute o Script 05a primeiro para criar os registros de avatares.\n');
    }

    // Filtrar apenas personas que têm avatares
    let personasToProcess = personas.filter(p => personasComAvatares.includes(p.id));

    // Filtrar personas se --retry-failed
    if (params.retryFailed) {
      console.log('🔄 Modo retry-failed: buscando personas com falhas...\n');

      const { data: avatares, error: avataresError } = await supabase
        .from('personas_avatares')
        .select('persona_id, servico_usado')
        .in('persona_id', personas.map(p => p.id));

      if (avataresError) {
        console.error('⚠️  Erro ao buscar status dos avatares:', avataresError.message);
        console.log('🔄 Processando todas as personas...\n');
      } else {
        const failedPersonaIds = avatares
          .filter(a => !a.servico_usado || a.servico_usado === 'pending_fal_ai' || a.servico_usado === 'falhou')
          .map(a => a.persona_id);

        personasToProcess = personas.filter(p => failedPersonaIds.includes(p.id));
        console.log(`❌ Personas com falha ou pendentes: ${personasToProcess.length}\n`);
      }
    }

    // Garantir diretório temporário
    await ensureTempDirectory();

    // Processar cada persona
    let sucesso = 0;
    let erros = 0;
    const errosDetalhes = [];

    updateProgress('iniciado', 0, personasToProcess.length);

    for (let i = 0; i < personasToProcess.length; i++) {
      const persona = personasToProcess[i];
      const personaIndex = i + 1;

      console.log(`\n[${personaIndex}/${personasToProcess.length}] 🔄 Processando: ${persona.full_name}`);
      console.log(`   📧 Email: ${persona.email}`);

      updateProgress('processando', personaIndex, personasToProcess.length, persona.full_name);

      let avatarRecord = null;
      try {
        // Buscar registro de avatar
        const { data: avatarData, error: avatarError } = await supabase
          .from('personas_avatares')
          .select('*')
          .eq('persona_id', persona.id)
          .single();

        if (avatarError || !avatarData) {
          throw new Error(`Registro de avatar não encontrado para persona ${persona.id}`);
        }

        avatarRecord = avatarData;

        if (!avatarRecord.prompt_usado) {
          throw new Error('Prompt de imagem não encontrado. Execute o Script 05a primeiro.');
        }

        // Verificar se já foi gerado e não é force
        if (avatarRecord.servico_usado && avatarRecord.servico_usado !== 'pending_fal_ai' && !params.force) {
          console.log(`   ⏭️  Já foi gerado anteriormente. Use --force para regenerar.`);
          sucesso++;
          continue;
        }

        // ALTERNÂNCIA: Persona ímpar = Pollinations | Par = Fal.ai
        const useFal = personaIndex % 2 === 0; // Par = Fal.ai, Ímpar = Pollinations
        const serviceName = useFal ? 'Fal.ai' : 'Pollinations.ai';

        console.log(`   🎯 Serviço selecionado: ${serviceName}`);

        let result;
        if (useFal) {
          result = await gerarImagemFal(persona, avatarRecord);
        } else {
          result = await gerarImagemPollinations(persona, avatarRecord);
        }

        if (result.success) {
          sucesso++;
          console.log(`   ✅ Sucesso com ${serviceName}`);
        } else {
          throw new Error(`Falha na geração com ${serviceName}`);
        }

      } catch (error) {
        console.error(`   ❌ Erro: ${error.message}`);
        erros++;
        errosDetalhes.push({
          persona: persona.full_name,
          email: persona.email,
          erro: error.message
        });

        // Marcar como falhou no banco
        try {
          await supabase
            .from('personas_avatares')
            .update({
              servico_usado: 'falhou',
              updated_at: new Date().toISOString(),
              metadados: {
                ...avatarRecord?.metadados,
                error: error.message,
                failed_at: new Date().toISOString()
              }
            })
            .eq('persona_id', persona.id);
        } catch (dbError) {
          console.error(`   ❌ Erro ao marcar falha no banco: ${dbError.message}`);
        }
      }

      // Delay entre personas para não sobrecarregar APIs
      if (i < personasToProcess.length - 1) {
        const delaySeconds = 2;
        console.log(`   ⏳ Aguardando ${delaySeconds}s antes da próxima persona...`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }
    }

    // Atualizar status da empresa
    const { error: updateEmpresaError } = await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          '05b_generate_images_alternating': {
            status: 'concluido',
            executado_em: new Date().toISOString(),
            sucesso,
            erros,
            total: personasToProcess.length
          }
        }
      })
      .eq('id', params.empresaId);

    if (updateEmpresaError) {
      console.warn('⚠️  Não foi possível atualizar status da empresa:', updateEmpresaError.message);
    }

    updateProgress('concluido', personasToProcess.length, personasToProcess.length, '', errosDetalhes);

    // Resultado final
    console.log('\n🎉 PROCESSAMENTO CONCLUÍDO');
    console.log('==========================');
    console.log(`✅ Sucessos: ${sucesso}`);
    console.log(`❌ Falhas: ${erros}`);
    console.log(`📊 Total: ${personasToProcess.length}`);
    console.log(`💰 Custo estimado: Pollinations = $0.00 | Fal.ai = $${(sucesso * 0.03 / 2).toFixed(2)}`);

    if (erros > 0) {
      console.log('\n❌ PERSONAS COM FALHA:');
      errosDetalhes.forEach((erro, index) => {
        console.log(`   ${index + 1}. ${erro.persona} (${erro.email}): ${erro.erro}`);
      });
      console.log('\n💡 Use --retry-failed para tentar novamente apenas as falhas');
    }

    console.log('\n📋 PRÓXIMO PASSO:');
    console.log('   Execute: node 05c_download_avatares.js --empresaId=' + params.empresaId);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message);
    updateProgress('erro', 0, 0, '', [error.message]);
    process.exit(1);
  }
}

// Executar script
main().catch(error => {
  console.error('❌ ERRO NÃO TRATADO:', error);
  process.exit(1);
});