/**
 * Cria empresa ARVA Tech Solutions do ZERO
 * Com ID fixo e estrutura completa
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ID FIXO para ARVA Tech Solutions
const ARVA_ID = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';

const empresaData = {
  id: ARVA_ID,
  nome: 'ARVA Tech Solutions',
  segmento: 'Tecnologia e Automação Empresarial',
  porte: 'Médio Porte',
  numero_funcionarios: 15,
  missao: 'Transformar empresas através da automação inteligente e soluções tecnológicas inovadoras',
  visao: 'Ser referência em automação empresarial e inteligência artificial aplicada aos negócios',
  valores: ['Inovação', 'Excelência', 'Ética', 'Colaboração', 'Resultados'],
  descricao_atividades: 'Desenvolvimento de soluções de automação, integração de sistemas, consultoria em IA e transformação digital',
  cultura_organizacional: 'Cultura tech-forward, colaborativa, com foco em inovação contínua e desenvolvimento profissional',
  estrutura_departamental: {
    "Diretoria Executiva": {
      "descricao": "Gestão estratégica e liderança organizacional",
      "cargos": ["CEO", "COO"]
    },
    "Tecnologia e Desenvolvimento": {
      "descricao": "Desenvolvimento de soluções e inovação tecnológica",
      "cargos": ["CTO", "Tech Lead", "Desenvolvedor Full-Stack", "DevOps Engineer"]
    },
    "Produto e Inovação": {
      "descricao": "Gestão de produto e experiência do usuário",
      "cargos": ["Product Manager", "UX/UI Designer"]
    },
    "Comercial e Relacionamento": {
      "descricao": "Vendas, relacionamento com clientes e SDR",
      "cargos": ["Gerente Comercial", "SDR Sênior", "Customer Success Manager"]
    },
    "Operações e Processos": {
      "descricao": "Eficiência operacional e gestão de projetos",
      "cargos": ["Gerente de Operações", "Analista de Processos", "Coordenador de Projetos"]
    },
    "Financeiro e Administrativo": {
      "descricao": "Gestão financeira e recursos humanos",
      "cargos": ["Controller Financeiro", "Analista de RH"]
    }
  },
  scripts_status: {
    create_personas: false,
    avatares: false,
    biografias: false,
    atribuicoes: false,
    competencias: false,
    tasks_automation: false,
    workflows_n8n: false
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function createArva() {
  console.log('\n🚀 Criando empresa ARVA Tech Solutions...\n');
  console.log(`📋 ID: ${ARVA_ID}`);
  console.log(`🏢 Nome: ${empresaData.nome}`);
  console.log(`👥 Estrutura: 6 departamentos, 15 cargos definidos\n`);
  
  const { data, error } = await supabase
    .from('empresas')
    .insert([empresaData])
    .select()
    .single();
  
  if (error) {
    console.error('❌ Erro ao criar empresa:', error);
    process.exit(1);
  }
  
  console.log('✅ Empresa criada com sucesso!');
  console.log('\n📊 Estrutura departamental:');
  Object.entries(empresaData.estrutura_departamental).forEach(([dept, info]) => {
    console.log(`\n   ${dept}:`);
    console.log(`   ${info.descricao}`);
    console.log(`   Cargos: ${info.cargos.join(', ')}`);
  });
  
  console.log(`\n✅ Pronto! Use este ID em todos os scripts:`);
  console.log(`   ${ARVA_ID}\n`);
}

createArva().catch(console.error);
