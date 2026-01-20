// ============================================================================
// SCRIPT 00 - COMPANY FOUNDATION GENERATOR (FUNDAÇÃO DA EMPRESA)
// ============================================================================
// ORDEM CORRETA: Executar PRIMEIRO, antes de qualquer outro script
// 
// Este script:
// 1. Solicita entrada do usuário via formulário web
// 2. Gera Missão Operacional usando LLM
// 3. Gera Objetivos Estratégicos Globais (3-7)
// 4. Gera OKRs detalhados com ownership
// 5. Mapeia Cadeia de Valor (Value Stream)
// 6. Cria Blocos Funcionais necessários
// 7. Define Regras de Governança
// 8. Salva tudo nas tabelas empresas_* (6 novas tabelas normalizadas)
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { generateJSONWithFallback, setupConsoleEncoding } from './lib/llm_fallback.js';
import dotenv from 'dotenv';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup Windows console UTF-8
setupConsoleEncoding();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n🏢 SCRIPT 00 - COMPANY FOUNDATION GENERATOR');
console.log('============================================');
console.log('📋 Este script cria a FUNDAÇÃO da empresa:');
console.log('   1️⃣ Missão Operacional');
console.log('   2️⃣ Objetivos Estratégicos Globais');
console.log('   3️⃣ OKRs (Objectives & Key Results)');
console.log('   4️⃣ Cadeia de Valor (Value Stream)');
console.log('   5️⃣ Blocos Funcionais');
console.log('   6️⃣ Governança');
console.log('============================================\n');

// ============================================================================
// INTERFACE DE FORMULÁRIO (CLI)
// ============================================================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function collectUserInput() {
  console.log('📝 FORMULÁRIO DE ENTRADA\n');
  console.log('Por favor, forneça as seguintes informações:\n');
  
  const empresaId = await askQuestion('🆔 ID da Empresa (UUID): ');
  const escopoAtuacao = await askQuestion('🎯 Escopo de Atuação (ex: "Consultoria em vacinas bovinas"): ');
  const produtos = await askQuestion('📦 Produtos/Serviços (ex: "Consultoria técnica, treinamentos, auditoria"): ');
  const propostaValor = await askQuestion('💎 Proposta de Valor (ex: "Reduzir mortalidade em 40%"): ');
  const missaoOperacional = await askQuestion('🧭 Missão Operacional (opcional, deixe vazio para gerar via LLM): ');
  const objetivosIniciais = await askQuestion('🎯 Objetivos Estratégicos Iniciais (separados por vírgula, opcional): ');
  
  rl.close();
  
  return {
    empresaId: empresaId.trim(),
    escopoAtuacao: escopoAtuacao.trim(),
    produtos: produtos.trim(),
    propostaValor: propostaValor.trim(),
    missaoOperacional: missaoOperacional.trim() || null,
    objetivosIniciais: objetivosIniciais.trim() ? objetivosIniciais.split(',').map(o => o.trim()) : []
  };
}

// ============================================================================
// STEP 1: GERAR MISSÃO OPERACIONAL
// ============================================================================

async function generateMissaoOperacional(input, empresa) {
  console.log('\n1️⃣ GERANDO MISSÃO OPERACIONAL...\n');
  
  if (input.missaoOperacional) {
    console.log('✅ Usando missão fornecida pelo usuário');
    return {
      missao_texto: input.missaoOperacional,
      para_quem: input.escopoAtuacao,
      como: input.produtos,
      resultado_mensuravel: input.propostaValor
    };
  }
  
  const prompt = `Você é um consultor estratégico especializado em criar missões operacionais para empresas.

EMPRESA: ${empresa.nome}
INDÚSTRIA: ${empresa.industria}
ESCOPO DE ATUAÇÃO: ${input.escopoAtuacao}
PRODUTOS/SERVIÇOS: ${input.produtos}
PROPOSTA DE VALOR: ${input.propostaValor}

Crie uma MISSÃO OPERACIONAL (NÃO filosófica) respondendo:

1. O QUE essa empresa entrega de valor?
2. PARA QUEM?
3. COMO?
4. COM QUAL RESULTADO MENSURÁVEL?

IMPORTANTE: A missão deve ser OPERACIONAL, não filosófica. Evite frases genéricas.

Retorne no formato JSON:
{
  "missao_texto": "Texto completo da missão operacional (1-2 parágrafos)",
  "para_quem": "Público-alvo específico",
  "como": "Como a empresa entrega valor (metodologia/processo)",
  "resultado_mensuravel": "Resultado específico e mensurável"
}`;

  const result = await generateJSONWithFallback(prompt, 0.7);
  console.log('✅ Missão operacional gerada com sucesso');
  console.log(`📝 ${result.missao_texto}\n`);
  
  return result;
}

// ============================================================================
// STEP 2: GERAR OBJETIVOS ESTRATÉGICOS GLOBAIS (3-7)
// ============================================================================

async function generateObjetivosEstrategicos(input, empresa, missao) {
  console.log('\n2️⃣ GERANDO OBJETIVOS ESTRATÉGICOS GLOBAIS...\n');
  
  const objetivosBase = input.objetivosIniciais.length > 0 
    ? `OBJETIVOS INICIAIS FORNECIDOS:\n${input.objetivosIniciais.map((o, i) => `${i+1}. ${o}`).join('\n')}\n\nVocê pode usar esses como inspiração, mas gere objetivos QUANTIFICÁVEIS e ESTRATÉGICOS.`
    : '';
  
  const prompt = `Você é um consultor estratégico especializado em definir objetivos empresariais.

EMPRESA: ${empresa.nome}
INDÚSTRIA: ${empresa.industria}
MISSÃO OPERACIONAL: ${missao.missao_texto}
PROPOSTA DE VALOR: ${input.propostaValor}

${objetivosBase}

Crie entre 3 e 7 OBJETIVOS ESTRATÉGICOS GLOBAIS para esta empresa.

REGRAS OBRIGATÓRIAS:
- Cada objetivo DEVE ser quantificável e mensurável
- Deve incluir meta numérica (%, valor, quantidade)
- Deve ter prazo definido (3 meses, 6 meses, 1 ano)
- Deve estar alinhado com a missão operacional
- Evite objetivos vagos ou filosóficos

EXEMPLOS DE OBJETIVOS CORRETOS:
✓ "Crescer receita recorrente em 25% nos próximos 12 meses"
✓ "Reduzir custo operacional em 15% até o final do trimestre"
✓ "Aumentar retenção de clientes de 70% para 85% em 6 meses"
✓ "Escalar operação sem aumentar equipe em mais de 20% no ano"

EXEMPLOS DE OBJETIVOS ERRADOS:
✗ "Melhorar a satisfação dos clientes" (não é mensurável)
✗ "Ser referência no mercado" (vago demais)
✗ "Crescer de forma sustentável" (sem números)

Retorne no formato JSON:
{
  "objetivos": [
    {
      "titulo": "Título curto do objetivo",
      "descricao": "Descrição detalhada (2-3 frases)",
      "metrica_alvo": "Meta específica (ex: 'Crescer receita em 25%')",
      "prazo_meses": 12,
      "prioridade": 1,
      "categoria": "financeiro|operacional|cliente|equipe|produto"
    }
  ]
}`;

  const result = await generateJSONWithFallback(prompt, 0.75);
  console.log(`✅ ${result.objetivos.length} objetivos estratégicos gerados:\n`);
  result.objetivos.forEach((obj, i) => {
    console.log(`   ${i+1}. ${obj.titulo}`);
    console.log(`      Meta: ${obj.metrica_alvo}`);
    console.log(`      Prazo: ${obj.prazo_meses} meses\n`);
  });
  
  return result.objetivos;
}

// ============================================================================
// STEP 3: GERAR OKRs (OBJECTIVES & KEY RESULTS)
// ============================================================================

async function generateOKRs(objetivo, empresa, missao) {
  console.log(`\n3️⃣ GERANDO OKRs PARA: "${objetivo.titulo}"...\n`);
  
  const prompt = `Você é um especialista em OKRs (Objectives and Key Results).

EMPRESA: ${empresa.nome}
MISSÃO: ${missao.missao_texto}
OBJETIVO ESTRATÉGICO: ${objetivo.titulo}
META: ${objetivo.metrica_alvo}

Crie 3 KEY RESULTS (KRs) para este objetivo.

REGRAS OBRIGATÓRIAS PARA CADA KR:
1. Deve ser MENSURÁVEL (número, %, valor)
2. Deve contribuir DIRETAMENTE para o objetivo global
3. Deve ter um OWNER (área responsável)
4. Deve ser atingível no prazo definido

ÁREAS POSSÍVEIS DE OWNERSHIP:
- Marketing & Aquisição
- Vendas & Fechamento
- Operações & Entrega
- Produto & Tecnologia
- Suporte & Retenção
- Financeiro & Legal
- Estratégia & Gestão

Retorne no formato JSON:
{
  "okrs": [
    {
      "titulo": "Nome do OKR (curto)",
      "key_result_1": "KR1: Descrição mensurável (ex: 'Aumentar leads qualificados em 30%')",
      "key_result_2": "KR2: Descrição mensurável",
      "key_result_3": "KR3: Descrição mensurável",
      "area_responsavel": "Nome da área owner",
      "progresso_percentual": 0,
      "prazo_meses": ${objetivo.prazo_meses}
    }
  ]
}`;

  const result = await generateJSONWithFallback(prompt, 0.8);
  console.log(`✅ ${result.okrs.length} OKR(s) gerado(s):\n`);
  result.okrs.forEach((okr, i) => {
    console.log(`   OKR ${i+1}: ${okr.titulo}`);
    console.log(`      ${okr.key_result_1}`);
    console.log(`      ${okr.key_result_2}`);
    console.log(`      ${okr.key_result_3}`);
    console.log(`      Owner: ${okr.area_responsavel}\n`);
  });
  
  return result.okrs;
}

// ============================================================================
// STEP 4: MAPEAR CADEIA DE VALOR (VALUE STREAM)
// ============================================================================

async function generateValueStream(empresa, missao, objetivos) {
  console.log('\n4️⃣ GERANDO CADEIA DE VALOR (VALUE STREAM)...\n');
  
  const prompt = `Você é um especialista em mapeamento de cadeia de valor (Value Stream Mapping).

EMPRESA: ${empresa.nome}
INDÚSTRIA: ${empresa.industria}
MISSÃO: ${missao.missao_texto}
OBJETIVOS: ${objetivos.map(o => o.titulo).join(', ')}

Mapeie a CADEIA DE VALOR completa desta empresa.

TODA EMPRESA tem este fluxo (adapte ao contexto):
1. AQUISIÇÃO - Como clientes descobrem a empresa?
2. CONVERSÃO - Como prospects viram clientes?
3. ENTREGA - Como o produto/serviço é entregue?
4. SUPORTE - Como clientes são atendidos pós-venda?
5. RETENÇÃO - Como clientes são mantidos e engajados?
6. EXPANSÃO - Como clientes aumentam consumo (upsell/cross-sell)?

Para cada estágio, defina:
- Descrição do que acontece
- Métricas-chave que medem esse estágio
- Área responsável principal

Retorne no formato JSON:
{
  "value_stream": [
    {
      "estagio": "aquisicao|conversao|entrega|suporte|retencao|expansao",
      "descricao": "Descrição detalhada do que acontece neste estágio",
      "metricas_chave": {
        "metrica_1": "valor_exemplo",
        "metrica_2": "valor_exemplo"
      },
      "area_responsavel": "Nome da área",
      "ordem": 1
    }
  ]
}`;

  const result = await generateJSONWithFallback(prompt, 0.7);
  console.log(`✅ Cadeia de valor mapeada (${result.value_stream.length} estágios):\n`);
  result.value_stream.forEach((stage, i) => {
    console.log(`   ${i+1}. ${stage.estagio.toUpperCase()}`);
    console.log(`      ${stage.descricao}`);
    console.log(`      Responsável: ${stage.area_responsavel}\n`);
  });
  
  return result.value_stream;
}

// ============================================================================
// STEP 5: CRIAR BLOCOS FUNCIONAIS
// ============================================================================

async function generateBlocosFuncionais(empresa, okrs, valueStream) {
  console.log('\n5️⃣ GERANDO BLOCOS FUNCIONAIS...\n');
  
  const areasIdentificadas = [
    ...new Set([
      ...okrs.map(okr => okr.area_responsavel),
      ...valueStream.map(vs => vs.area_responsavel)
    ])
  ];
  
  const prompt = `Você é um especialista em design organizacional.

EMPRESA: ${empresa.nome}
ÁREAS IDENTIFICADAS NOS OKRs E VALUE STREAM:
${areasIdentificadas.map((a, i) => `${i+1}. ${a}`).join('\n')}

Crie BLOCOS FUNCIONAIS (departamentos) estruturados para esta empresa.

BLOCOS-PADRÃO UNIVERSAIS (adapte ao contexto):
- Estratégia & Gestão
- Marketing & Aquisição
- Vendas & Fechamento
- Operações & Entrega
- Produto & Tecnologia
- Suporte & Retenção
- Financeiro & Legal
- Qualidade & Auditoria

Para cada bloco, defina:
- Nome do bloco
- Objetivo principal (o que esse bloco garante)
- KPIs principais (3-5 métricas)

Retorne no formato JSON:
{
  "blocos": [
    {
      "nome": "Nome do Bloco Funcional",
      "objetivo": "Objetivo principal deste bloco (1-2 frases)",
      "kpis": ["KPI 1", "KPI 2", "KPI 3"]
    }
  ]
}`;

  const result = await generateJSONWithFallback(prompt, 0.75);
  console.log(`✅ ${result.blocos.length} blocos funcionais criados:\n`);
  result.blocos.forEach((bloco, i) => {
    console.log(`   ${i+1}. ${bloco.nome}`);
    console.log(`      Objetivo: ${bloco.objetivo}`);
    console.log(`      KPIs: ${bloco.kpis.join(', ')}\n`);
  });
  
  return result.blocos;
}

// ============================================================================
// STEP 6: DEFINIR REGRAS DE GOVERNANÇA
// ============================================================================

async function generateGovernanca(empresa, blocos) {
  console.log('\n6️⃣ GERANDO REGRAS DE GOVERNANÇA...\n');
  
  const prompt = `Você é um especialista em governança corporativa.

EMPRESA: ${empresa.nome}
BLOCOS FUNCIONAIS:
${blocos.map((b, i) => `${i+1}. ${b.nome}`).join('\n')}

Defina as REGRAS DE GOVERNANÇA para cada área.

Para cada bloco funcional, responda:
1. DECIDE: Quem toma decisões estratégicas?
2. EXECUTA: Quem realiza o trabalho operacional?
3. MEDE: Quem acompanha métricas e performance?
4. CORRIGE: Quem implementa ações corretivas?
5. AUDITA: Quem valida qualidade e conformidade?

Retorne no formato JSON:
{
  "governanca": [
    {
      "area": "Nome da área/bloco",
      "regras": {
        "decide": "Descrição de quem decide (ex: 'CEO + Diretor de Marketing')",
        "executa": "Descrição de quem executa (ex: 'Equipe de Marketing (3-5 pessoas)')",
        "mede": "Descrição de quem mede (ex: 'Analista de BI + Gerente da área')",
        "corrige": "Descrição de quem corrige (ex: 'Gerente de Marketing')",
        "audita": "Descrição de quem audita (ex: 'Gerente de Qualidade')"
      }
    }
  ]
}`;

  const result = await generateJSONWithFallback(prompt, 0.7);
  console.log(`✅ Governança definida para ${result.governanca.length} áreas:\n`);
  result.governanca.forEach((gov, i) => {
    console.log(`   ${i+1}. ${gov.area}`);
    console.log(`      Decide: ${gov.regras.decide}`);
    console.log(`      Executa: ${gov.regras.executa}\n`);
  });
  
  return result.governanca;
}

// ============================================================================
// STEP 7: SALVAR TUDO NO BANCO DE DADOS
// ============================================================================

async function saveToDatabase(empresaId, data) {
  console.log('\n7️⃣ SALVANDO DADOS NO BANCO...\n');
  
  try {
    // 1. Salvar Missão
    console.log('💾 Salvando missão operacional...');
    const { error: missaoError } = await supabase
      .from('empresas_missao')
      .insert({
        empresa_id: empresaId,
        missao_operacional: data.missao.missao_texto,
        proposta_valor: data.missao.resultado_mensuravel,
        valores: [data.missao.para_quem, data.missao.como]
      });
    
    if (missaoError) throw missaoError;
    console.log('✅ Missão salva');
    
    // 2. Salvar Objetivos Estratégicos
    console.log('💾 Salvando objetivos estratégicos...');
    const objetivosInsert = data.objetivos.map(obj => ({
      empresa_id: empresaId,
      titulo: obj.titulo,
      descricao: obj.descricao,
      metrica_alvo: obj.metrica_alvo,
      prazo: new Date(Date.now() + obj.prazo_meses * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      prioridade: obj.prioridade,
      status: 'ativo'
    }));
    
    const { data: objetivosData, error: objetivosError } = await supabase
      .from('empresas_objetivos_estrategicos')
      .insert(objetivosInsert)
      .select();
    
    if (objetivosError) throw objetivosError;
    console.log(`✅ ${objetivosData.length} objetivos salvos`);
    
    // 3. Salvar OKRs
    console.log('💾 Salvando OKRs...');
    const okrsInsert = [];
    data.objetivos.forEach((obj, i) => {
      const objetivoId = objetivosData[i].id;
      obj.okrs.forEach(okr => {
        okrsInsert.push({
          empresa_id: empresaId,
          objetivo_estrategico_id: objetivoId,
          titulo: okr.titulo,
          key_result_1: okr.key_result_1,
          key_result_2: okr.key_result_2,
          key_result_3: okr.key_result_3,
          area_responsavel: okr.area_responsavel,
          progresso_percentual: 0,
          prazo: new Date(Date.now() + okr.prazo_meses * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      });
    });
    
    const { error: okrsError } = await supabase
      .from('empresas_okrs')
      .insert(okrsInsert);
    
    if (okrsError) throw okrsError;
    console.log(`✅ ${okrsInsert.length} OKRs salvos`);
    
    // 4. Salvar Value Stream
    console.log('💾 Salvando cadeia de valor...');
    const valueStreamInsert = data.valueStream.map(vs => ({
      empresa_id: empresaId,
      estagio: vs.estagio,
      descricao: vs.descricao,
      metricas_chave: vs.metricas_chave,
      ordem: vs.ordem
    }));
    
    const { error: vsError } = await supabase
      .from('empresas_value_stream')
      .insert(valueStreamInsert);
    
    if (vsError) throw vsError;
    console.log(`✅ ${valueStreamInsert.length} estágios da cadeia de valor salvos`);
    
    // 5. Salvar Blocos Funcionais
    console.log('💾 Salvando blocos funcionais...');
    const blocosInsert = data.blocos.map(bloco => ({
      empresa_id: empresaId,
      nome: bloco.nome,
      objetivo: bloco.objetivo,
      kpis: bloco.kpis,
      personas_ids: []
    }));
    
    const { error: blocosError } = await supabase
      .from('empresas_blocos_funcionais')
      .insert(blocosInsert);
    
    if (blocosError) throw blocosError;
    console.log(`✅ ${blocosInsert.length} blocos funcionais salvos`);
    
    // 6. Salvar Governança
    console.log('💾 Salvando regras de governança...');
    const governancaInsert = [];
    data.governanca.forEach(gov => {
      ['decide', 'executa', 'mede', 'corrige', 'audita'].forEach(tipo => {
        governancaInsert.push({
          empresa_id: empresaId,
          tipo,
          area: gov.area,
          descricao: gov.regras[tipo]
        });
      });
    });
    
    const { error: govError } = await supabase
      .from('empresas_governanca')
      .insert(governancaInsert);
    
    if (govError) throw govError;
    console.log(`✅ ${governancaInsert.length} regras de governança salvas`);
    
    console.log('\n✅ TODOS OS DADOS SALVOS COM SUCESSO!\n');
    
  } catch (error) {
    console.error('❌ Erro ao salvar dados:', error);
    throw error;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  try {
    // Coletar input do usuário
    const input = await collectUserInput();
    
    // Buscar dados da empresa
    console.log('\n🔍 Buscando dados da empresa...\n');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', input.empresaId)
      .single();
    
    if (empresaError || !empresa) {
      throw new Error('❌ Empresa não encontrada');
    }
    
    console.log(`✅ Empresa encontrada: ${empresa.nome}\n`);
    
    // STEP 1: Gerar Missão
    const missao = await generateMissaoOperacional(input, empresa);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // STEP 2: Gerar Objetivos Estratégicos
    const objetivos = await generateObjetivosEstrategicos(input, empresa, missao);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // STEP 3: Gerar OKRs para cada objetivo
    for (let i = 0; i < objetivos.length; i++) {
      const okrs = await generateOKRs(objetivos[i], empresa, missao);
      objetivos[i].okrs = okrs;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // STEP 4: Mapear Value Stream
    const valueStream = await generateValueStream(empresa, missao, objetivos);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // STEP 5: Criar Blocos Funcionais
    const allOkrs = objetivos.flatMap(obj => obj.okrs);
    const blocos = await generateBlocosFuncionais(empresa, allOkrs, valueStream);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // STEP 6: Definir Governança
    const governanca = await generateGovernanca(empresa, blocos);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // STEP 7: Salvar tudo no banco
    await saveToDatabase(input.empresaId, {
      missao,
      objetivos,
      valueStream,
      blocos,
      governanca
    });
    
    console.log('🎉 FUNDAÇÃO DA EMPRESA CRIADA COM SUCESSO!\n');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1️⃣ Execute o Script 01 para criar personas baseadas nos blocos funcionais');
    console.log('   2️⃣ Execute os Scripts 02-09 normalmente');
    console.log('   3️⃣ Acesse o dashboard para visualizar a estrutura completa\n');
    
  } catch (error) {
    console.error('❌ Erro na execução:', error);
    process.exit(1);
  }
}

main();
