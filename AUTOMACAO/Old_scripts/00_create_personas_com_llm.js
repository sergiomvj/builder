// SCRIPT 00 - CRIAÇÃO DE PERSONAS COMPLETAS COM NOMES HARDCODED
// Gera personas completas com nomes realistas baseados na distribuição de nacionalidades
// Usa listas de nomes hardcoded para evitar problemas com APIs externas

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { getNomeAleatorio, getPrimeiroNomeParaEmail, getSobrenomeParaEmail } from './lib/nomes_nacionalidades.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter diretório atual para resolver paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração - carregar .env do diretório raiz do projeto
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validar variáveis de ambiente
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não encontradas!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Encontrada' : '❌ Não encontrada');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Encontrada' : '❌ Não encontrada');
  console.error('');
  console.error('💡 Certifique-se de que o arquivo .env.local existe no diretório raiz do projeto');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Cliente Supabase criado');

console.log('🎭 SCRIPT 00 - CRIAÇÃO DE PERSONAS COMPLETAS COM NOMES HARDCODED');
console.log('====================================================================');
console.log('📝 Usa listas de nomes hardcoded baseados na nacionalidade');
console.log('📋 Fluxo correto:');
console.log('   1. Este script → cria personas completas com nomes hardcoded');
console.log('   2. Script 01.5 → atribuições contextualizadas');
console.log('   3. Script 02 → competências técnicas/comportamentais');
console.log('   4. Script 00_generate_avatares.js → gera perfis visuais');
console.log('====================================================================\n');

// Parâmetros do script
let targetEmpresaId = null;
const args = process.argv.slice(2);

for (const arg of args) {
  if (arg.startsWith('--empresaId=')) {
    targetEmpresaId = arg.split('=')[1];
  }
}

if (!targetEmpresaId && args.length > 0) {
  targetEmpresaId = args[0];
}

if (!targetEmpresaId) {
  console.error('❌ Erro: empresaId é obrigatório!');
  console.log('📝 Uso: node 00_create_personas_from_structure.js --empresaId=UUID');
  process.exit(1);
}

console.log(`🎯 Empresa alvo: ${targetEmpresaId}\n`);

/**
 * Gera nome realista baseado na nacionalidade usando listas hardcoded
 */
function gerarNomeHardcoded(nacionalidade, genero) {
  try {
    const nomeCompleto = getNomeAleatorio(nacionalidade, genero);
    console.log(`  📝 Nome gerado: ${nomeCompleto} (${nacionalidade}, ${genero})`);
    return nomeCompleto;
  } catch (error) {
    console.error(`  ❌ Erro ao gerar nome hardcoded: ${error.message}`);
    // Fallback para nomes genéricos
    return genero === 'masculino' ? 'João Silva' : 'Maria Silva';
  }
}

/**
 * Gera email baseado no nome e domínio da empresa
 */
function gerarEmail(nomeCompleto, dominioEmpresa) {
  const primeiroNome = getPrimeiroNomeParaEmail(nomeCompleto);
  const sobrenome = getSobrenomeParaEmail(nomeCompleto);

  // Usar domínio da empresa ou fallback
  const dominio = dominioEmpresa || 'empresa.com';

  return `${primeiroNome}.${sobrenome}@${dominio}`;
}

/**
 * Distribui nacionalidades proporcionalmente aos cargos
 */
function distribuirNacionalidades(cargos, nacionalidades) {
  const distribuidos = [];
  const totalCargos = cargos.length;

  // Calcular quantos de cada nacionalidade baseado nos percentuais
  const distribuicao = {};
  let cargosDistribuidos = 0;

  nacionalidades.forEach((nac, index) => {
    // Para o último, usar o que sobrar para evitar erros de arredondamento
    if (index === nacionalidades.length - 1) {
      distribuicao[nac.tipo] = totalCargos - cargosDistribuidos;
    } else {
      const quantidade = Math.round(totalCargos * nac.percentual / 100);
      distribuicao[nac.tipo] = quantidade;
      cargosDistribuidos += quantidade;
    }
  });

  // Distribuir nacionalidades aos cargos
  let cargoIndex = 0;
  for (const [nacionalidade, quantidade] of Object.entries(distribuicao)) {
    for (let i = 0; i < quantidade && cargoIndex < totalCargos; i++) {
      distribuidos.push({
        cargo: cargos[cargoIndex],
        nacionalidade: nacionalidade
      });
      cargoIndex++;
    }
  }

  // Embaralhar para não ter blocos de nacionalidades
  return distribuidos.sort(() => Math.random() - 0.5);
}

/**
 * Mapeia cargo específico para role/department/specialty
 */
function mapearCargoParaRole(cargo) {
  // Mapeamentos mais específicos baseados em palavras-chave
  const cargoLower = cargo.toLowerCase();

  if (cargoLower.includes('ceo') || cargoLower.includes('diretor') || cargoLower.includes('chief')) {
    return { role: 'CEO', department: 'Executive', specialty: 'Leadership' };
  }

  if (cargoLower.includes('vp') || cargoLower.includes('vice') || cargoLower.includes('diretor')) {
    return { role: cargo, department: 'Executive', specialty: 'Management' };
  }

  if (cargoLower.includes('gerente') || cargoLower.includes('manager') || cargoLower.includes('coordenador')) {
    return { role: cargo, department: 'Management', specialty: 'Team Leadership' };
  }

  if (cargoLower.includes('analista') || cargoLower.includes('analyst') || cargoLower.includes('especialista')) {
    return { role: cargo, department: 'Operations', specialty: 'Analysis' };
  }

  if (cargoLower.includes('desenvolvedor') || cargoLower.includes('developer') || cargoLower.includes('engenheiro')) {
    return { role: cargo, department: 'Technology', specialty: 'Development' };
  }

  if (cargoLower.includes('designer') || cargoLower.includes('design')) {
    return { role: cargo, department: 'Creative', specialty: 'Design' };
  }

  if (cargoLower.includes('vendas') || cargoLower.includes('sales') || cargoLower.includes('comercial')) {
    return { role: cargo, department: 'Sales', specialty: 'Business Development' };
  }

  if (cargoLower.includes('marketing') || cargoLower.includes('social')) {
    return { role: cargo, department: 'Marketing', specialty: 'Digital Marketing' };
  }

  if (cargoLower.includes('financeiro') || cargoLower.includes('finance') || cargoLower.includes('contador')) {
    return { role: cargo, department: 'Finance', specialty: 'Financial Planning' };
  }

  if (cargoLower.includes('rh') || cargoLower.includes('recursos') || cargoLower.includes('pessoas')) {
    return { role: cargo, department: 'HR', specialty: 'People Management' };
  }

  if (cargoLower.includes('assistente') || cargoLower.includes('assistant') || cargoLower.includes('auxiliar')) {
    return { role: cargo, department: 'Operations', specialty: 'Support' };
  }

  // Fallback genérico
  return { role: cargo, department: 'Operations', specialty: 'General' };
}

async function createPersonasComLLM() {
  try {
    // 1. Buscar empresa
    console.log('📂 Buscando dados da empresa...');
    console.log(`   ID procurado: ${targetEmpresaId}`);

    const { data: empresas, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', targetEmpresaId);

    if (empresaError) {
      console.error('Erro na query:', empresaError);
      throw new Error(`Erro ao buscar empresa: ${empresaError.message}`);
    }

    if (!empresas || empresas.length === 0) {
      console.error('Nenhuma empresa encontrada com o ID especificado');
      throw new Error(`Empresa com ID ${targetEmpresaId} não encontrada`);
    }

    const empresa = empresas[0];
    console.log(`✅ Empresa encontrada: ${empresa.nome}`);

    // 2. Verificar se empresa já tem equipe gerada
    const { count, error: countError } = await supabase
      .from('personas')
      .select('*', { count: 'exact', head: true })
      .eq('empresa_id', empresa.id);

    if (countError) {
      console.error('Erro ao verificar personas existentes:', countError);
      throw new Error(`Erro ao verificar personas existentes: ${countError.message}`);
    }

    if (count > 0) {
      console.log(`\n⚠️  Esta empresa já possui ${count} persona(s) gerada(s)!`);
      console.log('   Para regenerar, primeiro delete as personas existentes no banco ou use uma empresa diferente.');
      console.log('   Comando sugerido:');
      console.log(`   node AUTOMACAO/cleanup_empresas_orfas.js --empresaId=${empresa.id} --delete-personas`);
      return;
    }

    console.log('✅ Empresa pronta para geração de personas');

    // 3. Validar dados necessários
    if (!empresa.cargos_necessarios || empresa.cargos_necessarios.length === 0) {
      throw new Error('Empresa não possui cargos_necessarios definidos. Use o form de criação de empresa para gerar a estrutura organizacional.');
    }

    if (!empresa.nationalities || empresa.nationalities.length === 0) {
      throw new Error('Empresa não possui nacionalidades definidas');
    }

    if (!empresa.idiomas || empresa.idiomas.length === 0) {
      throw new Error('Empresa não possui idiomas definidos');
    }

    const cargos = empresa.cargos_necessarios;
    const nacionalidades = empresa.nationalities;
    const idiomas = empresa.idiomas;

    console.log(`\n📋 Estrutura definida:`);
    console.log(`   Cargos: ${cargos.length} posições (gerados pela IA)`);
    console.log(`   Nacionalidades:`);
    nacionalidades.forEach(n => {
      console.log(`     - ${n.tipo}: ${n.percentual}%`);
    });
    console.log(`   Idiomas: ${idiomas.join(', ')}`);

    // 4. Distribuir nacionalidades pelos cargos
    console.log('\n🌍 Distribuindo nacionalidades...');
    const distribuicao = distribuirNacionalidades(cargos, nacionalidades);

    console.log(`✅ Distribuição criada:`);
    const contagem = {};
    distribuicao.forEach(d => {
      contagem[d.nacionalidade] = (contagem[d.nacionalidade] || 0) + 1;
    });
    Object.entries(contagem).forEach(([nac, count]) => {
      console.log(`   ${nac}: ${count} personas (${Math.round(count/cargos.length*100)}%)`);
    });

    // 5. Criar personas completas com nomes hardcoded
    console.log('\n📝 Criando personas completas com nomes hardcoded...');
    console.log('   ⚠️  Gerando nomes realistas baseados na nacionalidade');
    console.log('   ⚠️  Este processo é rápido e confiável...\n');

    const personas = [];

    for (let i = 0; i < distribuicao.length; i++) {
      const { cargo, nacionalidade } = distribuicao[i];

      // Mapear cargo para role/department/specialty
      const cargoInfo = mapearCargoParaRole(cargo);

      // Gerar gênero aleatório (50/50)
      const genero = Math.random() > 0.5 ? 'masculino' : 'feminino';

      console.log(`  [${i+1}/${distribuicao.length}] ${cargo} (${nacionalidade})`);

      // Gerar nome usando listas hardcoded
      const nomeCompleto = gerarNomeHardcoded(nacionalidade, genero);

      // Gerar email
      const email = gerarEmail(nomeCompleto, empresa.dominio);

      // Criar persona completa
      const persona = {
        persona_code: `${empresa.codigo}-P${String(i+1).padStart(3, '0')}`,
        empresa_id: empresa.id,
        full_name: nomeCompleto,
        email: email,
        genero: genero,
        role: cargoInfo.role,
        department: cargoInfo.department,
        specialty: cargoInfo.specialty,
        nacionalidade: nacionalidade,
        idiomas: idiomas, // Idiomas da empresa
        experiencia_anos: null, // Será preenchido pelo script de biografias
        biografia_completa: null, // Será preenchido pelo script de biografias
        personalidade: null, // Será preenchido pelo script de biografias
        system_prompt: null // Será preenchido pelo script de avatares
      };

      personas.push(persona);
    }

    // 6. Inserir personas no banco
    console.log('\n💾 Salvando personas completas no banco de dados...');
    const { data: personasInseridas, error: insertError } = await supabase
      .from('personas')
      .insert(personas)
      .select();

    if (insertError) {
      throw new Error(`Erro ao inserir personas: ${insertError.message}`);
    }

    console.log(`✅ ${personasInseridas.length} personas criadas com sucesso!`);

    // 7. Atualizar status do script na empresa
    const { error: updateError } = supabase
      .from('empresas')
      .update({
        equipe_gerada: true,
        scripts_status: {
          ...empresa.scripts_status,
          create_personas: true
        }
      })
      .eq('id', empresa.id);

    if (updateError) {
      console.warn(`⚠️  Aviso: não foi possível atualizar scripts_status: ${updateError.message}`);
    }

    // 8. Salvar JSON de backup
    const outputDir = path.join(process.cwd(), '04_BIOS_PERSONAS_REAL');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `personas_completas_${empresa.codigo}_${Date.now()}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        codigo: empresa.codigo,
        industria: empresa.industria,
        idiomas: empresa.idiomas
      },
      personas: personasInseridas,
      distribuicao_nacionalidades: contagem,
      timestamp: new Date().toISOString(),
      metodo_geracao: 'hardcoded_lists',
      nota: 'Personas completas com nomes de listas hardcoded baseadas na nacionalidade. Próximos passos: scripts 01.5, 02, 00_generate_avatares.js'
    }, null, 2));

    console.log(`📁 Backup salvo: ${path.basename(outputFile)}`);

    // 9. Relatório final
    console.log('\n📊 RELATÓRIO FINAL');
    console.log('==================');
    console.log(`✅ Empresa: ${empresa.nome}`);
    console.log(`✅ Personas criadas: ${personasInseridas.length}`);
    console.log(`✅ Método: Nomes de listas hardcoded`);
    console.log(`✅ Nacionalidades distribuídas:`);
    Object.entries(contagem).forEach(([nac, count]) => {
      console.log(`   ${nac}: ${count} personas`);
    });
    console.log(`✅ Idiomas configurados: ${idiomas.join(', ')}`);

    console.log('\n🎉 PERSONAS COMPLETAS CRIADAS COM SUCESSO!');
    console.log('\n⚠️  PRÓXIMOS PASSOS (NA ORDEM):');
    console.log('   1. node AUTOMACAO/01.5_generate_atribuicoes_contextualizadas.cjs --empresaId=' + empresa.id);
    console.log('   2. node AUTOMACAO/02_generate_competencias_grok.cjs --empresaId=' + empresa.id);
    console.log('   3. node AUTOMACAO/00_generate_avatares.js --empresaId=' + empresa.id);
    console.log('      ↑ ESTE gera perfis visuais via API (opcional)');
    console.log('   4. node AUTOMACAO/01_generate_biografias_REAL_FIXED.js --empresaId=' + empresa.id);
    console.log('   5. Continue com scripts 03-06');

  } catch (error) {
    console.error('\n❌ Erro crítico:', error.message);
    process.exit(1);
  }
}

createPersonasComLLM();