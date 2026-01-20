// INTEGRAÇÃO COM MIDJOURNEY API
// Para geração automática de imagens de cenas de trabalho

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Opção 1: Usar serviço de API não-oficial (ex: goapi.ai, useapi.net)
// Opção 2: Usar Discord Bot próprio (mais complexo mas gratuito)
// Opção 3: Usar thenextleg.io (API wrapper oficial)

const MIDJOURNEY_API_URL = 'https://api.thenextleg.io/v2'; // Exemplo
const MIDJOURNEY_API_KEY = process.env.MIDJOURNEY_API_KEY;

export async function generateImageWithMidjourney(prompt, webhookUrl = null) {
  try {
    console.log('🎨 Iniciando geração no Midjourney...');
    
    // 1. Enviar prompt para Midjourney
    const response = await axios.post(
      `${MIDJOURNEY_API_URL}/imagine`,
      {
        msg: prompt,
        ref: '', // Referência opcional para consistência
        webhookOverride: webhookUrl,
        ignorePrefilter: false
      },
      {
        headers: {
          'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const messageId = response.data.messageId;
    console.log(`✅ Job criado: ${messageId}`);

    // 2. Polling para verificar status
    let attempts = 0;
    const maxAttempts = 60; // 5 minutos (5s * 60)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s
      
      const statusResponse = await axios.get(
        `${MIDJOURNEY_API_URL}/message/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`
          }
        }
      );

      const status = statusResponse.data;
      
      if (status.progress === 100) {
        console.log('✅ Imagem gerada com sucesso!');
        return {
          success: true,
          imageUrl: status.response.imageUrl,
          imageUrls: status.response.imageUrls, // Array com 4 variações
          messageId: messageId,
          buttons: status.response.buttons // U1, U2, U3, U4, V1, V2, V3, V4
        };
      }

      console.log(`⏳ Progresso: ${status.progress}%`);
      attempts++;
    }

    throw new Error('Timeout: geração excedeu 5 minutos');

  } catch (error) {
    console.error('❌ Erro ao gerar imagem:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function upscaleImage(messageId, buttonIndex) {
  try {
    console.log(`🔍 Upscaling imagem ${buttonIndex}...`);
    
    const response = await axios.post(
      `${MIDJOURNEY_API_URL}/button`,
      {
        button: `U${buttonIndex}`, // U1, U2, U3, ou U4
        messageId: messageId
      },
      {
        headers: {
          'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const newMessageId = response.data.messageId;
    
    // Polling para upscale
    let attempts = 0;
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await axios.get(
        `${MIDJOURNEY_API_URL}/message/${newMessageId}`,
        {
          headers: {
            'Authorization': `Bearer ${MIDJOURNEY_API_KEY}`
          }
        }
      );

      if (statusResponse.data.progress === 100) {
        console.log('✅ Upscale concluído!');
        return {
          success: true,
          imageUrl: statusResponse.data.response.imageUrl
        };
      }

      attempts++;
    }

    throw new Error('Timeout no upscale');

  } catch (error) {
    console.error('❌ Erro no upscale:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function downloadImage(imageUrl, outputPath) {
  try {
    console.log('📥 Baixando imagem...');
    
    const response = await axios.get(imageUrl, {
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Imagem salva: ${outputPath}`);
        resolve(true);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('❌ Erro ao baixar imagem:', error.message);
    return false;
  }
}

// Exemplo de uso completo
export async function generateAndSaveWorkplaceScene(scenarioId, prompt, outputDir) {
  try {
    // 1. Gerar imagem (4 variações)
    const result = await generateImageWithMidjourney(prompt);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    // 2. Salvar metadata
    const metadata = {
      scenario_id: scenarioId,
      messageId: result.messageId,
      imageUrls: result.imageUrls,
      generated_at: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(outputDir, `${scenarioId}_metadata.json`),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );

    // 3. Baixar grade com 4 variações
    await downloadImage(
      result.imageUrl,
      path.join(outputDir, `${scenarioId}_grid.png`)
    );

    // 4. Upscale da melhor variação (ex: U1)
    console.log('\n🔍 Selecionando melhor variação para upscale...');
    const upscaled = await upscaleImage(result.messageId, 1);
    
    if (upscaled.success) {
      await downloadImage(
        upscaled.imageUrl,
        path.join(outputDir, `${scenarioId}_final.png`)
      );
    }

    return {
      success: true,
      gridPath: path.join(outputDir, `${scenarioId}_grid.png`),
      finalPath: upscaled.success ? path.join(outputDir, `${scenarioId}_final.png`) : null,
      metadata
    };

  } catch (error) {
    console.error('❌ Erro no processo completo:', error.message);
    return { success: false, error: error.message };
  }
}

// Exemplo de uso
/*
const prompt = fs.readFileSync('workplace_scenes_prompts/reuniao_estrategica_2025-11-28T15-30-00.txt', 'utf8');
const result = await generateAndSaveWorkplaceScene(
  'reuniao_estrategica',
  prompt + ' --ar 16:9 --q 2 --style raw --v 6',
  'public/images/workplace_scenes/arva_tech'
);
*/
