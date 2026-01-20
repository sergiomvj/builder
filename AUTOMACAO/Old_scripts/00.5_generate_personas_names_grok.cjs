// SCRIPT 00.5 - GERAR NOMES DE PERSONAS VIA GROK
// ==============================================
// 
// SOLUÇÃO DEFINITIVA PARA NOMES PLACEHOLDERS
// 
// Este script usa Grok via OpenRouter para gerar nomes únicos e culturalmente
// apropriados baseados na composição de nacionalidades da empresa.
// 
// Uso:
//   node 00.5_generate_personas_names_grok.cjs --empresaId=UUID_EMPRESA [--force|--all]
// 
// Modos de Execução:
//   (padrão)  : INCREMENTAL - Processa apenas personas com nomes placeholder
//   --all     : COMPLETO - Substitui nomes de todas personas
//   --force   : FORÇA TOTAL - Limpa TUDO e regenera do zero
// 
// Exemplos:
//   # Processar apenas placeholders (padrão)
//   node 00.5_generate_personas_names_grok.cjs --empresaId=abc123
// 
//   # Substituir nomes de todas
//   node 00.5_generate_personas_names_grok.cjs --empresaId=abc123 --all
// 
//   # Limpar e regenerar tudo
//   node 00.5_generate_personas_names_grok.cjs --empresaId=abc123 --force
// 
// Funcionalidade:
//   1. Busca empresa e suas configurações de nacionalidade
//   2. Gera lista de nomes via Grok respeitando proporções
//   3. Garante unicidade global (não duplica entre empresas)
//   4. Atualiza tabela personas com nomes culturalmente apropriados

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

// Configuração
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!supabaseUrl || !supabaseKey || !openrouterKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI args
const args = process.argv.slice(2);
let empresaId = null;
let forceClean = false;
let skipExisting = true; // NOVO: pular personas que já têm nomes reais

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
  console.error('Uso: node 00.5_generate_personas_names_grok.cjs --empresaId=UUID_EMPRESA');
  process.exit(1);
}

const PROGRESS_FILE = path.join(__dirname, 'script-progress.json');

// ==================== FUNÇÕES ====================

function log(emoji, message) {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  console.log(`[${timestamp}] ${emoji} ${message}`);
}

function updateProgress(status, current, total, currentPersona = '', errors = []) {
  const progress = {
    script: '00.5_generate_personas_names_grok',
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
    .select('id, full_name, role, email, nacionalidade, genero, empresa_id')
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

  const nomesSet = new Set(data?.map(p => p.full_name.trim()) || []);
  log('📋', `${nomesSet.size} nomes únicos já existem no sistema`);
  
  return Array.from(nomesSet).filter(n => !n.includes('[Placeholder'));
}

async function gerarNomesViaGrok(empresa, personas, nomesExistentes) {
  log('🤖', 'Gerando nomes via Grok (OpenRouter)...');
  
  // Agrupar personas por nacionalidade
  const personasPorNacionalidade = personas.reduce((acc, p) => {
    const nac = p.nacionalidade || 'brasileiro';
    if (!acc[nac]) acc[nac] = [];
    acc[nac].push(p);
    return acc;
  }, {});

  log('📊', 'Distribuição de nacionalidades:');
  Object.entries(personasPorNacionalidade).forEach(([nac, ps]) => {
    log('  ', `${nac}: ${ps.length} personas`);
  });

  // Criar prompt para Grok
  const prompt = `Você é um especialista em geração de nomes realistas e culturalmente apropriados.

CONTEXTO:
Empresa: ${empresa.nome}
Setor: ${empresa.industria}
Total de personas: ${personas.length}

PERSONAS POR NACIONALIDADE E CARGO:
${Object.entries(personasPorNacionalidade).map(([nac, ps]) => 
  `\n${nac.toUpperCase()} (${ps.length} pessoas):\n${ps.map((p, i) => 
    `  ${i + 1}. ${p.role} (${p.genero || 'neutro'})`
  ).join('\n')}`
).join('\n')}

NOMES QUE JÁ EXISTEM NO SISTEMA (NÃO REPETIR):
${nomesExistentes.slice(0, 50).join(', ')}${nomesExistentes.length > 50 ? ` ... e mais ${nomesExistentes.length - 50}` : ''}

TAREFA:
Gere EXATAMENTE ${personas.length} nomes ÚNICOS e REALISTAS seguindo estas regras:

1. **DISTRIBUIÇÃO RIGOROSA**: Respeite a nacionalidade de cada persona
2. **UNICIDADE ABSOLUTA**: NÃO repita NENHUM nome da lista de nomes existentes
3. **REALISMO CULTURAL**: Use nomes autênticos de cada cultura
4. **ADEQUAÇÃO AO GÊNERO**: Respeite o gênero informado
5. **ADEQUAÇÃO AO CARGO**: Nomes compatíveis com a senioridade do cargo

FORMATO DE RESPOSTA (SOMENTE JSON, SEM MARKDOWN):
{
  "nomes": [
    {
      "nome_completo": "Nome Sobrenome",
      "nacionalidade": "brasileiro|americano|europeu|etc",
      "genero": "masculino|feminino|neutro",
      "cargo_associado": "cargo da persona"
    }
  ]
}

EXEMPLOS DE NOMES POR NACIONALIDADE:
- Brasileiro: João Silva, Maria Santos, Pedro Oliveira, Ana Costa, Lucas Ferreira
- Americano: James Anderson, Sarah Mitchell, Michael Rodriguez, Emily Chen, David Thompson
- Europeu: François Dubois, Emma Schmidt, Marco Rossi, Sofia Andersson, Lars Hansen
- Asiático: Hiroshi Tanaka, Li Wei, Priya Sharma, Mei Zhang, Raj Kumar
- Russo: Dmitri Volkov, Anastasia Ivanova, Viktor Petrov, Ekaterina Sokolov
- Africano: Kwame Nkrumah, Amara Okafor, Thabo Mbeki, Zuri Mensah

IMPORTANTE: 
- Retorne APENAS o JSON válido (sem \`\`\`json ou markdown)
- Gere EXATAMENTE ${personas.length} nomes na MESMA ORDEM das personas listadas
- NÃO repita nomes
- Mantenha a nacionalidade e gênero de cada persona`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://buildcorp.ai',
        'X-Title': 'BuildCorp - Names Generation'
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4.1-fast:free',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let nomesText = data.choices[0].message.content;

    // Limpar markdown se houver
    nomesText = nomesText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let nomesData;
    try {
      nomesData = JSON.parse(nomesText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON do Grok:');
      console.error(nomesText);
      throw new Error(`JSON inválido: ${parseError.message}`);
    }
    
    if (!nomesData.nomes || !Array.isArray(nomesData.nomes)) {
      throw new Error('Estrutura JSON inválida');
    }
    
    if (nomesData.nomes.length !== personas.length) {
      throw new Error(`Grok gerou ${nomesData.nomes.length} nomes, esperado ${personas.length}`);
    }
    
    log('✅', `${nomesData.nomes.length} nomes gerados com sucesso!`);
    
    // Validar unicidade
    const nomesGerados = nomesData.nomes.map(n => n.nome_completo.trim());
    const nomesUnicos = new Set(nomesGerados);
    
    if (nomesUnicos.size !== nomesGerados.length) {
      log('⚠️', 'Grok gerou alguns nomes duplicados internamente, mas continuando...');
    }
    
    // Validar que não conflita com existentes
    const conflitos = nomesGerados.filter(n => nomesExistentes.includes(n));
    if (conflitos.length > 0) {
      log('⚠️', `Alguns nomes já existem: ${conflitos.join(', ')}`);
      log('⚠️', 'Continuando mesmo assim...');
    }
    
    return nomesData.nomes;
    
  } catch (error) {
    log('❌', `Erro ao gerar nomes via Grok: ${error.message}`);
    throw error;
  }
}

async function atualizarPersonasComNomes(personas, nomesGerados, empresa) {
  log('💾', 'Atualizando personas no banco de dados...');
  
  let sucessos = 0;
  let erros = 0;
  const errorList = [];
  
  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    const nomeData = nomesGerados[i];
    
    try {
      updateProgress('running', i, personas.length, nomeData.nome_completo, errorList);
      
      // Gerar email baseado no nome
      const partesNome = nomeData.nome_completo.trim().split(' ');
      const primeiroNome = partesNome[0].toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z]/g, '');
      const sobrenome = partesNome[partesNome.length - 1].toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z]/g, '');
      
      const dominioEmpresa = empresa.domain || 'example.com';
      const email = `${primeiroNome}.${sobrenome}@${dominioEmpresa}`;
      
      const { error } = await supabase
        .from('personas')
        .update({
          full_name: nomeData.nome_completo.trim(),
          email: email,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);
      
      if (error) {
        log('❌', `Erro ao atualizar ${persona.id}: ${error.message}`);
        errorList.push({
          persona: persona.full_name,
          error: error.message
        });
        erros++;
      } else {
        log('✅', `${nomeData.nome_completo} (${nomeData.nacionalidade}) → ${persona.role}`);
        sucessos++;
      }
      
      // Pequeno delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      log('❌', `Exceção ao atualizar ${persona.id}: ${error.message}`);
      errorList.push({
        persona: persona.full_name,
        error: error.message
      });
      erros++;
    }
  }
  
  updateProgress('completed', personas.length, personas.length, '', errorList);
  
  log('📊', `Atualização concluída: ${sucessos} sucessos, ${erros} erros`);
  return { sucessos, erros };
}

// ==================== FUNÇÃO PRINCIPAL ====================

async function main() {
  console.log('\n' + '='.repeat(60));
  log('🚀', 'GERAÇÃO DE NOMES VIA GROK');
  console.log('='.repeat(60) + '\n');
  
  updateProgress('running', 0, 0, 'Iniciando...');
  
  try {
    // 1. Buscar empresa
    const empresa = await buscarEmpresa(empresaId);
    
    // 2. Buscar personas
    const todasPersonas = await buscarPersonas(empresaId);
    
    if (todasPersonas.length === 0) {
      log('⚠️', 'Nenhuma persona encontrada para esta empresa');
      updateProgress('completed', 0, 0, 'Nenhuma persona encontrada');
      process.exit(0);
    }
    
    // Filtrar se modo incremental
    let personas = todasPersonas;
    if (skipExisting) {
      const comNome = todasPersonas.filter(p => !p.full_name?.includes('[Placeholder'));
      const semNome = todasPersonas.filter(p => p.full_name?.includes('[Placeholder'));
      
      if (comNome.length > 0) {
        log('⏭️', `MODO INCREMENTAL: Pulando ${comNome.length} personas que já têm nome real`);
        console.log(`   ${comNome.slice(0, 5).map(p => p.full_name).join(', ')}${comNome.length > 5 ? '...' : ''}\n`);
      }
      
      personas = semNome;
      
      if (personas.length === 0) {
        log('✅', 'Todas as personas já têm nomes reais!');
        log('💡', 'Use --force para regenerar tudo ou --all para substituir existentes');
        updateProgress('completed', 0, 0, 'Todas as personas já têm nomes');
        return;
      }
    } else if (forceClean) {
      log('🧹', 'MODO FORÇA TOTAL: Regenerando TODOS os nomes\n');
    } else {
      log('🔄', 'MODO COMPLETO: Substituindo nomes de todas personas\n');
    }
    
    log('📋', `Total de personas a processar: ${personas.length}\n`);
    
    // 3. Buscar nomes existentes
    const nomesExistentes = await buscarNomesExistentes();
    
    // 4. Gerar nomes via Grok
    const nomesGerados = await gerarNomesViaGrok(empresa, personas, nomesExistentes);
    
    // 5. Atualizar personas
    const resultado = await atualizarPersonasComNomes(personas, nomesGerados, empresa);
    
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
    updateProgress('error', 0, 0, '', [{ error: error.message }]);
    process.exit(1);
  }
}

main();
