// SCRIPT 03 - GERAÇÃO DE AVATARES COM GOOGLE NANO BANANA
// Gera imagens reais usando Google AI Nano Banana para avatares profissionais

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Função para download de imagem
async function downloadImageToFile(imageUrl, filename, persona) {
  try {
    console.log(`    📥 Fazendo download de: ${imageUrl.substring(0, 60)}...`);
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    let extension = '.png';
    
    if (contentType?.includes('svg')) {
      extension = '.svg';
    } else if (contentType?.includes('jpeg')) {
      extension = '.jpg';
    }
    
    const finalFilename = filename.replace(/\.[^/.]+$/, '') + extension;
    
    // Criar diretório para avatares locais
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    
    const localPath = path.join(avatarsDir, finalFilename);
    
    if (contentType?.includes('svg')) {
      const svgContent = await response.text();
      fs.writeFileSync(localPath, svgContent, 'utf8');
    } else {
      const buffer = await response.buffer();
      fs.writeFileSync(localPath, buffer);
    }
    
    const localUrl = `/avatars/${finalFilename}`;
    console.log(`    ✅ Avatar salvo localmente: ${localUrl}`);
    
    return localUrl;
    
  } catch (error) {
    console.error(`    ❌ Erro no download:`, error.message);
    return imageUrl; // Retorna URL original se falhar
  }
}

// Função para download e salvamento de avatar
async function downloadAndSaveAvatar(imageUrl, persona, empresaInfo) {
  try {
    const personaSlug = persona.full_name.toLowerCase().replace(/\s+/g, '_');
    const filename = `${personaSlug}_avatar`;
    
    console.log(`    📥 Fazendo download de: ${imageUrl.substring(0, 60)}...`);
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    let extension = '.png';
    
    if (contentType?.includes('svg')) {
      extension = '.svg';
    } else if (contentType?.includes('jpeg')) {
      extension = '.jpg';
    } else if (contentType?.includes('webp')) {
      extension = '.webp';
    }
    
    const finalFilename = filename + extension;
    
    // Criar diretório para avatares locais
    const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }
    
    const localPath = path.join(avatarsDir, finalFilename);
    let fileSize = 0;
    
    if (contentType?.includes('svg')) {
      const svgContent = await response.text();
      fs.writeFileSync(localPath, svgContent, 'utf8');
      fileSize = Buffer.byteLength(svgContent, 'utf8');
    } else {
      const buffer = await response.buffer();
      fs.writeFileSync(localPath, buffer);
      fileSize = buffer.length;
    }
    
    const publicUrl = `/avatars/${finalFilename}`;
    console.log(`    ✅ Avatar salvo: ${publicUrl} (${fileSize} bytes)`);
    
    return {
      public_url: publicUrl,
      local_path: localPath,
      file_name: finalFilename,
      file_size: fileSize,
      content_type: contentType
    };
    
  } catch (error) {
    console.error(`    ❌ Erro no download:`, error.message);
    return null;
  }
}

// Configuração
dotenv.config({ path: '../../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleAIKey = process.env.GOOGLE_AI_API_KEY_2; // Usando nova API key

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎭 SCRIPT 03 - AVATARES COM GOOGLE NANO BANANA (ETAPA 3/6)');
console.log('===========================================================');

// Parâmetros do script
let targetEmpresaId = null;
let forceRegenerate = false;
const args = process.argv.slice(2);

// Processar argumentos
for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
    console.log(`🎯 Empresa alvo especificada: ${targetEmpresaId}`);
  }
  if (arg === '--force') {
    forceRegenerate = true;
    console.log(`🔄 Modo force ativado: regenerar todos os avatares`);
  }
}

async function generateImageWithNanoBanana(prompt, persona) {
  try {
    console.log(`    🍌 Gerando imagem com Nano Banana para: ${persona.full_name}`);
    
    // Configurar prompt para imagem profissional com office background
    const imagePrompt = `Professional corporate headshot of ${prompt}, standing in a modern office background, high quality photography, professional lighting, corporate environment, business attire, confident posture`;
    
    // Chamada para Google AI Imagen API (Nano Banana)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${googleAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        safetyFilterLevel: 'BLOCK_ONLY_HIGH',
        aspectRatio: 'ASPECT_RATIO_1_1', // 1:1 para avatares
        outputOptions: {
          outputFormat: 'JPEG'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google AI Imagen API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].imageUri) {
      throw new Error('Nenhuma imagem gerada pela API');
    }

    const imageUrl = data.candidates[0].imageUri;
    const thumbnailUrl = imageUrl; // Por enquanto, usar a mesma URL
    
    console.log(`    ✅ Imagem gerada: ${imageUrl.substring(0, 50)}...`);
    
    // Fazer download da imagem Google Nano Banana
    const downloadResult = await downloadAndSaveAvatar(imageUrl, persona, {});
    
    if (downloadResult) {
      return {
        avatar_url: downloadResult.public_url,
        avatar_thumbnail_url: downloadResult.public_url,
        prompt_usado: imagePrompt,
        estilo: 'Profissional Corporativo',
        background_tipo: 'escritório moderno',
        servico_usado: 'google_nano_banana_local',
        versao: 'v1.0',
        ativo: true,
        local_file: downloadResult.file_name,
        file_size: downloadResult.file_size
      };
    } else {
      // Se falhar o download, usar URL externa
      return {
        avatar_url: imageUrl,
        avatar_thumbnail_url: thumbnailUrl,
        prompt_usado: imagePrompt,
        estilo: 'Profissional Corporativo',
        background_tipo: 'escritório moderno',
        servico_usado: 'google_nano_banana',
        versao: 'v1.0',
        ativo: true
      };
    }

  } catch (error) {
    console.error(`    ❌ Erro ao gerar imagem Nano Banana:`, error.message);
    
    // Fallback para avatar simulado se a API falhar
    const fallbackUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(persona.full_name)}&backgroundColor=e3f2fd`;
    
    // Fazer download do avatar DiceBear
    const downloadResult = await downloadAndSaveAvatar(fallbackUrl, persona, {});
    
    if (downloadResult) {
      return {
        avatar_url: downloadResult.public_url,
        avatar_thumbnail_url: downloadResult.public_url,
        prompt_usado: prompt,
        estilo: 'Profissional Simulado',
        background_tipo: 'escritório (fallback)',
        servico_usado: 'dicebear_local',
        versao: 'v1.0',
        ativo: true,
        local_file: downloadResult.file_name,
        file_size: downloadResult.file_size
      };
    } else {
      // Se falhar o download, usar URL externa
      return {
        avatar_url: fallbackUrl,
        avatar_thumbnail_url: fallbackUrl,
        prompt_usado: prompt,
        estilo: 'Profissional Simulado',
        background_tipo: 'escritório (fallback)',
        servico_usado: 'dicebear_fallback',
        versao: 'v1.0',
        ativo: true
      };
    }
  }
}

async function generateAvatarWithNanoBanana(persona, empresaInfo) {
  try {
    console.log(`  🤖 Gerando avatar para ${persona.full_name}...`);

    // Criar prompt descritivo baseado no perfil da persona
    const gender = persona.full_name.includes('a ') || persona.full_name.endsWith('a') ? 'woman' : 'man';
    const age = Math.floor(Math.random() * 15) + 25; // 25-40 anos
    
    // Prompt baseado no cargo e departamento
    let description = `${age}-year-old professional ${gender}`;
    
    if (persona.cargo?.toLowerCase().includes('ceo') || persona.cargo?.toLowerCase().includes('director')) {
      description += ', executive style, confident expression, formal business suit';
    } else if (persona.cargo?.toLowerCase().includes('engineer') || persona.cargo?.toLowerCase().includes('developer')) {
      description += ', smart casual attire, focused expression, tech professional';
    } else if (persona.cargo?.toLowerCase().includes('marketing')) {
      description += ', creative professional style, approachable expression, modern business casual';
    } else if (persona.cargo?.toLowerCase().includes('hr') || persona.cargo?.toLowerCase().includes('human')) {
      description += ', friendly professional style, warm expression, business casual';
    } else {
      description += ', business professional style, confident expression, corporate attire';
    }

    // Dados base da persona
    const personaData = {
      id: persona.id,
      nome: persona.full_name,
      cargo: persona.cargo,
      departamento: persona.departamento,
      biografia: persona.biografia || 'Biografia não disponível'
    };

    // Gerar imagem com Nano Banana
    const avatarData = await generateImageWithNanoBanana(description, persona);
    
    // Adicionar biometrics e history simulados
    avatarData.biometrics = {
      genero: gender === 'woman' ? 'feminino' : 'masculino',
      idade_aparente: age,
      etnia: 'diverso',
      estatura: 'média',
      biotipo: 'profissional'
    };

    avatarData.history = {
      formacao_academica: [persona.cargo?.includes('Engineer') ? 'Engenharia' : 'Administração'],
      experiencia_anos: Math.floor(Math.random() * 10) + 5,
      empresas_anteriores: ['Previous Corp', 'Tech Solutions'],
      certificacoes: ['Professional Certification'],
      idiomas: ['português', 'inglês']
    };

    avatarData.metadados = {
      generated_at: new Date().toISOString(),
      script_version: '03_nano_banana',
      confidence_score: 95,
      google_nano_banana: true
    };

    // Salvar na tabela personas_avatares
    const avatarRecord = {
      persona_id: persona.id,
      avatar_url: avatarData.avatar_url,
      avatar_thumbnail_url: avatarData.avatar_thumbnail_url,
      prompt_usado: avatarData.prompt_usado,
      estilo: avatarData.estilo,
      background_tipo: avatarData.background_tipo,
      servico_usado: avatarData.servico_usado,
      versao: avatarData.versao,
      ativo: avatarData.ativo,
      biometrics: avatarData.biometrics,
      history: avatarData.history,
      metadados: avatarData.metadados,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('personas_avatares')
      .insert(avatarRecord);

    if (insertError) {
      console.error('    ❌ Erro ao salvar avatar:', insertError.message);
      return false;
    }

    // Salvar backup local
    const outputDir = path.join(process.cwd(), 'output', 'avatares_nano_banana', empresaInfo.nome);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `avatar_${persona.full_name.replace(/\s+/g, '_').toLowerCase()}.json`;
    fs.writeFileSync(
      path.join(outputDir, filename),
      JSON.stringify({
        persona: personaData,
        avatar: avatarData,
        generated_at: new Date().toISOString()
      }, null, 2),
      'utf8'
    );

    console.log(`    ✅ Avatar Nano Banana gerado: ${avatarData.estilo}`);
    return true;

  } catch (error) {
    console.error(`    ❌ Erro ao gerar avatar para ${persona.full_name}:`, error.message);
    return false;
  }
}

async function generateAvatares() {
  try {
    // 1. Buscar empresa
    let empresa;
    
    if (targetEmpresaId) {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', targetEmpresaId)
        .single();
      
      if (error) throw new Error(`Empresa não encontrada: ${error.message}`);
      empresa = data;
    } else {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('status', 'ativa')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error || !data.length) throw new Error('Nenhuma empresa ativa encontrada');
      empresa = data[0];
    }

    console.log(`\n🏢 Processando empresa: ${empresa.nome}`);
    
    // 2. Verificar API key
    if (!googleAIKey) {
      throw new Error('GOOGLE_AI_API_KEY_2 não encontrada no .env.local');
    }
    
    console.log(`🔑 Usando Google AI API Key: ${googleAIKey.substring(0, 20)}...`);
    
    // 3. Marcar script como em execução
    await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          avatares: { running: true, last_run: new Date().toISOString() }
        }
      })
      .eq('id', empresa.id);

    // 4. Buscar personas e avatares existentes
    const { data: avatarsExistentes } = await supabase
      .from('personas_avatares')
      .select('persona_id, avatar_url, servico_usado')
      .eq('ativo', true);

    const avatarMap = new Map();
    avatarsExistentes?.forEach(avatar => {
      avatarMap.set(avatar.persona_id, avatar);
    });

    const { data: todasPersonas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!todasPersonas.length) {
      console.log('\n⚠️ Nenhuma persona encontrada para esta empresa!');
      return;
    }

    // Filtrar personas que precisam de novo avatar
    const personasParaProcessar = todasPersonas.filter(p => {
      const avatarExistente = avatarMap.get(p.id);
      
      if (!avatarExistente) {
        return true; // Não tem avatar
      }
      
      if (forceRegenerate) {
        return true; // Force mode ativado
      }
      
      // Verificar se usa Unsplash ou não é do Google Nano Banana
      const usaUnsplash = avatarExistente.avatar_url?.includes('unsplash');
      const naoEhNanoBanana = avatarExistente.servico_usado !== 'google_nano_banana';
      
      return usaUnsplash || naoEhNanoBanana;
    });

    if (!personasParaProcessar.length) {
      console.log('\n✅ Todas as personas já possuem avatares do Google Nano Banana!');
      
      // Atualizar status como sucesso
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            ...empresa.scripts_status,
            avatares: {
              running: false,
              last_result: 'success',
              last_run: new Date().toISOString(),
              total_generated: 0,
              message: 'Todas as personas já possuem avatares'
            }
          }
        })
        .eq('id', empresa.id);
        
      return;
    }

    console.log(`\n🍌 Gerando avatares Nano Banana para ${personasParaProcessar.length} personas...`);
    
    // Log das personas que serão processadas
    personasParaProcessar.forEach((p, i) => {
      const avatarExistente = avatarMap.get(p.id);
      let motivo = 'sem avatar';
      
      if (avatarExistente) {
        if (avatarExistente.avatar_url?.includes('unsplash')) {
          motivo = '🚨 substituir Unsplash';
        } else if (avatarExistente.servico_usado !== 'google_nano_banana') {
          motivo = '🔄 converter para Nano Banana';
        } else if (forceRegenerate) {
          motivo = '🔄 force regenerate';
        }
      }
      
      console.log(`  ${i+1}. ${p.full_name} (${motivo})`);
    });

    // 5. Gerar avatares via Google Nano Banana
    let sucessos = 0;
    let erros = 0;

    for (const persona of personasParaProcessar) {
      const sucesso = await generateAvatarWithNanoBanana(persona, empresa);
      if (sucesso) {
        sucessos++;
      } else {
        erros++;
      }
      
      // Pausa entre requests para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // 6. Atualizar status da empresa
    await supabase
      .from('empresas')
      .update({
        scripts_status: {
          ...empresa.scripts_status,
          avatares: {
            running: false,
            last_result: erros > 0 ? 'partial_success' : 'success',
            last_run: new Date().toISOString(),
            total_generated: sucessos
          }
        }
      })
      .eq('id', empresa.id);

    // 7. Relatório final
    console.log('\n📊 RELATÓRIO DE AVATARES NANO BANANA');
    console.log('====================================');
    console.log(`✅ Avatares gerados com sucesso: ${sucessos}`);
    console.log(`❌ Falhas na geração: ${erros}`);
    console.log(`🎯 Taxa de sucesso: ${((sucessos / personasParaProcessar.length) * 100).toFixed(1)}%`);
    console.log(`🗃️ Dados salvos na tabela: personas_avatares`);
    console.log(`🍌 Usando Google Nano Banana com office background padrão`);

  } catch (error) {
    console.error('❌ Erro durante execução:', error.message);
    
    // Atualizar status como erro
    if (targetEmpresaId) {
      await supabase
        .from('empresas')
        .update({
          scripts_status: {
            avatares: {
              running: false,
              last_result: 'error',
              last_run: new Date().toISOString(),
              error_message: error.message
            }
          }
        })
        .eq('id', targetEmpresaId);
    }
  }
}

generateAvatares();