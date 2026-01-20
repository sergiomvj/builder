// SCRIPT 01.3 - GERAÇÃO DE IMAGENS DE AVATARES COM FAL.AI
// Gera imagens customizadas baseadas nas descrições físicas detalhadas dos avatares
// Baixa e salva as imagens em C:\Projetos\vcm_vite_react\public\avatars
// 
// Uso:
//   node 01.3_generate_avatar_images.cjs --empresaId=UUID_EMPRESA [--force|--all]
// 
// Modos de Execução:
//   (padrão)  : INCREMENTAL - Processa apenas personas sem imagem
//   --all     : COMPLETO - Regenera imagens de todas personas
//   --force   : FORÇA TOTAL - Limpa TUDO e regenera do zero
// 
// Exemplos:
//   # Processar apenas sem imagem (padrão)
//   node 01.3_generate_avatar_images.cjs --empresaId=abc123
// 
//   # Regenerar todas imagens
//   node 01.3_generate_avatar_images.cjs --empresaId=abc123 --all
// 
//   # Limpar e regenerar tudo
//   node 01.3_generate_avatar_images.cjs --empresaId=abc123 --force

const { createClient } = require('@supabase/supabase-js');
const fal = require('@fal-ai/serverless-client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuração
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const falApiKey = process.env.FAL_AI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis NEXT_PUBLIC_SUPABASE_* não encontradas');
  process.exit(1);
}

if (!falApiKey) {
  console.error('❌ Erro: FAL_AI_API_KEY não encontrada no .env.local');
  console.log('💡 Adicione: FAL_AI_API_KEY=your_key_here');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar fal.ai
fal.config({
  credentials: falApiKey
});

// Parse CLI args
const args = process.argv.slice(2);
let empresaId = null;
let forceClean = false;
let skipExisting = true; // NOVO: pular personas que já têm imagem

args.forEach(arg => {
  if (arg.startsWith('--empresaId=')) {
    empresaId = arg.split('=')[1];
  } else if (arg === '--force') {
    forceClean = true;
    skipExisting = false;
  } else if (arg === '--all') {
    skipExisting = false;
  }
});

if (!empresaId) {
  console.error('❌ Erro: --empresaId é obrigatório');
  console.error('Uso: node 01.3_generate_avatar_images.cjs --empresaId=UUID [--force|--all]');
  process.exit(1);
}

const AVATARS_DIR = path.join(__dirname, '..', 'public', 'avatars');
const PROGRESS_FILE = path.join(__dirname, 'script-progress.json');

// Criar diretório de avatares se não existir
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
  console.log(`✅ Diretório criado: ${AVATARS_DIR}`);
}

console.log('🎨 SCRIPT 01.3 - GERAÇÃO DE IMAGENS DE AVATARES');
console.log('=============================================');
console.log('🎯 Modelo: fal-ai/flux/schnell (rápido e gratuito)');
console.log('📁 Destino: public/avatars/');
console.log('=============================================\n');

function updateProgress(status, current, total, currentPersona = '', errors = []) {
  const progress = {
    script: '01.3_avatar_images',
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
 * Baixa imagem de uma URL e salva localmente
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Deletar arquivo parcial
      reject(err);
    });
  });
}

/**
 * Constrói prompt detalhado para fal.ai baseado nos biometrics
 */
function buildImagePrompt(avatar, persona) {
  let biometrics;
  try {
    biometrics = typeof avatar.biometrics === 'string' 
      ? JSON.parse(avatar.biometrics) 
      : avatar.biometrics;
  } catch (e) {
    console.error('    ⚠️  Erro ao parsear biometrics, usando dados básicos');
    biometrics = {};
  }

  // Construir descrição física extremamente detalhada
  const parts = [
    // Cabeçalho do prompt
    'Professional corporate headshot photograph, ultra high quality, 8K resolution, DSLR quality,',
    
    // Gênero e idade
    `${biometrics.genero || 'pessoa'} profissional,`,
    `${biometrics.idade_aparente || '30-40 anos'},`,
    
    // Etnia e pele
    `${biometrics.etnia || 'caucasiano'} ethnicity,`,
    `${biometrics.pele_tom || 'pele clara'} skin tone,`,
    `${biometrics.pele_textura || 'pele lisa'},`,
    
    // Rosto
    `${biometrics.rosto_formato || 'rosto oval'},`,
    `${biometrics.expressao_facial_padrao || 'expressão confiante'},`,
    
    // Olhos
    `${biometrics.olhos_cor || 'olhos castanhos'},`,
    `${biometrics.olhos_formato || 'olhos amendoados'},`,
    
    // Sobrancelhas
    `${biometrics.sobrancelhas || 'sobrancelhas grossas'},`,
    
    // Nariz e boca
    `${biometrics.nariz || 'nariz fino'},`,
    `${biometrics.boca_labios || 'lábios médios'},`,
    
    // Cabelo - MUITO DETALHADO
    `${biometrics.cabelo_cor || 'cabelo castanho escuro'},`,
    `${biometrics.cabelo_comprimento || 'cabelo curto'},`,
    `${biometrics.cabelo_estilo || 'cabelo liso'},`,
    `${biometrics.cabelo_volume || 'volumoso'},`,
    
    // Tipo físico e postura
    `${biometrics.tipo_fisico || 'tipo atlético'},`,
    `${biometrics.postura || 'postura ereta e confiante'},`,
    
    // Vestimenta profissional baseada no cargo
    `wearing ${biometrics.estilo_vestimenta_padrao || 'formal business attire'},`,
    `${biometrics.paleta_cores_vestuario || 'blue and gray tones'},`,
    
    // Acessórios (se houver)
    biometrics.acessorios_permanentes ? `${biometrics.acessorios_permanentes},` : '',
    
    // Marcas únicas (se houver)
    biometrics.marcas_unicas ? `${biometrics.marcas_unicas},` : '',
    
    // Contexto profissional baseado no cargo
    `${persona.role} professional,`,
    `${persona.department} department,`,
    
    // Iluminação e estilo fotográfico
    'soft studio lighting, neutral gray background,',
    'professional corporate photography, clean composition,',
    'centered framing, looking at camera,',
    'professional headshot style, LinkedIn profile quality,',
    
    // Características técnicas da foto
    'sharp focus, natural colors, realistic skin texture,',
    'professional color grading, commercial photography quality'
  ];

  const prompt = parts.filter(p => p).join(' ');
  
  // Prompt negativo (o que NÃO queremos)
  const negativePrompt = [
    'blurry, low quality, distorted, cartoon, anime, illustration,',
    'painting, sketch, unrealistic, artificial, fake,',
    'overexposed, underexposed, harsh lighting, bad composition,',
    'multiple people, crowd, group photo,',
    'unprofessional, casual, messy background,',
    'watermark, text, logo, signature,',
    'deformed, disfigured, bad anatomy, extra limbs,',
    'nsfw, nude, inappropriate'
  ].join(' ');

  return { prompt, negativePrompt };
}

/**
 * Gera imagem usando fal.ai
 */
async function generateAvatarImage(avatar, persona) {
  try {
    console.log(`  🎨 Gerando imagem para ${persona.full_name}...`);
    
    const { prompt, negativePrompt } = buildImagePrompt(avatar, persona);
    
    console.log(`  📝 Prompt (primeiras 200 chars): ${prompt.substring(0, 200)}...`);
    
    // Usar modelo FLUX Schnell (rápido e eficiente)
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: prompt,
        negative_prompt: negativePrompt,
        image_size: {
          width: 1024,
          height: 1024
        },
        num_inference_steps: 4, // Schnell é otimizado para 4 steps
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'jpeg',
        guidance_scale: 3.5 // Schnell usa guidance baixo
      },
      logs: false,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(`    ⏳ Processando...`);
        }
      }
    });

    // CORREÇÃO: fal.ai retorna os dados diretamente no result, não em result.data
    if (!result.images || result.images.length === 0) {
      console.error('    ⚠️  Resposta da API:', JSON.stringify(result, null, 2));
      throw new Error('Nenhuma imagem retornada pela API');
    }

    const imageUrl = result.images[0].url;
    console.log(`  ✅ Imagem gerada: ${imageUrl.substring(0, 50)}...`);
    
    // Definir nome do arquivo baseado no persona_code
    const filename = `${persona.persona_code || persona.id}.jpg`;
    const filepath = path.join(AVATARS_DIR, filename);
    
    // Baixar imagem
    console.log(`  ⬇️  Baixando imagem...`);
    await downloadImage(imageUrl, filepath);
    console.log(`  💾 Salvo: ${filepath}`);
    
    // Atualizar registro do avatar com a URL local
    const localUrl = `/avatars/${filename}`;
    const { error: updateError } = await supabase
      .from('personas_avatares')
      .update({
        avatar_url: localUrl,
        avatar_thumbnail_url: localUrl,
        servico_usado: 'fal_ai_flux_schnell',
        metadados: JSON.stringify({
          ...(typeof avatar.metadados === 'string' ? JSON.parse(avatar.metadados) : avatar.metadados || {}),
          fal_ai: {
            model: 'flux/schnell',
            generated_at: new Date().toISOString(),
            image_url_original: imageUrl,
            local_path: filepath,
            prompt_used: prompt.substring(0, 500), // Salvar preview do prompt
            negative_prompt: negativePrompt.substring(0, 500)
          }
        })
      })
      .eq('id', avatar.id);

    if (updateError) {
      console.error(`    ⚠️  Erro ao atualizar avatar no banco:`, updateError.message);
    } else {
      console.log(`  ✅ Avatar atualizado no banco com URL local`);
    }

    return {
      success: true,
      localUrl,
      originalUrl: imageUrl,
      filepath
    };

  } catch (error) {
    console.error(`  ❌ Erro ao gerar imagem:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Função principal
 */
async function generateAvatarImages() {
  try {
    // Buscar empresa alvo
    const args = process.argv.slice(2);
    let empresaId = null;
    
    for (const arg of args) {
      if (arg.startsWith('--empresaId=')) {
        empresaId = arg.split('=')[1];
      }
    }
    
    if (!empresaId) {
      console.error('❌ Erro: --empresaId não fornecido');
      console.log('💡 Uso: node 01.3_generate_avatar_images.cjs --empresaId=ID');
      process.exit(1);
    }

    console.log(`🎯 Empresa alvo: ${empresaId}\n`);

    // Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      throw new Error(`Empresa não encontrada: ${empresaError?.message}`);
    }

    console.log(`🏢 Processando: ${empresa.nome}\n`);

    // Buscar todas as personas da empresa
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresaId);

    if (personasError) {
      throw new Error(`Erro ao buscar personas: ${personasError.message}`);
    }

    if (!personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      return;
    }

    // Buscar avatares separadamente
    const personaIds = personas.map(p => p.id);
    const { data: avatares, error: avataresError } = await supabase
      .from('personas_avatares')
      .select('*')
      .in('persona_id', personaIds);

    if (avataresError) {
      throw new Error(`Erro ao buscar avatares: ${avataresError.message}`);
    }

    // Combinar personas com seus avatares
    let personasComAvatar = personas
      .map(persona => {
        const avatar = avatares?.find(a => a.persona_id === persona.id);
        return avatar ? { ...persona, avatar } : null;
      })
      .filter(p => p !== null);

    // Modo força total: limpar imagens existentes
    if (forceClean) {
      console.log('🧹 MODO FORÇA TOTAL: Limpando imagens anteriores...');
      for (const p of personasComAvatar) {
        if (p.avatar.avatar_url?.startsWith('/avatars/')) {
          await supabase
            .from('personas_avatares')
            .update({ avatar_url: null })
            .eq('id', p.avatar.id);
        }
      }
      console.log('');
    }

    // Filtrar apenas personas sem imagem se modo incremental
    if (skipExisting) {
      const comImagem = personasComAvatar.filter(p => p.avatar.avatar_url?.startsWith('/avatars/'));
      const semImagem = personasComAvatar.filter(p => !p.avatar.avatar_url?.startsWith('/avatars/'));
      
      if (comImagem.length > 0) {
        console.log(`⏭️  MODO INCREMENTAL: Pulando ${comImagem.length} personas que já têm imagem`);
        console.log(`   ${comImagem.slice(0, 5).map(p => p.full_name).join(', ')}${comImagem.length > 5 ? '...' : ''}\n`);
      }
      
      personasComAvatar = semImagem;
    } else if (!forceClean) {
      console.log('🔄 MODO COMPLETO: Regenerando imagens de todas personas\n');
    }

    if (personasComAvatar.length === 0) {
      console.log('✅ Todas as personas já possuem imagens geradas!');
      console.log('💡 Use --force para regenerar tudo ou --all para substituir existentes');
      return;
    }

    console.log(`🎨 Gerando imagens para ${personasComAvatar.length} personas...\n`);

    // Inicializar progresso
    updateProgress('running', 0, personasComAvatar.length);

    let sucessos = 0;
    let erros = 0;
    const errorList = [];

    // Processar cada persona
    for (let i = 0; i < personasComAvatar.length; i++) {
      const personaData = personasComAvatar[i];
      const avatar = personaData.avatar;
      
      console.log(`\n[${i + 1}/${personasComAvatar.length}] ${personaData.full_name}`);
      updateProgress('running', i, personasComAvatar.length, personaData.full_name, errorList);
      
      const result = await generateAvatarImage(avatar, personaData);
      
      if (result.success) {
        sucessos++;
        console.log(`  ✅ Sucesso! URL: ${result.localUrl}`);
      } else {
        erros++;
        errorList.push({
          persona: personaData.full_name,
          error: result.error
        });
        console.error(`  ❌ Falha: ${result.error}`);
      }

      // Delay entre requests (respeitar rate limits da fal.ai)
      if (i < personasComAvatar.length - 1) {
        console.log(`  ⏳ Aguardando 3s antes da próxima geração...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // Finalizar progresso
    updateProgress('completed', personasComAvatar.length, personasComAvatar.length, '', errorList);

    // Relatório final
    console.log('\n📊 RELATÓRIO DE GERAÇÃO DE IMAGENS');
    console.log('===================================');
    console.log(`✅ Imagens geradas com sucesso: ${sucessos}`);
    console.log(`❌ Falhas: ${erros}`);
    console.log(`🎯 Taxa de sucesso: ${((sucessos / personasComAvatar.length) * 100).toFixed(1)}%`);
    console.log(`📁 Imagens salvas em: ${AVATARS_DIR}`);
    
    if (errorList.length > 0) {
      console.log('\n❌ Erros encontrados:');
      errorList.forEach(err => {
        console.log(`  - ${err.persona}: ${err.error}`);
      });
    }

    if (sucessos > 0) {
      console.log('\n🎉 SCRIPT 01.3 CONCLUÍDO!');
      console.log('💡 As imagens estão disponíveis em /avatars/[persona_code].jpg');
    }

  } catch (error) {
    console.error('\n❌ Erro crítico:', error.message);
    updateProgress('error', 0, 0, '', [{ error: error.message }]);
    process.exit(1);
  }
}

// Executar
generateAvatarImages();
