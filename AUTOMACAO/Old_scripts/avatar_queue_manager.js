/**
 * Sistema de Fila para Geração de Avatares com Google AI Studio Free
 * 
 * PROPÓSITO:
 * - Gerenciar fila de personas aguardando geração de avatar
 * - Respeitar limites do Google AI (120s entre requests, 15/dia)
 * - Permitir retomada após interrupção
 * - Controle persistente em arquivo JSON
 * 
 * EXECUÇÃO:
 * node avatar_queue_manager.js --empresaId=UUID [--start|--status|--reset]
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const GEMINI_KEY = process.env.GOOGLE_AI_API_KEY;

if (!SUPABASE_KEY || !GEMINI_KEY) {
  console.error('❌ Variáveis de ambiente faltando');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// Limites do Google AI Studio Free
const DELAY_BETWEEN_REQUESTS = 120000; // 120 segundos
const MAX_DAILY_BATCH = 15; // Máximo por dia
const QUEUE_FILE = path.join(process.cwd(), 'AUTOMACAO', 'avatar_queue.json');

// ============================================================================
// GERENCIAMENTO DA FILA
// ============================================================================

async function loadQueue() {
  try {
    const data = await fs.readFile(QUEUE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      empresa_id: null,
      created_at: null,
      last_run: null,
      total_personas: 0,
      processed: 0,
      failed: 0,
      queue: [],
      completed: [],
      errors: []
    };
  }
}

async function saveQueue(queueData) {
  await fs.writeFile(QUEUE_FILE, JSON.stringify(queueData, null, 2), 'utf-8');
}

async function initializeQueue(empresaId) {
  console.log('🔄 Inicializando fila de avatares...\n');

  // Buscar todas as personas sem avatar
  const { data: personas, error } = await supabase
    .from('personas')
    .select('id, full_name, role, department, biografia_completa, personalidade, experiencia_anos')
    .eq('empresa_id', empresaId)
    .eq('status', 'active');

  if (error) throw new Error(`Erro ao buscar personas: ${error.message}`);

  // Verificar quais já têm avatar
  const { data: existingAvatars } = await supabase
    .from('avatares_personas')
    .select('persona_id')
    .in('persona_id', personas.map(p => p.id));

  const personasComAvatar = new Set(existingAvatars?.map(a => a.persona_id) || []);
  const personasSemAvatar = personas.filter(p => !personasComAvatar.has(p.id));

  const queueData = {
    empresa_id: empresaId,
    created_at: new Date().toISOString(),
    last_run: null,
    total_personas: personasSemAvatar.length,
    processed: 0,
    failed: 0,
    queue: personasSemAvatar.map(p => ({
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      status: 'pending',
      attempts: 0,
      last_attempt: null,
      error: null
    })),
    completed: [],
    errors: []
  };

  await saveQueue(queueData);

  console.log(`✅ Fila criada com ${personasSemAvatar.length} personas`);
  console.log(`📊 Tempo estimado: ${Math.ceil((personasSemAvatar.length * DELAY_BETWEEN_REQUESTS) / 60000)} minutos\n`);

  return queueData;
}

// ============================================================================
// PROCESSAMENTO DA FILA
// ============================================================================

async function generateAvatarForPersona(persona, empresaInfo) {
  const prompt = `
Analise os dados da persona e gere um perfil visual detalhado para avatar AI:

PERSONA:
- Nome: ${persona.full_name}
- Cargo: ${persona.role}
- Departamento: ${persona.department || 'N/A'}
- Experiência: ${persona.experiencia_anos || 0} anos

RESPONDA APENAS COM JSON:
{
  "avatar_url": "https://images.unsplash.com/photo-[ID]?w=400&h=400&fit=crop&crop=face",
  "avatar_thumbnail_url": "https://images.unsplash.com/photo-[ID]?w=100&h=100&fit=crop&crop=face",
  "prompt_usado": "[prompt detalhado para geração de avatar]",
  "estilo": "business",
  "background_tipo": "office",
  "servico_usado": "gemini_ai",
  "versao": 1,
  "ativo": true,
  "biometrics": {
    "idade_aparente": "30-40",
    "genero": "masculino/feminino",
    "etnia": "caucasiano",
    "tipo_fisico": "atlético",
    "cabelo_cor": "castanho",
    "cabelo_estilo": "curto profissional",
    "olhos_cor": "castanho",
    "pele_tom": "claro",
    "estilo_vestimenta": "formal executivo",
    "expressao_facial": "confiante"
  }
}
`;

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Resposta sem JSON válido');

    const avatarData = JSON.parse(jsonMatch[0]);

    // Salvar no banco
    const { error: insertError } = await supabase
      .from('avatares_personas')
      .insert({
        persona_id: persona.id,
        ...avatarData,
        biometrics: JSON.stringify(avatarData.biometrics),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) throw insertError;

    return { success: true, data: avatarData };

  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      isRateLimit: error.message?.includes('429') || error.message?.includes('quota')
    };
  }
}

async function processQueue(queueData, batchSize = MAX_DAILY_BATCH) {
  console.log('🚀 PROCESSAMENTO DA FILA DE AVATARES\n');
  console.log('='.repeat(60));
  console.log(`📊 Total na fila: ${queueData.queue.length}`);
  console.log(`✅ Já processados: ${queueData.processed}`);
  console.log(`❌ Falhas: ${queueData.failed}`);
  console.log(`🎯 Lote atual: até ${batchSize} personas`);
  console.log('='.repeat(60) + '\n');

  // Buscar info da empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', queueData.empresa_id)
    .single();

  let processedInBatch = 0;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < queueData.queue.length && processedInBatch < batchSize; i++) {
    const item = queueData.queue[i];
    
    if (item.status !== 'pending') continue;

    processedInBatch++;
    const personaNum = queueData.processed + processedInBatch;

    console.log(`\n[${ personaNum}/${queueData.total_personas}] ${item.full_name} (${item.role})`);
    console.log(`  🤖 Gerando avatar via Gemini...`);

    // Buscar dados completos da persona
    const { data: persona } = await supabase
      .from('personas')
      .select('*')
      .eq('id', item.id)
      .single();

    item.attempts++;
    item.last_attempt = new Date().toISOString();

    const result = await generateAvatarForPersona(persona, empresa);

    if (result.success) {
      item.status = 'completed';
      queueData.completed.push(item);
      successCount++;
      console.log(`  ✅ Avatar gerado com sucesso!`);
    } else {
      item.error = result.error;
      
      if (result.isRateLimit) {
        console.log(`  ⚠️  Limite diário atingido! Salvando progresso...`);
        await saveQueue(queueData);
        console.log(`\n📊 SESSÃO INTERROMPIDA (Limite Diário)`);
        console.log(`✅ Processados hoje: ${successCount}`);
        console.log(`📅 Execute novamente amanhã para continuar\n`);
        return;
      }

      if (item.attempts >= 3) {
        item.status = 'failed';
        queueData.errors.push(item);
        failCount++;
        console.log(`  ❌ Falha após 3 tentativas: ${result.error}`);
      } else {
        console.log(`  ⚠️  Erro (tentativa ${item.attempts}/3): ${result.error}`);
      }
    }

    // Atualizar fila
    queueData.queue = queueData.queue.filter(q => q.status === 'pending');
    queueData.processed += (item.status === 'completed' || item.status === 'failed') ? 1 : 0;
    queueData.failed = queueData.errors.length;
    queueData.last_run = new Date().toISOString();

    await saveQueue(queueData);

    // Delay entre requisições
    if (processedInBatch < batchSize && i < queueData.queue.length - 1) {
      console.log(`  ⏳ Aguardando ${DELAY_BETWEEN_REQUESTS/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }

  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO DA SESSÃO\n');
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`❌ Falhas: ${failCount}`);
  console.log(`📋 Restantes na fila: ${queueData.queue.length}`);
  console.log(`🎯 Progresso total: ${queueData.processed}/${queueData.total_personas}`);

  if (queueData.queue.length === 0) {
    console.log('\n🎉 FILA COMPLETA! Todos os avatares foram processados.\n');
  } else {
    console.log(`\n💡 Execute novamente amanhã para processar os ${queueData.queue.length} restantes.\n`);
  }
}

// ============================================================================
// CLI
// ============================================================================

async function showStatus() {
  const queueData = await loadQueue();
  
  if (!queueData.empresa_id) {
    console.log('📭 Nenhuma fila ativa\n');
    return;
  }

  console.log('📊 STATUS DA FILA DE AVATARES\n');
  console.log('='.repeat(60));
  console.log(`🏢 Empresa: ${queueData.empresa_id}`);
  console.log(`📅 Criada em: ${new Date(queueData.created_at).toLocaleString('pt-BR')}`);
  console.log(`⏰ Última execução: ${queueData.last_run ? new Date(queueData.last_run).toLocaleString('pt-BR') : 'Nunca'}`);
  console.log(`\n📊 Progresso: ${queueData.processed}/${queueData.total_personas}`);
  console.log(`✅ Completados: ${queueData.completed.length}`);
  console.log(`❌ Falhas: ${queueData.failed}`);
  console.log(`📋 Na fila: ${queueData.queue.length}\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='));
  const action = args.find(arg => arg.startsWith('--')) || '--start';

  if (action === '--status') {
    await showStatus();
    return;
  }

  if (action === '--reset') {
    await fs.unlink(QUEUE_FILE);
    console.log('✅ Fila resetada\n');
    return;
  }

  // Iniciar ou continuar processamento
  if (!empresaIdArg && action === '--start') {
    console.error('❌ Use: node avatar_queue_manager.js --empresaId=UUID [--start|--status|--reset]\n');
    process.exit(1);
  }

  const empresaId = empresaIdArg?.split('=')[1];
  let queueData = await loadQueue();

  if (!queueData.empresa_id || queueData.empresa_id !== empresaId) {
    queueData = await initializeQueue(empresaId);
  } else {
    console.log('📂 Fila existente encontrada, continuando...\n');
  }

  await processQueue(queueData);
}

main();
