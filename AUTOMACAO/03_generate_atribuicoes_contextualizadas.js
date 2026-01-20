#!/usr/bin/env node
/**
 * 🎯 SCRIPT 03 - GERAR ATRIBUIÇÕES CONTEXTUALIZADAS VIA LLM
 * ============================================================
 * 
 * ORDEM CORRETA: Executar APÓS Script 02 (biografias criadas)
 * Este script gera atribuições detalhadas usando dados de personas_biografias
 * 
 * FUNCIONALIDADES:
 * - Busca biografia estruturada de personas_biografias
 * - Inclui hard_skills e soft_skills no contexto
 * - Usa OpenAI (primário) com fallback para OpenRouter
 * - Salva em personas_atribuicoes e personas_tasks (tabelas normalizadas)
 * 
 * Uso:
 *   node 03_generate_atribuicoes_contextualizadas.js --empresaId=UUID_EMPRESA [--force|--all]
 * 
 * Modos de Execução:
 *   (padrão)  : INCREMENTAL - Processa apenas personas sem atribuições (recomendado)
 *   --all     : COMPLETO - Substitui atribuições de todas personas
 *   --force   : FORÇA TOTAL - Limpa TUDO e regenera do zero
 */

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { setupConsoleEncoding } from './lib/console_fix.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Corrigir encoding UTF-8 no Windows PowerShell
setupConsoleEncoding();

// ==================== CONFIGURAÇÃO ====================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente Supabase não configuradas');
  process.exit(1);
}

if (!openaiKey && !openRouterKey) {
  console.error('❌ Erro: Nenhuma chave LLM configurada (OPENAI_API_KEY ou OPENROUTER_API_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI args
const args = process.argv.slice(2);
let empresaId = null;
let forceClean = false;
let skipExisting = true; // NOVO: pular personas que já têm atribuições

args.forEach(arg => {
  if (arg.startsWith('--empresaId=')) {
    empresaId = arg.split('=')[1];
  } else if (arg === '--force') {
    forceClean = true;
    skipExisting = false; // Se --force, reprocessar tudo
  } else if (arg === '--all') {
    skipExisting = false; // Reprocessar todas sem limpar
  }
});

if (!empresaId) {
  console.error('❌ Erro: --empresaId é obrigatório');
  console.error('Uso: node 03_generate_atribuicoes_contextualizadas.js --empresaId=UUID_EMPRESA');
  process.exit(1);
}

// ==================== FUNÇÕES AUXILIARES ====================

function log(emoji, message) {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

function logProgress(current, total, message) {
  log('📊', `Progresso: ${current}/${total} - ${message}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== BUSCAR DADOS ====================

async function buscarEmpresa(empresaId) {
  log('🏢', `Buscando empresa: ${empresaId}`);
  
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();
  
  if (error || !data) {
    console.error('❌ Erro ao buscar empresa:', error);
    process.exit(1);
  }
  
  log('✅', `Empresa encontrada: ${data.nome}`);
  return data;
}

async function buscarPersonas(empresaId) {
  log('👥', 'Buscando personas da empresa...')
  
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('department', { ascending: true })
  
  if (error) {
    console.error('❌ Erro ao buscar personas:', error)
    process.exit(1)
  }
  
  if (!data || data.length === 0) {
    log('⚠️', 'Nenhuma persona encontrada para esta empresa')
    process.exit(0)
  }
  
  log('✅', `${data.length} personas encontradas`)
  return data
}

// ==================== GERAR ATRIBUIÇÕES COM LLM ====================

async function gerarAtribuicoesLLM(persona, empresa, biografia) {
  // Montar contexto rico com biografia
  const bioContext = biografia ? `
BIOGRAFIA E SKILLS:
- Experiência: ${persona.experiencia_anos || 'N/A'} anos
- Skills Técnicas: ${JSON.stringify(biografia.hard_skills?.tecnologicas || {})}
- Skills Soft: ${JSON.stringify(biografia.soft_skills || {})}
- Formação: ${biografia.educacao?.formacao_superior?.join(', ') || 'N/A'}
- Idiomas: ${JSON.stringify(biografia.idiomas_fluencia || {})}
` : '';
  
  const prompt = `Você é um especialista em Recursos Humanos e Design Organizacional.

CONTEXTO DA EMPRESA:
- Nome: ${empresa.nome}
- Indústria: ${empresa.industria || empresa.setor || 'Tecnologia'}
- País: ${empresa.pais}
- Descrição: ${empresa.descricao || 'Empresa no setor de ' + empresa.industria}

PESSOA:
- Nome: ${persona.full_name}
- Cargo: ${persona.role}
- Departamento: ${persona.department}
- Especialidade: ${persona.specialty || 'Geral'}
- Nacionalidade: ${persona.nacionalidade || 'N/A'}${bioContext}

TAREFA:
Crie uma lista de 5 a 8 atribuições ESPECÍFICAS e CONTEXTUALIZADAS para este cargo. Cada atribuição deve:

1. Ser responsabilidade concreta e mensurável
2. Estar alinhada com experiência (${persona.experiencia_anos || 'N/A'} anos)
3. Refletir a especialização do cargo e skills
4. Ser relevante para o setor e contexto da empresa
5. Usar verbos de ação no infinitivo

FORMATO JSON (sem markdown):
{
  "atribuicoes": [
    {
      "titulo": "Título curto",
      "descricao": "Descrição detalhada (1-2 frases)",
      "frequencia": "diaria|semanal|mensal|trimestral",
      "importancia": "critica|alta|media",
      "categoria": "operacional|estrategica|gerencial|tecnica|administrativa"
    }
  ]
}

Retorne APENAS JSON válido, sem explicações.`;

  // Usar sistema de fallback unificado (prioriza FREE models)
  try {
    log('🤖', `[LLM Fallback] Gerando atribuições para: ${persona.full_name}`);
    
    const parsed = await generateJSONWithFallback(prompt, {
      temperature: 0.7,
      maxTokens: 2500,
      timeout: 60000
    });
    
    if (parsed.atribuicoes && Array.isArray(parsed.atribuicoes)) {
      log('✅', `Atribuições geradas: ${parsed.atribuicoes.length} itens`);
      return parsed.atribuicoes;
    }
    
    throw new Error('LLM retornou formato inválido');
    
  } catch (error) {
    log('❌', `[LLM Fallback] Falhou: ${error.message}`);
    log('⚠️', 'Usando atribuições genéricas como fallback');
    return gerarAtribuicoesGenericas(persona);
  }
}

function gerarAtribuicoesGenericas(persona) {
  const personalidade = persona.personalidade || {}
  const cargo = personalidade.cargo || persona.role
  const dept = persona.department
  
  const atribuicoesBase = {
    'Executivo': [
      {
        titulo: 'Definir estratégia organizacional',
        descricao: 'Estabelecer visão, missão e objetivos estratégicos de longo prazo',
        frequencia: 'trimestral',
        importancia: 'critica',
        categoria: 'estrategica'
      },
      {
        titulo: 'Supervisionar operações gerais',
        descricao: 'Monitorar performance de todos os departamentos e garantir alinhamento',
        frequencia: 'semanal',
        importancia: 'critica',
        categoria: 'gerencial'
      }
    ],
    'Tecnologia': [
      {
        titulo: 'Desenvolver soluções técnicas',
        descricao: 'Implementar e manter sistemas e aplicações da empresa',
        frequencia: 'diaria',
        importancia: 'alta',
        categoria: 'tecnica'
      },
      {
        titulo: 'Garantir qualidade de código',
        descricao: 'Revisar e validar entregas técnicas seguindo padrões estabelecidos',
        frequencia: 'semanal',
        importancia: 'alta',
        categoria: 'tecnica'
      }
    ],
    'Vendas': [
      {
        titulo: 'Prospectar novos clientes',
        descricao: 'Identificar e abordar potenciais clientes alinhados ao perfil ideal',
        frequencia: 'diaria',
        importancia: 'critica',
        categoria: 'operacional'
      },
      {
        titulo: 'Realizar apresentações comerciais',
        descricao: 'Demonstrar valor dos produtos e serviços aos prospects',
        frequencia: 'semanal',
        importancia: 'alta',
        categoria: 'operacional'
      }
    ],
    'Marketing': [
      {
        titulo: 'Planejar campanhas de marketing',
        descricao: 'Criar e executar estratégias para atrair e engajar público-alvo',
        frequencia: 'mensal',
        importancia: 'alta',
        categoria: 'estrategica'
      },
      {
        titulo: 'Analisar métricas de desempenho',
        descricao: 'Monitorar KPIs e ajustar táticas conforme resultados',
        frequencia: 'semanal',
        importancia: 'alta',
        categoria: 'operacional'
      }
    ],
    'Financeiro': [
      {
        titulo: 'Controlar fluxo de caixa',
        descricao: 'Monitorar entradas e saídas financeiras para garantir saúde financeira',
        frequencia: 'diaria',
        importancia: 'critica',
        categoria: 'operacional'
      },
      {
        titulo: 'Elaborar relatórios financeiros',
        descricao: 'Preparar demonstrativos e análises para tomada de decisão',
        frequencia: 'mensal',
        importancia: 'critica',
        categoria: 'estrategica'
      }
    ]
  }
  
  return atribuicoesBase[dept] || atribuicoesBase['Tecnologia']
}

// ==================== SALVAR NO BANCO ====================

async function salvarAtribuicoes(personaId, atribuicoes) {
  log('💾', `Salvando ${atribuicoes.length} atribuições em personas_atribuicoes e personas_tasks...`)

  // 1. Deletar atribuições antigas desta persona (se existirem)
  await supabase
    .from('personas_atribuicoes')
    .delete()
    .eq('persona_id', personaId)

  await supabase
    .from('personas_tasks')
    .delete()
    .eq('persona_id', personaId)

  // 2. Inserir novas atribuições (uma linha por atribuição)
  const atribuicoesRecords = atribuicoes.map((atribuicao, index) => ({
    persona_id: personaId,
    atribuicao: atribuicao,
    ordem: index + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  // 3. Inserir em personas_tasks (classificação por frequência)
  const freqMap = {
    diaria: ['diaria', 'diário', 'diarias', 'diárias'],
    semanal: ['semanal', 'semanalmente', 'semanais'],
    mensal: ['mensal', 'mensalmente', 'mensais']
  };

  function detectFrequencia(atribuicao) {
    const freq = (atribuicao.frequencia || '').toLowerCase();
    if (freqMap.diaria.some(f => freq.includes(f))) return 'diaria';
    if (freqMap.semanal.some(f => freq.includes(f))) return 'semanal';
    if (freqMap.mensal.some(f => freq.includes(f))) return 'mensal';
    return 'outra';
  }

  const tasksRecords = atribuicoes.map((atribuicao, index) => ({
    task_id: `${personaId.substring(0, 8)}-task-${index + 1}`,
    persona_id: personaId,
    title: atribuicao.titulo || atribuicao.titulo_curto || atribuicao.atribuicao || `Tarefa ${index+1}`,
    description: atribuicao.descricao || atribuicao.atribuicao || ''
  }));

  // Inserir APENAS em personas_tasks (tabela normalizada)
  const { error: taskError } = await supabase
    .from('personas_tasks')
    .insert(tasksRecords);

  if (taskError) {
    log('❌', `Erro ao salvar tarefas: ${taskError.message}`)
    throw taskError
  }

  log('✅', `${atribuicoes.length} tarefas salvas em personas_tasks!`)

  // Também inserir em personas_atribuicoes para retrocompatibilidade (opcional)
  try {
    const { error: insertError } = await supabase
      .from('personas_atribuicoes')
      .insert(atribuicoesRecords)

    if (insertError) {
      log('⚠️', `Aviso: Não foi possível salvar em personas_atribuicoes: ${insertError.message}`)
    }
  } catch (e) {
    log('⚠️', `Aviso: ${e.message}`)
  }
}

/**
 * Verifica se uma persona já tem atribuições
 */
async function verificarAtribuicoesExistentes(personaId) {
  const { data: tasks, error } = await supabase
    .from('personas_tasks')
    .select('id')
    .eq('persona_id', personaId)
    .limit(1)
  
  if (error) return false
  
  // Considera como existente se tiver pelo menos 1 tarefa
  return tasks && tasks.length > 0
}

/**
 * Limpa atribuições existentes de uma empresa
 * Usado quando flag --force é ativada
 */
async function cleanupAtribuicoes(empresaId) {
  log('🧹', 'Limpando atribuições anteriores...')
  
  const { data: personas } = await supabase
    .from('personas')
    .select('id, ia_config')
    .eq('empresa_id', empresaId)
  
  if (!personas || personas.length === 0) {
    log('⚠️', 'Nenhuma persona encontrada')
    return
  }
  
  const personaIds = personas.map(p => p.id)
  
  // Remover atribuições do ia_config
  for (const persona of personas) {
    await supabase
      .from('personas')
      .update({
        ia_config: {
          ...persona.ia_config,
          atribuicoes_especificas: null
        }
      })
      .eq('id', persona.id)
  }
  
  log('✅', `Atribuições anteriores removidas (${personaIds.length} personas)`)
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function main() {
  console.log('\n' + '='.repeat(60))
  log('🚀', 'INICIANDO GERAÇÃO DE ATRIBUIÇÕES CONTEXTUALIZADAS')
  console.log('='.repeat(60) + '\n')
  
  try {
    // 1. Buscar empresa
    const empresa = await buscarEmpresa(empresaId)
    
    // 1.5. Verificar flag --force e limpar dados anteriores
    if (forceClean) {
      log('⚠️', 'FLAG --force DETECTADA: Limpando dados anteriores...')
      await cleanupAtribuicoes(empresaId)
      console.log('')
    } else if (!skipExisting) {
      log('🔄', 'Modo completo: atribuições existentes serão substituídas')
      console.log('')
    } else {
      log('⏭️', 'MODO INCREMENTAL: Processando apenas personas sem atribuições')
      log('💡', 'Use --force para regenerar tudo ou --all para substituir existentes')
      console.log('')
    }
    
    // 2. Buscar personas
    const todasPersonas = await buscarPersonas(empresaId)
    
    // Filtrar se modo incremental
    let personas = todasPersonas
    if (skipExisting) {
      const personasComAtribuicoes = []
      const personasSemAtribuicoes = []
      
      for (const persona of todasPersonas) {
        const temAtribuicoes = await verificarAtribuicoesExistentes(persona.id)
        if (temAtribuicoes) {
          personasComAtribuicoes.push(persona.full_name)
        } else {
          personasSemAtribuicoes.push(persona)
        }
      }
      
      if (personasComAtribuicoes.length > 0) {
        log('⏭️', `Pulando ${personasComAtribuicoes.length} personas que já têm atribuições`)
        console.log(`   ${personasComAtribuicoes.slice(0, 5).join(', ')}${personasComAtribuicoes.length > 5 ? '...' : ''}`)
        console.log('')
      }
      
      personas = personasSemAtribuicoes
      
      if (personas.length === 0) {
        log('✅', 'Todas as personas já têm atribuições!')
        log('💡', 'Use --force para regenerar tudo ou --all para substituir existentes')
        return
      }
    }
    
    const total = personas.length
    
    log('📋', `Total de personas a processar: ${total}${skipExisting ? ' (sem atribuições)' : ''}`)
    console.log('')
    
    // 3. Processar cada persona
    let processados = 0
    let sucessos = 0
    let erros = 0
    
    for (const persona of personas) {
      processados++;
      
      try {
        logProgress(processados, total, `Processando: ${persona.full_name}`);
        log('🔄', `Cargo: ${persona.role} | Departamento: ${persona.department}`);
        
        // Buscar biografia estruturada de personas_biografias
        const { data: biografiaData } = await supabase
          .from('personas_biografias')
          .select('biografia_estruturada')
          .eq('persona_id', persona.id)
          .single();
        
        const biografia = biografiaData?.biografia_estruturada || null;
        if (biografia) {
          log('📖', 'Biografia encontrada - gerando atribuições contextualizadas');
        } else {
          log('⚠️', 'Sem biografia - gerando atribuições básicas');
        }
        
        // Gerar atribuições via LLM com biografia
        const atribuicoes = await gerarAtribuicoesLLM(persona, empresa, biografia);
        
        // Salvar no banco
        await salvarAtribuicoes(persona.id, atribuicoes);
        
        sucessos++;
        log('✅', `Persona ${processados}/${total} concluída`);
        console.log('');
        
        // Rate limiting: 2 segundos entre chamadas
        if (processados < total) {
          await delay(2000);
        }
        
      } catch (error) {
        erros++;
        log('❌', `Erro ao processar ${persona.full_name}: ${error.message}`);
        console.log('');
      }
    }
    
    // 4. Resumo final
    console.log('\n' + '='.repeat(60))
    log('🎉', 'PROCESSAMENTO CONCLUÍDO')
    console.log('='.repeat(60))
    log('📊', `Total processado: ${processados}`)
    log('✅', `Sucessos: ${sucessos}`)
    log('❌', `Erros: ${erros}`)
    console.log('='.repeat(60) + '\n')
    
  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error.message)
    process.exit(1)
  }
}

// Executar
main()
