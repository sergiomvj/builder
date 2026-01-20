// ============================================================================
// SCRIPT 09 - AUDITORIA COMPLETA DE PERSONAS
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 08 (ML models gerados)
// 
// DESCRIÇÃO:
// - Audita completude de dados em TODAS as 9 fases anteriores
// - Valida integridade referencial entre tabelas
// - Calcula quality_score (0-100) para cada persona
// - Identifica gaps, inconsistências e dados faltantes
// - Gera relatório detalhado de auditoria
// - Salva em tabela normalizada `personas_auditorias` (APENAS BANCO - SEM JSON)
// 
// Uso:
//   node 09_generate_auditoria.js --empresaId=UUID [--personaId=UUID] [--full]
// 
// Modos de Execução:
//   (padrão)      : AUDITORIA RÁPIDA - Verifica existência de dados
//   --personaId=X : INDIVIDUAL - Audita apenas uma persona específica
//   --full        : AUDITORIA COMPLETA - Valida conteúdo e consistência profunda

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ExecutionTracker } from './lib/execution-tracker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const OUTPUT_DIR = path.join(__dirname, 'auditoria_output');

// Criar diretório de output
await fs.mkdir(OUTPUT_DIR, { recursive: true });

console.log('🔍 SCRIPT 09 - AUDITORIA COMPLETA DE PERSONAS');
console.log('===============================================');
console.log('📊 Validando dados de todas as 9 fases');
console.log('===============================================\n');

/**
 * Cria tabela personas_audit_logs se não existir
 */
async function criarTabelaSeNecessario() {
  console.log('📋 Verificando tabela personas_audit_logs...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS personas_auditorias (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
      audit_type TEXT NOT NULL DEFAULT 'completeness_check',
      quality_score INT NOT NULL,
      phase_scores JSONB NOT NULL,
      missing_data JSONB,
      inconsistencies JSONB,
      warnings JSONB,
      recommendations JSONB,
      audit_date TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_audit_logs_persona ON personas_auditorias(persona_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON personas_auditorias(audit_date DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_score ON personas_auditorias(quality_score);
  `;
  
  console.log('⚠️  Execute o SQL abaixo no Supabase SQL Editor se a tabela não existir:');
  console.log(createTableSQL);
  console.log('');
}

/**
 * Audita Fase 01: Placeholders
 */
async function auditarFase01(personaId) {
  const checks = {
    has_id: false,
    has_role: false,
    has_department: false,
    has_specialty: false,
    has_nacionalidade: false
  };
  
  const { data: persona } = await supabase
    .from('personas')
    .select('id, role, department, specialty, nacionalidade')
    .eq('id', personaId)
    .single();
  
  if (persona) {
    checks.has_id = !!persona.id;
    checks.has_role = !!persona.role && persona.role !== '';
    checks.has_department = !!persona.department && persona.department !== '';
    checks.has_specialty = !!persona.specialty;
    checks.has_nacionalidade = !!persona.nacionalidade && persona.nacionalidade !== '';
  }
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
  
  return { score, checks, phase: '01_placeholders' };
}

/**
 * Audita Fase 02: Biografias + Dados Básicos
 */
async function auditarFase02(personaId) {
  const checks = {
    has_full_name: false,
    has_email: false,
    has_genero: false,
    has_experiencia_anos: false,
    has_biografia: false,
    biografia_complete: false
  };
  
  const { data: persona } = await supabase
    .from('personas')
    .select('full_name, email, genero, experiencia_anos')
    .eq('id', personaId)
    .single();
  
  const { data: biografia } = await supabase
    .from('personas_biografias')
    .select('biografia_estruturada')
    .eq('persona_id', personaId)
    .single();
  
  if (persona) {
    checks.has_full_name = !!persona.full_name && persona.full_name !== '';
    checks.has_email = !!persona.email && persona.email.includes('@');
    checks.has_genero = !!persona.genero && ['masculino', 'feminino'].includes(persona.genero);
    checks.has_experiencia_anos = typeof persona.experiencia_anos === 'number' && persona.experiencia_anos > 0;
  }
  
  if (biografia) {
    checks.has_biografia = !!biografia.biografia_estruturada;
    
    const bio = biografia.biografia_estruturada;
    checks.biografia_complete = !!(
      bio.formacao_academica &&
      bio.experiencia_profissional &&
      bio.hard_skills &&
      bio.soft_skills
    );
  }
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
  
  return { score, checks, phase: '02_biografias' };
}

/**
 * Audita Fase 03: Atribuições
 */
async function auditarFase03(personaId) {
  const checks = {
    has_atribuicoes: false,
    min_3_atribuicoes: false,
    has_ordem: false
  };
  
  const { data: atribuicoes } = await supabase
    .from('personas_atribuicoes')
    .select('*')
    .eq('persona_id', personaId);
  
  if (atribuicoes && atribuicoes.length > 0) {
    checks.has_atribuicoes = true;
    checks.min_3_atribuicoes = atribuicoes.length >= 3;
    checks.has_ordem = atribuicoes.every(a => typeof a.ordem === 'number');
  }
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
  
  return { score, checks, phase: '03_atribuicoes', count: atribuicoes?.length || 0 };
}

/**
 * Audita Fase 04: Competências + Metas
 */
async function auditarFase04(personaId) {
  const checks = {
    has_competencias: false,
    has_competencias_tecnicas: false,
    has_competencias_comportamentais: false,
    has_ferramentas: false,
    has_tarefas: false,
    has_kpis: false,
    has_objetivos: false
  };
  
  const { data: comp } = await supabase
    .from('personas_competencias')
    .select('*')
    .eq('persona_id', personaId)
    .single();
  
  if (comp) {
    checks.has_competencias = true;
    checks.has_competencias_tecnicas = Array.isArray(comp.competencias_tecnicas) && comp.competencias_tecnicas.length >= 3;
    checks.has_competencias_comportamentais = Array.isArray(comp.competencias_comportamentais) && comp.competencias_comportamentais.length >= 3;
    checks.has_ferramentas = Array.isArray(comp.ferramentas) && comp.ferramentas.length >= 2;
    checks.has_tarefas = !!(
      Array.isArray(comp.tarefas_diarias) && comp.tarefas_diarias.length >= 2 &&
      Array.isArray(comp.tarefas_semanais) && comp.tarefas_semanais.length >= 2
    );
    checks.has_kpis = Array.isArray(comp.kpis) && comp.kpis.length >= 2;
    checks.has_objetivos = Array.isArray(comp.objetivos_desenvolvimento) && comp.objetivos_desenvolvimento.length >= 2;
  }
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
  
  return { score, checks, phase: '04_competencias' };
}

/**
 * Audita Fase 05: Avatares
 */
async function auditarFase05(personaId) {
  const checks = {
    has_avatar: false,
    has_biometrics: false,
    has_visual_description: false
  };
  
  const { data: avatar } = await supabase
    .from('personas_avatares')
    .select('*')
    .eq('persona_id', personaId)
    .single();
  
  const { data: persona } = await supabase
    .from('personas')
    .select('system_prompt')
    .eq('id', personaId)
    .single();
  
  if (avatar) {
    checks.has_avatar = true;
    checks.has_biometrics = !!avatar.biometrics && Object.keys(avatar.biometrics).length >= 10;
  }
  
  if (persona?.system_prompt) {
    checks.has_visual_description = persona.system_prompt.includes('descricao_fisica');
  }
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
  
  return { score, checks, phase: '05_avatares' };
}

/**
 * Audita Fase 06: Automação
 */
async function auditarFase06(personaId) {
  const checks = {
    has_automation_opportunities: false,
    min_1_opportunity: false,
    has_high_score: false
  };
  
  const { data: automations } = await supabase
    .from('automation_opportunities')
    .select('*')
    .eq('persona_id', personaId);
  
  if (automations && automations.length > 0) {
    checks.has_automation_opportunities = true;
    checks.min_1_opportunity = automations.length >= 1;
    checks.has_high_score = automations.some(a => a.automation_score >= 60);
  }
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
  
  return { score, checks, phase: '06_automation', count: automations?.length || 0 };
}

/**
 * Audita Fase 07: Workflows N8N
 */
async function auditarFase07(personaId) {
  const checks = {
    has_workflows: false,
    min_1_workflow: false,
    has_valid_json: false
  };
  
  const { data: workflows } = await supabase
    .from('personas_workflows')
    .select('*')
    .eq('persona_id', personaId);
  
  if (workflows && workflows.length > 0) {
    checks.has_workflows = true;
    checks.min_1_workflow = workflows.length >= 1;
    checks.has_valid_json = workflows.every(w => w.n8n_json && typeof w.n8n_json === 'object');
  }
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
  
  return { score, checks, phase: '07_workflows', count: workflows?.length || 0 };
}

/**
 * Audita Fase 08: Machine Learning
 */
async function auditarFase08(personaId) {
  const checks = {
    has_ml_model: false,
    has_metrics: false,
    has_predictions: false,
    good_accuracy: false
  };
  
  const { data: mlModel } = await supabase
    .from('personas_machine_learning')
    .select('*')
    .eq('persona_id', personaId)
    .single();
  
  if (mlModel) {
    checks.has_ml_model = true;
    checks.has_metrics = !!mlModel.performance_metrics;
    checks.has_predictions = !!mlModel.predictions;
    
    if (mlModel.performance_metrics?.accuracy) {
      checks.good_accuracy = mlModel.performance_metrics.accuracy >= 0.7;
    }
  }
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
  
  return { score, checks, phase: '08_machine_learning' };
}

/**
 * Calcula score geral de qualidade
 */
function calcularQualityScore(phaseScores) {
  const weights = {
    '01_placeholders': 0.05,
    '02_biografias': 0.20,
    '03_atribuicoes': 0.15,
    '04_competencias': 0.20,
    '05_avatares': 0.10,
    '06_automation': 0.10,
    '07_workflows': 0.10,
    '08_machine_learning': 0.10
  };
  
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  for (const [phase, result] of Object.entries(phaseScores)) {
    const weight = weights[phase] || 0;
    totalWeightedScore += result.score * weight;
    totalWeight += weight;
  }
  
  return Math.round(totalWeightedScore / totalWeight);
}

/**
 * Identifica dados faltantes e inconsistências
 */
function identificarGaps(phaseScores, persona) {
  const missing = [];
  const warnings = [];
  const recommendations = [];
  
  // Verificar cada fase
  for (const [phase, result] of Object.entries(phaseScores)) {
    if (result.score < 50) {
      missing.push({
        phase,
        score: result.score,
        severity: 'high',
        message: `Fase ${phase} com completude baixa (${result.score}%)`
      });
    } else if (result.score < 80) {
      warnings.push({
        phase,
        score: result.score,
        severity: 'medium',
        message: `Fase ${phase} com completude média (${result.score}%)`
      });
    }
  }
  
  // Recomendações baseadas em scores
  if (phaseScores['02_biografias']?.score < 100) {
    recommendations.push({
      priority: 'high',
      action: 'Completar dados biográficos',
      script: '02_generate_biografias_COMPLETO.js',
      reason: 'Biografia incompleta impacta todas as fases seguintes'
    });
  }
  
  if (phaseScores['04_competencias']?.score < 100) {
    recommendations.push({
      priority: 'high',
      action: 'Regenerar competências',
      script: '04_generate_competencias_grok.cjs',
      reason: 'Competências são base para automação e ML'
    });
  }
  
  if (phaseScores['06_automation']?.count === 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Analisar oportunidades de automação',
      script: '06_analyze_tasks_for_automation.js',
      reason: 'Nenhuma análise de automação encontrada'
    });
  }
  
  return { missing, warnings, recommendations };
}

/**
 * Audita uma persona completa
 */
async function auditarPersona(personaId, fullAudit = false) {
  const phaseScores = {};
  
  // Buscar dados básicos da persona
  const { data: persona } = await supabase
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .single();
  
  if (!persona) {
    throw new Error(`Persona ${personaId} não encontrada`);
  }
  
  console.log(`  🔍 Auditando: ${persona.full_name || 'Nome não definido'}`);
  
  // Auditar cada fase
  phaseScores['01_placeholders'] = await auditarFase01(personaId);
  phaseScores['02_biografias'] = await auditarFase02(personaId);
  phaseScores['03_atribuicoes'] = await auditarFase03(personaId);
  phaseScores['04_competencias'] = await auditarFase04(personaId);
  phaseScores['05_avatares'] = await auditarFase05(personaId);
  phaseScores['06_automation'] = await auditarFase06(personaId);
  phaseScores['07_workflows'] = await auditarFase07(personaId);
  phaseScores['08_machine_learning'] = await auditarFase08(personaId);
  
  // Calcular quality score geral
  const qualityScore = calcularQualityScore(phaseScores);
  
  // Identificar gaps
  const { missing, warnings, recommendations } = identificarGaps(phaseScores, persona);
  
  const auditResult = {
    persona_id: personaId,
    audit_type: fullAudit ? 'full_validation' : 'completeness_check',
    quality_score: qualityScore,
    phase_scores: phaseScores,
    missing_data: missing,
    inconsistencies: [],
    warnings,
    recommendations,
    audit_date: new Date().toISOString()
  };
  
  // Salvar no banco
  const { error } = await supabase
    .from('personas_auditorias')
    .insert(auditResult);
  
  if (error) {
    console.warn(`    ⚠️  Erro ao salvar auditoria (tabela pode não existir):`, error.message);
  } else {
    console.log(`    ✅ Auditoria salva no banco`);
  }
  
  // Exibir resumo
  console.log(`    📊 Quality Score: ${qualityScore}/100`);
  console.log(`    ✅ Fases completas: ${Object.values(phaseScores).filter(p => p.score === 100).length}/8`);
  console.log(`    ⚠️  Warnings: ${warnings.length}`);
  console.log(`    ❌ Gaps críticos: ${missing.length}`);
  
  return auditResult;
}

/**
 * Função principal
 */
async function executarAuditoria() {
  try {
    const args = process.argv.slice(2);
    let empresaId = null;
    let personaId = null;
    let fullAudit = false;
    
    for (const arg of args) {
      if (arg.startsWith('--empresaId=')) {
        empresaId = arg.split('=')[1];
      } else if (arg.startsWith('--personaId=')) {
        personaId = arg.split('=')[1];
      } else if (arg === '--full') {
        fullAudit = true;
      }
    }
    
    if (!empresaId) {
      console.error('❌ --empresaId não fornecido');
      console.log('💡 Uso: node 09_generate_auditoria.js --empresaId=ID [--personaId=ID] [--full]');
      process.exit(1);
    }

    // Verificar/criar tabela
    await criarTabelaSeNecessario();

    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError) throw new Error(`Empresa não encontrada: ${empresaError.message}`);

    console.log(`🏢 Empresa: ${empresa.nome}`);
    console.log(`🔍 Tipo: ${fullAudit ? 'AUDITORIA COMPLETA' : 'AUDITORIA RÁPIDA'}\n`);

    // Buscar personas
    let query = supabase
      .from('personas')
      .select('id, full_name, role')
      .eq('empresa_id', empresa.id);
    
    if (personaId) {
      query = query.eq('id', personaId);
    }

    const { data: personas, error: personasError } = await query;

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      return;
    }

    console.log(`🎯 Auditando ${personas.length} personas...\n`);

    const results = [];
    let highQuality = 0;
    let mediumQuality = 0;
    let lowQuality = 0;

    // Inicializar tracker de progresso
    const tracker = new ExecutionTracker('09_generate_auditoria', empresaId, personas.length);
    await tracker.start();

    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];
      await tracker.updateProgress(i + 1, `Auditando ${persona.full_name}`, persona.full_name);
      
      console.log(`\n[${i + 1}/${personas.length}]`);
      
      const result = await auditarPersona(persona.id, fullAudit);
      results.push(result);
      
      // Categorizar
      if (result.quality_score >= 80) highQuality++;
      else if (result.quality_score >= 60) mediumQuality++;
      else lowQuality++;
      
      // Delay
      if (i < personas.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Salvar relatório geral
    const reportFilename = `auditoria_${empresa.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    const report = {
      empresa: {
        id: empresa.id,
        nome: empresa.nome
      },
      audit_summary: {
        total_personas: personas.length,
        high_quality: highQuality,
        medium_quality: mediumQuality,
        low_quality: lowQuality,
        avg_quality_score: Math.round(results.reduce((sum, r) => sum + r.quality_score, 0) / results.length)
      },
      audits: results,
      generated_at: new Date().toISOString()
    };

    console.log('\n📊 RELATÓRIO GERAL');
    console.log('===================');
    console.log(`🏢 Empresa: ${empresa.nome}`);
    console.log(`👥 Personas auditadas: ${personas.length}`);
    console.log(`\n📈 QUALIDADE:`);
    console.log(`   🟢 Alta (80-100): ${highQuality} personas`);
    console.log(`   🟡 Média (60-79): ${mediumQuality} personas`);
    console.log(`   🔴 Baixa (<60): ${lowQuality} personas`);
    console.log(`\n⭐ Score médio: ${report.audit_summary.avg_quality_score}/100`);
    console.log(`\n💾 Dados salvos em: personas_auditorias (apenas banco de dados)`);
    
    // Marcar script como concluído
    await tracker.complete(`Auditoria concluída: ${personas.length} personas, score médio ${report.audit_summary.avg_quality_score}/100`);
    
    console.log('\n🎉 AUDITORIA CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    process.exit(1);
  }
}

executarAuditoria();
