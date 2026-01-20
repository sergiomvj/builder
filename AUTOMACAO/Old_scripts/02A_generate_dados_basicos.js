// ============================================================================
// SCRIPT 02A - GERAÇÃO DE DADOS PESSOAIS BÁSICOS
// ============================================================================
// ORDEM CORRETA: Executar APÓS Script 01 (placeholders criados)
//
// Este script:
// 1. Gera NOMES REAIS baseados na nacionalidade
// 2. Define GÊNERO (masculino/feminino)
// 3. Gera EMAILS com domínio da empresa
// 4. Calcula EXPERIÊNCIA (anos) baseada no cargo
// 5. Salva apenas em personas (dados básicos)
//
// PRÓXIMO: Script 02B para biografias
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { getNomeAleatorio, getPrimeiroNomeParaEmail, getSobrenomeParaEmail } from './lib/nomes_nacionalidades.js';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🚀 SCRIPT 02A - GERAÇÃO DE DADOS PESSOAIS BÁSICOS');
console.log('==================================================');
console.log('📝 Este script gera APENAS:');
console.log('   - Nome real baseado na nacionalidade');
console.log('   - Gênero (masculino/feminino)');
console.log('   - Email com domínio da empresa');
console.log('   - Experiência (anos) baseada no cargo');
console.log('==================================================\n');

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
  console.log('📝 Uso: node 02A_generate_dados_basicos.js --empresaId=UUID');
  process.exit(1);
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Calcula experiência em anos baseado no cargo
 */
function calcularExperiencia(cargo) {
  const mapeamento = {
    'CEO': { min: 10, max: 15 },
    'CTO': { min: 8, max: 15 },
    'CFO': { min: 8, max: 15 },
    'CMO': { min: 7, max: 12 },
    'COO': { min: 8, max: 14 },
    'VP': { min: 8, max: 12 },
    'Director': { min: 7, max: 12 },
    'Head': { min: 6, max: 10 },
    'Manager': { min: 5, max: 10 },
    'Senior': { min: 5, max: 10 },
    'Lead': { min: 4, max: 8 },
    'Specialist': { min: 3, max: 8 },
    'Pleno': { min: 3, max: 7 },
    'Junior': { min: 1, max: 3 },
    'Assistant': { min: 1, max: 4 }
  };

  for (const [key, range] of Object.entries(mapeamento)) {
    if (cargo.includes(key)) {
      return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
    }
  }

  return Math.floor(Math.random() * 6) + 3; // Default: 3-8 anos
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function generateDadosBasicos() {
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

    console.log(`✅ Empresa: ${empresa.nome}`);
    console.log(`   Domínio: ${empresa.dominio || empresa.codigo + '.com'}\n`);

    // 2. Buscar personas sem dados básicos
    console.log('2️⃣ Buscando personas sem dados básicos...\n');

    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*')
      .eq('empresa_id', empresa.id);

    if (personasError || !personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      process.exit(0);
    }

    // Filtrar personas que ainda não têm dados básicos
    const personasSemDados = personas.filter(p =>
      !p.full_name ||
      !p.email ||
      !p.genero ||
      p.experiencia_anos === null
    );

    if (personasSemDados.length === 0) {
      console.log('✅ Todas as personas já têm dados básicos!');
      process.exit(0);
    }

    console.log(`📊 ${personasSemDados.length} personas sem dados básicos encontradas\n`);

    // 3. Processar cada persona
    let sucessos = 0;
    let erros = 0;
    const dominio = empresa.dominio || `${empresa.codigo.toLowerCase()}.com`;

    for (let i = 0; i < personasSemDados.length; i++) {
      const persona = personasSemDados[i];
      console.log(`\n[${i + 1}/${personasSemDados.length}] Processando ${persona.role}...`);

      try {
        // 3.1 Gerar nome baseado na nacionalidade
        const genero = Math.random() > 0.5 ? 'masculino' : 'feminino';
        const nomeCompleto = getNomeAleatorio(persona.nacionalidade, genero);
        console.log(`  👤 Nome gerado: ${nomeCompleto} (${persona.nacionalidade}, ${genero})`);

        // 3.2 Gerar email
        const primeiroNome = getPrimeiroNomeParaEmail(nomeCompleto);
        const sobrenome = getSobrenomeParaEmail(nomeCompleto);
        const email = `${primeiroNome}.${sobrenome}@${dominio}`.toLowerCase();
        console.log(`  📧 Email: ${email}`);

        // 3.3 Calcular experiência
        const experiencia = calcularExperiencia(persona.role);
        console.log(`  💼 Experiência: ${experiencia} anos`);

        // 3.4 Atualizar persona com dados básicos
        const { error: updateError } = await supabase
          .from('personas')
          .update({
            full_name: nomeCompleto,
            email: email,
            genero: genero,
            experiencia_anos: experiencia
          })
          .eq('id', persona.id);

        if (updateError) {
          console.error(`  ❌ Erro ao atualizar persona: ${updateError.message}`);
          erros++;
          continue;
        }

        console.log(`  ✅ Dados básicos salvos!`);
        sucessos++;

      } catch (error) {
        console.error(`  ❌ Erro ao processar persona: ${error.message}`);
        erros++;
      }
    }

    // 4. Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL - DADOS BÁSICOS');
    console.log('='.repeat(60));
    console.log(`✅ Dados básicos gerados: ${sucessos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📈 Taxa de sucesso: ${((sucessos / personasSemDados.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (sucessos > 0) {
      console.log('\n🎉 SCRIPT 02A CONCLUÍDO COM SUCESSO!');
      console.log('\n📝 PRÓXIMO PASSO:');
      console.log(`   node 02B_generate_biografias_llm.js --empresaId=${empresa.id}`);
    }

  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  }
}

generateDadosBasicos();