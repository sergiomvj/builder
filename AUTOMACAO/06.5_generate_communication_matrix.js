// ============================================================================
// SCRIPT 06.5 - GERAÇÃO DE MATRIZ DE COMUNICAÇÃO
// ============================================================================
// OBJETIVO: Analisar atribuições e subsistemas compartilhados para criar
// padrões de comunicação entre personas (handoffs, notificações, perguntas)
//
// PARADIGMA V5.0: Comunicação baseada em colaboração real
// - Analisa atribuições sobrepostas
// - Identifica subsistemas compartilhados
// - Cria canais de comunicação naturais
// - Define prioridades baseadas em hierarquia
//
// Uso: node 06.5_generate_communication_matrix.js --empresaId=UUID
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Configurar encoding do console
setupConsoleEncoding();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🔗 SCRIPT 06.5 - GERAÇÃO DE MATRIZ DE COMUNICAÇÃO');
console.log('===================================================');
console.log('📊 Analisando colaborações entre personas');
console.log('===================================================\n');

// Parse arguments
const args = process.argv.slice(2);
let targetEmpresaId = null;

for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
  }
}

if (!targetEmpresaId) {
  console.error('❌ Erro: --empresaId é obrigatório');
  console.log('📝 Uso: node 06.5_generate_communication_matrix.js --empresaId=UUID');
  process.exit(1);
}

// Output directory
const OUTPUT_DIR = join(__dirname, 'communication_matrix_output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ============================================================================
// ANALISAR COLABORAÇÃO ENTRE DUAS PERSONAS
// ============================================================================

async function analisarColaboracao(personaA, personaB) {
  const prompt = `Você é um especialista em análise de fluxos de trabalho organizacionais.

PERSONA A:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: ${personaA.full_name || 'A GERAR'}
Cargo: ${personaA.role}
Departamento: ${personaA.departamento || 'N/A'}
Nível: ${personaA.nivel_hierarquico || 'operacional'}

Atribuições principais (primeiras 3):
${personaA.atribuicoes?.slice(0, 3).map(a => `• ${a.atribuicao}`).join('\n') || '• Trabalha em ' + personaA.role}

PERSONA B:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: ${personaB.full_name || 'A GERAR'}
Cargo: ${personaB.role}
Departamento: ${personaB.departamento || 'N/A'}
Nível: ${personaB.nivel_hierarquico || 'operacional'}

Atribuições principais (primeiras 3):
${personaB.atribuicoes?.slice(0, 3).map(a => `• ${a.atribuicao}`).join('\n') || '• Trabalha em ' + personaB.role}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALISE SE ESSAS PERSONAS PRECISAM SE COMUNICAR REGULARMENTE:

Retorne APENAS JSON válido (sem markdown):
{
  "precisa_comunicar": boolean,
  "razao": "Por que precisam se comunicar (máximo 100 caracteres)",
  "tipos_comunicacao": ["handoff", "notification", "question", "approval_request"],
  "frequencia": "diaria" | "semanal" | "mensal" | "ocasional",
  "prioridade": "low" | "normal" | "high",
  "exemplos": ["Exemplo 1", "Exemplo 2"]
}

CRITÉRIOS:
✅ SIM se: mesma área, hierarquia direta, workflows conectados, dados compartilhados
❌ NÃO se: áreas totalmente diferentes, sem interdependência

IMPORTANTE: Seja criterioso - retorne true APENAS para colaborações genuínas.`;

  try {
    // generateJSONWithFallback já retorna objeto parseado
    const resultado = await generateJSONWithFallback(prompt, {
      temperature: 0.2,
      maxTokens: 500
    });

    // Validar estrutura mínima do resultado
    if (!resultado || typeof resultado !== 'object') {
      console.error(`   ⚠️ Resposta inválida do LLM`);
      return null;
    }

    // Validar campos obrigatórios
    if (typeof resultado.precisa_comunicar !== 'boolean') {
      console.error(`   ⚠️ Campo precisa_comunicar inválido`);
      return null;
    }

    return resultado;

  } catch (error) {
    console.error(`   ⚠️ Erro ao analisar colaboração:`, error.message);
    return null;
  }
}

// ============================================================================
// CRIAR COMUNICAÇÃO NO BANCO
// ============================================================================

async function criarComunicacao(empresaId, personaA, personaB, analise) {
  // Criar uma comunicação para cada tipo identificado
  const comunicacoes = [];

  for (const tipo of analise.tipos_comunicacao) {
    const subject = gerarSubject(tipo, personaA, personaB, analise);
    const message = gerarMessage(tipo, personaA, personaB, analise);

    const { data, error } = await supabase
      .from('personas_communications')
      .insert({
        sender_persona_id: personaA.id,
        receiver_persona_id: personaB.id,
        communication_type: tipo,
        priority: analise.prioridade || 'normal',
        subject: subject,
        message: message,
        context_data: {
          razao: analise.razao,
          frequencia: analise.frequencia,
          exemplos: analise.exemplos,
          generated_by: 'script_06.5',
          generated_at: new Date().toISOString()
        },
        status: 'pending',
        requires_action: ['approval_request', 'question'].includes(tipo)
      })
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Erro ao criar comunicação:`, error.message);
    } else {
      comunicacoes.push(data);
    }
  }

  return comunicacoes;
}

function gerarSubject(tipo, personaA, personaB, analise) {
  const subjects = {
    handoff: `Transferência de trabalho: ${personaA.role} → ${personaB.role}`,
    notification: `Atualização de ${personaA.role} para ${personaB.role}`,
    question: `Dúvida de ${personaA.role} para ${personaB.role}`,
    approval_request: `Solicitação de aprovação: ${personaA.role} → ${personaB.role}`
  };
  return subjects[tipo] || `Comunicação entre ${personaA.role} e ${personaB.role}`;
}

function gerarMessage(tipo, personaA, personaB, analise) {
  const messages = {
    handoff: `${personaA.full_name} precisa transferir trabalho para ${personaB.full_name}. ${analise.razao}`,
    notification: `${personaA.full_name} está mantendo ${personaB.full_name} informado sobre progressos. ${analise.razao}`,
    question: `${personaA.full_name} tem perguntas para ${personaB.full_name}. ${analise.razao}`,
    approval_request: `${personaA.full_name} precisa de aprovação de ${personaB.full_name}. ${analise.razao}`
  };
  return messages[tipo] || analise.razao;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  try {
    // 1. Buscar empresa
    console.log('1️⃣ Buscando empresa...\n');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', targetEmpresaId)
      .single();

    if (empresaError) {
      console.error('❌ Empresa não encontrada:', empresaError.message);
      process.exit(1);
    }

    console.log(`✅ Empresa: ${empresa.nome}\n`);

    // 2. Buscar personas com atribuições
    console.log('2️⃣ Buscando personas...\n');
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id)
      .order('persona_code');

    if (personasError || !personas || personas.length === 0) {
      console.error('❌ Nenhuma persona encontrada:', personasError?.message);
      process.exit(1);
    }

    // Buscar atribuições separadamente (se existir tabela)
    for (const p of personas) {
      const { data: atrib } = await supabase
        .from('personas_atribuicoes')
        .select('atribuicao, subsistema, ordem')
        .eq('persona_id', p.id)
        .order('ordem');
      p.atribuicoes = atrib || [];
    }

    console.log(`✅ ${personas.length} personas encontradas\n`);

    // 3. Analisar pares de personas
    console.log('3️⃣ Analisando colaborações...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let sucessos = 0;
    let falhas = 0;
    let comunicacoesCriadas = 0;
    const matriz = [];

    // Analisar cada par (evitando duplicatas: A→B e B→A)
    for (let i = 0; i < personas.length; i++) {
      for (let j = i + 1; j < personas.length; j++) {
        const personaA = personas[i];
        const personaB = personas[j];

        console.log(`🔍 Analisando: ${personaA.persona_code} ↔ ${personaB.persona_code}`);
        console.log(`   ${personaA.role} × ${personaB.role}`);

        try {
          const analise = await analisarColaboracao(personaA, personaB);

          if (analise && analise.precisa_comunicar) {
            console.log(`   ✅ Colaboração identificada!`);
            console.log(`   📝 Tipos: ${analise.tipos_comunicacao.join(', ')}`);
            console.log(`   🔄 Frequência: ${analise.frequencia}`);
            console.log(`   ⚡ Prioridade: ${analise.prioridade}`);

            // Criar comunicações nos dois sentidos se necessário
            const comA_B = await criarComunicacao(empresa.id, personaA, personaB, analise);
            comunicacoesCriadas += comA_B.length;

            matriz.push({
              persona_a: personaA.persona_code,
              persona_b: personaB.persona_code,
              analise: analise,
              comunicacoes_criadas: comA_B.length
            });

            console.log(`   💾 ${comA_B.length} comunicação(ões) criada(s)\n`);
            sucessos++;
          } else {
            console.log(`   ⚠️ Sem colaboração necessária\n`);
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`   ❌ Erro:`, error.message, '\n');
          falhas++;
        }
      }
    }

    // 4. Salvar matriz JSON
    const jsonPath = join(OUTPUT_DIR, `${empresa.codigo}_communication_matrix.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(matriz, null, 2), 'utf-8');
    console.log(`📄 Matriz salva em: ${jsonPath}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 SCRIPT 06.5 CONCLUÍDO!\n');
    console.log(`✅ Pares analisados: ${personas.length * (personas.length - 1) / 2}`);
    console.log(`✅ Colaborações identificadas: ${sucessos}`);
    console.log(`✅ Comunicações criadas: ${comunicacoesCriadas}`);
    console.log(`❌ Erros: ${falhas}\n`);

    console.log('📋 PRÓXIMO PASSO:');
    console.log('   Execute: node 07.5_generate_supervision_chains.js --empresaId=' + targetEmpresaId + '\n');

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
