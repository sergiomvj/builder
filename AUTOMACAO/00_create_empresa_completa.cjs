#!/usr/bin/env node

/**
 * Script para criar uma empresa completa do zero no VCM
 * Uso: node 00_create_empresa_completa.cjs --nome="Nome da Empresa" --setor="Tecnologia"
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de ter NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Estrutura organizacional padrão para empresas de tecnologia
const ESTRUTURA_PADRAO = {
  'CEO': 1,
  'CTO': 1,
  'CFO': 1,
  'CMO': 1,
  'COO': 1,
  'Gerente de Produto': 2,
  'Gerente de Marketing': 2,
  'Gerente de Vendas': 2,
  'Gerente Financeiro': 1,
  'Gerente de Operações': 2,
  'Desenvolvedor Full Stack': 4,
  'Desenvolvedor Frontend': 2,
  'Desenvolvedor Backend': 2,
  'Designer UI/UX': 2,
  'Analista de Dados': 2,
  'Especialista em Marketing Digital': 2,
  'Analista de SEO/SEM': 1,
  'Gerente de Conteúdo': 1,
  'Executivo de Vendas': 3,
  'Coordenador de Vendas': 1,
  'Analista Financeiro': 2,
  'Contador': 1,
  'Coordenador de Operações': 1,
  'Analista de Qualidade': 2
};

// Parse argumentos da linha de comando
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  
  args.forEach(arg => {
    const match = arg.match(/--(\w+)=(.+)/);
    if (match) {
      params[match[1]] = match[2].replace(/"/g, '');
    }
  });
  
  return params;
}

async function criarEmpresa(nome, setor, descricao) {
  console.log('\n🏢 Criando empresa no banco de dados...\n');
  
  // Gerar código único baseado no nome
  const codigo = nome.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) + Date.now().toString().slice(-4);
  
  const empresaData = {
    codigo,
    nome,
    industria: setor || 'Tecnologia',
    descricao: descricao || `${nome} - Empresa de ${setor || 'Tecnologia'}`,
    status: 'ativa',
    pais: 'Brasil',
    idiomas: ['pt-BR', 'en-US'],
    cargos_necessarios: ESTRUTURA_PADRAO,
    total_personas: Object.values(ESTRUTURA_PADRAO).reduce((a, b) => a + b, 0),
    equipe_gerada: false,
    scripts_status: {
      '01_create_personas': 'pending',
      '02_generate_biografias': 'pending',
      '03_generate_atribuicoes': 'pending',
      '04_generate_competencias': 'pending',
      '05_generate_avatares': 'pending',
      '06_analyze_automation': 'pending',
      '06.5_generate_communications': 'pending',
      '07_generate_workflows': 'pending',
      '07.5_generate_supervision': 'pending',
      '08_generate_ml': 'pending',
      '09_generate_auditoria': 'pending'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: empresa, error } = await supabase
    .from('empresas')
    .insert(empresaData)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao criar empresa:', error);
    throw error;
  }

  console.log('✅ Empresa criada com sucesso!');
  console.log(`   ID: ${empresa.id}`);
  console.log(`   Código: ${empresa.codigo}`);
  console.log(`   Nome: ${empresa.nome}`);
  console.log(`   Indústria: ${empresa.industria}`);
  console.log(`   Total de cargos: ${empresa.total_personas} personas`);
  
  return empresa;
}

async function main() {
  const args = parseArgs();
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('       🏢 CRIAÇÃO DE EMPRESA COMPLETA NO VCM 🏢');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Validar parâmetros
  if (!args.nome) {
    console.log('📋 Uso:');
    console.log('   node 00_create_empresa_completa.cjs --nome="Nome da Empresa" --setor="Tecnologia" --descricao="Descrição"');
    console.log('\n📝 Exemplo:');
    console.log('   node 00_create_empresa_completa.cjs --nome="TechCorp Solutions" --setor="Tecnologia da Informação"\n');
    process.exit(1);
  }

  try {
    // Criar empresa
    const empresa = await criarEmpresa(
      args.nome,
      args.setor || 'Tecnologia',
      args.descricao
    );

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                  ✅ EMPRESA CRIADA COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎯 PRÓXIMOS PASSOS:\n');
    console.log('1️⃣  Criar personas (placeholders):');
    console.log(`   cd AUTOMACAO; node 01_create_personas_from_structure.js --empresaId=${empresa.id}\n`);
    
    console.log('2️⃣  Gerar biografias completas:');
    console.log(`   node 02_generate_biografias_COMPLETO.js --empresaId=${empresa.id}\n`);
    
    console.log('3️⃣  Gerar atribuições contextualizadas:');
    console.log(`   node 03_generate_atribuicoes_contextualizadas.cjs --empresaId=${empresa.id}\n`);
    
    console.log('4️⃣  Gerar competências e metas:');
    console.log(`   node 04_generate_competencias_grok.cjs --empresaId=${empresa.id}\n`);
    
    console.log('5️⃣  Gerar avatares visuais:');
    console.log(`   node 05_generate_avatares.js --empresaId=${empresa.id}\n`);
    
    console.log('6️⃣  Análise de automação:');
    console.log(`   node 06_analyze_tasks_for_automation.js --empresaId=${empresa.id}\n`);
    
    console.log('7️⃣  Matriz de comunicação (LLM):');
    console.log(`   node 06.5_generate_communication_matrix.js --empresaId=${empresa.id}\n`);
    
    console.log('8️⃣  Cadeias de supervisão:');
    console.log(`   node 07.5_generate_supervision_chains.js --empresaId=${empresa.id}\n`);
    
    console.log('9️⃣  Workflows N8N:');
    console.log(`   node 07_generate_n8n_workflows.js --empresaId=${empresa.id}\n`);
    
    console.log('🔟 Modelos de Machine Learning:');
    console.log(`   node 08_generate_machine_learning.js --empresaId=${empresa.id}\n`);
    
    console.log('1️⃣1️⃣  Auditoria completa:');
    console.log(`   node 09_generate_auditoria.js --empresaId=${empresa.id}\n`);

    console.log('💡 DICA: Execute todos os scripts em sequência ou use o script master (se disponível)\n');

    // Salvar informações em arquivo
    const outputDir = path.join(__dirname, 'empresas_criadas');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `${empresa.id}_${empresa.nome.replace(/\s+/g, '_')}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({
      empresa,
      estrutura: ESTRUTURA_PADRAO,
      comandos: {
        '01': `node 01_create_personas_from_structure.js --empresaId=${empresa.id}`,
        '02': `node 02_generate_biografias_COMPLETO.js --empresaId=${empresa.id}`,
        '03': `node 03_generate_atribuicoes_contextualizadas.cjs --empresaId=${empresa.id}`,
        '04': `node 04_generate_competencias_grok.cjs --empresaId=${empresa.id}`,
        '05': `node 05_generate_avatares.js --empresaId=${empresa.id}`,
        '06': `node 06_analyze_tasks_for_automation.js --empresaId=${empresa.id}`,
        '06.5': `node 06.5_generate_communication_matrix.js --empresaId=${empresa.id}`,
        '07.5': `node 07.5_generate_supervision_chains.js --empresaId=${empresa.id}`,
        '07': `node 07_generate_n8n_workflows.js --empresaId=${empresa.id}`,
        '08': `node 08_generate_machine_learning.js --empresaId=${empresa.id}`,
        '09': `node 09_generate_auditoria.js --empresaId=${empresa.id}`
      },
      created_at: new Date().toISOString()
    }, null, 2));

    console.log(`📄 Informações salvas em: ${outputFile}\n`);

  } catch (error) {
    console.error('\n❌ Erro durante a criação:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
