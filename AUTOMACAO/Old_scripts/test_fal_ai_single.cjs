// TESTE: Chamada REAL à API fal.ai com UMA persona
const { createClient } = require('@supabase/supabase-js');
const fal = require('@fal-ai/serverless-client');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const falApiKey = process.env.FAL_AI_API_KEY;

if (!falApiKey) {
  console.error('❌ FAL_AI_API_KEY não encontrada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurar fal.ai
fal.config({
  credentials: falApiKey
});

console.log('🧪 TESTE: Chamada FAL.AI com 1 persona');
console.log('======================================\n');

async function testFalAI() {
  try {
    // Buscar 1 avatar
    const { data: avatar, error } = await supabase
      .from('personas_avatares')
      .select('*, personas(*)')
      .eq('servico_usado', 'grok_openrouter')
      .limit(1)
      .single();

    if (error || !avatar) {
      console.error('❌ Erro ao buscar avatar:', error?.message);
      return;
    }

    console.log(`📋 Persona: ${avatar.personas.full_name}`);
    console.log(`📋 Cargo: ${avatar.personas.role}\n`);

    const biometrics = avatar.biometrics;

    const parts = [
      'Professional corporate headshot photograph, ultra high quality, 8K resolution, DSLR quality,',
      `${biometrics.genero || 'pessoa'} profissional,`,
      `${biometrics.idade_aparente || '30-40 anos'},`,
      `${biometrics.etnia || 'caucasiano'} ethnicity,`,
      `${biometrics.pele_tom || 'pele clara'} skin tone,`,
      `${biometrics.pele_textura || 'pele lisa'},`,
      `${biometrics.rosto_formato || 'rosto oval'},`,
      `${biometrics.expressao_facial_padrao || 'expressão confiante'},`,
      `${biometrics.olhos_cor || 'olhos castanhos'},`,
      `${biometrics.olhos_formato || 'olhos amendoados'},`,
      `${biometrics.sobrancelhas || 'sobrancelhas grossas'},`,
      `${biometrics.nariz || 'nariz fino'},`,
      `${biometrics.boca_labios || 'lábios médios'},`,
      `${biometrics.cabelo_cor || 'cabelo castanho escuro'},`,
      `${biometrics.cabelo_comprimento || 'cabelo curto'},`,
      `${biometrics.cabelo_estilo || 'cabelo liso'},`,
      `${biometrics.cabelo_volume || 'volumoso'},`,
      `${biometrics.tipo_fisico || 'tipo atlético'},`,
      `${biometrics.postura || 'postura ereta e confiante'},`,
      `wearing ${biometrics.estilo_vestimenta_padrao || 'formal business attire'},`,
      `${biometrics.paleta_cores_vestuario || 'blue and gray tones'},`,
      `${avatar.personas.role} professional,`,
      `${avatar.personas.department} department,`,
      'soft studio lighting, neutral gray background,',
      'professional corporate photography, clean composition,',
      'centered framing, looking at camera,',
      'professional headshot style, LinkedIn profile quality,',
      'sharp focus, natural colors, realistic skin texture,',
      'professional color grading, commercial photography quality'
    ];

    const prompt = parts.filter(p => p).join(' ');
    
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

    console.log('📝 PROMPT:');
    console.log(prompt);
    console.log('');
    console.log('❌ NEGATIVE PROMPT:');
    console.log(negativePrompt);
    console.log('\n🎨 Chamando fal.ai FLUX Schnell...\n');

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: prompt,
        negative_prompt: negativePrompt,
        image_size: {
          width: 1024,
          height: 1024
        },
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'jpeg',
        guidance_scale: 3.5
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`📊 Status: ${update.status}`);
        if (update.status === 'IN_PROGRESS') {
          console.log('⏳ Processando...');
        }
      }
    });

    console.log('\n📦 RESPOSTA COMPLETA DA API:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');

    if (!result.data) {
      console.error('❌ result.data é undefined!');
      return;
    }

    if (!result.data.images) {
      console.error('❌ result.data.images é undefined!');
      console.error('📋 Campos disponíveis em result.data:', Object.keys(result.data));
      return;
    }

    if (result.data.images.length === 0) {
      console.error('❌ result.data.images está vazio!');
      return;
    }

    const imageUrl = result.data.images[0].url;
    console.log('✅ SUCESSO!');
    console.log(`🖼️  URL da imagem: ${imageUrl}`);

  } catch (error) {
    console.error('\n❌ ERRO NA CHAMADA:', error.message);
    console.error('📋 Stack:', error.stack);
    
    if (error.body) {
      console.error('📋 Corpo do erro:', JSON.stringify(error.body, null, 2));
    }
  }
}

testFalAI();
