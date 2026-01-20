#!/usr/bin/env node
/**
 * 🎯 SCRIPT 00 - GERAR NOMES DE PERSONAS VIA LLM
 * ==============================================
 * 
 * SOLUÇÃO DEFINITIVA PARA DUPLICATAS DE NOMES
 * 
 * Este script usa Google Gemini para gerar nomes únicos e culturalmente
 * apropriados baseados na composição de nacionalidades da empresa.
 * 
 * Uso:
 *   node 00_generate_personas_names_llm.js --empresaId=UUID_EMPRESA
 * 
 * Funcionalidade:
 *   1. Busca empresa e suas configurações de nacionalidade
 *   2. Gera lista de nomes via LLM respeitando proporções
 *   3. Garante unicidade global (não duplica entre empresas)
 *   4. Atualiza tabela personas com nomes culturalmente apropriados
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

// ==================== CONFIGURAÇÃO ====================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const googleApiKey = process.env.GOOGLE_AI_API_KEY;

if (!supabaseUrl || !supabaseKey || !googleApiKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Parse CLI args
const args = process.argv.slice(2);
let empresaId = null;

args.forEach(arg => {
  if (arg.startsWith('--empresaId=')) {
    empresaId = arg.split('=')[1];
  }
});

if (!empresaId) {
  console.error('❌ Erro: --empresaId é obrigatório');
  console.error('Uso: node 00_generate_personas_names_llm.js --empresaId=UUID_EMPRESA');
  process.exit(1);
}

// ==================== FUNÇÕES ====================

function log(emoji, message) {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

async function buscarEmpresa(empresaId) {
  log('🏢', `Buscando empresa: ${empresaId}`);
  
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', empresaId)
    .single();

  if (error) {
    throw new Error(`Erro ao buscar empresa: ${error.message}`);
  }

  if (!data) {
    throw new Error('Empresa não encontrada');
  }

  log('✅', `Empresa encontrada: ${data.nome}`);
  return data;
}

async function buscarPersonas(empresaId) {
  log('👥', 'Buscando personas da empresa...');
  
  const { data, error } = await supabase
    .from('personas')
    .select('id, full_name, role, email, empresa_id')
    .eq('empresa_id', empresaId)
    .order('role');

  if (error) {
    throw new Error(`Erro ao buscar personas: ${error.message}`);
  }

  log('✅', `${data?.length || 0} personas encontradas`);
  return data || [];
}

async function buscarNomesExistentes() {
  log('🔍', 'Buscando nomes já existentes no sistema...');
  
  const { data, error } = await supabase
    .from('personas')
    .select('full_name');

  if (error) {
    throw new Error(`Erro ao buscar nomes existentes: ${error.message}`);
  }

  const nomesSet = new Set(data?.map(p => p.full_name) || []);
  log('📋', `${nomesSet.size} nomes únicos já existem no sistema`);
  
  return Array.from(nomesSet);
}

async function gerarNomesViaLLM(empresa, personas, nomesExistentes) {
  log('🤖', 'Gerando nomes via Google Gemini...');
  
  // Preparar configuração de nacionalidades
  const nacionalidades = empresa.nationalities || [
    { tipo: 'americanos', percentual: 40 },
    { tipo: 'brasileiros', percentual: 30 },
    { tipo: 'europeus', percentual: 20 },
    { tipo: 'asiaticos', percentual: 10 }
  ];

  // Calcular distribuição de nomes
  const totalPersonas = personas.length;
  const distribuicao = nacionalidades
    .filter(n => n.percentual > 0)
    .map(n => {
      const quantidade = Math.round((n.percentual / 100) * totalPersonas);
      return { ...n, quantidade };
    });

  // Ajustar para garantir total exato
  const somaDistribuicao = distribuicao.reduce((sum, d) => sum + d.quantidade, 0);
  if (somaDistribuicao !== totalPersonas) {
    const diferenca = totalPersonas - somaDistribuicao;
    distribuicao[0].quantidade += diferenca;
  }

  log('📊', 'Distribuição de nacionalidades:');
  distribuicao.forEach(d => {
    log('  ', `${d.tipo}: ${d.quantidade} personas (${d.percentual}%)`);
  });

  // Agrupar personas por cargo para contexto
  const personasPorCargo = personas.map(p => ({
    cargo: p.role,
    genero_sugerido: p.role.includes('a') || Math.random() > 0.5 ? 'feminino' : 'masculino'
  }));

  // Criar prompt para LLM
  const prompt = `Você é um especialista em geração de nomes realistas e culturalmente apropriados.

CONTEXTO:
Empresa: ${empresa.nome}
Setor: ${empresa.industria}
Total de personas: ${totalPersonas}

DISTRIBUIÇÃO DE NACIONALIDADES:
${distribuicao.map(d => `- ${d.tipo}: ${d.quantidade} pessoas (${d.percentual}%)`).join('\n')}

CARGOS DAS PERSONAS:
${personasPorCargo.map((p, i) => `${i + 1}. ${p.cargo} (gênero sugerido: ${p.genero_sugerido})`).join('\n')}

NOMES QUE JÁ EXISTEM NO SISTEMA (NÃO REPETIR):
${nomesExistentes.join(', ')}

TAREFA:
Gere EXATAMENTE ${totalPersonas} nomes ÚNICOS e REALISTAS seguindo estas regras:

1. **DISTRIBUIÇÃO RIGOROSA**: Respeite as quantidades por nacionalidade
2. **UNICIDADE ABSOLUTA**: NÃO repita NENHUM nome da lista de nomes existentes
3. **REALISMO CULTURAL**: Use nomes autênticos de cada cultura
4. **DIVERSIDADE DE GÊNERO**: Mix equilibrado de nomes masculinos e femininos
5. **ADEQUAÇÃO AO CARGO**: Nomes compatíveis com a senioridade do cargo

FORMATO DE RESPOSTA (JSON):
{
  "nomes": [
    {
      "nome_completo": "Nome Sobrenome",
      "nacionalidade": "americanos|brasileiros|europeus|nordicos|asiaticos|russos|africanos|latinos",
      "genero": "masculino|feminino",
      "cargo_associado": "CEO|CTO|etc"
    }
  ]
}

EXEMPLOS DE NOMES POR NACIONALIDADE:
- Americanos: James Anderson, Sarah Mitchell, Michael Rodriguez
- Brasileiros: João Silva, Maria Santos, Pedro Oliveira
- Europeus: François Dubois, Emma Schmidt, Marco Rossi
- Nórdicos: Lars Svensson, Ingrid Johansen, Erik Nielsen
- Asiáticos: Hiroshi Tanaka, Li Wei, Priya Sharma
- Russos: Dmitri Volkov, Anastasia Ivanova, Viktor Petrov
- Africanos: Kwame Nkrumah, Amara Okafor, Thabo Mbeki
- Latinos: Carlos Mendez, Valentina Reyes, Diego Fernández

IMPORTANTE: 
- Retorne APENAS o JSON válido
- Gere EXATAMENTE ${totalPersonas} nomes
- NÃO repita nomes
- Mantenha proporção de nacionalidades`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extrair JSON da resposta
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM não retornou JSON válido');
    }
    
    const data = JSON.parse(jsonMatch[0]);
    
    if (!data.nomes || !Array.isArray(data.nomes)) {
      throw new Error('Estrutura JSON inválida');
    }
    
    if (data.nomes.length !== totalPersonas) {
      throw new Error(`LLM gerou ${data.nomes.length} nomes, esperado ${totalPersonas}`);
    }
    
    log('✅', `${data.nomes.length} nomes gerados com sucesso!`);
    
    // Validar unicidade
    const nomesGerados = data.nomes.map(n => n.nome_completo);
    const nomesUnicos = new Set(nomesGerados);
    
    if (nomesUnicos.size !== nomesGerados.length) {
      throw new Error('LLM gerou nomes duplicados internamente');
    }
    
    // Validar que não conflita com existentes
    const conflitos = nomesGerados.filter(n => nomesExistentes.includes(n));
    if (conflitos.length > 0) {
      throw new Error(`LLM gerou nomes que já existem: ${conflitos.join(', ')}`);
    }
    
    return data.nomes;
    
  } catch (error) {
    log('❌', `Erro ao gerar nomes via LLM: ${error.message}`);
    throw error;
  }
}

async function atualizarPersonasComNomes(personas, nomesGerados) {
  log('💾', 'Atualizando personas no banco de dados...');
  
  let sucessos = 0;
  let erros = 0;
  
  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    const nomeData = nomesGerados[i];
    
    try {
      // Gerar email baseado no nome
      const primeiroNome = nomeData.nome_completo.split(' ')[0].toLowerCase();
      const sobrenome = nomeData.nome_completo.split(' ').slice(-1)[0].toLowerCase();
      const dominio = 'example.com'; // Será substituído pelo domínio da empresa se existir
      const email = `${primeiroNome}.${sobrenome}@${dominio}`;
      
      const { error } = await supabase
        .from('personas')
        .update({
          full_name: nomeData.nome_completo,
          email: email,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);
      
      if (error) {
        log('❌', `Erro ao atualizar ${persona.id}: ${error.message}`);
        erros++;
      } else {
        log('✅', `${nomeData.nome_completo} (${nomeData.nacionalidade}) → ${persona.role}`);
        sucessos++;
      }
      
    } catch (error) {
      log('❌', `Exceção ao atualizar ${persona.id}: ${error.message}`);
      erros++;
    }
  }
  
  log('📊', `Atualização concluída: ${sucessos} sucessos, ${erros} erros`);
  return { sucessos, erros };
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function main() {
  console.log('\n' + '='.repeat(60));
  log('🚀', 'GERAÇÃO DE NOMES VIA LLM');
  console.log('='.repeat(60) + '\n');
  
  try {
    // 1. Buscar empresa
    const empresa = await buscarEmpresa(empresaId);
    
    // 2. Buscar personas
    const personas = await buscarPersonas(empresaId);
    
    if (personas.length === 0) {
      log('⚠️', 'Nenhuma persona encontrada para esta empresa');
      process.exit(0);
    }
    
    // 3. Buscar nomes existentes
    const nomesExistentes = await buscarNomesExistentes();
    
    // 4. Gerar nomes via LLM
    const nomesGerados = await gerarNomesViaLLM(empresa, personas, nomesExistentes);
    
    // 5. Atualizar personas
    const resultado = await atualizarPersonasComNomes(personas, nomesGerados);
    
    // 6. Relatório final
    console.log('\n' + '='.repeat(60));
    log('📊', 'RELATÓRIO FINAL');
    console.log('='.repeat(60));
    console.log(`Empresa: ${empresa.nome}`);
    console.log(`Total de personas: ${personas.length}`);
    console.log(`Nomes atualizados: ${resultado.sucessos}`);
    console.log(`Erros: ${resultado.erros}`);
    console.log('='.repeat(60) + '\n');
    
    if (resultado.erros === 0) {
      log('✅', 'PROCESSO CONCLUÍDO COM SUCESSO!');
    } else {
      log('⚠️', 'Processo concluído com erros');
    }
    
  } catch (error) {
    log('❌', `ERRO FATAL: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
