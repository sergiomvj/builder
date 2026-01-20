// ============================================================================
// SCRIPT 05c - DOWNLOAD E ARMAZENAMENTO LOCAL DE AVATARES
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 05b (imagens geradas)
// 
// O QUE FAZ:
// - Busca avatar_url de personas_avatares (URLs do Fal.ai)
// - Faz download das imagens para o servidor local
// - Salva em /public/avatars/{empresa_id}/{persona_id}.jpg
// - Gera thumbnails (200x200) para listagens
// - Atualiza avatar_local_path no banco
// - Suporta --retry-failed para completar downloads falhos
// 
// RESULTADO FINAL:
// - Imagens armazenadas localmente (não dependem de Fal.ai CDN)
// - Thumbnails otimizados para performance
// - URLs locais prontas para uso no frontend
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import sharp from 'sharp';

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

const PROGRESS_FILE = path.join(__dirname, 'script-progress.json');
const AVATARS_DIR = path.join(__dirname, '..', 'public', 'avatars');

console.log('💾 SCRIPT 05c - DOWNLOAD E ARMAZENAMENTO LOCAL');
console.log('===============================================');
console.log('📥 Download de imagens do Fal.ai CDN');
console.log('🖼️  Geração de thumbnails (200x200)');
console.log('💾 Armazenamento em /public/avatars/');
console.log('===============================================\n');

function updateProgress(status, current, total, currentPersona = '', errors = []) {
  const progress = {
    script: '05c_download_avatares',
    status,
    current,
    total,
    currentPersona,
    errors,
    startedAt: status === 'running' && current === 0 ? new Date().toISOString() : null,
    completedAt: status === 'completed' ? new Date().toISOString() : null
  };
  
  try {
    fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (err) {
    console.error('⚠️  Erro ao atualizar progresso:', err.message);
  }
}

/**
 * Faz download de imagem via HTTPS
 */
async function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      const fileStream = createWriteStream(destPath);
      
      pipeline(response, fileStream)
        .then(() => resolve(destPath))
        .catch(reject);
    }).on('error', reject);
  });
}

/**
 * Gera thumbnail otimizado usando Sharp
 */
async function gerarThumbnail(imagePath, thumbnailPath, size = 200) {
  await sharp(imagePath)
    .resize(size, size, {
      fit: 'cover',
      position: 'center'
    })
    .jpeg({ quality: 85 })
    .toFile(thumbnailPath);
}

/**
 * Processa download/cópia e thumbnail de um avatar
 */
async function processarAvatar(persona, avatarRecord, empresaDir) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`  🔄 Tentativa ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const imageUrl = avatarRecord.avatar_url;
      
      if (!imageUrl) {
        throw new Error('avatar_url não encontrado');
      }

      // Definir caminhos
      const filename = `${persona.id}.jpg`;
      const thumbnailFilename = `${persona.id}_thumb.jpg`;
      
      const imagePath = path.join(empresaDir, filename);
      const thumbnailPath = path.join(empresaDir, thumbnailFilename);

      // Deletar arquivos antigos se existirem
      try {
        await fs.unlink(imagePath).catch(() => {});
        await fs.unlink(thumbnailPath).catch(() => {});
      } catch (e) {
        // Ignorar erros
      }

      // Verificar se é URL HTTP ou caminho local (Pollinations.ai salva localmente)
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        console.log(`  📥 Baixando de URL...`);
        await downloadImage(imageUrl, imagePath);
      } else {
        // Caminho local (temp_avatars) - copiar arquivo
        console.log(`  📁 Copiando de arquivo local...`);
        await fs.copyFile(imageUrl, imagePath);
      }
      
      console.log(`  ✅ Imagem salva: ${filename}`);

      // Gerar thumbnail
      await gerarThumbnail(imagePath, thumbnailPath);
      console.log(`  ✅ Thumbnail gerado: ${thumbnailFilename}`);

      // Aguardar para liberar file handles (Windows)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Gerar URLs locais (relativo a /public)
      const empresaId = persona.empresa_id;
      const localUrl = `/avatars/${empresaId}/${filename}`;
      const localThumbnailUrl = `/avatars/${empresaId}/${thumbnailFilename}`;

      // Obter tamanhos dos arquivos (com retry por causa do Windows file locking)
      let imageSizeKb = 0;
      let thumbnailSizeKb = 0;
      try {
        const imageStats = await fs.stat(imagePath);
        imageSizeKb = Math.round(imageStats.size / 1024);
        const thumbStats = await fs.stat(thumbnailPath);
        thumbnailSizeKb = Math.round(thumbStats.size / 1024);
      } catch (statError) {
        console.log(`  ⚠️  Não foi possível obter tamanhos de arquivo: ${statError.message}`);
      }

      // Atualizar banco de dados
      const { error: updateError } = await supabase
        .from('personas_avatares')
        .update({
          avatar_local_path: localUrl,
          avatar_thumbnail_local_path: localThumbnailUrl,
          metadados: {
            ...avatarRecord.metadados,
            local_storage: {
              downloaded_at: new Date().toISOString(),
              file_path: imagePath,
              thumbnail_path: thumbnailPath,
              file_size_kb: imageSizeKb,
              thumbnail_size_kb: thumbnailSizeKb
            },
            awaiting_download: false,
            status: 'completed'
          },
          updated_at: new Date().toISOString()
        })
        .eq('persona_id', persona.id);

      if (updateError) {
        throw updateError;
      }

      console.log('  ✅ Paths locais salvos no banco');
      return true;

    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        console.error(`    ❌ Erro após ${maxRetries} tentativas:`, error.message);
        return false;
      }
    }
  }
  
  return false;
}

async function downloadAvatares() {
  try {
    const args = process.argv.slice(2);
    let empresaId = null;
    let retryFailed = false;
    let forceReprocess = false;
    
    for (const arg of args) {
      if (arg.startsWith('--empresaId=')) {
        empresaId = arg.split('=')[1];
      } else if (arg === '--retry-failed') {
        retryFailed = true;
      } else if (arg === '--force') {
        forceReprocess = true;
      }
    }
    
    if (!empresaId) {
      console.error('❌ --empresaId não fornecido');
      console.log('💡 Uso: node 05c_download_avatares.js --empresaId=ID [--retry-failed] [--force]');
      console.log('\n📝 Opções:');
      console.log('   --retry-failed: Processa apenas falhas anteriores');
      console.log('   --force: Reprocessa TODAS as imagens (ignora status)');
      process.exit(1);
    }

    // 1. Verificar empresa
    console.log(`🔍 Procurando empresa: ${empresaId}`);
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      console.error(`❌ Empresa não encontrada: ${empresaId}`);
      console.error(`   Erro: ${empresaError?.message}`);
      throw new Error(`Empresa não encontrada: ${empresaId}`);
    }

    console.log(`✅ Empresa encontrada: ${empresa.nome} (ID: ${empresa.id})`);

    console.log(`🏢 Empresa: ${empresa.nome}\n`);

    // 2. Criar diretório da empresa
    const empresaDir = path.join(AVATARS_DIR, empresaId);
    await fs.mkdir(empresaDir, { recursive: true });
    console.log(`📁 Diretório criado: ${empresaDir}\n`);

    // 3. Buscar personas
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      return;
    }

    // 4. Buscar avatares com URLs (gerados pelo Script 05b)
    console.log(`🔍 Buscando avatares para ${personas.length} personas...`);
    const { data: avatares, error: avataresError } = await supabase
      .from('personas_avatares')
      .select('*')
      .in('persona_id', personas.map(p => p.id))
      .not('avatar_url', 'is', null);

    console.log(`📊 Query result:`, {
      hasData: !!avatares,
      length: avatares?.length || 0,
      hasError: !!avataresError,
      errorMessage: avataresError?.message
    });

    if (avataresError) throw new Error(`Erro ao buscar avatares: ${avataresError.message}`);

    if (!avatares || avatares.length === 0) {
      console.log('⚠️  Nenhuma imagem encontrada!');
      console.log('💡 Execute primeiro: node 05b_generate_images_fal.js --empresaId=' + empresaId);
      return;
    }

    console.log(`✅ Encontrados ${avatares.length} avatares com URLs`);

    // Filtrar avatares baseado nos flags
    let avataresPendentes;
    
    if (forceReprocess) {
      console.log('⚡ Modo --force: Reprocessando TODAS as imagens');
      avataresPendentes = avatares.filter(a => a.avatar_url);
    } else if (retryFailed) {
      console.log('🔄 Modo --retry-failed: Processando falhas');
      avataresPendentes = avatares.filter(a => !a.avatar_local_path);
    } else {
      avataresPendentes = avatares.filter(a => a.avatar_url && !a.avatar_local_path);
    }

    if (avataresPendentes.length === 0) {
      console.log('✅ Todas as imagens já foram baixadas!');
      console.log('💡 Use --retry-failed para tentar novamente as falhas');
      console.log('💡 Use --force para reprocessar TODAS as imagens\n');
      return;
    }

    console.log(`💾 Baixando ${avataresPendentes.length} imagens...\n`);

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
      
      console.log(`\n[${i + 1}/${avataresPendentes.length}] ${persona.full_name}`);
      console.log(`  🔗 URL: ${avatarRecord.avatar_url?.substring(0, 65)}...`);
      console.log(`  🎲 Seed: ${avatarRecord.metadados?.fal_ai_generation?.seed_used || 'N/A'}`);
      updateProgress('running', i, avataresPendentes.length, persona.full_name, errorList);

      const sucesso = await processarAvatar(persona, avatarRecord, empresaDir);
      
      if (sucesso) {
        sucessos++;
      } else {
        erros++;
        errorList.push({
          persona: persona.full_name,
          error: 'Falha ao baixar/processar imagem'
        });
      }

      // Delay entre downloads
      if (i < avataresPendentes.length - 1) {
        console.log('  ⏳ Aguardando 1s...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    updateProgress('completed', avataresPendentes.length, avataresPendentes.length, '', errorList);

    console.log('\n📊 RELATÓRIO');
    console.log('=============');
    console.log(`✅ Downloads concluídos: ${sucessos}`);
    console.log(`❌ Falhas: ${erros}`);
    console.log(`📁 Imagens salvas em: ${empresaDir}`);
    console.log(`🔗 URLs locais em: personas_avatares (campos avatar_local_path, avatar_thumbnail_local_path)`);
    console.log('\n✨ PIPELINE DE AVATARES COMPLETO!');
    console.log('   - Script 05a: Prompts gerados ✅');
    console.log('   - Script 05b: Imagens geradas (Fal.ai) ✅');
    console.log('   - Script 05c: Download local ✅');
    console.log('\n🎉 Avatares prontos para uso no frontend!');

  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    updateProgress('error', 0, 0, '', [{ error: error.message }]);
    process.exit(1);
  }
}

downloadAvatares();
