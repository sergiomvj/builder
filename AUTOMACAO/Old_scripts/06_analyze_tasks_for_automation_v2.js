#!/usr/bin/env node
/**
 * ============================================================================
 * SCRIPT 06: ANÁLISE DE TAREFAS PARA AUTOMAÇÃO (V2 - REESCRITO)
 * ============================================================================
 * Analisa tarefas das personas e identifica oportunidades de automação
 * Gera automation scores, workflow types e steps para cada tarefa
 * Salva resultados DIRETO NO BANCO (personas_automation_opportunities)
 * 
 * Uso: node 06_analyze_tasks_for_automation_v2.js --empresaId=UUID
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from '../lib/llm_fallback.js';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

dotenv.config({ path: '../.env.local' });

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const OUTPUT_DIR = './automation_analysis_output';

// Parse argumentos
const args = process.argv.slice(2);
const empresaIdArg = args.find(arg => arg.startsWith('--empresaId='))?.split('=')[1];

if (!empresaIdArg) {
  console.error('❌ Erro: --empresaId é obrigatório');
  console.log('Uso: node 06_analyze_tasks_for_automation_v2.js --empresaId=UUID');
  process.exit(1);
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function buscarEmpresa(empresaId) {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();

  if (error) throw new Error(`Erro ao buscar empresa: ${error.message}`);
  return data;
}

async function buscarPersonas(empresaId) {
  const { data, error } = await supabase
    .from('personas')
    .select('id, full_name, role')
    .eq('empresa_id', empresaId)
    .order('full_name');

  if (error) throw new Error(`Erro ao buscar personas: ${error.message}`);
  return data || [];
}

async function extrairTarefas(persona) {
  // Buscar tarefas da tabela personas_competencias
  const { data: comp, error } = await supabase
    .from('personas_competencias')
    .select('tarefas_diarias, tarefas_semanais, tarefas_mensais')
    .eq('persona_id', persona.id)
    .single();

  if (error) {
    console.error(`   ⚠️  Erro ao buscar competências: ${error.message}`);
    return [];
  }

  if (!comp) {
    return [];
  }

  const tarefas = [];

  // Tarefas diárias
  if (Array.isArray(comp.tarefas_diarias)) {
    comp.tarefas_diarias.forEach((t, idx) => {
      tarefas.push({
        titulo: typeof t === 'string' ? t : t.titulo || t.tarefa || 'Sem título',
        descricao: typeof t === 'string' ? t : t.descricao || t.titulo || 'Sem descrição',
        frequencia: 'diaria',
        categoria: 'operacional',
        index: idx
      });
    });
  }

  // Tarefas semanais
  if (Array.isArray(comp.tarefas_semanais)) {
    comp.tarefas_semanais.forEach((t, idx) => {
      tarefas.push({
        titulo: typeof t === 'string' ? t : t.titulo || t.tarefa || 'Sem título',
        descricao: typeof t === 'string' ? t : t.descricao || t.titulo || 'Sem descrição',
        frequencia: 'semanal',
        categoria: 'tatica',
        index: idx
      });
    });
  }

  // Tarefas mensais
  if (Array.isArray(comp.tarefas_mensais)) {
    comp.tarefas_mensais.forEach((t, idx) => {
      tarefas.push({
        titulo: typeof t === 'string' ? t : t.titulo || t.tarefa || 'Sem título',
        descricao: typeof t === 'string' ? t : t.descricao || t.titulo || 'Sem descrição',
        frequencia: 'mensal',
        categoria: 'estrategica',
        index: idx
      });
    });
  }

  return tarefas;
}

async function analisarTarefa(tarefa, persona, empresa) {
  const prompt = `Você é um especialista em automação de processos empresariais.

**TAREFA PARA ANÁLISE:**
- Título: ${tarefa.titulo}
- Descrição: ${tarefa.descricao}
- Frequência: ${tarefa.frequencia}
- Categoria: ${tarefa.categoria}

**PERSONA:**
- Nome: ${persona.full_name}
- Cargo: ${persona.role}

**EMPRESA:**
- Nome: ${empresa.nome}
- Setor: ${empresa.setor_atuacao || 'N/A'}

**INSTRUÇÕES:**
Analise se esta tarefa pode ser automatizada e retorne JSON com:

1. **automation_score** (0-100): 
   - 0-30: Essencialmente humana (criatividade, empatia, julgamento complexo)
   - 31-60: Parcialmente automatizável (assistida por automação)
   - 61-100: Totalmente automatizável (repetitivo, regras claras)

2. **automation_feasibility**: "high" | "medium" | "low"

3. **workflow_type**: "cron" (agendado) | "webhook" (evento externo) | "event" (mudança no sistema) | "manual"

4. **required_integrations**: Array de integrações (ex: ["gmail", "slack", "supabase"])

5. **workflow_steps**: Array de objetos com step, action, type, config, description

6. **estimated_time_saved_per_execution**: String (ex: "30 minutes", "2 hours")

7. **roi_potential**: "high" | "medium" | "low"

8. **complexity**: "simple" | "medium" | "complex"

9. **reasoning**: String explicando a análise (2-3 frases)

Retorne APENAS JSON válido, sem markdown:`;

  try {
    console.log(`      🤖 Chamando LLM...`);
    
    const analysis = await generateJSONWithFallback(prompt, {
      temperature: 0.3,
      maxTokens: 2000,
      timeout: 15000 // 15s por provedor
    });

    // Validação básica
    if (!analysis?.automation_score || !analysis?.workflow_type) {
      throw new Error('Resposta LLM incompleta');
    }

    return analysis;
  } catch (error) {
    console.error(`      ⚠️  Erro LLM: ${error.message}`);
    console.log(`      🔄 Usando análise fallback básica...`);
    
    // FALLBACK: análise básica automática sem LLM
    const isCronKeyword = tarefa.frequencia.includes('diaria') || tarefa.frequencia.includes('semanal') || tarefa.frequencia.includes('mensal');
    const score = isCronKeyword ? 65 : 45; // Tarefas periódicas = mais automatizáveis
    
    return {
      automation_score: score,
      automation_feasibility: score >= 60 ? 'medium' : 'low',
      workflow_type: isCronKeyword ? 'cron' : 'manual',
      required_integrations: ['supabase'],
      workflow_steps: [
        {
          step: 1,
          action: 'Trigger',
          type: isCronKeyword ? 'cron' : 'manual',
          config: {},
          description: `Disparar ${tarefa.frequencia}mente`
        }
      ],
      estimated_time_saved_per_execution: '30 minutes',
      roi_potential: 'medium',
      complexity: 'medium',
      reasoning: `Análise automática: tarefa ${tarefa.frequencia} com potencial ${score >= 60 ? 'alto' : 'médio'} de automação.`
    };
  }
}

async function salvarAnalise(empresaId, personaId, tarefa, analise) {
  // Converter tempo para interval
  let timeInterval = null;
  if (analise.estimated_time_saved_per_execution) {
    const match = analise.estimated_time_saved_per_execution.match(/(\d+)\s*(minute|hour|day)/i);
    if (match) {
      const [, value, unit] = match;
      timeInterval = `${value} ${unit.toLowerCase()}${value > 1 ? 's' : ''}`;
    }
  }

  const record = {
    empresa_id: empresaId,
    persona_id: personaId,
    task_title: tarefa.titulo,
    task_description: tarefa.descricao,
    task_frequency: tarefa.frequencia,
    automation_score: analise.automation_score,
    automation_feasibility: analise.automation_feasibility,
    workflow_type: analise.workflow_type,
    required_integrations: analise.required_integrations || [],
    workflow_steps: analise.workflow_steps || [],
    dependencies: analise.dependencies || [],
    estimated_time_saved_per_execution: timeInterval,
    roi_potential: analise.roi_potential,
    complexity: analise.complexity,
    reasoning: analise.reasoning,
    status: 'analyzed'
  };

  // Verificar se já existe
  const { data: existing } = await supabase
    .from('personas_automation_opportunities')
    .select('id')
    .eq('persona_id', personaId)
    .eq('task_title', tarefa.titulo)
    .maybeSingle();

  if (existing) {
    // Atualizar
    const { error } = await supabase
      .from('personas_automation_opportunities')
      .update(record)
      .eq('id', existing.id);

    if (error) {
      console.error(`      ❌ Erro ao atualizar: ${error.message}`);
      return false;
    }
  } else {
    // Inserir
    const { error } = await supabase
      .from('personas_automation_opportunities')
      .insert([record]);

    if (error) {
      console.error(`      ❌ Erro ao inserir: ${error.message}`);
      return false;
    }
  }

  return true;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('\n🚀 ANÁLISE DE TAREFAS PARA AUTOMAÇÃO (V2)\n');
  console.log(`📋 Empresa: ${empresaIdArg}\n`);

  // 1. Buscar empresa
  const empresa = await buscarEmpresa(empresaIdArg);
  console.log(`✅ Empresa: ${empresa.nome}\n`);

  // 2. Buscar personas
  const personas = await buscarPersonas(empresaIdArg);
  console.log(`✅ ${personas.length} personas encontradas\n`);

  // 3. Processar cada persona
  const relatorio = {
    empresa_id: empresaIdArg,
    empresa_nome: empresa.nome,
    analyzed_at: new Date().toISOString(),
    total_personas: personas.length,
    total_tasks: 0,
    tasks_analyzed: 0,
    tasks_automatable: 0,
    tasks_high_score: 0,
    analises: []
  };

  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    console.log(`\n[${i + 1}/${personas.length}] 👤 ${persona.full_name} (${persona.role})`);

    // Extrair tarefas (agora é async)
    const tarefas = await extrairTarefas(persona);
    relatorio.total_tasks += tarefas.length;

    if (tarefas.length === 0) {
      console.log(`   ⚠️  Sem tarefas`);
      continue;
    }

    console.log(`   📋 ${tarefas.length} tarefas encontradas`);

    // Analisar cada tarefa
    for (let j = 0; j < tarefas.length; j++) {
      const tarefa = tarefas[j];
      console.log(`\n   [${j + 1}/${tarefas.length}] 📝 "${tarefa.titulo}"`);

      // Análise com LLM
      const analise = await analisarTarefa(tarefa, persona, empresa);
      
      if (!analise) {
        console.log(`      ⚠️  Pulando (erro na análise)`);
        continue;
      }

      console.log(`      ✅ Score: ${analise.automation_score} | Type: ${analise.workflow_type}`);

      // Salvar no banco
      const salvou = await salvarAnalise(empresaIdArg, persona.id, tarefa, analise);
      
      if (salvou) {
        relatorio.tasks_analyzed++;
        
        if (analise.automation_score >= 60) relatorio.tasks_automatable++;
        if (analise.automation_score >= 80) relatorio.tasks_high_score++;

        relatorio.analises.push({
          persona: persona.full_name,
          tarefa: tarefa.titulo,
          score: analise.automation_score,
          type: analise.workflow_type,
          roi: analise.roi_potential
        });

        console.log(`      💾 Salvo`);
      }

      // Rate limit
      await sleep(2000);
    }
  }

  // 4. Resumo
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO');
  console.log('='.repeat(80));
  console.log(`Personas: ${relatorio.total_personas}`);
  console.log(`Total de tarefas: ${relatorio.total_tasks}`);
  console.log(`Tarefas analisadas: ${relatorio.tasks_analyzed}`);
  console.log(`Automatizáveis (≥60): ${relatorio.tasks_automatable} (${Math.round(relatorio.tasks_automatable / relatorio.tasks_analyzed * 100)}%)`);
  console.log(`Alta automação (≥80): ${relatorio.tasks_high_score} (${Math.round(relatorio.tasks_high_score / relatorio.tasks_analyzed * 100)}%)`);
  console.log('='.repeat(80));

  console.log('\n✅ Análise concluída!\n');
  console.log('📌 Próximo: node 07_generate_n8n_workflows.js --empresaId=' + empresaIdArg + '\n');
}

// Executar
main().catch(error => {
  console.error('\n❌ ERRO FATAL:', error.message);
  console.error(error.stack);
  process.exit(1);
});
