#!/usr/bin/env node
/**
 * 🎯 SCRIPT 06 - ANÁLISE DE AUTOMAÇÃO DE TAREFAS
 * ============================================================
 * ORDEM CORRETA: Executar APÓS Script 04 (competências criadas)
 * 
 * Analisa tarefas de personas usando LLM (OpenAI GPT-4) para identificar
 * oportunidades de automação. Gera workflow_steps e salva análise.
 * 
 * DEPENDE DE:
 * - Script 04: personas_competencias (tarefas_diarias, tarefas_semanais, tarefas_mensais)
 * 
 * Funcionalidades:
 * - Lê tarefas de personas_tasks
 * - Usa OpenAI GPT-4 para analisar automatizabilidade
 * - Calcula automation_score (0-100)
 * - Identifica tipo de workflow necessário
 * - Mapeia integrações e APIs necessárias
 * - Gera sequência de passos (workflow_steps)
 * - Detecta dependências entre tarefas
 * - Salva análise em automation_opportunities
 * 
 * Uso:
 * node 06_analyze_tasks_for_automation.js --empresaId=UUID_DA_EMPRESA
 * node 06_analyze_tasks_for_automation.js --empresaId=UUID --personaId=UUID
 * 
 * Requisitos:
 * - OPENAI_API_KEY no .env
 * - NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - Tabelas: personas_tasks, automation_opportunities
 * 
 * @author Sergio Castro
 * @version 1.0.0
 * @date 2025-11-28
 */

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { loadPrompt } from './lib/prompt-loader.js';

// Configurar encoding do console
setupConsoleEncoding();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env.local
config();
// dotenv.config();
// config({ path: path.join(__dirname, '..', '.env.local') });

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_KEY
);

// Parse CLI arguments
const args = process.argv.slice(2);
const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='))?.split('=')[1];
const personaIdArg = args.find(arg => arg.startsWith('--personaId='))?.split('=')[1];
const minScoreArg = args.find(arg => arg.startsWith('--minScore='))?.split('=')[1] || '0';

if (!empresaIdArg) {
  console.error('❌ Erro: --empresaId é obrigatório');
  console.log('\nUso:');
  console.log('  node 06_analyze_tasks_for_automation.js --empresaId=UUID_DA_EMPRESA');
  console.log('  node 06_analyze_tasks_for_automation.js --empresaId=UUID --personaId=UUID');
  process.exit(1);
}

console.log('🤖 Usando LLM com fallback: Grok → GLM → Kimi-K2 (FREE) → GPT-3.5 → Qwen → Claude');

const OUTPUT_DIR = path.join(__dirname, 'automation_analysis_output');

// ============================================================================
// PROMPT PARA LLM
// ============================================================================

const ANALYZE_TASK_PROMPT = (task, persona, empresa, allTasks = []) => `
Você é um especialista em automação de processos e workflows N8N.

**TAREFA A ANALISAR:**
- Título: ${task.title}
- Descrição: ${task.description || 'N/A'}
- Tipo: ${task.task_type || 'N/A'}
- Frequência: ${task.recurrence || 'N/A'}
- Duração estimada: ${task.estimated_duration || 'N/A'}
- Prioridade: ${task.priority || 'N/A'}

**CONTEXTO DA PERSONA:**
- Nome: ${persona.nome_completo}
- Cargo: ${persona.cargo}
- Especialidade: ${persona.especialidade || 'N/A'}
- Ferramentas principais: ${persona.ferramentas_principais?.join(', ') || 'N/A'}
- Competências: ${persona.competencias_principais?.join(', ') || 'N/A'}

**EMPRESA:**
- Nome: ${empresa.nome}
- Setor: ${empresa.setor_atuacao || 'N/A'}
- Tamanho: ${empresa.numero_funcionarios || 'N/A'} funcionários

**OUTRAS TAREFAS DA PERSONA (contexto para dependências):**
${allTasks.slice(0, 5).map((t, i) => `${i + 1}. ${t.title} (ID: ${t.id})`).join('\n')}

---

**ANÁLISE NECESSÁRIA:**

1. **Automation Score (0-100):**
   - 0-30: Tarefa essencialmente humana (requer criatividade, julgamento complexo, interação humana essencial)
   - 31-60: Parcialmente automatizável (pode ser assistida por automação, mas requer supervisão/decisão humana)
   - 61-100: Totalmente automatizável (processo repetitivo, regras claras, sem ambiguidade)
   
   Considere:
   - Frequência (diária = mais valor)
   - Repetibilidade (sempre mesmos passos = mais automatizável)
   - Complexidade de decisões
   - Disponibilidade de integrações
   - ROI potencial

2. **Workflow Type:**
   - **webhook**: Disparado por evento externo (ex: novo lead no CRM, formulário preenchido, pagamento recebido)
   - **cron**: Agendado periodicamente (ex: diário às 9h, toda segunda às 8h, mensal no dia 1)
   - **event**: Disparado por mudança no sistema/banco (ex: quando lead.score > 70, quando task.status = 'completed')
   - **manual**: Iniciado manualmente quando necessário (ex: gerar relatório sob demanda, processar lista de emails)

3. **Required Integrations:**
   - Liste APIs/serviços/sistemas necessários
   - Exemplos comuns: slack, gmail, googlesheets, supabase, hubspot, salesforce, trello, asana, calendly, twilio, stripe, etc.
   - Use nomes lowercase separados por hífen (ex: google-sheets, active-campaign)

4. **Workflow Steps (sequência de ações N8N):**
   - Descreva passo a passo as ações do workflow
   - Use tipos válidos de nós N8N
   - Seja específico nas configurações
   
   **Tipos de nós disponíveis:**
   - Trigger: cron (agendado), webhook (HTTP), manual (botão)
   - Fetch Data: supabase (query DB), http (API call), google-sheets (ler planilha)
   - Transform: function (código JS), set (definir variáveis), if (condição)
   - Action: gmail (enviar email), slack (notificar), supabase (insert/update)
   - Wait: wait (aguardar tempo), schedule-trigger (próxima data)
   - Loop: split-in-batches (processar em lotes)
   
   **Formato de cada step:**
   {
     "step": 1,
     "action": "Trigger",
     "type": "cron",
     "config": {
       "cron": "0 9 * * *",
       "timezone": "America/Sao_Paulo"
     },
     "description": "Disparar todo dia às 9h"
   }

5. **Dependencies:**
   - Esta tarefa depende de outras tarefas sendo concluídas primeiro?
   - Se sim, liste os IDs das tarefas relacionadas
   - Se não, retorne array vazio []

6. **Estimated Time Saved Per Execution:**
   - Quanto tempo a persona economiza por execução automática?
   - Formato: "30 minutes", "2 hours", "15 minutes"

7. **ROI Potential:**
   - **high**: Economiza > 10 horas/mês ou > R$ 1000/mês
   - **medium**: Economiza 5-10 horas/mês ou R$ 500-1000/mês
   - **low**: Economiza < 5 horas/mês ou < R$ 500/mês

8. **Complexity:**
   - **simple**: < 5 nós, integrações simples, sem lógica complexa
   - **medium**: 5-10 nós, algumas condicionais, 2-3 integrações
   - **complex**: > 10 nós, muitas condicionais, loops, 4+ integrações

9. **Reasoning:**
   - Explique em 2-3 frases POR QUE essa tarefa é/não é automatizável
   - Seja específico sobre os fatores que influenciaram o score

---

**IMPORTANTE:**
- Seja conservador no score (é melhor subestimar que superestimar)
- Se a tarefa envolve criatividade, empatia ou decisões complexas → score baixo
- Se a tarefa é repetitiva, tem regras claras e dados estruturados → score alto
- Considere a maturidade das integrações disponíveis

**RETORNE EM FORMATO JSON VÁLIDO:**
\`\`\`json
{
  "automation_score": 85,
  "automation_feasibility": "high",
  "workflow_type": "cron",
  "required_integrations": ["supabase", "gmail", "slack"],
  "workflow_steps": [
    {
      "step": 1,
      "action": "Trigger",
      "type": "cron",
      "config": {
        "cron": "0 9 * * *",
        "timezone": "America/Sao_Paulo"
      },
      "description": "Disparar todo dia às 9h"
    },
    {
      "step": 2,
      "action": "Fetch Data",
      "type": "supabase",
      "config": {
        "operation": "select",
        "table": "leads",
        "filters": {
          "last_interaction": { "lt": "NOW() - INTERVAL '7 days'" },
          "status": "cold"
        }
      },
      "description": "Buscar leads inativos há 7 dias"
    },
    {
      "step": 3,
      "action": "Transform",
      "type": "function",
      "config": {
        "code": "return items.map(lead => ({ ...lead, email_body: \`Olá \${lead.nome}, ...\` }));"
      },
      "description": "Personalizar corpo do email"
    },
    {
      "step": 4,
      "action": "Send Email",
      "type": "gmail",
      "config": {
        "to": "{{ $json.email }}",
        "subject": "Vamos retomar nossa conversa?",
        "message": "{{ $json.email_body }}"
      },
      "description": "Enviar email personalizado"
    },
    {
      "step": 5,
      "action": "Update Record",
      "type": "supabase",
      "config": {
        "operation": "update",
        "table": "leads",
        "set": {
          "last_interaction": "NOW()",
          "follow_up_sent": true
        }
      },
      "description": "Atualizar registro do lead"
    }
  ],
  "dependencies": [],
  "estimated_time_saved_per_execution": "30 minutes",
  "roi_potential": "high",
  "complexity": "medium",
  "reasoning": "Tarefa altamente repetitiva com padrão claro: buscar leads frios e enviar emails. Frequência diária gera alto ROI. Requer apenas integrações maduras (Supabase + Gmail). Score 85 devido à natureza 100% sistemática da tarefa."
}
\`\`\`
`;

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Buscar empresa no Supabase
 */
async function fetchEmpresa(empresaId) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar empresa:', error.message);
    return null;
  }

  return data;
}

/**
 * Buscar personas da empresa
 */
async function fetchPersonas(empresaId, personaId = null) {
  let query = supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId);

  if (personaId) {
    query = query.eq('id', personaId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Erro ao buscar personas:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Buscar tarefas de uma persona a partir da tabela personas_tasks
 */
async function fetchTasks(personaId) {
  const { data: tasks, error } = await supabase
    .from('personas_tasks')
    .select('*')
    .eq('persona_id', personaId);

  if (error) {
    console.error('❌ Erro ao buscar personas_tasks:', error.message);
    return [];
  }

  if (!tasks || tasks.length === 0) {
    console.log(`   ⚠️ Persona ${personaId} não tem tarefas em personas_tasks`);
    return [];
  }

  console.log(`   📋 ${tasks.length} tarefas encontradas em personas_tasks para persona ${personaId}`);
  return tasks;
}

/**
 * Chamar LLM para análise
 */
async function analyzeTaskWithLLM(task, persona, empresa, allTasks) {
  // Subsistemas disponíveis (exemplo fixo, pode ser dinâmico se necessário)
  const subsistemasDisponiveis = [
    'CRM', 'ERP', 'RH', 'Financeiro', 'Projetos', 'Atendimento', 'Marketing', 'Vendas', 'BI', 'Documentos', 'N8N', 'Supabase', 'Google Sheets', 'Slack', 'Gmail', 'Notion', 'Trello', 'Asana', 'Calendly', 'Twilio', 'Stripe'
  ];

  // =================================================================================
  // LÓGICA DE CARREGAMENTO DE PROMPT COM FALLBACK E INJEÇÃO DE CONTEXTO
  // =================================================================================

  // Tentar carregar prompt customizado do banco (workflow_prompt)
  const customBasePrompt = await loadPrompt(supabase, 'workflow_prompt', null);

  let prompt;

  if (customBasePrompt) {
    // SE EXISTIR PROMPT NO BANCO, USA ELE COMO BASE MAS INJETA O CONTEXTO ESPECÍFICO
    prompt = `
${customBasePrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ INSTRUÇÃO DE SOBRESCRITA DE SISTEMA ⚠️
IGNORE qualquer instrução anterior de gerar listas de workflows ou estruturas JSON massivas.
Sua missão AGORA é analisar UMA ÚNICA TAREFA para identificar oportunidades de automação.

Mantenha a IDENTIDADE e CRITÉRIOS DE QUALIDADE definidos no início do prompt.

DADOS DA ANÁLISE:

SUBSISTEMAS DISPONÍVEIS: ${subsistemasDisponiveis.join(', ')}

TAREFA ALVO:
- Título: ${task.title}
- Descrição: ${task.description}
- Tipo: ${task.task_type}
- Prioridade: ${task.priority}

CONTEXTO DA PERSONA:
- Nome: ${persona.nome_completo}
- Cargo: ${persona.cargo}

EMPRESA:
- Nome: ${empresa.nome}
- Setor: ${empresa.setor_atuacao}

OBRIGATÓRIO: Retorne APENAS um objeto JSON com a análise desta tarefa específica, seguindo EXATAMENTE esta estrutura (compatível com o sistema):

\`\`\`json
{
  "automation_score": (0-100),
  "automation_feasibility": "high|medium|low",
  "workflow_type": "webhook|cron|event|manual",
  "required_integrations": ["tool1", "tool2"],
  "workflow_steps": [
    { "step": 1, "action": "Trigger", "type": "webhook", "config": {}, "description": "..." }
  ],
  "dependencies": [],
  "estimated_time_saved_per_execution": "XX minutes",
  "roi_potential": "high|medium|low",
  "complexity": "simple|medium|complex",
  "reasoning": "Justificativa..."
}
\`\`\`
`;
  } else {
    // FALLBACK PADRÃO (HARDCODED)
    prompt = `SUBSISTEMAS DISPONÍVEIS PARA AUTOMAÇÃO: ${subsistemasDisponiveis.join(', ')}\n\n` + ANALYZE_TASK_PROMPT(task, persona, empresa, allTasks);
  }

  console.log(`   🤔 Analisando tarefa "${task.title}"...`);

  try {
    console.log(`   📤 Chamando LLM com fallback...`);

    // Usar sistema de fallback (prioriza FREE models)
    const analysis = await generateJSONWithFallback(prompt, {
      temperature: 0.3,
      maxTokens: 2000,
      timeout: 60000 // 60 segundos
    });

    console.log(`   📥 Análise recebida com sucesso`);

    if (!analysis) {
      throw new Error('LLM não retornou resposta válida');
    }

    // Validar campos obrigatórios
    if (!analysis.automation_score || !analysis.workflow_type || !analysis.workflow_steps) {
      throw new Error('Resposta do LLM não contém campos obrigatórios');
    }

    console.log(`   ✅ Score: ${analysis.automation_score}/100 | Feasibility: ${analysis.automation_feasibility} | Type: ${analysis.workflow_type}`);

    return {
      ...analysis,
      llm_response_raw: {
        system: 'llm-service',
        model: 'fallback-model',
        tokens: 0,
        duration_ms: 0
      },
      llm_prompt_used: prompt
    };

  } catch (error) {
    console.error(`   ❌ ERRO ao analisar tarefa:`, error.message);
    console.error(`   ⏭️  PULANDO para próxima tarefa...`);
    return null;
  }
}

/**
 * Salvar análise no Supabase
 */
async function saveAnalysis(empresaId, personaId, task, analysis) {
  console.log(`      💾 [SAVE] Iniciando salvamento...`);

  // Converter estimated_time_saved para formato Postgres INTERVAL
  let timeInterval = null;
  if (analysis.estimated_time_saved_per_execution) {
    const match = analysis.estimated_time_saved_per_execution.match(/(\d+)\s*(minute|hour|day)/i);
    if (match) {
      const value = match[1];
      const unit = match[2].toLowerCase();
      timeInterval = `${value} ${unit}${value > 1 ? 's' : ''}`;
    }
  }

  console.log(`      💾 [SAVE] Preparando record para inserção...`);

  const record = {
    empresa_id: empresaId,
    persona_id: personaId,
    // NÃO incluir task_id - usamos task_title para identificar
    task_title: task.title,
    task_description: task.description,
    task_frequency: task.frequency,
    automation_score: analysis.automation_score,
    automation_feasibility: analysis.automation_feasibility,
    workflow_type: analysis.workflow_type,
    required_integrations: analysis.required_integrations || [],
    workflow_steps: analysis.workflow_steps || [],
    dependencies: analysis.dependencies || [],
    estimated_time_saved_per_execution: timeInterval,
    roi_potential: analysis.roi_potential,
    complexity: analysis.complexity,
    reasoning: analysis.reasoning,
    llm_prompt_used: analysis.llm_prompt_used,
    llm_response_raw: analysis.llm_response_raw,
    analyzed_by: analysis.llm_response_raw?.model || 'LLM com fallback',
    analyzed_version: 'fallback-v1',
    status: 'analyzed'
  };

  console.log(`      💾 [SAVE] Verificando se já existe (persona_id: ${personaId}, task_title: "${task.title}")...`);

  // Salvar em automation_opportunities
  const { data: existingPersona, error: selectPersonaError } = await supabase
    .from('automation_opportunities')
    .select('id')
    .eq('persona_id', personaId)
    .eq('task_title', task.title)
    .maybeSingle();

  if (selectPersonaError) {
    console.error(`      ❌ [SAVE] Erro ao verificar existência em automation_opportunities:`, selectPersonaError.message);
    return false;
  }

  if (existingPersona) {
    const { error } = await supabase
      .from('automation_opportunities')
      .update(record)
      .eq('id', existingPersona.id);
    if (error) {
      console.error(`      ❌ [SAVE] Erro ao atualizar automation_opportunities:`, error.message);
      return false;
    }
  } else {
    const { error } = await supabase
      .from('automation_opportunities')
      .insert([record]);
    if (error) {
      console.error(`      ❌ [SAVE] Erro ao inserir automation_opportunities:`, error.message);
      return false;
    }
  }


  return true;
}

/**
 * Gerar procedimento de execução detalhado para a tarefa
 */
async function generateProcedimento(task, analysis, persona, empresa) {
  try {
    const prompt = `Crie um procedimento SIMPLES (3-5 steps) para: ${task.title}

Retorne JSON válido:
{
  "procedimento_execucao": [
    {"step": 1, "acao": "Ação", "ferramenta": "Ferramenta", "tempo_estimado_min": 5}
  ],
  "required_subsystems": ["comunicacao"],
  "complexity_score": 3
}`;

    const procedimentoData = await generateJSONWithFallback(prompt, {
      temperature: 0.5,
      maxTokens: 800,
      timeout: 45000 // 45 segundos
    });

    if (!procedimentoData.procedimento_execucao || procedimentoData.procedimento_execucao.length === 0) {
      console.log(`      ⚠️  Nenhum procedimento gerado`);
      return;
    }

    // Atualizar personas_tasks com o procedimento
    const { error } = await supabase
      .from('personas_tasks')
      .update({
        procedimento_execucao: procedimentoData.procedimento_execucao,
        required_subsystems: procedimentoData.required_subsystems || [],
        inputs_from: procedimentoData.inputs_from || [],
        outputs_to: procedimentoData.outputs_to || [],
        success_criteria: procedimentoData.success_criteria || null,
        complexity_score: procedimentoData.complexity_score || 5,
      })
      .eq('task_id', task.task_id);

    if (error) {
      console.error(`      ❌ Erro ao salvar procedimento:`, error.message);
      return;
    }

    const totalSteps = procedimentoData.procedimento_execucao.length;
    const totalTime = procedimentoData.procedimento_execucao.reduce((sum, step) => sum + (step.tempo_estimado_min || 0), 0);

    console.log(`      ✅ Procedimento salvo: ${totalSteps} steps (${totalTime} min)`);

  } catch (error) {
    console.error(`      ❌ Erro ao gerar procedimento:`, error.message);
  }
}

/**
 * Salvar relatório em arquivo JSON
 */
async function saveReport(empresaId, report) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `analysis_${empresaId}_${timestamp}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  await fs.writeFile(filepath, JSON.stringify(report, null, 2), 'utf-8');

  console.log(`\n📄 Relatório salvo em: ${filepath}`);
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('\n🚀 Iniciando análise de tarefas para automação...\n');
  console.log(`📋 Empresa ID: ${empresaIdArg}`);
  if (personaIdArg) {
    console.log(`👤 Persona ID: ${personaIdArg}`);
  }
  console.log(`🤖 LLM: OpenAI GPT-4o`);
  console.log(`📊 Score mínimo: ${minScoreArg}\n`);

  // 1. Buscar empresa
  const empresa = await fetchEmpresa(empresaIdArg);
  if (!empresa) {
    console.error('❌ Empresa não encontrada');
    process.exit(1);
  }

  console.log(`✅ Empresa: ${empresa.nome}\n`);

  // 2. Buscar personas
  const personas = await fetchPersonas(empresaIdArg, personaIdArg);
  if (personas.length === 0) {
    console.error('❌ Nenhuma persona encontrada');
    process.exit(1);
  }

  console.log(`✅ ${personas.length} persona(s) encontrada(s)\n`);

  // 3. Analisar tarefas de cada persona
  const report = {
    empresa_id: empresaIdArg,
    empresa_nome: empresa.nome,
    analyzed_at: new Date().toISOString(),
    llm_used: 'OpenAI GPT-4o',
    llm_model: 'z-ai/glm-4.6',
    personas_analyzed: personas.length,
    total_tasks: 0,
    tasks_analyzed: 0,
    tasks_automatable: 0, // score >= 60
    tasks_high_score: 0, // score >= 80
    analyses: []
  };

  for (const persona of personas) {
    console.log(`\n👤 Analisando persona: ${persona.nome_completo} (${persona.cargo})`);
    console.log(`   🔑 Persona ID: ${persona.id}`);

    // Buscar tarefas
    const tasks = await fetchTasks(persona.id);
    report.total_tasks += tasks.length;

    if (tasks.length === 0) {
      console.log(`   ⚠️  Sem tarefas cadastradas\n`);
      continue;
    }

    console.log(`   📋 ${tasks.length} tarefas encontradas\n`);

    // Analisar cada tarefa
    let taskIndex = 0;
    for (const task of tasks) {
      taskIndex++;
      console.log(`\n   📝 [${taskIndex}/${tasks.length}] Processando: "${task.title}"`);
      console.log(`   🔑 Task ID: ${task.id} | Frequency: ${task.frequency}`);

      console.log(`   ⏱️  [1/4] Preparando análise LLM...`);
      const analysis = await analyzeTaskWithLLM(task, persona, empresa, tasks);

      if (!analysis) {
        console.log(`   ⚠️  [SKIP] Análise falhou, pulando para próxima`);
        continue; // Erro ao analisar
      }

      console.log(`   ⏱️  [2/4] Análise concluída, atualizando contadores...`);
      report.tasks_analyzed++;

      if (analysis.automation_score >= 60) {
        report.tasks_automatable++;
      }

      if (analysis.automation_score >= 80) {
        report.tasks_high_score++;
      }

      // Salvar no banco (passar objeto task inteiro)
      console.log(`   ⏱️  [3/5] Salvando análise no banco...`);
      const saved = await saveAnalysis(empresaIdArg, persona.id, task, analysis);

      if (saved) {
        console.log(`   ⏱️  [4/5] Salvo com sucesso!`);

        // NOVO: Gerar procedimentos detalhados
        console.log(`   ⏱️  [5/5] Gerando procedimento de execução...`);
        await generateProcedimento(task, analysis, persona, empresa);

        report.analyses.push({
          persona_nome: persona.nome_completo,
          persona_cargo: persona.cargo,
          task_title: task.title,
          automation_score: analysis.automation_score,
          workflow_type: analysis.workflow_type,
          roi_potential: analysis.roi_potential,
          complexity: analysis.complexity
        });
      } else {
        console.log(`   ⚠️  [4/5] Falha ao salvar no banco`);
      }

      // Rate limiting (2 segundos entre análises)
      console.log(`   😴 Aguardando 2s antes da próxima tarefa...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 4. Salvar relatório
  await saveReport(empresaIdArg, report);

  // 5. Resumo final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DA ANÁLISE');
  console.log('='.repeat(80));
  console.log(`Total de tarefas: ${report.total_tasks}`);
  console.log(`Tarefas analisadas: ${report.tasks_analyzed}`);
  console.log(`Tarefas automatizáveis (score >= 60): ${report.tasks_automatable} (${Math.round(report.tasks_automatable / report.tasks_analyzed * 100)}%)`);
  console.log(`Tarefas altamente automatizáveis (score >= 80): ${report.tasks_high_score} (${Math.round(report.tasks_high_score / report.tasks_analyzed * 100)}%)`);
  console.log('='.repeat(80));

  console.log('\n✅ Análise concluída com sucesso!');
  console.log('\n📌 Próximo passo: Execute o script 07_generate_n8n_workflows.js para gerar workflows N8N\n');
}

// Executar
main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
