/**
 * Script para gerar personas básicas se não existirem
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const personasBasicas = [
  {
    persona_code: 'CEO001',
    full_name: 'Sarah Johnson',
    role: 'Chief Executive Officer (CEO)',
    specialty: 'Strategic Leadership',
    department: 'Executive',
    email: 'sarah.johnson@arvatech.com',
    whatsapp: '+55-11-99999-0001',
    status: 'active'
  },
  {
    persona_code: 'CTO001', 
    full_name: 'Michael Rodriguez',
    role: 'Chief Technology Officer (CTO)',
    specialty: 'Technology Strategy',
    department: 'Technology',
    email: 'michael.rodriguez@arvatech.com',
    whatsapp: '+55-11-99999-0002',
    status: 'active'
  },
  {
    persona_code: 'CFO001',
    full_name: 'Jennifer Chen',
    role: 'Chief Financial Officer (CFO)', 
    specialty: 'Financial Management',
    department: 'Finance',
    email: 'jennifer.chen@arvatech.com',
    whatsapp: '+55-11-99999-0003',
    status: 'active'
  },
  {
    persona_code: 'MKTMGR001',
    full_name: 'David Thompson',
    role: 'Marketing Manager',
    specialty: 'Digital Marketing',
    department: 'Marketing',
    email: 'david.thompson@arvatech.com',
    whatsapp: '+55-11-99999-0004',
    status: 'active'
  },
  {
    persona_code: 'SDRMGR001',
    full_name: 'Lisa Park',
    role: 'SDR Manager',
    specialty: 'Sales Development',
    department: 'Sales',
    email: 'lisa.park@arvatech.com',
    whatsapp: '+55-11-99999-0005',
    status: 'active'
  }
];

async function garantirPersonas() {
  try {
    console.log('🔍 Verificando empresas disponíveis...');
    
    // Buscar empresa ativa
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id, nome, codigo')
      .eq('status', 'ativa')
      .limit(1);
    
    if (!empresas || empresas.length === 0) {
      console.error('❌ Nenhuma empresa ativa encontrada');
      return;
    }
    
    const empresa = empresas[0];
    console.log(`✅ Empresa encontrada: ${empresa.nome} (${empresa.codigo})`);
    
    // Verificar personas existentes
    const { data: personasExistentes } = await supabase
      .from('personas')
      .select('id, full_name')
      .eq('empresa_id', empresa.id);
    
    console.log(`📊 Personas existentes: ${personasExistentes?.length || 0}`);
    
    if (personasExistentes && personasExistentes.length >= 5) {
      console.log('✅ Já existem personas suficientes');
      return;
    }

    // Gerar domínio baseado no domínio real da empresa ARVA Tech
    const dominio = 'arvabot.com';  // Domínio correto da ARVA Tech
    console.log(`📧 Usando domínio: ${dominio}`);

    // Atualizar emails das personas básicas com domínio correto
    const personasComDominioCorreto = personasBasicas.map(persona => ({
      ...persona,
      email: persona.email.replace('@arvatech.com', `@${dominio}`),
      empresa_id: empresa.id
    }));
    console.log('🔄 Criando personas básicas...');
    
    // Criar personas básicas com domínio correto
    const personasParaCriar = personasComDominioCorreto.map(persona => ({
      ...persona,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      biografia_completa: `${persona.full_name} é um profissional experiente na área de ${persona.department}.`,
      personalidade: {
        idade: Math.floor(Math.random() * 15) + 30,
        temperamento: 'profissional',
        estilo_comunicacao: 'assertivo'
      },
      experiencia_anos: Math.floor(Math.random() * 10) + 5,
      ia_config: {
        model: 'gpt-4',
        temperature: 0.7
      },
      temperatura_ia: 0.7,
      max_tokens: 2000,
      system_prompt: `Você é ${persona.full_name}, ${persona.role} da ${empresa.nome}.`,
      idiomas: ['português', 'inglês']
    }));
    
    const { data: novasPersonas, error } = await supabase
      .from('personas')
      .insert(personasParaCriar)
      .select();
    
    if (error) {
      console.error('❌ Erro ao criar personas:', error);
      return;
    }
    
    console.log(`✅ ${novasPersonas?.length || 0} personas criadas com sucesso!`);
    
    // Listar personas criadas
    novasPersonas?.forEach((persona, index) => {
      console.log(`${index + 1}. ${persona.full_name} - ${persona.role}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

console.log('🚀 Iniciando verificação e criação de personas...\n');
garantirPersonas().then(() => {
  console.log('\n✅ Processo concluído!');
}).catch(console.error);