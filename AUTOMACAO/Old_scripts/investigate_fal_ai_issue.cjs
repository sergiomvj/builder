// INVESTIGAÇÃO COMPLETA DO PROBLEMA FAL.AI
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 INVESTIGAÇÃO: PROBLEMA COM FAL.AI');
console.log('=====================================\n');

async function investigate() {
  try {
    // 1. Buscar um avatar de exemplo
    const { data: avatar, error } = await supabase
      .from('personas_avatares')
      .select('*')
      .eq('servico_usado', 'grok_openrouter')
      .limit(1)
      .single();

    if (error || !avatar) {
      console.error('❌ Erro ao buscar avatar:', error?.message);
      return;
    }

    console.log('📋 DADOS DO AVATAR GERADO PELO SCRIPT 00 (GROK)');
    console.log('=================================================\n');

    console.log('1️⃣ CAMPO: avatar_url');
    console.log('Valor:', avatar.avatar_url);
    console.log('Tipo:', typeof avatar.avatar_url);
    console.log('');

    console.log('2️⃣ CAMPO: biometrics');
    console.log('Tipo original:', typeof avatar.biometrics);
    console.log('É string?', typeof avatar.biometrics === 'string');
    
    let biometrics = avatar.biometrics;
    if (typeof biometrics === 'string') {
      try {
        biometrics = JSON.parse(biometrics);
        console.log('✅ Parseado com sucesso');
      } catch (e) {
        console.log('❌ Erro ao parsear:', e.message);
      }
    }
    
    console.log('\n📊 Estrutura biometrics:');
    console.log(JSON.stringify(biometrics, null, 2));
    console.log('');

    console.log('3️⃣ CAMPO: metadados');
    console.log('Tipo original:', typeof avatar.metadados);
    console.log('É string?', typeof avatar.metadados === 'string');
    
    let metadados = avatar.metadados;
    if (typeof metadados === 'string') {
      try {
        metadados = JSON.parse(metadados);
        console.log('✅ Parseado com sucesso');
      } catch (e) {
        console.log('❌ Erro ao parsear:', e.message);
      }
    }
    
    console.log('\n📊 Estrutura metadados:');
    console.log(JSON.stringify(metadados, null, 2));
    console.log('');

    console.log('4️⃣ ANÁLISE DO SCRIPT 01.3');
    console.log('==========================\n');

    console.log('O Script 01.3 faz isso:');
    console.log('1. Busca biometrics do avatar');
    console.log('2. Constrói um prompt DETALHADO baseado nos biometrics');
    console.log('3. Envia para fal.ai FLUX Schnell');
    console.log('4. Espera receber: result.data.images[0].url');
    console.log('');

    console.log('⚠️  PROBLEMA IDENTIFICADO:');
    console.log('O Script 00 (Grok) salva biometrics como OBJETO JSON completo.');
    console.log('O Script 01.3 tenta ler esse objeto e construir um prompt.');
    console.log('');

    console.log('🔍 Campos disponíveis em biometrics:');
    if (biometrics && typeof biometrics === 'object') {
      Object.keys(biometrics).forEach(key => {
        const value = biometrics[key];
        const preview = typeof value === 'string' 
          ? value.substring(0, 50)
          : JSON.stringify(value).substring(0, 50);
        console.log(`  - ${key}: ${preview}...`);
      });
    }
    console.log('');

    console.log('💡 TESTE: Construir prompt como o Script 01.3 faz');
    console.log('================================================\n');

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
    ];

    const prompt = parts.filter(p => p).join(' ');
    
    console.log('📝 PROMPT CONSTRUÍDO:');
    console.log(prompt);
    console.log('');
    console.log(`📏 Tamanho: ${prompt.length} caracteres`);
    console.log('');

    console.log('✅ PROMPT PARECE VÁLIDO!');
    console.log('');
    console.log('🔍 PRÓXIMO PASSO: Testar chamada real à API fal.ai');
    console.log('Sugestão: Execute o Script 01.3 com APENAS UMA persona para debug');

  } catch (error) {
    console.error('❌ Erro na investigação:', error.message);
    console.error(error.stack);
  }
}

investigate();
