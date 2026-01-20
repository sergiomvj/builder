// ============================================================================
// SCRIPT 03 V5.0 - GERAÇÃO DE ATRIBUIÇÕES COMO RESULTADOS + SUBSISTEMAS
// ============================================================================
// PARADIGMA V5.0: Atribuições não são tarefas, são RESPONSABILIDADES POR RESULTADOS
// 
// Este script:
// 1. Busca persona com contexto completo (OKRs, bloco funcional, responsabilidade)
// 2. Busca TODOS os 12 subsistemas VCM disponíveis
// 3. Gera atribuições baseadas nos RESULTADOS que a persona deve garantir
// 4. LLM decide quais SUBSISTEMAS usar em cada atribuição
// 5. LLM gera instruções de COMO USAR cada subsistema
// 6. Salva em personas_atribuicoes com os 3 novos campos
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback } from './lib/llm_fallback.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Tenta carregar .env.local se existir (dev), caso contrário usa variáveis de sistema (prod)
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🏗️  SCRIPT 03 V5.0 - ATRIBUIÇÕES = RESULTADOS + SUBSISTEMAS');
console.log('═══════════════════════════════════════════════════════════');
console.log('📊 Atribuições são responsabilidades por resultados');
console.log('🔧 Cada atribuição indica QUAL subsistema usar e COMO');
console.log('🎯 Baseado em OKRs, métricas e KPIs do bloco funcional');
console.log('═══════════════════════════════════════════════════════════\n');

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
  console.log('📝 Uso: node 03_generate_atribuicoes_contextualizadas_v5.js --empresaId=UUID');
  process.exit(1);
}

// ============================================================================
// BUSCAR SUBSISTEMAS VCM
// ============================================================================

async function buscarSubsistemas() {
  const { data, error } = await supabase
    .from('subsistemas')
    .select('*')
    .eq('status', 'ativo')
    .order('ordem_exibicao');
  
  if (error) {
    console.error('❌ Erro ao buscar subsistemas:', error.message);
    return [];
  }
  
  return data || [];
}

// ============================================================================
// BUSCAR PERSONA COM CONTEXTO COMPLETO
// ============================================================================

async function buscarPersonaComContexto(personaId) {
  // Buscar persona
  const { data: persona, error: personaError } = await supabase
    .from('personas')
    .select('*')
    .eq('id', personaId)
    .single();
  
  if (personaError) throw new Error('Persona não encontrada');
  
  // Buscar OKRs (se owner)
  let okrs = [];
  if (persona.okr_owner_ids && persona.okr_owner_ids.length > 0) {
    const { data: okrsData } = await supabase
      .from('empresas_okrs')
      .select(`
        id,
        titulo,
        key_result_1,
        key_result_2,
        key_result_3,
        progresso_percentual,
        empresas_objetivos_estrategicos (
          titulo,
          descricao
        )
      `)
      .in('id', persona.okr_owner_ids);
    
    okrs = okrsData || [];
  }
  
  // Buscar bloco funcional
  let bloco = null;
  if (persona.bloco_funcional_id) {
    const { data: blocoData } = await supabase
      .from('empresas_blocos_funcionais')
      .select('*')
      .eq('id', persona.bloco_funcional_id)
      .single();
    
    bloco = blocoData;
  }
  
  return { persona, okrs, bloco };
}

// ============================================================================
// GERAR ATRIBUIÇÕES COM SUBSISTEMAS (LLM)
// ============================================================================

async function gerarAtribuicoesComSubsistemas(contexto, empresa, subsistemas) {
  const { persona, okrs, bloco } = contexto;
  
  console.log(`   🤖 Gerando atribuições para ${persona.persona_code}...`);
  
  // Construir texto de OKRs
  const okrsTexto = okrs.length > 0
    ? okrs.map(okr => `
      • OKR: ${okr.titulo}
        - KR1: ${okr.key_result_1}
        - KR2: ${okr.key_result_2}
        - KR3: ${okr.key_result_3}
    `).join('\n')
    : 'Sem OKRs atribuídos (foco em execução operacional)';
  
  // Construir lista de subsistemas
  const subsisteMasTexto = subsistemas.map(s => `
    • ${s.nome} (${s.codigo})
      Descrição: ${s.descricao}
      Funcionalidades: ${s.funcionalidades.join(', ')}
      Métricas: ${s.metricas_principais.join(', ')}
  `).join('\n');
  
  const prompt = `Você é um especialista em design de responsabilidades e workflows empresariais.

EMPRESA: ${empresa.nome}
INDÚSTRIA: ${empresa.industria}

PERSONA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Código: ${persona.persona_code}
Nome: ${persona.full_name}
Cargo: ${persona.role}
Nível: ${persona.nivel_hierarquico}
Departamento: ${persona.departamento}

Bloco Funcional: ${bloco?.nome || 'N/A'}
${bloco ? `Objetivo do Bloco: ${bloco.objetivo}` : ''}
${bloco ? `KPIs do Bloco: ${bloco.kpis?.join(', ') || 'N/A'}` : ''}

RESPONSABILIDADE POR RESULTADO:
${persona.responsabilidade_resultado || 'Executar tarefas conforme atribuições'}

MÉTRICAS DE RESPONSABILIDADE:
${persona.metricas_responsabilidade?.join(', ') || 'N/A'}

OKRs QUE ESTA PERSONA É OWNER:
${okrsTexto}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBSISTEMAS VCM DISPONÍVEIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${subsisteMasTexto}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INSTRUÇÕES OBRIGATÓRIAS:
1. Gere 4-8 ATRIBUIÇÕES (não são tarefas, são RESPONSABILIDADES POR RESULTADOS)
2. Cada atribuição deve:
   - Descrever O QUE deve ser garantido/entregue (resultado mensurável)
   - Indicar se USA SUBSISTEMA (use_subsystem: true/false)
   - Se usa, indicar QUAL subsistema (which_subsystem: código do subsistema)
   - Se usa, descrever COMO USAR o subsistema para alcançar o resultado
3. Priorize atribuições alinhadas aos OKRs da persona
4. Cada atribuição deve ter métrica clara de sucesso
5. Atribuições gerenciais: foco em garantir resultados de equipe
6. Atribuições operacionais: foco em executar com eficiência

EXEMPLO DE ATRIBUIÇÃO COM SUBSISTEMA:
{
  "atribuicao": "Aumentar taxa de conversão de leads em 25% através de campanhas segmentadas",
  "resultado_esperado": "Taxa de conversão MQL→Cliente de 15% para 25% em 90 dias",
  "metrica_sucesso": "Taxa de Conversão ≥ 25%",
  "baseline": "15%",
  "meta_numerica": "25%",
  "prazo_dias": 90,
  "use_subsystem": true,
  "which_subsystem": "marketing",
  "how_use": "1. Usar módulo de Campanhas para criar 3 campanhas segmentadas por persona. 2. Configurar automação de email marketing com 5 toques. 3. Monitorar ROI de marketing no dashboard. 4. Analisar taxa de conversão por canal e ajustar budget."
}

EXEMPLO DE ATRIBUIÇÃO SEM SUBSISTEMA (tarefa manual):
{
  "atribuicao": "Realizar reuniões semanais 1:1 com equipe para acompanhamento de metas",
  "resultado_esperado": "100% da equipe com acompanhamento semanal e planos de ação claros",
  "metrica_sucesso": "Frequência de reuniões ≥ 95%",
  "baseline": "N/A",
  "meta_numerica": "100%",
  "prazo_dias": 30,
  "use_subsystem": false,
  "which_subsystem": null,
  "how_use": null
}

Retorne APENAS JSON VÁLIDO:
{
  "atribuicoes": [
    {
      "atribuicao": "Descrição da responsabilidade/resultado",
      "resultado_esperado": "O que deve ser alcançado (específico e mensurável)",
      "metrica_sucesso": "Métrica clara de sucesso",
      "baseline": "Valor atual (se aplicável)",
      "meta_numerica": "Meta a atingir",
      "prazo_dias": 30,
      "use_subsystem": true,
      "which_subsystem": "codigo_do_subsistema",
      "how_use": "Passo a passo de como usar o subsistema para alcançar o resultado"
    }
  ]
}`;

  try {
    const response = await generateJSONWithFallback(prompt, 0.8);
    
    let cleanResponse = typeof response === 'string' ? response.trim() : JSON.stringify(response);
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    const resultado = JSON.parse(cleanResponse);
    
    if (!resultado.atribuicoes || !Array.isArray(resultado.atribuicoes)) {
      throw new Error('Resposta LLM inválida');
    }
    
    return resultado.atribuicoes;
    
  } catch (error) {
    console.error(`   ❌ Erro ao gerar atribuições:`, error.message);
    
    // Fallback: 3 atribuições genéricas
    return [
      {
        atribuicao: persona.responsabilidade_resultado || `Executar atividades de ${persona.role}`,
        resultado_esperado: 'Garantir execução conforme padrões estabelecidos',
        metrica_sucesso: 'Conformidade ≥ 95%',
        baseline: 'N/A',
        meta_numerica: '95%',
        prazo_dias: 30,
        use_subsystem: false,
        which_subsystem: null,
        how_use: null
      },
      {
        atribuicao: 'Reportar progresso e resultados semanalmente',
        resultado_esperado: 'Relatórios entregues no prazo com dados precisos',
        metrica_sucesso: 'Pontualidade ≥ 100%',
        baseline: 'N/A',
        meta_numerica: '100%',
        prazo_dias: 7,
        use_subsystem: false,
        which_subsystem: null,
        how_use: null
      },
      {
        atribuicao: 'Colaborar com equipe multifuncional',
        resultado_esperado: 'Participação ativa em projetos transversais',
        metrica_sucesso: 'Satisfação de stakeholders ≥ 4/5',
        baseline: 'N/A',
        meta_numerica: '4/5',
        prazo_dias: 30,
        use_subsystem: false,
        which_subsystem: null,
        how_use: null
      }
    ];
  }
}

// ============================================================================
// SALVAR ATRIBUIÇÕES NO BANCO
// ============================================================================

async function salvarAtribuicoes(personaId, empresaId, atribuicoes) {
  // Deletar atribuições antigas desta persona
  console.log(`   🗑️  Deletando atribuições antigas...`);
  const { error: deleteError } = await supabase
    .from('personas_atribuicoes')
    .delete()
    .eq('persona_id', personaId);
  
  if (deleteError) {
    console.error(`   ⚠️  Erro ao deletar: ${deleteError.message}`);
  }
  
  let sucessos = 0;
  let falhas = 0;
  
  for (let i = 0; i < atribuicoes.length; i++) {
    const atr = atribuicoes[i];
    
    try {
      const { error } = await supabase
        .from('personas_atribuicoes')
        .insert({
          persona_id: personaId,
          atribuicao: atr.atribuicao,
          use_subsystem: atr.use_subsystem || false,
          which_subsystem: atr.which_subsystem,
          how_use: atr.how_use,
          ordem: i + 1
        });
      
      if (error) throw error;
      
      console.log(`      ✅ ${atr.atribuicao.substring(0, 60)}...`);
      if (atr.use_subsystem) {
        console.log(`         🔧 Usa: ${atr.which_subsystem}`);
      }
      sucessos++;
      
    } catch (error) {
      console.error(`      ❌ Erro ao salvar atribuição ${i+1}:`, error.message);
      falhas++;
    }
  }
  
  return { sucessos, falhas };
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function generateAtribuicoesContextualizadas() {
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
    
    // 2. Buscar subsistemas
    console.log('2️⃣ Buscando subsistemas VCM...\n');
    const subsistemas = await buscarSubsistemas();
    
    if (subsistemas.length === 0) {
      console.error('❌ Nenhum subsistema encontrado. Execute o SQL create_subsistemas_table.sql primeiro.');
      process.exit(1);
    }
    
    console.log(`✅ ${subsistemas.length} subsistemas encontrados:`);
    subsistemas.forEach(s => console.log(`   • ${s.nome} (${s.codigo})`));
    console.log('');
    
    // 3. Buscar personas
    console.log('3️⃣ Buscando personas...\n');
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, persona_code, role')
      .eq('empresa_id', empresa.id)
      .order('persona_code');
    
    if (personasError || !personas || personas.length === 0) {
      console.error('❌ Nenhuma persona encontrada. Execute os Scripts 01-02 primeiro.');
      process.exit(1);
    }
    
    console.log(`✅ ${personas.length} personas encontradas\n`);
    
    // 4. Processar cada persona
    console.log('4️⃣ Gerando atribuições com subsistemas...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    let totalSucessos = 0;
    let totalFalhas = 0;
    
    for (const p of personas) {
      try {
        console.log(`📝 ${p.persona_code} - ${p.role}`);
        
        // Buscar contexto completo
        const contexto = await buscarPersonaComContexto(p.id);
        
        console.log(`   ℹ️  Bloco: ${contexto.bloco?.nome || 'N/A'}`);
        console.log(`   ℹ️  OKRs: ${contexto.okrs.length} owner`);
        
        // Gerar atribuições
        const atribuicoes = await gerarAtribuicoesComSubsistemas(contexto, empresa, subsistemas);
        
        console.log(`   ✅ ${atribuicoes.length} atribuições geradas`);
        
        // Salvar
        const { sucessos, falhas } = await salvarAtribuicoes(p.id, empresa.id, atribuicoes);
        
        totalSucessos += sucessos;
        totalFalhas += falhas;
        
        console.log(`   ✅ ${sucessos} salvas, ${falhas} falhas\n`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        console.error(`   ❌ Erro ao processar ${p.persona_code}:`, error.message);
        console.log('');
      }
    }
    
    // 5. Resumo final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 SCRIPT 03 V5.0 CONCLUÍDO!\n');
    console.log(`✅ Atribuições salvas: ${totalSucessos}`);
    console.log(`❌ Falhas: ${totalFalhas}\n`);
    
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1️⃣ Execute: node 04_generate_competencias_grok.js --empresaId=' + targetEmpresaId);
    console.log('   2️⃣ Continue com Scripts 05-11\n');
    
  } catch (error) {
    console.error('\n❌ ERRO INESPERADO:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// ============================================================================
// EXECUTAR
// ============================================================================

generateAtribuicoesContextualizadas();
