// Script para baixar e armazenar imagens dos avatares localmente
// Faz download das URLs da fal.ai e salva em public/avatars/
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const https = require('https');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const AVATARS_DIR = path.join(__dirname, '..', 'public', 'avatars');

// Criar diretório se não existir
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
  console.log(`✅ Diretório criado: ${AVATARS_DIR}`);
}

console.log('💾 SCRIPT - DOWNLOAD E ARMAZENAMENTO DE IMAGENS DE AVATARES');
console.log('============================================================');
console.log('📁 Destino: public/avatars/');
console.log('🎯 Objetivo: Fazer fallback das imagens da fal.ai para arquivos locais');
console.log('============================================================\n');

/**
 * Baixa imagem de uma URL e salva localmente
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    // Usar https ou http baseado na URL
    const protocol = url.startsWith('https') ? https : require('http');
    
    const file = fs.createWriteStream(filepath);
    protocol.get(url, (response) => {
      // Seguir redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(filepath, () => {});
        return downloadImage(response.headers.location, filepath)
          .then(resolve)
          .catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(filepath, () => {});
        return reject(new Error(`HTTP ${response.statusCode}`));
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

/**
 * Extrai URL original da fal.ai dos metadados
 */
function getOriginalImageUrl(avatar) {
  try {
    let metadados = avatar.metadados;
    
    // Parse se for string
    if (typeof metadados === 'string') {
      metadados = JSON.parse(metadados);
    }
    
    // Tentar pegar URL original da fal.ai nos metadados
    if (metadados?.fal_ai?.image_url_original) {
      return metadados.fal_ai.image_url_original;
    }
    
    // Se não tiver nos metadados, tentar usar avatar_url se for externa
    if (avatar.avatar_url && !avatar.avatar_url.startsWith('/avatars/')) {
      return avatar.avatar_url;
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

async function downloadAvatarImages() {
  try {
    const args = process.argv.slice(2);
    let empresaId = null;
    
    for (const arg of args) {
      if (arg.startsWith('--empresaId=')) {
        empresaId = arg.split('=')[1];
      }
    }
    
    if (!empresaId) {
      console.error('❌ Erro: --empresaId não fornecido');
      console.log('💡 Uso: node download_avatar_images.cjs --empresaId=ID');
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

    // Buscar todas as personas
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

    // Buscar avatares
    const personaIds = personas.map(p => p.id);
    const { data: avatares, error: avataresError } = await supabase
      .from('personas_avatares')
      .select('*')
      .in('persona_id', personaIds);

    if (avataresError) {
      throw new Error(`Erro ao buscar avatares: ${avataresError.message}`);
    }

    if (!avatares || avatares.length === 0) {
      console.log('⚠️  Nenhum avatar encontrado');
      return;
    }

    console.log(`💾 Processando ${avatares.length} avatares...\n`);

    let downloaded = 0;
    let skipped = 0;
    let errors = 0;
    const errorList = [];

    for (let i = 0; i < avatares.length; i++) {
      const avatar = avatares[i];
      const persona = personas.find(p => p.id === avatar.persona_id);
      
      if (!persona) {
        console.log(`⚠️  Avatar sem persona correspondente, pulando...`);
        skipped++;
        continue;
      }

      console.log(`\n[${i + 1}/${avatares.length}] ${persona.full_name}`);
      
      // Definir nome do arquivo
      const filename = `${persona.persona_code || persona.id}.jpg`;
      const filepath = path.join(AVATARS_DIR, filename);
      const localUrl = `/avatars/${filename}`;
      
      // Verificar se já existe localmente
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        console.log(`  ✅ Arquivo já existe (${(stats.size / 1024).toFixed(1)} KB)`);
        
        // Atualizar banco se necessário
        if (avatar.avatar_url !== localUrl) {
          const { error: updateError } = await supabase
            .from('personas_avatares')
            .update({ avatar_url: localUrl, avatar_thumbnail_url: localUrl })
            .eq('id', avatar.id);
          
          if (!updateError) {
            console.log(`  ✅ URL atualizada no banco: ${localUrl}`);
          }
        }
        
        skipped++;
        continue;
      }
      
      // Tentar obter URL original
      const originalUrl = getOriginalImageUrl(avatar);
      
      if (!originalUrl) {
        console.log(`  ⚠️  Sem URL original, pulando...`);
        skipped++;
        continue;
      }
      
      console.log(`  🔗 URL: ${originalUrl.substring(0, 60)}...`);
      
      try {
        console.log(`  ⬇️  Baixando...`);
        await downloadImage(originalUrl, filepath);
        
        const stats = fs.statSync(filepath);
        console.log(`  💾 Salvo: ${filepath} (${(stats.size / 1024).toFixed(1)} KB)`);
        
        // Atualizar banco com URL local
        const { error: updateError } = await supabase
          .from('personas_avatares')
          .update({
            avatar_url: localUrl,
            avatar_thumbnail_url: localUrl
          })
          .eq('id', avatar.id);

        if (updateError) {
          console.log(`  ⚠️  Erro ao atualizar banco: ${updateError.message}`);
        } else {
          console.log(`  ✅ URL atualizada no banco: ${localUrl}`);
        }
        
        downloaded++;
        
      } catch (error) {
        console.error(`  ❌ Erro ao baixar: ${error.message}`);
        errors++;
        errorList.push({
          persona: persona.full_name,
          error: error.message
        });
      }
      
      // Pequeno delay entre downloads
      if (i < avatares.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO DE DOWNLOAD');
    console.log('========================');
    console.log(`✅ Imagens baixadas: ${downloaded}`);
    console.log(`⏭️  Já existiam localmente: ${skipped}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📁 Diretório: ${AVATARS_DIR}`);
    
    if (errorList.length > 0) {
      console.log('\n❌ Erros encontrados:');
      errorList.forEach(err => {
        console.log(`  - ${err.persona}: ${err.error}`);
      });
    }

    console.log('\n🎉 DOWNLOAD CONCLUÍDO!');
    console.log('💡 As imagens agora estão armazenadas localmente como fallback');

  } catch (error) {
    console.error('\n❌ Erro crítico:', error.message);
    process.exit(1);
  }
}

downloadAvatarImages();
