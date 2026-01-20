#!/usr/bin/env node
/**
 * 🎯 SCRIPT 01.5 - GERAR ATRIBUIÇÕES CONTEXTUALIZADAS VIA LLM
 * ============================================================
 * 
 * Este script gera atribuições detalhadas e contextualizadas para cada cargo
 * usando Grok via OpenRouter, baseado na empresa e estrutura organizacional.
 * 
 * MASTER FLUXO: Cargos têm Atribuições
 * 
 * Uso:
 *   node 01.5_generate_atribuicoes_contextualizadas.cjs --empresaId=UUID_EMPRESA [--force|--all]
 * 
 * Modos de Execução:
 *   (padrão)  : INCREMENTAL - Processa apenas personas sem atribuições (recomendado)
 *   --all     : COMPLETO - Substitui atribuições de todas personas
 *   --force   : FORÇA TOTAL - Limpa TUDO e regenera do zero
 * 
 * Saída:
 *   - Insere diretamente na tabela personas (campo ia_config.atribuicoes_especificas)
 *   - Logging detalhado para acompanhamento em tempo real
 * 
 * Exemplos:
 *   # Processar apenas novas personas (padrão)
 *   node 01.5_generate_atribuicoes_contextualizadas.cjs --empresaId=abc123
 * 
 *   # Substituir atribuições de todas
 *   node 01.5_generate_atribuicoes_contextualizadas.cjs --empresaId=abc123 --all
 * 
 *   # Limpar e regenerar tudo
 *   node 01.5_generate_atribuicoes_contextualizadas.cjs --empresaId=abc123 --force
 */

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')
const dotenv = require('dotenv')
const path = require('path')

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })
dotenv.config({ path: path.join(__dirname, '..', '.env') })

// ==================== CONFIGURAÇÃO ====================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const openRouterKey = process.env.OPENROUTER_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente Supabase não configuradas')
  process.exit(1)
}

if (!openRouterKey) {
  console.error('❌ Erro: OPENROUTER_API_KEY não configurada')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse CLI args
const args = process.argv.slice(2)
let empresaId = null
let forceClean = false
let skipExisting = true // NOVO: pular personas que já têm atribuições

args.forEach(arg => {
  if (arg.startsWith('--empresaId=')) {
    empresaId = arg.split('=')[1]
  } else if (arg === '--force') {
    forceClean = true
    skipExisting = false // Se --force, reprocessar tudo
  } else if (arg === '--all') {
    skipExisting = false // Reprocessar todas sem limpar
  }
})

if (!empresaId) {
  console.error('❌ Erro: --empresaId é obrigatório')
  console.error('Uso: node 01.5_generate_atribuicoes_contextualizadas.js --empresaId=UUID_EMPRESA')
  process.exit(1)
}

// ==================== FUNÇÕES AUXILIARES ====================

function log(emoji, message) {
  const timestamp = new Date().toLocaleTimeString('pt-BR')
  console.log(`[${timestamp}] ${emoji} ${message}`)
}

function logProgress(current, total, message) {
  log('📊', `Progresso: ${current}/${total} - ${message}`)
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ==================== BUSCAR DADOS ====================

async function buscarEmpresa(empresaId) {
  log('🏢', `Buscando empresa: ${empresaId}`)
  
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single()
  
  if (error || !data) {
    console.error('❌ Erro ao buscar empresa:', error)
    process.exit(1)
  }
  
  log('✅', `Empresa encontrada: ${data.nome}`)
  return data
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

async function gerarAtribuicoesLLM(persona, empresa) {
  const personalidade = persona.personalidade || {}
  
  const prompt = `Você é um especialista em Recursos Humanos e Design Organizacional.

CONTEXTO DA EMPRESA:
- Nome: ${empresa.nome}
- Setor: ${empresa.setor || 'Tecnologia'}
- País: ${empresa.pais}
- Descrição: ${empresa.descricao || 'Empresa de tecnologia e inovação'}

CARGO A DEFINIR:
- Nome: ${persona.full_name}
- Cargo: ${personalidade.cargo || persona.role}
- Departamento: ${persona.department}
- Senioridade: ${personalidade.senioridade || 'Pleno'}
- Especialização: ${personalidade.especializacao || 'Geral'}

TAREFA:
Crie uma lista de 5 a 8 atribuições específicas e contextualizadas para este cargo. Cada atribuição deve:

1. Ser uma responsabilidade concreta e mensurável
2. Estar alinhada com o nível de senioridade
3. Refletir a especialização do cargo
4. Ser relevante para o setor e contexto da empresa
5. Usar verbos de ação no infinitivo (Ex: "Desenvolver", "Analisar", "Coordenar")

FORMATO DE RESPOSTA (JSON):
{
  "atribuicoes": [
    {
      "titulo": "Título curto da atribuição",
      "descricao": "Descrição detalhada da responsabilidade (1-2 frases)",
      "frequencia": "diaria|semanal|mensal|trimestral",
      "importancia": "critica|alta|media",
      "categoria": "operacional|estrategica|gerencial|tecnica|administrativa"
    }
  ]
}

IMPORTANTE: 
- Retorne APENAS o JSON, sem explicações adicionais
- Garanta que o JSON seja válido
- Não invente dados sobre a empresa
- Foque nas responsabilidades reais do cargo`

  try {
    log('🤖', `Gerando atribuições para: ${persona.full_name} (${personalidade.cargo || persona.role})`)
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vcm-dashboard.com',
        'X-Title': 'VCM Dashboard - Atribuições'
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4.1-fast:free',
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${data.error?.message || response.statusText}`)
    }
    
    const result = data.choices[0].message.content
    
    // Limpar resposta (remover markdown, etc)
    let jsonText = result.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }
    
    const parsed = JSON.parse(jsonText)
    
    if (!parsed.atribuicoes || !Array.isArray(parsed.atribuicoes)) {
      throw new Error('Formato de resposta inválido - faltam atribuicoes')
    }
    
    log('✅', `${parsed.atribuicoes.length} atribuições geradas`)
    return parsed.atribuicoes
    
  } catch (error) {
    log('❌', `Erro ao gerar atribuições: ${error.message}`)
    
    // Fallback: atribuições genéricas
    log('⚠️', 'Usando atribuições genéricas como fallback')
    return gerarAtribuicoesGenericas(persona)
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
  log('💾', `Salvando ${atribuicoes.length} atribuições em personas_atribuicoes...`)
  
  // 1. Deletar atribuições antigas desta persona (se existirem)
  await supabase
    .from('personas_atribuicoes')
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
  
  const { error: insertError } = await supabase
    .from('personas_atribuicoes')
    .insert(atribuicoesRecords)
  
  if (insertError) {
    log('❌', `Erro ao salvar atribuições: ${insertError.message}`)
    throw insertError
  }
  
  log('✅', `${atribuicoes.length} atribuições salvas em personas_atribuicoes!`)
}

/**
 * Verifica se uma persona já tem atribuições
 */
async function verificarAtribuicoesExistentes(personaId) {
  const { data: atribuicoes, error } = await supabase
    .from('personas_atribuicoes')
    .select('id')
    .eq('persona_id', personaId)
    .limit(1)
  
  if (error) return false
  
  // Considera como existente se tiver pelo menos 1 atribuição
  return atribuicoes && atribuicoes.length > 0
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
      processados++
      const personalidade = persona.personalidade || {}
      
      try {
        logProgress(processados, total, `Processando: ${persona.full_name}`)
        log('🔄', `Cargo: ${personalidade.cargo || persona.role} | Departamento: ${persona.department}`)
        
        // Gerar atribuições via LLM
        const atribuicoes = await gerarAtribuicoesLLM(persona, empresa)
        
        // Salvar no banco
        await salvarAtribuicoes(persona.id, atribuicoes)
        
        sucessos++
        log('✅', `Persona ${processados}/${total} concluída`)
        console.log('')
        
        // Rate limiting: 2 segundos entre chamadas
        if (processados < total) {
          await delay(2000)
        }
        
      } catch (error) {
        erros++
        log('❌', `Erro ao processar ${persona.full_name}: ${error.message}`)
        console.log('')
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
