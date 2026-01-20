// Script para baixar imagens de avatares do Supabase
const path = require('path');
require('dotenv').config({ path: 'c:\\Projetos\\vcm_vite_react\\.env.local' });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const OUTPUT_DIR = path.join(process.cwd(), 'downloaded_avatars');

async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(OUTPUT_DIR, filename);
    const file = fs.createWriteStream(filePath);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✅ Baixada: ${filename}`);
        resolve(filePath);
      });

      file.on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

async function downloadAllAvatars() {
  console.log('🎭 Baixando imagens de avatares...\n');

  try {
    const { data: images, error } = await supabase
      .from('avatares_multimedia')
      .select('id, title, file_url, personas_metadata, generation_service, created_at')
      .eq('generation_service', 'fal')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar imagens: ${error.message}`);
    }

    if (!images || images.length === 0) {
      console.log('⚠️ Nenhuma imagem encontrada');
      return;
    }

    console.log(`📸 Encontradas ${images.length} imagens para baixar\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const personaName = image.personas_metadata?.[0]?.name || 'Unknown';
      const personaRole = image.personas_metadata?.[0]?.role || 'Unknown';

      const cleanName = personaName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      const cleanRole = personaRole.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      const filename = `${cleanName}_${cleanRole}_${image.id}.jpg`;

      try {
        console.log(`[${i + 1}/${images.length}] Baixando ${personaName} - ${personaRole}...`);
        await downloadImage(image.file_url, filename);
        successCount++;
      } catch (error) {
        console.error(`❌ Erro ao baixar ${filename}: ${error.message}`);
        errorCount++;
      }

      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('\n📊 RESUMO DO DOWNLOAD');
    console.log('='.repeat(40));
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Falhas: ${errorCount}`);
    console.log(`📁 Total: ${images.length}`);
    console.log(`📂 Salvas em: ${OUTPUT_DIR}`);

    if (successCount > 0) {
      console.log('\n🎉 DOWNLOAD CONCLUÍDO!');
      console.log(`As imagens estão disponíveis em: ${OUTPUT_DIR}`);
    }

  } catch (error) {
    console.error('❌ ERRO FATAL:', error.message);
    process.exit(1);
  }
}

downloadAllAvatars();