// ============================================================================
// SCRIPT 01 V5.0 - CRIAÇÃO DE PERSONAS BASEADA EM BLOCOS FUNCIONAIS E OKRs
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 00 (Company Foundation)
// 
// PARADIGMA TOP-DOWN (v5.0):
// - Busca blocos funcionais criados pelo Script 00
// - Busca OKRs com ownership definido
// - Para cada bloco, gera cargos necessários via LLM
// - Vincula personas a OKRs como owners
// - Define responsabilidades por RESULTADOS (não tarefas)
//
// Uso:
//   node 01_create_personas_from_structure_v5.js --empresaId=UUID
//
// Output:
//   Personas criadas com contexto estratégico completo
// ============================================================================

import llmHealth from './llm_health_checker.cjs';
const { testLLMs, generateWithFallback } = llmHealth;
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { distribuirNacionalidades } from './lib/nomes_nacionalidades.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const OUTPUT_DIR = path.join(__dirname, 'estrutura_organizacional_output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('\n🏗️  SCRIPT 01 V5.0 - CRIAÇÃO DE PERSONAS (TOP-DOWN)');
console.log('===================================================');
console.log('📊 Baseado em Blocos Funcionais e OKRs');
console.log('🎯 Paradigma: Missão → Objetivos → OKRs → Personas');
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
  console.log('📝 Uso: node 01_create_personas_from_structure_v5.js --empresaId=UUID');
  process.exit(1);
}

// ============================================================================
// FUNÇÕES AUXILIARES - BUSCAR FUNDAÇÃO DA EMPRESA
// ============================================================================

async function buscarBlocosFuncionais(empresaId) {
  console.log('1️⃣ Buscando blocos funcionais...\n');
  
  const { data, error } = await supabase
    .from('empresas_blocos_funcionais')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('nome');
  
  if (error) throw error;
  
  if (!data || data.length === 0) {
    throw new Error('❌ Nenhum bloco funcional encontrado. Execute o Script 00 primeiro.');
  }
  
  console.log(`✅ ${data.length} blocos funcionais encontrados:\n`);
  data.forEach((bloco, i) => {
    console.log(`   ${i+1}. ${bloco.nome}`);
    console.log(`      Objetivo: ${bloco.objetivo}`);
    console.log(`      KPIs: ${bloco.kpis?.join(', ') || 'Nenhum'}\n`);
  });
  
  return data;
}

async function buscarOKRs(empresaId) {
  console.log('2️⃣ Buscando OKRs...\n');
  
  const { data, error } = await supabase
    .from('empresas_okrs')
    .select(`
      *,
      objetivo:empresas_objetivos_estrategicos(*)
    `)
    .eq('empresa_id', empresaId);
  
  if (error) throw error;
  
  console.log(`✅ ${data?.length || 0} OKRs encontrados:\n`);
  data?.forEach((okr, i) => {
    console.log(`   ${i+1}. ${okr.titulo}`);
    console.log(`      Área: ${okr.area_responsavel}`);
    console.log(`      KR1: ${okr.key_result_1}`);
    console.log(`      KR2: ${okr.key_result_2}`);
    console.log(`      KR3: ${okr.key_result_3}\n`);
  });
  
  return data || [];
}

async function buscarValueStream(empresaId) {
  const { data } = await supabase
    .from('empresas_value_stream')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('ordem');
  
  return data || [];
}

// ============================================================================
// FUNÇÃO PRINCIPAL - GERAR CARGOS PARA CADA BLOCO FUNCIONAL
// ============================================================================

async function gerarCargosDoBloco(bloco, okrsRelacionados, empresa, activeLLM) {
  console.log(`\n3️⃣ Gerando cargos para bloco: ${bloco.nome}...\n`);
  
  const okrsTexto = okrsRelacionados.length > 0
    ? okrsRelacionados.map(okr => `
      • OKR ID: ${okr.id}
        Título: ${okr.titulo}
        - KR1: ${okr.key_result_1}
        - KR2: ${okr.key_result_2}
        - KR3: ${okr.key_result_3}
        - Progresso atual: ${okr.progresso_percentual}%
    `).join('\n')
    : 'Nenhum OKR específico para este bloco';
  
  const prompt = `Você é um especialista em design organizacional estratégico.

EMPRESA: ${empresa.nome}
INDÚSTRIA: ${empresa.industria}

BLOCO FUNCIONAL: ${bloco.nome}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBJETIVO DO BLOCO:
${bloco.objetivo}

KPIs DO BLOCO:
${bloco.kpis?.join('\n') || 'Não definidos'}

OKRs DESTE BLOCO:
${okrsTexto}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Defina 2-5 CARGOS necessários para este bloco funcional.

REGRAS OBRIGATÓRIAS:
1. Pelo menos 1 cargo GERENCIAL (owner de OKRs)
2. Cargos ESPECIALISTAS que executam tarefas específicas
3. Cada cargo deve ter RESPONSABILIDADE POR RESULTADO, não apenas tarefas
4. Responsabilidades devem ser mensuráveis e alinhadas aos KPIs

NÍVEIS HIERÁRQUICOS:
- "gerencial": Owner de OKRs, toma decisões estratégicas, gerencia equipe
- "especialista": Executa com autonomia, especialista técnico, não gerencia
- "operacional": Executa tarefas específicas, menos autonomia

Retorne APENAS JSON VÁLIDO (sem markdown, sem texto extra):
{
  "cargos": [
    {
      "titulo": "Nome do cargo (ex: 'Gerente de Marketing Digital')",
      "nivel_hierarquico": "gerencial|especialista|operacional",
      "departamento": "${bloco.nome}",
      "responsabilidade_resultado": "Resultado mensurável que garante (ex: 'Gerar 150 leads qualificados/mês com CAC < $50')",
      "metricas_responsabilidade": ["Métrica 1", "Métrica 2", "Métrica 3"],
      "okr_titles_ownership": ["Título do OKR se for owner (copie o título exato da lista acima)"],
      "justificativa": "Por que este cargo é necessário (1 frase)"
    }
  ]
}`;

  try {
    const response = await generateWithFallback(activeLLM, prompt, {
      temperature: 0.75,
      maxTokens: 2500
    });
    
    // Limpar resposta
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    const resultado = JSON.parse(cleanResponse);
    
    if (!resultado.cargos || !Array.isArray(resultado.cargos)) {
      throw new Error('Resposta LLM inválida: campo "cargos" ausente ou não é array');
    }
    
    // ====================================================================
    // MATCHING: Converter títulos de OKRs em UUIDs reais
    // ====================================================================
    resultado.cargos.forEach(cargo => {
      const okrTitles = cargo.okr_titles_ownership || [];
      cargo.okr_owner_ids = [];
      
      okrTitles.forEach(title => {
        const okrMatch = okrsRelacionados.find(okr => 
          okr.titulo.toLowerCase().includes(title.toLowerCase()) ||
          title.toLowerCase().includes(okr.titulo.toLowerCase())
        );
        
        if (okrMatch && !cargo.okr_owner_ids.includes(okrMatch.id)) {
          cargo.okr_owner_ids.push(okrMatch.id);
        }
      });
      
      // Se nível gerencial mas sem OKRs matched, atribuir todos os OKRs do bloco
      if (cargo.nivel_hierarquico === 'gerencial' && cargo.okr_owner_ids.length === 0) {
        cargo.okr_owner_ids = okrsRelacionados.map(okr => okr.id);
      }
    });
    
    console.log(`✅ ${resultado.cargos.length} cargo(s) gerado(s) para ${bloco.nome}:\n`);
    resultado.cargos.forEach((cargo, i) => {
      console.log(`   ${i+1}. ${cargo.titulo} (${cargo.nivel_hierarquico})`);
      console.log(`      Responsabilidade: ${cargo.responsabilidade_resultado}`);
      console.log(`      Métricas: ${cargo.metricas_responsabilidade?.join(', ') || 'Nenhuma'}\n`);
    });
    
    return resultado.cargos;
    
  } catch (error) {
    console.error(`❌ Erro ao gerar cargos para ${bloco.nome}:`, error.message);
    
    // Fallback: criar 1 cargo gerencial genérico
    console.log('⚠️  Usando fallback: criando 1 cargo gerencial genérico\n');
    return [{
      titulo: `Gerente de ${bloco.nome}`,
      nivel_hierarquico: 'gerencial',
      departamento: bloco.nome,
      responsabilidade_resultado: bloco.objetivo,
      metricas_responsabilidade: bloco.kpis || [],
      okr_titles_ownership: okrsRelacionados.map(okr => okr.titulo),
      okr_owner_ids: okrsRelacionados.map(okr => okr.id),
      justificativa: 'Cargo gerencial responsável pelo bloco funcional'
    }];
  }
}

// ============================================================================
// CRIAR PERSONAS NO BANCO DE DADOS
// ============================================================================

async function criarPersonas(empresa, blocosFuncionais, okrs, cargosGerados) {
  console.log('\n4️⃣ Criando personas no banco de dados...\n');
  
  // Distribuir nacionalidades
  const totalCargos = cargosGerados.reduce((sum, grupo) => sum + grupo.cargos.length, 0);
  const todosOsCargos = cargosGerados.flatMap(grupo => grupo.cargos);
  
  const distribuicaoNacionalidades = distribuirNacionalidades(
    todosOsCargos.map(c => c.titulo),
    empresa.nationalities || [{ tipo: 'brasileiros', percentual: 100 }]
  );
  
  console.log(`🌍 Distribuindo ${totalCargos} cargos entre nacionalidades\n`);
  
  let personaIndex = 0;
  let successCount = 0;
  
  for (const grupo of cargosGerados) {
    const bloco = grupo.bloco;
    
    for (const cargo of grupo.cargos) {
      const nacionalidadeInfo = distribuicaoNacionalidades[personaIndex];
      
      const personaData = {
        persona_code: `${empresa.codigo}-${bloco.nome.substring(0,3).toUpperCase()}${personaIndex+1}`,
        empresa_id: empresa.id,
        specialty: cargo.titulo,
        department: cargo.departamento,
        role: cargo.titulo,
        
        // NOVOS CAMPOS V5.0
        bloco_funcional_id: bloco.id,
        bloco_funcional_nome: bloco.nome,
        okr_owner_ids: cargo.okr_owner_ids || [],
        responsabilidade_resultado: cargo.responsabilidade_resultado,
        metricas_responsabilidade: cargo.metricas_responsabilidade || [],
        nivel_hierarquico: cargo.nivel_hierarquico,
        
        // Dados básicos (serão preenchidos pelo Script 02)
        nacionalidade: nacionalidadeInfo?.nacionalidade || 'brasileiros',
        status: 'active',
        full_name: '[A GERAR]',
        email: `persona${personaIndex+1}@${empresa.dominio || 'empresa.com'}`
      };
      
      // Verificar se já existe
      const { data: existing } = await supabase
        .from('personas')
        .select('id, full_name')
        .eq('persona_code', personaData.persona_code)
        .maybeSingle();
      
      if (existing && existing.full_name && !existing.full_name.startsWith('[')) {
        console.log(`   ⏭️  Pulando ${personaData.persona_code} - já existe com dados reais`);
        personaIndex++;
        continue;
      }
      
      // Inserir/atualizar
      const { error } = await supabase
        .from('personas')
        .upsert([personaData], {
          onConflict: 'persona_code',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error(`   ❌ Erro ao criar ${personaData.persona_code}:`, error.message);
      } else {
        console.log(`   ✅ ${personaData.persona_code} - ${cargo.titulo} (${cargo.nivel_hierarquico})`);
        successCount++;
      }
      
      personaIndex++;
    }
  }
  
  console.log(`\n✅ ${successCount} personas criadas/atualizadas com sucesso!\n`);
  
  // Atualizar empresa
  await supabase
    .from('empresas')
    .update({
      equipe_gerada: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', empresa.id);
  
  return successCount;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  try {
    // Buscar empresa
    console.log('🔍 Buscando empresa...\n');
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', targetEmpresaId)
      .single();
    
    if (empresaError || !empresa) {
      throw new Error('❌ Empresa não encontrada');
    }
    
    console.log(`✅ Empresa: ${empresa.nome}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Buscar fundação da empresa (Script 00)
    const blocos = await buscarBlocosFuncionais(targetEmpresaId);
    const okrs = await buscarOKRs(targetEmpresaId);
    const valueStream = await buscarValueStream(targetEmpresaId);
    
    // Testar LLM
    console.log('🤖 Testando LLMs disponíveis...\n');
    const activeLLM = await testLLMs();
    if (!activeLLM) {
      throw new Error('❌ Nenhum LLM disponível');
    }
    console.log(`✅ LLM ativo: ${activeLLM}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Para cada bloco funcional, gerar cargos
    const cargosGerados = [];
    
    for (const bloco of blocos) {
      // Filtrar OKRs relacionados a este bloco
      const okrsRelacionados = okrs.filter(okr => 
        okr.area_responsavel?.toLowerCase().includes(bloco.nome.toLowerCase()) ||
        bloco.nome.toLowerCase().includes(okr.area_responsavel?.toLowerCase())
      );
      
      const cargos = await gerarCargosDoBloco(bloco, okrsRelacionados, empresa, activeLLM);
      
      cargosGerados.push({
        bloco,
        cargos,
        okrsRelacionados
      });
      
      // Pausa entre blocos
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Criar personas no banco
    const totalCriadas = await criarPersonas(empresa, blocos, okrs, cargosGerados);
    
    // Salvar estrutura gerada em arquivo
    const outputFile = path.join(OUTPUT_DIR, `${empresa.codigo}_structure_v5.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        codigo: empresa.codigo
      },
      blocos_funcionais: blocos.length,
      okrs_total: okrs.length,
      personas_criadas: totalCriadas,
      estrutura: cargosGerados,
      gerado_em: new Date().toISOString()
    }, null, 2));
    
    console.log(`📄 Estrutura salva em: ${outputFile}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 SCRIPT 01 V5.0 CONCLUÍDO COM SUCESSO!\n');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1️⃣ Execute o Script 02 para gerar biografias com contexto de OKRs');
    console.log('   2️⃣ Execute o Script 03 para gerar atribuições baseadas em resultados');
    console.log('   3️⃣ Continue com os Scripts 04-11 normalmente\n');
    
  } catch (error) {
    console.error('\n❌ ERRO NA EXECUÇÃO:\n');
    console.error(error);
    process.exit(1);
  }
}

main();
