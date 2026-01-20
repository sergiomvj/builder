// ============================================================================
// SCRIPT 04 - GERAÇÃO DE COMPETÊNCIAS COM GROK (RÁPIDO)
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 03 (atribuições criadas)
// 
// CORREÇÕES IMPLEMENTADAS:
// - Busca biografia completa de personas_biografias (SEM truncar)
// - Busca atribuições de personas_atribuicoes
// - Inclui hard_skills e soft_skills no prompt
// - Contexto completo para competências detalhadas
// 
// Uso:
//   node 04_generate_competencias_grok.js --empresaId=UUID [--force|--all]
// 
// Modos de Execução:
//   (padrão)  : INCREMENTAL - Processa apenas personas sem competências
//   --all     : COMPLETO - Substitui competências de todas personas
//   --force   : FORÇA TOTAL - Limpa TUDO e regenera do zero

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import { setupConsoleEncoding } from './lib/console_fix.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

console.log('🤖 SCRIPT 04 - GERAÇÃO DE COMPETÊNCIAS');
console.log('🔄 Usando LLM com fallback: Grok → GLM → Kimi-K2 (FREE) → GPT-3.5 → Qwen → Claude');
console.log('===================================================\n');

const PROGRESS_FILE = path.join(__dirname, 'script-progress.json');
const OUTPUT_DIR = path.join(__dirname, 'competencias_output');
const METAS_OUTPUT_DIR = path.join(__dirname, 'metas_output');

// Criar diretórios de output
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(METAS_OUTPUT_DIR)) {
  fs.mkdirSync(METAS_OUTPUT_DIR, { recursive: true });
}

console.log('🎯 SCRIPT 04 - GERAÇÃO DE COMPETÊNCIAS + METAS COM GROK');
console.log('========================================================');
console.log('🚀 Modelo: Grok via OpenRouter (rápido!)');
console.log('🎯 Novo: Geração automática de metas SMART');
console.log('========================================================\n');

function updateProgress(status, current, total, currentPersona = '', errors = []) {
  const progress = {
    script: '02_generate_competencias_grok',
    status,
    current,
    total,
    currentPersona,
    errors,
    startedAt: status === 'running' && current === 0 ? new Date().toISOString() : null,
    completedAt: status === 'completed' ? new Date().toISOString() : null
  };
  
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (err) {
    console.error('⚠️  Erro ao atualizar progresso:', err.message);
  }
}

async function gerarCompetenciasComGrok(persona, empresaInfo) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`  🔄 Tentativa ${attempt}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar 3s antes de retry
      }

      console.log(`  🤖 Gerando competências via Grok para ${persona.full_name}...`);

      const biografia = persona.biografia_completa || persona.biografia_resumida || '';
      const biografiaResumida = biografia.substring(0, 500); // Limitar biografia para reduzir tamanho do prompt

      const prompt = `Gere competências profissionais para:

PERSONA: ${persona.full_name}
CARGO: ${persona.role}

DADOS DA EMPRESA:
- Nome: ${empresaInfo.nome}
- Setor: ${empresaInfo.setor || empresaInfo.industria || ''}
- País: ${empresaInfo.pais || ''}
- Descrição: ${empresaInfo.descricao || ''}

BIOGRAFIA (resumida): ${biografiaResumida}

Retorne APENAS JSON válido (sem markdown):

{
  "competencias_tecnicas": ["comp1", "comp2", "comp3", "comp4", "comp5"],
  "competencias_comportamentais": ["soft1", "soft2", "soft3", "soft4", "soft5"],
  "ferramentas": ["ferramenta1", "ferramenta2", "ferramenta3", "ferramenta4"],
  "tarefas_diarias": ["tarefa1", "tarefa2", "tarefa3", "tarefa4"],
  "tarefas_semanais": ["tarefa1", "tarefa2", "tarefa3"],
  "tarefas_mensais": ["tarefa1", "tarefa2", "tarefa3"],
  "kpis": ["KPI 1: Nome - Meta", "KPI 2: Nome - Meta", "KPI 3: Nome - Meta"],
  "objetivos_desenvolvimento": ["objetivo1", "objetivo2", "objetivo3"]
}`;

      console.log('  📤 Chamando LLM com fallback...');
      
      const competencias = await generateJSONWithFallback(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
        timeout: 60000
      });
      
      console.log(`  📥 Competências geradas com sucesso`);

      // Salvar no banco - tabela personas_competencias
      console.log(`  💾 Salvando em personas_competencias...`);
      
      const { error: upsertError } = await supabase
        .from('personas_competencias')
        .upsert({
          persona_id: persona.id,
          competencias_tecnicas: competencias.competencias_tecnicas || [],
          competencias_comportamentais: competencias.competencias_comportamentais || [],
          ferramentas: competencias.ferramentas || [],
          tarefas_diarias: competencias.tarefas_diarias || [],
          tarefas_semanais: competencias.tarefas_semanais || [],
          tarefas_mensais: competencias.tarefas_mensais || [],
          kpis: competencias.kpis || [],
          objetivos_desenvolvimento: competencias.objetivos_desenvolvimento || [],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'persona_id'
        });

      if (upsertError) {
        console.error('    ❌ Erro ao salvar competências:', upsertError.message);
        throw upsertError;
      }
      
      console.log(`  ✅ Competências salvas em personas_competencias!`);

      // Salvar arquivo local
      const sanitizedName = persona.full_name
        .replace(/\\/g, '') // Remove barras invertidas
        .replace(/\//g, '') // Remove barras normais
        .replace(/:/g, '') // Remove dois pontos
        .replace(/\*/g, '') // Remove asteriscos
        .replace(/\?/g, '') // Remove interrogações
        .replace(/"/g, '') // Remove aspas duplas
        .replace(/</g, '') // Remove menor que
        .replace(/>/g, '') // Remove maior que
        .replace(/\|/g, '') // Remove pipe
        .replace(/\s+/g, '_'); // Substitui espaços por underline
      
      const filename = `${sanitizedName}_competencias.json`;
      const resultado = {
        persona_id: persona.id,
        full_name: persona.full_name,
        role: persona.role,
        empresa_id: empresaInfo.id,
        ...competencias,
        generated_at: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(OUTPUT_DIR, filename),
        JSON.stringify(resultado, null, 2)
      );

      console.log(`    ✅ Competências geradas e salvas`);
      
      // NOVO: Gerar metas SMART baseadas nos KPIs e competências
      await gerarMetasSMART(persona, competencias, empresaInfo);
      
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

async function gerarMetasSMART(persona, competencias, empresaInfo) {
  try {
    console.log(`  🎯 Gerando metas SMART baseadas nos KPIs...`);
    
    // Criar 3-5 metas SMART baseadas nos KPIs e objetivos
    const kpis = competencias.kpis || [];
    const objetivos = competencias.objetivos_desenvolvimento || [];
    
    if (kpis.length === 0 && objetivos.length === 0) {
      console.log(`    ⚠️  Sem KPIs ou objetivos, pulando geração de metas`);
      return;
    }

    const prompt = `Crie 3-5 metas SMART (Specific, Measurable, Achievable, Relevant, Time-bound) para:

PERSONA: ${persona.full_name} - ${persona.role}
EMPRESA: ${empresaInfo.nome} (${empresaInfo.setor || 'setor não especificado'})

KPIs IDENTIFICADOS:
${kpis.map((kpi, i) => `${i + 1}. ${kpi}`).join('\n')}

OBJETIVOS DE DESENVOLVIMENTO:
${objetivos.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

Crie metas que sejam:
- SPECIFIC (Específicas): Objetivo claro e bem definido
- MEASURABLE (Mensuráveis): Com valor numérico e unidade de medida
- ACHIEVABLE (Atingíveis): Realistas para o cargo e experiência
- RELEVANT (Relevantes): Alinhadas com o papel da persona
- TIME-BOUND (Temporais): Com prazo de 3-6 meses

Retorne APENAS JSON válido (sem markdown):

{
  "metas": [
    {
      "titulo": "Título curto da meta",
      "descricao": "Descrição detalhada do objetivo",
      "categoria": "performance ou desenvolvimento ou kpi",
      "valor_alvo": 100,
      "unidade_medida": "% ou unidades ou horas ou R$",
      "data_prazo": "2026-06-01",
      "prioridade": 3,
      "vinculada_kpi": "Nome do KPI relacionado (se aplicável)"
    }
  ]
}

IMPORTANTE: "prioridade" deve ser 1 (muito baixa), 2 (baixa), 3 (média), 4 (alta) ou 5 (crítica).`;

    console.log('  📤 Gerando metas SMART com LLM fallback...');
    
    const metasData = await generateJSONWithFallback(prompt, {
      temperature: 0.7,
      maxTokens: 1500,
      timeout: 45000
    });
    
    console.log(`  📥 Metas recebidas com sucesso`);

    if (!metasData.metas || metasData.metas.length === 0) {
      console.log(`    ⚠️  Nenhuma meta gerada`);
      return;
    }

    // Salvar cada meta no banco
    let metasSalvas = 0;
    const dataInicio = new Date().toISOString().split('T')[0];
    
    for (const meta of metasData.metas) {
      // Validar e normalizar prioridade (1-5)
      let prioridade = parseInt(meta.prioridade) || 2;
      if (prioridade < 1) prioridade = 1;
      if (prioridade > 5) prioridade = 5;
      
      const { error } = await supabase
        .from('personas_metas')
        .insert({
          persona_id: persona.id,
          titulo: meta.titulo,
          descricao: meta.descricao || null,
          categoria: meta.categoria || 'performance',
          valor_alvo: parseFloat(meta.valor_alvo) || 100,
          valor_atual: 0,
          unidade_medida: meta.unidade_medida || '%',
          data_inicio: dataInicio,
          data_prazo: meta.data_prazo || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +6 meses
          status: 'nao_iniciada',
          progresso_percentual: 0,
          prioridade: prioridade,
          vinculada_kpi: meta.vinculada_kpi || null,
        });

      if (!error) {
        metasSalvas++;
      } else {
        console.error(`      ⚠️  Erro ao salvar meta "${meta.titulo}":`, error.message);
      }
    }

    console.log(`    ✅ ${metasSalvas} metas SMART criadas!`);

    // Salvar arquivo local
    const sanitizedName = persona.full_name
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '_');
    
    const filename = `${sanitizedName}_metas.json`;
    const resultado = {
      persona_id: persona.id,
      full_name: persona.full_name,
      role: persona.role,
      empresa_id: empresaInfo.id,
      metas: metasData.metas,
      generated_at: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(METAS_OUTPUT_DIR, filename),
      JSON.stringify(resultado, null, 2)
    );

  } catch (error) {
    console.error('    ❌ Erro ao gerar metas SMART:', error.message);
  }
}

async function gerarCompetencias() {
  try {
    const args = process.argv.slice(2);
    let empresaId = null;
    let forceClean = false;
    let skipExisting = true;
    
    for (const arg of args) {
      if (arg.startsWith('--empresaId=')) {
        empresaId = arg.split('=')[1];
      } else if (arg === '--force') {
        forceClean = true;
        skipExisting = false;
      } else if (arg === '--all') {
        skipExisting = false;
      }
    }
    
    if (!empresaId) {
      console.error('❌ --empresaId não fornecido');
      console.log('💡 Uso: node 04_generate_competencias_grok.js --empresaId=ID');
      process.exit(1);
    }

    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError) throw new Error(`Empresa não encontrada: ${empresaError.message}`);

    console.log(`🏢 Empresa: ${empresa.nome}\n`);

    // Buscar personas
    const { data: todasPersonas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError) throw new Error(`Erro ao buscar personas: ${personasError.message}`);

    if (!todasPersonas || todasPersonas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      return;
    }

    // Modo força total: limpar competências
    if (forceClean) {
      console.log('🧹 MODO FORÇA TOTAL: Limpando competências anteriores...\n');
      for (const p of todasPersonas) {
        const iaConfig = p.ia_config || {};
        delete iaConfig.tarefas_metas;
        delete iaConfig.competencias_updated_at;
        await supabase
          .from('personas')
          .update({ ia_config: iaConfig })
          .eq('id', p.id);
      }
    }

    // Filtrar personas se modo incremental
    let personas = todasPersonas;
    if (skipExisting) {
      // Buscar quais personas já têm competências na tabela personas_competencias
      const { data: competenciasExistentes } = await supabase
        .from('personas_competencias')
        .select('persona_id');
      
      const idsComCompetencias = new Set(competenciasExistentes?.map(c => c.persona_id) || []);
      const comCompetencias = todasPersonas.filter(p => idsComCompetencias.has(p.id));
      const semCompetencias = todasPersonas.filter(p => !idsComCompetencias.has(p.id));
      
      if (comCompetencias.length > 0) {
        console.log(`⏭️  MODO INCREMENTAL: Pulando ${comCompetencias.length} personas que já têm competências`);
        console.log(`   ${comCompetencias.slice(0, 5).map(p => p.full_name).join(', ')}${comCompetencias.length > 5 ? '...' : ''}\n`);
      }
      
      personas = semCompetencias;
      
      if (personas.length === 0) {
        console.log('✅ Todas as personas já têm competências!');
        console.log('💡 Use --force para regenerar tudo ou --all para substituir existentes\n');
        return;
      }
    } else if (!forceClean) {
      console.log('🔄 MODO COMPLETO: Regenerando competências de todas personas\n');
    }

    console.log(`🎯 Gerando competências para ${personas.length} personas...\n`);

    updateProgress('running', 0, personas.length);

    let sucessos = 0;
    let erros = 0;
    const errorList = [];

    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];
      
      console.log(`\n[${i + 1}/${personas.length}] ${persona.full_name} (${persona.role})`);
      updateProgress('running', i, personas.length, persona.full_name, errorList);
      
      const sucesso = await gerarCompetenciasComGrok(persona, empresa);
      
      if (sucesso) {
        sucessos++;
      } else {
        erros++;
        errorList.push({
          persona: persona.full_name,
          error: 'Falha ao gerar competências'
        });
      }
      
      // Delay para respeitar rate limits
      if (i < personas.length - 1) {
        console.log(`  ⏳ Aguardando 5s...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    updateProgress('completed', personas.length, personas.length, '', errorList);

    console.log('\n📊 RELATÓRIO');
    console.log('=============');
    console.log(`✅ Sucessos: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📁 Arquivos salvos em: ${OUTPUT_DIR}`);
    console.log('🎉 CONCLUÍDO!');

  } catch (error) {
    console.error('❌ Erro crítico:', error.message);
    updateProgress('error', 0, 0, '', [{ error: error.message }]);
    process.exit(1);
  }
}

gerarCompetencias();