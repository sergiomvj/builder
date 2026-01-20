// ============================================================================
// SCRIPT 01 - CRIAÇÃO INTELIGENTE DA ESTRUTURA ORGANIZACIONAL VIA LLM
// ============================================================================
// ORDEM CORRETA: Executar PRIMEIRO (antes de todos os outros)
// Usa LLM para analisar empresa e gerar cargos contextualizados
//
// DESCRIÇÃO:
// - Analisa contexto da empresa (tipo, tamanho, indústria, objetivos)
// - Gera estrutura organizacional completa com cargos específicos
// - Define responsabilidades básicas por departamento
// - Salva cargos_necessarios na tabela empresas
// - Cria placeholders das posições (não personas ainda)
//
// Uso:
//   node 01_create_personas_from_structure.js --empresaId=UUID
//
// Output LLM:
//   JSON com estrutura organizacional completa e cargos contextualizados
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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const OUTPUT_DIR = path.join(__dirname, 'estrutura_organizacional_output');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🏗️  SCRIPT 01 - CRIAÇÃO INTELIGENTE DA ESTRUTURA ORGANIZACIONAL VIA LLM');
console.log('========================================================================');
console.log('🤖 Usa LLM para gerar cargos contextualizados com a empresa');
console.log('========================================================================\n');

async function updateScriptStatus(empresaId, scriptNome, status, errorMessage = null) {
  await supabase
    .from('empresas_scripts_status')
    .upsert({
      empresa_id: empresaId,
      script_nome: scriptNome,
      status,
      started_at: status === 'running' ? new Date().toISOString() : undefined,
      finished_at: ['success', 'error'].includes(status) ? new Date().toISOString() : undefined,
      error_message: errorMessage
    }, { onConflict: 'empresa_id,script_nome' });
}

/**
 * Gera estrutura organizacional via LLM
 */
async function gerarEstruturaOrganizacional(empresa) {
  console.log(`  🤖 Gerando estrutura organizacional via LLM para ${empresa.nome}...`);

  // Testar LLMs disponíveis
  const activeLLM = await testLLMs();
  if (!activeLLM) {
    throw new Error('Nenhum LLM disponível para gerar estrutura organizacional');
  }

  // Prompt para gerar estrutura organizacional
  const prompt = `
Analise a empresa e crie uma estrutura organizacional simples com 8-12 cargos.

EMPRESA: ${empresa.nome} - ${empresa.industria || 'Tecnologia'}

FORMATO JSON:
{
  "cargos_necessarios": ["CEO", "CTO", "Desenvolvedor Senior", "Designer", "Gerente de Vendas"],
  "metadata": {
    "gerado_em": "${new Date().toISOString()}",
    "metodo": "llm_analysis"
  }
}

Retorne apenas JSON válido, sem texto extra.
`;

  try {
    const response = await generateWithFallback(activeLLM, prompt, {
      temperature: 0.7,
      maxTokens: 4000
    });

    console.log('  📄 Resposta LLM recebida, processando...');

    // DEBUG: Salvar resposta raw
    fs.writeFileSync(path.join(__dirname, 'debug_llm_response.json'), response);

    // Limpar resposta (remover markdown se presente)
    let cleanResponse = response.trim();
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
    }

    // Parse JSON
    const estrutura = JSON.parse(cleanResponse);

    // Validações básicas
    if (!estrutura.cargos_necessarios || !Array.isArray(estrutura.cargos_necessarios)) {
      throw new Error('JSON gerado não contém lista de cargos válida');
    }

    if (estrutura.cargos_necessarios.length === 0) {
      throw new Error('Lista de cargos necessários está vazia');
    }

    console.log(`  ✅ Estrutura gerada via LLM: ${estrutura.cargos_necessarios.length} cargos`);

    return estrutura;

  } catch (error) {
    console.error('  ❌ Erro ao gerar estrutura via LLM:', error.message);
    throw error;
  }
}

/**
 * Infere departamento a partir do nome do cargo
 */
function inferDepartmentFromCargo(cargo) {
  const cargoLower = cargo.toLowerCase();
  if (cargoLower.includes('ceo') || cargoLower.includes('cto') || cargoLower.includes('diretor')) return 'Executivo';
  if (cargoLower.includes('desenvolvedor') || cargoLower.includes('engenharia') || cargoLower.includes('engineer')) return 'Engenharia';
  if (cargoLower.includes('designer') || cargoLower.includes('ux') || cargoLower.includes('ui')) return 'Design';
  if (cargoLower.includes('vendas') || cargoLower.includes('comercial') || cargoLower.includes('sales')) return 'Vendas';
  if (cargoLower.includes('marketing')) return 'Marketing';
  if (cargoLower.includes('produto') || cargoLower.includes('product')) return 'Produto';
  if (cargoLower.includes('financeiro') || cargoLower.includes('finance')) return 'Financeiro';
  if (cargoLower.includes('recursos humanos') || cargoLower.includes('rh') || cargoLower.includes('hr')) return 'RH';
  if (cargoLower.includes('operações') || cargoLower.includes('operations')) return 'Operações';
  return 'Geral';
}

/**
 * Salva estrutura organizacional no banco
 */
async function salvarEstruturaOrganizacional(empresaId, estrutura) {
  console.log('  💾 Salvando estrutura organizacional...');

  const { error } = await supabase
    .from('empresas')
    .update({
      cargos_necessarios: estrutura.cargos_necessarios,
      equipe_gerada: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', empresaId);

  if (error) {
    console.error('    ❌ Erro ao salvar estrutura:', error.message);
    return false;
  }

  console.log('  ✅ Estrutura organizacional salva!');
  return true;
}

/**
 * Cria placeholders das posições organizacionais
 */
async function criarPlaceholdersPosicoes(empresa, estrutura) {
  console.log('  👥 Criando placeholders das posições...');

  // Distribuir nacionalidades entre os cargos
  const distribuicaoNacionalidades = distribuirNacionalidades(
    estrutura.cargos_necessarios,
    empresa.nationalities || [{ tipo: 'brasileiros', percentual: 100 }]
  );

  console.log(`  🌍 Distribuição de nacionalidades aplicada: ${empresa.nationalities?.length || 1} tipos`);

  const placeholders = [];

  // Para cada cargo necessário, criar um placeholder com nacionalidade
  for (let i = 0; i < estrutura.cargos_necessarios.length; i++) {
    const cargo = estrutura.cargos_necessarios[i];
    const nacionalidadeInfo = distribuicaoNacionalidades[i];

    const placeholder = {
      persona_code: `${empresa.codigo}-POS${String(i+1).padStart(3, '0')}`,
      empresa_id: empresa.id,
      role: cargo,
      department: inferDepartmentFromCargo(cargo),
      specialty: cargo,
      nacionalidade: nacionalidadeInfo?.nacionalidade || 'brasileiros',
      status: 'active',
      full_name: '[POSIÇÃO VAGA]',
      email: `pos${i+1}@${empresa.dominio || 'empresa.com'}`
    };

    placeholders.push(placeholder);
  }

  // Só insere placeholder se não existe persona real para o persona_code
  let createdCount = 0;
  for (const placeholder of placeholders) {
    // Verifica se já existe persona real para este persona_code
    const { data: existing, error: fetchError } = await supabase
      .from('personas')
      .select('id, full_name, email')
      .eq('persona_code', placeholder.persona_code)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('    ❌ Erro ao buscar persona existente:', fetchError.message);
      continue;
    }

    // Se existe e já tem nome real ou email, não sobrescrever
    if (existing && existing.full_name && !existing.full_name.startsWith('[POSIÇÃO VAGA]') && existing.email) {
      // Não sobrescreve persona real
      continue;
    }

    // Se não existe ou é placeholder, insere/atualiza
    const { error: upsertError } = await supabase
      .from('personas')
      .upsert([placeholder], {
        onConflict: 'persona_code',
        ignoreDuplicates: false
      });
    if (upsertError) {
      console.error('    ❌ Erro ao criar/atualizar placeholder:', upsertError.message);
      continue;
    }
    createdCount++;
  }
  console.log(`  ✅ ${createdCount} posições criadas/atualizadas como placeholders com nacionalidades (sem sobrescrever nomes reais)`);
  
  // Atualizar flag equipe_gerada
  await supabase
    .from('empresas')
    .update({ 
      equipe_gerada: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', empresa.id);
  
  console.log('  ✅ Flag equipe_gerada atualizada!');
  return true;
}

/**
 * Função principal
 */
async function criarEstruturaOrganizacional() {
  const args = process.argv.slice(2);
  let empresaId = null;

  for (const arg of args) {
    if (arg.startsWith('--empresaId=')) {
      empresaId = arg.split('=')[1];
    }
  }

  const scriptNome = '01_create_personas_from_structure';
  try {
    if (!empresaId) {
      await updateScriptStatus(null, scriptNome, 'error', '--empresaId não fornecido');
      console.error('❌ --empresaId não fornecido');
      console.log('💡 Uso: node 01_create_personas_from_structure.js --empresaId=ID');
      process.exit(1);
    }

    await updateScriptStatus(empresaId, scriptNome, 'running');

    // Testar LLMs disponíveis
    const activeLLM = await testLLMs();
    if (!activeLLM) {
      await updateScriptStatus(empresaId, scriptNome, 'error', 'Nenhum LLM disponível para gerar estrutura organizacional');
      console.error('❌ Nenhum LLM disponível para gerar estrutura organizacional');
      process.exit(1);
    }

    console.log(`🏢 Empresa ID: ${empresaId}\n`);

    // Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError) {
      await updateScriptStatus(empresaId, scriptNome, 'error', 'Empresa não encontrada: ' + empresaError.message);
      console.error('❌ Empresa não encontrada:', empresaError.message);
      process.exit(1);
    }

    console.log(`✅ Empresa: ${empresa.nome}`);
    console.log(`📋 Tipo: ${empresa.tipo || 'Não definido'}`);
    console.log(`🏭 Indústria: ${empresa.industria || 'Não definida'}\n`);

    // Verificar se já criou placeholders (equipe_gerada = true)
    if (empresa.equipe_gerada === true) {
      await updateScriptStatus(empresaId, scriptNome, 'success');
      console.log('⚠️  Placeholders já foram criados (equipe_gerada = true)!');
      console.log('💡 Continue com o próximo script (02_generate_biografias_COMPLETO.js)\n');
      return;
    }

    // Se tem cargos_necessarios mas não criou placeholders, criar
    let estrutura;
    if (empresa.cargos_necessarios && empresa.cargos_necessarios.length > 0) {
      console.log('📋 Empresa já possui cargos_necessarios do frontend');
      console.log(`   Total de cargos: ${empresa.cargos_necessarios.length}\n`);
      estrutura = { cargos_necessarios: empresa.cargos_necessarios };
    } else {
      // Gerar estrutura via LLM
      console.log('🤖 Gerando estrutura organizacional via LLM...\n');
      estrutura = await gerarEstruturaOrganizacional(empresa);
      if (!estrutura) {
        await updateScriptStatus(empresaId, scriptNome, 'error', 'Falha ao gerar estrutura organizacional');
        console.error('❌ Falha ao gerar estrutura organizacional');
        process.exit(1);
      }

      // Salvar estrutura no banco
      const saved = await salvarEstruturaOrganizacional(empresaId, estrutura);
      if (!saved) {
        await updateScriptStatus(empresaId, scriptNome, 'error', 'Falha ao salvar estrutura');
        console.error('❌ Falha ao salvar estrutura');
        process.exit(1);
      }
    }

    // Criar placeholders das posições
    const placeholdersCreated = await criarPlaceholdersPosicoes(empresa, estrutura);
    if (!placeholdersCreated) {
      await updateScriptStatus(empresaId, scriptNome, 'error', 'Falha ao criar placeholders');
      console.error('❌ Falha ao criar placeholders');
      process.exit(1);
    }

    // Salvar relatório
    const reportPath = path.join(OUTPUT_DIR, `estrutura_${empresa.codigo}_${new Date().toISOString().split('T')[0]}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        tipo: empresa.tipo,
        industria: empresa.industria
      },
      estrutura_gerada: estrutura,
      placeholders_criados: estrutura.cargos_necessarios.length,
      timestamp: new Date().toISOString()
    }, null, 2));

    // Relatório final
    console.log('\n📊 ESTRUTURA ORGANIZACIONAL CRIADA');
    console.log('=====================================');
    console.log(`🏢 Empresa: ${empresa.nome}`);
    console.log(`📋 Cargos gerados: ${estrutura.cargos_necessarios.length}`);
    console.log(`👥 Placeholders criados: ${estrutura.cargos_necessarios.length}`);
    console.log(`💾 Arquivo salvo: ${path.basename(reportPath)}`);
    console.log('=====================================');

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Script 02: Gerar biografias e dados pessoais');
    console.log('2. Script 03: Definir atribuições específicas');
    console.log('3. Script 04: Estabelecer competências e KPIs');
    console.log('4. Continuar com os demais scripts...\n');

    console.log('✅ ESTRUTURA ORGANIZACIONAL CONCLUÍDA!');

    await updateScriptStatus(empresaId, scriptNome, 'success');
  } catch (error) {
    await updateScriptStatus(empresaId, scriptNome, 'error', error.message);
    console.error('❌ Erro crítico:', error.message);
    process.exit(1);
  }
}

criarEstruturaOrganizacional();
