#!/usr/bin/env node
/**
 * 🎯 SCRIPT 02.5 - ANÁLISE DE TAREFAS PARA AUTOMAÇÃO (Node.js)
 * ============================================================
 * 
 * Analisa tarefas de personas usando LLM para identificar oportunidades de automação.
 * Gera workflow_steps e salva em automation_opportunities no Supabase.
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
 * node 02.5_analyze_tasks_for_automation.js --empresaId=UUID_DA_EMPRESA
 * node 02.5_analyze_tasks_for_automation.js --empresaId=UUID --personaId=UUID (análise de 1 persona)
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
import OpenAI from 'openai';
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada');
  process.exit(1);
}

if (!OPENAI_KEY) {
  console.error('❌ Erro: OPENAI_API_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse CLI arguments
const args = process.argv.slice(2);
const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='))?.split('=')[1];
const personaIdArg = args.find(arg => arg.startsWith('--personaId='))?.split('=')[1];
const minScoreArg = args.find(arg => arg.startsWith('--minScore='))?.split('=')[1] || '0';

if (!empresaIdArg) {
  console.error('❌ Erro: --empresaId é obrigatório');
  console.log('\nUso:');
  console.log('  node 02.5_analyze_tasks_for_automation.js --empresaId=UUID_DA_EMPRESA');
  console.log('  node 02.5_analyze_tasks_for_automation.js --empresaId=UUID --personaId=UUID');
  process.exit(1);
}

// Inicializar OpenAI client (Google AI removido por instabilidade)
const llmClient = new OpenAI({ apiKey: OPENAI_KEY });
console.log('🤖 Usando LLM: OpenAI GPT-4 Turbo');

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
 * Buscar tarefas de uma persona a partir do ia_config.tarefas_metas
 */
async function fetchTasks(personaId) {
  const { data: persona, error } = await supabase
    .from('personas')
    .select('id, full_name, role, ia_config')
    .eq('id', personaId)
    .single();

  if (error || !persona) {
    console.error('❌ Erro ao buscar persona:', error?.message);
    return [];
  }

  // Extrair tarefas do ia_config.tarefas_metas
  const tarefasMetas = persona.ia_config?.tarefas_metas;
  
  if (!tarefasMetas) {
    console.log(`   ⚠️ Persona ${persona.full_name} não tem tarefas_metas em ia_config`);
    return [];
  }

  // Converter estrutura de tarefas_metas para formato esperado
  const tasks = [];
  
  // Tarefas diárias
  if (tarefasMetas.tarefas_diarias) {
    tarefasMetas.tarefas_diarias.forEach((tarefa, index) => {
      tasks.push({
        id: `${personaId}_daily_${index}`,
        persona_id: personaId,
        title: tarefa.titulo || tarefa,
        description: tarefa.descricao || tarefa,
        frequency: 'diaria',
        category: tarefa.categoria || 'operacional',
        importance: tarefa.importancia || 'media'
      });
    });
  }

  // Tarefas semanais
  if (tarefasMetas.tarefas_semanais) {
    tarefasMetas.tarefas_semanais.forEach((tarefa, index) => {
      tasks.push({
        id: `${personaId}_weekly_${index}`,
        persona_id: personaId,
        title: tarefa.titulo || tarefa,
        description: tarefa.descricao || tarefa,
        frequency: 'semanal',
        category: tarefa.categoria || 'operacional',
        importance: tarefa.importancia || 'media'
      });
    });
  }

  // Tarefas mensais
  if (tarefasMetas.tarefas_mensais) {
    tarefasMetas.tarefas_mensais.forEach((tarefa, index) => {
      tasks.push({
        id: `${personaId}_monthly_${index}`,
        persona_id: personaId,
        title: tarefa.titulo || tarefa,
        description: tarefa.descricao || tarefa,
        frequency: 'mensal',
        category: tarefa.categoria || 'estrategica',
        importance: tarefa.importancia || 'alta'
      });
    });
  }

  console.log(`   📋 ${tasks.length} tarefas encontradas para ${persona.full_name}`);
  return tasks;
}

/**
 * Chamar LLM para análise
 */
async function analyzeTaskWithLLM(task, persona, empresa, allTasks) {
  const prompt = ANALYZE_TASK_PROMPT(task, persona, empresa, allTasks);

  console.log(`   🤔 Analisando tarefa "${task.title}"...`);

  try {
    // Usar OpenAI GPT-4 Turbo (Google AI removido por instabilidade)
    const completion = await llmClient.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'Você é um especialista em automação de processos e workflows N8N. Retorne sempre JSON válido.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Baixa temperatura para respostas mais consistentes
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content;

    // Extrair JSON da resposta (remover markdown se presente)
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/```\n([\s\S]*?)\n```/);
    const jsonString = jsonMatch ? jsonMatch[1] : responseText;

    const analysis = JSON.parse(jsonString.trim());

    // Validar campos obrigatórios
    if (!analysis.automation_score || !analysis.workflow_type || !analysis.workflow_steps) {
      throw new Error('Resposta do LLM não contém campos obrigatórios');
    }

    console.log(`   ✅ Score: ${analysis.automation_score}/100 | Feasibility: ${analysis.automation_feasibility} | Type: ${analysis.workflow_type}`);

    return {
      ...analysis,
      llm_response_raw: { model: 'gpt-4-turbo-preview', response: responseText },
      llm_prompt_used: prompt
    };

  } catch (error) {
    console.error(`   ❌ Erro ao analisar tarefa:`, error.message);
    return null;
  }
}

/**
 * Salvar análise no Supabase
 */
async function saveAnalysis(empresaId, personaId, taskId, analysis) {
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

  const record = {
    empresa_id: empresaId,
    persona_id: personaId,
    task_id: taskId,
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
    analyzed_by: 'GPT-4-Turbo',
    analyzed_version: 'gpt-4-turbo-preview',
    status: 'analyzed'
  };

  // Verificar se já existe análise para essa tarefa
  const { data: existing } = await supabase
    .from('automation_opportunities')
    .select('id')
    .eq('task_id', taskId)
    .single();

  if (existing) {
    // Atualizar existente
    const { error } = await supabase
      .from('automation_opportunities')
      .update(record)
      .eq('id', existing.id);

    if (error) {
      console.error(`   ❌ Erro ao atualizar análise:`, error.message);
      return false;
    }

    console.log(`   💾 Análise atualizada no banco`);
  } else {
    // Inserir novo
    const { error } = await supabase
      .from('automation_opportunities')
      .insert([record]);

    if (error) {
      console.error(`   ❌ Erro ao salvar análise:`, error.message);
      return false;
    }

    console.log(`   💾 Análise salva no banco`);
  }

  return true;
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
  console.log(`🤖 LLM: OpenAI GPT-4 Turbo`);
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
    llm_used: 'GPT-4-Turbo',
    llm_model: 'gpt-4-turbo-preview',
    personas_analyzed: personas.length,
    total_tasks: 0,
    tasks_analyzed: 0,
    tasks_automatable: 0, // score >= 60
    tasks_high_score: 0, // score >= 80
    analyses: []
  };

  for (const persona of personas) {
    console.log(`\n👤 Analisando persona: ${persona.nome_completo} (${persona.cargo})`);

    // Buscar tarefas
    const tasks = await fetchTasks(persona.id);
    report.total_tasks += tasks.length;

    if (tasks.length === 0) {
      console.log(`   ⚠️  Sem tarefas cadastradas\n`);
      continue;
    }

    console.log(`   📋 ${tasks.length} tarefas encontradas\n`);

    // Analisar cada tarefa
    for (const task of tasks) {
      const analysis = await analyzeTaskWithLLM(task, persona, empresa, tasks);

      if (!analysis) {
        continue; // Erro ao analisar
      }

      report.tasks_analyzed++;

      if (analysis.automation_score >= 60) {
        report.tasks_automatable++;
      }

      if (analysis.automation_score >= 80) {
        report.tasks_high_score++;
      }

      // Salvar no banco
      const saved = await saveAnalysis(empresaIdArg, persona.id, task.id, analysis);

      if (saved) {
        report.analyses.push({
          persona_nome: persona.nome_completo,
          persona_cargo: persona.cargo,
          task_title: task.title,
          automation_score: analysis.automation_score,
          workflow_type: analysis.workflow_type,
          roi_potential: analysis.roi_potential,
          complexity: analysis.complexity
        });
      }

      // Rate limiting (2 segundos entre análises)
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
  console.log('\n📌 Próximo passo: Execute o script 03_generate_n8n_from_tasks.js para gerar workflows N8N\n');
}

// Executar
main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
