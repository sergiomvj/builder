// SCRIPT SIMPLIFICADO - DOWNLOAD AVATARES EXISTENTES
// Faz download das imagens DiceBear atuais para armazenamento local

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '../../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📥 DOWNLOAD DE AVATARES EXISTENTES');
console.log('==================================');

async function downloadAvatar(avatarUrl, personaName, personaId) {
  try {
    console.log(`  📥 Baixando: ${personaName}`);
    
    // Criar nome do arquivo
    const fileName = `${personaName.toLowerCase().replace(/\s+/g, '_')}_${personaId.slice(0, 8)}.svg`;
    
    // Criar diretório se não existir
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
      console.log(`  📁 Diretório criado: ${avatarsDir}`);
    }
    
    const localPath = path.join(avatarsDir, fileName);
    const publicUrl = `/avatars/${fileName}`;
    
    // Download da imagem
    const response = await fetch(avatarUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const svgContent = await response.text();
    
    // Salvar arquivo
    fs.writeFileSync(localPath, svgContent, 'utf8');
    
    const fileSize = Buffer.byteLength(svgContent, 'utf8');
    console.log(`  ✅ Salvo: ${fileName} (${fileSize} bytes)`);
    
    return {
      localPath,
      publicUrl,
      fileName,
      fileSize
    };
    
  } catch (error) {
    console.error(`  ❌ Erro ao baixar ${personaName}:`, error.message);
    return null;
  }
}

async function updateAvatarInDatabase(personaId, publicUrl, fileName, fileSize) {
  try {
    const { error } = await supabase
      .from('personas_avatares')
      .update({
        avatar_url: publicUrl,
        avatar_thumbnail_url: publicUrl,
        servico_usado: 'dicebear_local',
        estilo: 'Profissional Local',
        versao: 'v2.0_local',
        local_file: fileName,
        file_size: fileSize,
        updated_at: new Date().toISOString()
      })
      .eq('persona_id', personaId);
      
    if (error) {
      console.error(`  ❌ Erro ao atualizar DB:`, error.message);
      return false;
    }
    
    console.log(`  💾 Database atualizado para persona ${personaId.slice(0, 8)}`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Erro no update:`, error.message);
    return false;
  }
}

async function downloadAllAvatars() {
  try {
    // Buscar todos os avatares atuais
    const { data: avatars, error } = await supabase
      .from('personas_avatares')
      .select(`
        persona_id,
        avatar_url,
        personas!inner(full_name)
      `)
      .eq('ativo', true);
      
    if (error) {
      throw new Error(`Erro ao buscar avatares: ${error.message}`);
    }
    
    console.log(`🔍 Encontrados ${avatars.length} avatares para download\n`);
    
    let sucessos = 0;
    let erros = 0;
    
    for (const avatar of avatars) {
      const personaName = avatar.personas.full_name;
      const personaId = avatar.persona_id;
      const avatarUrl = avatar.avatar_url;
      
      // Só baixar se for URL externa (DiceBear ou Google)
      if (avatarUrl.startsWith('http')) {
        const downloadResult = await downloadAvatar(avatarUrl, personaName, personaId);
        
        if (downloadResult) {
          const updateSuccess = await updateAvatarInDatabase(
            personaId, 
            downloadResult.publicUrl, 
            downloadResult.fileName, 
            downloadResult.fileSize
          );
          
          if (updateSuccess) {
            sucessos++;
          } else {
            erros++;
          }
        } else {
          erros++;
        }
        
        // Pausa entre downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`  ⏭️  Pulando ${personaName}: já é local`);
      }
    }
    
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`✅ Downloads realizados: ${sucessos}`);
    console.log(`❌ Falhas: ${erros}`);
    console.log(`📁 Diretório: /public/avatars/`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

downloadAllAvatars();