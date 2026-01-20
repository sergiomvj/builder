#!/usr/bin/env node
/**
 * 🎨 SCRIPT 05.5 - GERAÇÃO DE IMAGENS DE AVATARES COM NANO BANANA
 * =========================================================================
 * MODELO: Gemini 2.5 Flash Image (gemini-2.5-flash-image) - "Nano Banana"
 * 
 * LIMITAÇÕES GOOGLE AI FREE TIER:
 * - Rate Limit: 1 requisição a cada 120 segundos (2 minutos)
 * - Limite Diário: ~10 a 15 imagens por dia
 * - Reset: Meia-noite horário do Pacífico (04:00-05:00 AM Brasil)
 * 
 * SISTEMA DE FILA PERSISTENTE:
 * - Processa até 15 imagens por dia respeitando rate limits
 * - Salva progresso em arquivo JSON (retoma de onde parou)
 * - Visualização em tempo real do status da fila
 * - Pode ser executado ao longo de vários dias
 * - Retry automático em caso de erro temporário
 * 
 * Uso:
 *   node 05.5_generate_avatar_images_nanobana.js --empresaId=UUID [--reset] [--status]
 *   node 05.5_generate_avatar_images_nanobana.js --empresaId=UUID --maxDaily=10
 *   node 05.5_generate_avatar_images_nanobana.js --status  # Ver status da fila
 *   node 05.5_generate_avatar_images_nanobana.js --reset   # Resetar fila
 * 
 * @author Sergio Castro
 * @version 1.0.0
 * @date 2025-12-02
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env.local
config({ path: path.join(__dirname, '..', '.env.local') });

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const RATE_LIMIT_MS = 120000; // 2 minutos entre requisições
const MAX_DAILY_IMAGES = 15; // Limite diário seguro
const QUEUE_FILE = path.join(__dirname, 'nanobana_queue.json');
const OUTPUT_DIR = path.join(__dirname, 'nanobana_images');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// ============================================================================
// ESTRUTURA DA FILA
// ============================================================================

/**
 * Estrutura do arquivo de fila:
 * {
 *   empresaId: string,
 *   personas: [
 *     {
 *       id: string,
 *       full_name: string,
 *       role: string,
 *       status: 'pending' | 'processing' | 'completed' | 'failed',
 *       attempts: number,
 *       last_attempt: string (ISO date),
 *       image_url: string | null,
 *       error_message: string | null
 *     }
 *   ],
 *   stats: {
 *     total: number,
 *     pending: number,
 *     completed: number,
 *     failed: number,
 *     daily_count: number,
 *     last_reset_date: string (YYYY-MM-DD)
 *   },
 *   created_at: string,
 *   updated_at: string
 * }
 */

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Criar diretórios necessários
 */
async function criarDiretorios() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    console.error('Erro ao criar diretórios:', error.message);
  }
}

/**
 * Carregar fila do arquivo
 */
async function carregarFila() {
  try {
    const data = await fs.readFile(QUEUE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

/**
 * Salvar fila no arquivo
 */
async function salvarFila(queue) {
  queue.updated_at = new Date().toISOString();
  await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), 'utf-8');
}

/**
 * Verificar se precisa resetar contador diário
 */
function verificarResetDiario(queue) {
  const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (queue.stats.last_reset_date !== hoje) {
    queue.stats.daily_count = 0;
    queue.stats.last_reset_date = hoje;
    console.log(`\n📅 Novo dia detectado! Contador diário resetado para 0/${MAX_DAILY_IMAGES}`);
    return true;
  }
  return false;
}

/**
 * Atualizar estatísticas da fila
 */
function atualizarEstatisticas(queue) {
  queue.stats = {
    total: queue.personas.length,
    pending: queue.personas.filter(p => p.status === 'pending').length,
    completed: queue.personas.filter(p => p.status === 'completed').length,
    failed: queue.personas.filter(p => p.status === 'failed').length,
    daily_count: queue.stats?.daily_count || 0,
    last_reset_date: queue.stats?.last_reset_date || new Date().toISOString().split('T')[0]
  };
}

/**
 * Exibir status da fila
 */
async function exibirStatus() {
  const queue = await carregarFila();
  
  if (!queue) {
    console.log('❌ Nenhuma fila encontrada. Execute o script com --empresaId para criar uma fila.');
    return;
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 STATUS DA FILA NANO BANANA');
  console.log('='.repeat(70));
  console.log(`🏢 Empresa: ${queue.empresaId}`);
  console.log(`📅 Criada em: ${new Date(queue.created_at).toLocaleString('pt-BR')}`);
  console.log(`🔄 Última atualização: ${new Date(queue.updated_at).toLocaleString('pt-BR')}`);
  console.log('\n📈 ESTATÍSTICAS:');
  console.log(`   Total: ${queue.stats.total}`);
  console.log(`   ⏳ Pendentes: ${queue.stats.pending}`);
  console.log(`   ✅ Completos: ${queue.stats.completed}`);
  console.log(`   ❌ Falhas: ${queue.stats.failed}`);
  console.log(`   📸 Hoje: ${queue.stats.daily_count}/${MAX_DAILY_IMAGES}`);
  console.log(`   📅 Último reset: ${queue.stats.last_reset_date}`);

  if (queue.stats.pending > 0) {
    console.log('\n⏳ PRÓXIMAS NA FILA:');
    const proximas = queue.personas
      .filter(p => p.status === 'pending')
      .slice(0, 5);
    
    proximas.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.full_name} - ${p.role}`);
    });
    
    if (queue.stats.pending > 5) {
      console.log(`   ... e mais ${queue.stats.pending - 5} personas`);
    }
  }

  if (queue.stats.failed > 0) {
    console.log('\n❌ FALHAS:');
    const falhas = queue.personas.filter(p => p.status === 'failed');
    falhas.forEach(p => {
      console.log(`   - ${p.full_name}: ${p.error_message} (${p.attempts} tentativas)`);
    });
  }

  console.log('\n💡 COMANDOS:');
  console.log('   Continuar processamento: node 05.5_generate_avatar_images_nanobana.js');
  console.log('   Resetar fila: node 05.5_generate_avatar_images_nanobana.js --reset');
  console.log('='.repeat(70) + '\n');
}

/**
 * Resetar fila
 */
async function resetarFila() {
  try {
    await fs.unlink(QUEUE_FILE);
    console.log('✅ Fila resetada com sucesso!');
  } catch (error) {
    console.log('⚠️  Nenhuma fila para resetar.');
  }
}

/**
 * Criar nova fila para uma empresa
 */
async function criarFila(empresaId) {
  console.log('\n🔍 Buscando personas sem imagens...\n');

  // Buscar personas que ainda não têm imagem gerada
  const { data: personas, error } = await supabase
    .from('personas')
    .select('id, full_name, role, nacionalidade, genero')
    .eq('empresa_id', empresaId)
    .is('avatar_image_url', null); // Ainda não tem imagem

  if (error) {
    console.error('❌ Erro ao buscar personas:', error.message);
    return null;
  }

  if (!personas || personas.length === 0) {
    console.log('⚠️  Nenhuma persona encontrada sem imagem.');
    console.log('💡 Todas as personas já têm imagens geradas ou não existem personas nesta empresa.');
    return null;
  }

  // Criar estrutura da fila
  const queue = {
    empresaId,
    personas: personas.map(p => ({
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      nacionalidade: p.nacionalidade,
      genero: p.genero,
      status: 'pending',
      attempts: 0,
      last_attempt: null,
      image_url: null,
      error_message: null
    })),
    stats: {
      total: personas.length,
      pending: personas.length,
      completed: 0,
      failed: 0,
      daily_count: 0,
      last_reset_date: new Date().toISOString().split('T')[0]
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await salvarFila(queue);
  
  console.log(`✅ Fila criada com ${personas.length} personas`);
  console.log(`📸 Processamento: ${MAX_DAILY_IMAGES} imagens por dia`);
  console.log(`⏱️  Tempo estimado: ${Math.ceil(personas.length / MAX_DAILY_IMAGES)} dias\n`);

  return queue;
}

/**
 * Gerar prompt para imagem baseado nos dados da persona
 */
async function gerarPromptImagem(persona) {
  // Buscar dados completos da persona
  const { data: personaData, error } = await supabase
    .from('personas')
    .select('personality_traits, bio_summary, department')
    .eq('id', persona.id)
    .single();

  if (error) {
    console.log('   ⚠️  Erro ao buscar dados da persona, usando dados básicos');
  }

  // Mapear nacionalidade para etnia visual
  const etniaMap = {
    'brasileiro': 'Brazilian',
    'brasileiros': 'Brazilian',
    'americano': 'American',
    'americanos': 'American',
    'europeu': 'European',
    'europeus': 'European',
    'asiatico': 'Asian',
    'asiaticos': 'Asian',
    'africano': 'African',
    'africanos': 'African',
    'nordico': 'Nordic',
    'nordicos': 'Nordic'
  };

  const etnia = etniaMap[persona.nacionalidade?.toLowerCase()] || 'Brazilian';
  const genero = persona.genero === 'feminino' ? 'woman' : 'man';
  
  // Determinar idade baseada no cargo
  let idade = 30;
  if (persona.role?.includes('Junior')) idade = 25;
  else if (persona.role?.includes('Pleno')) idade = 32;
  else if (persona.role?.includes('Senior') || persona.role?.includes('Sênior')) idade = 38;
  else if (persona.role?.includes('Gerente') || persona.role?.includes('Manager')) idade = 40;
  else if (persona.role?.includes('Diretor') || persona.role?.includes('Director')) idade = 45;
  else if (persona.role?.includes('CEO') || persona.role?.includes('CTO') || persona.role?.includes('CPO')) idade = 50;

  // Criar prompt rico para Nano Banana
  const prompt = `Create a highly realistic professional corporate headshot photograph.

PERSON DETAILS:
- Gender: ${genero}
- Age: ${idade} years old
- Ethnicity: ${etnia}
- Role: ${persona.role}
- Name: ${persona.full_name}

PHOTOGRAPHY REQUIREMENTS:
- Professional studio headshot
- Neutral solid background (soft gray or light blue)
- Professional business attire appropriate for ${persona.role}
- Confident and approachable facial expression
- Direct eye contact with camera
- Natural smile
- Well-groomed professional appearance

LIGHTING & TECHNICAL:
- Soft studio lighting setup
- Shallow depth of field with sharp focus on face
- Professional color grading
- Natural skin tones
- High resolution portrait
- Clean and professional composition

STYLE:
- Corporate professional photography
- LinkedIn profile quality
- Modern business environment aesthetic`;

  return prompt;
}

/**
 * Gerar imagem com Nano Banana
 */
async function gerarImagemNanoBanana(prompt) {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash-image' // Nano Banana
  });

  try {
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.8,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    });

    const response = await result.response;
    
    // O Nano Banana retorna dados de imagem
    // Verificar se temos dados de imagem inline
    const parts = response.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        console.log(`   ✅ Imagem recebida (${part.inlineData.mimeType})`);
        return part.inlineData.data; // Base64 string
      }
    }
    
    // Se não encontrou dados de imagem, pode ser que o modelo retornou texto
    const text = response.text();
    if (text) {
      console.log('   ⚠️  Resposta em texto, esperava imagem');
      throw new Error('Modelo retornou texto em vez de imagem');
    }
    
    throw new Error('Nenhum dado de imagem encontrado na resposta');
    
  } catch (error) {
    if (error.message?.includes('429') || 
        error.message?.includes('Resource Exhausted') ||
        error.message?.includes('quota')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw error;
  }
}

/**
 * Salvar imagem localmente e fazer upload para Supabase Storage
 */
async function salvarImagem(personaId, personaName, imageData) {
  const filename = `${personaId}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  // Salvar localmente como backup
  await fs.writeFile(filepath, imageData, 'base64');
  console.log(`   💾 Backup local: ${filepath}`);
  
  // Upload para Supabase Storage
  try {
    const fileBuffer = Buffer.from(imageData, 'base64');
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('persona-avatars')
      .upload(`${personaId}.png`, fileBuffer, {
        contentType: 'image/png',
        upsert: true // Sobrescreve se já existir
      });

    if (uploadError) {
      console.log(`   ⚠️  Erro no upload para Storage: ${uploadError.message}`);
      console.log('   📁 Usando caminho local como fallback');
      return filepath;
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from('persona-avatars')
      .getPublicUrl(`${personaId}.png`);

    console.log(`   ☁️  Upload Supabase: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;

  } catch (error) {
    console.log(`   ⚠️  Erro ao fazer upload: ${error.message}`);
    console.log('   📁 Usando caminho local como fallback');
    return filepath;
  }
}

/**
 * Processar uma persona da fila
 */
async function processarPersona(persona, queue) {
  console.log(`\n[${ queue.stats.daily_count + 1}/${MAX_DAILY_IMAGES}] Processando: ${persona.full_name}`);
  console.log(`   Cargo: ${persona.role}`);

  persona.status = 'processing';
  persona.attempts += 1;
  persona.last_attempt = new Date().toISOString();
  await salvarFila(queue);

  try {
    // Gerar prompt
    console.log('   📝 Gerando prompt...');
    const prompt = await gerarPromptImagem(persona);

    // Gerar imagem com Nano Banana
    console.log('   🎨 Gerando imagem com Nano Banana...');
    const imageData = await gerarImagemNanoBanana(prompt);

    // Salvar imagem
    console.log('   💾 Salvando imagem...');
    const imageUrl = await salvarImagem(persona.id, persona.full_name, imageData);

    // Salvar prompt usado (para auditoria)
    console.log('   💼 Atualizando banco de dados...');
    const { error: updateError } = await supabase
      .from('personas')
      .update({ 
        avatar_image_url: imageUrl,
        avatar_image_generated_at: new Date().toISOString(),
        avatar_image_prompt: prompt
      })
      .eq('id', persona.id);

    if (updateError) throw updateError;

    // Marcar como completo
    persona.status = 'completed';
    persona.image_url = imageUrl;
    persona.error_message = null;
    queue.stats.daily_count += 1;

    console.log('   ✅ Imagem gerada e salva com sucesso!');
    console.log(`   🔗 ${imageUrl}\n`);

    return true;

  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);

    if (error.message === 'QUOTA_EXCEEDED') {
      console.log('   ⚠️  Limite diário atingido! Parando processamento.');
      persona.status = 'pending'; // Volta para pending
      return 'QUOTA_EXCEEDED';
    }

    persona.status = persona.attempts >= 3 ? 'failed' : 'pending';
    persona.error_message = error.message;

    if (persona.status === 'failed') {
      console.log(`   ⛔ Persona marcada como falha após ${persona.attempts} tentativas`);
    }

    return false;
  } finally {
    atualizarEstatisticas(queue);
    await salvarFila(queue);
  }
}

/**
 * Processar fila
 */
async function processarFila(queue, maxDaily = MAX_DAILY_IMAGES) {
  // Verificar reset diário
  verificarResetDiario(queue);

  // Verificar se já atingiu limite diário
  if (queue.stats.daily_count >= maxDaily) {
    console.log(`\n⏰ Limite diário já atingido (${queue.stats.daily_count}/${maxDaily})`);
    console.log('📅 Execute novamente amanhã para continuar o processamento.\n');
    return;
  }

  const pendentes = queue.personas.filter(p => p.status === 'pending');

  if (pendentes.length === 0) {
    console.log('\n🎉 Todas as personas foram processadas!\n');
    await exibirStatus();
    return;
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎨 INICIANDO PROCESSAMENTO NANO BANANA');
  console.log('='.repeat(70));
  console.log(`📊 Pendentes: ${pendentes.length}`);
  console.log(`📸 Processadas hoje: ${queue.stats.daily_count}/${maxDaily}`);
  console.log(`⏱️  Rate limit: ${RATE_LIMIT_MS / 1000}s entre requisições`);
  console.log('='.repeat(70));

  // Processar até atingir limite diário
  const limiteProcessamento = Math.min(
    maxDaily - queue.stats.daily_count,
    pendentes.length
  );

  for (let i = 0; i < limiteProcessamento; i++) {
    const persona = pendentes[i];
    
    const resultado = await processarPersona(persona, queue);

    if (resultado === 'QUOTA_EXCEEDED') {
      console.log('\n⚠️  Processamento interrompido por limite de quota.');
      break;
    }

    // Aguardar rate limit entre requisições (exceto na última)
    if (i < limiteProcessamento - 1 && resultado === true) {
      const waitSeconds = RATE_LIMIT_MS / 1000;
      console.log(`\n⏳ Aguardando ${waitSeconds}s (rate limit)...`);
      
      // Countdown visual
      for (let s = waitSeconds; s > 0; s -= 10) {
        process.stdout.write(`   ${s}s... `);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      console.log('✅\n');
    }
  }

  // Exibir resumo final
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMO DA SESSÃO');
  console.log('='.repeat(70));
  atualizarEstatisticas(queue);
  await salvarFila(queue);
  
  console.log(`✅ Completas: ${queue.stats.completed}/${queue.stats.total}`);
  console.log(`⏳ Pendentes: ${queue.stats.pending}`);
  console.log(`❌ Falhas: ${queue.stats.failed}`);
  console.log(`📸 Processadas hoje: ${queue.stats.daily_count}/${maxDaily}`);
  
  if (queue.stats.pending > 0) {
    const diasRestantes = Math.ceil(queue.stats.pending / maxDaily);
    console.log(`\n⏰ Tempo estimado restante: ~${diasRestantes} dia(s)`);
    console.log('💡 Execute novamente para continuar o processamento.');
  } else {
    console.log('\n🎉 TODAS AS IMAGENS FORAM GERADAS COM SUCESSO!');
  }
  console.log('='.repeat(70) + '\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const empresaIdArg = args.find(a => a.startsWith('--empresaId='));
  const maxDailyArg = args.find(a => a.startsWith('--maxDaily='));
  const statusFlag = args.includes('--status');
  const resetFlag = args.includes('--reset');

  await criarDiretorios();

  // Comando: --status
  if (statusFlag) {
    await exibirStatus();
    return;
  }

  // Comando: --reset
  if (resetFlag) {
    await resetarFila();
    return;
  }

  // Carregar ou criar fila
  let queue = await carregarFila();

  if (!queue && empresaIdArg) {
    const empresaId = empresaIdArg.split('=')[1];
    queue = await criarFila(empresaId);
    
    if (!queue) {
      process.exit(1);
    }
  } else if (!queue) {
    console.log('❌ Nenhuma fila encontrada.');
    console.log('💡 Use: node 05.5_generate_avatar_images_nanobana.js --empresaId=UUID');
    console.log('💡 Ou: node 05.5_generate_avatar_images_nanobana.js --status');
    process.exit(1);
  }

  // Obter limite diário customizado
  const maxDaily = maxDailyArg 
    ? parseInt(maxDailyArg.split('=')[1]) 
    : MAX_DAILY_IMAGES;

  // Processar fila
  await processarFila(queue, maxDaily);
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error.message);
  process.exit(1);
});
