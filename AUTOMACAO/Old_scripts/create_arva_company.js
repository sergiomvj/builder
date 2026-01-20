// SCRIPT PARA CRIAR EMPRESA ARVA TECH SOLUTIONS
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createArvaCompany() {
  try {
    console.log('🚀 Criando empresa ARVA Tech Solutions...\n');

    const empresaData = {
      id: '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17',
      nome: 'ARVA Tech Solutions',
      codigo: 'ARVA',
      industria: 'Tecnologia da Informação',
      pais: 'Brasil',
      descricao: 'Empresa especializada em soluções tecnológicas inovadoras, focada em desenvolvimento de software, consultoria em TI e transformação digital para empresas de diversos setores.',
      dominio: 'arvabot.com',
      nacionalidades: [
        { pais: 'Brasil', porcentagem: 40 },
        { pais: 'Portugal', porcentagem: 15 },
        { pais: 'Espanha', porcentagem: 10 },
        { pais: 'Estados Unidos', porcentagem: 10 },
        { pais: 'Reino Unido', porcentagem: 8 },
        { pais: 'Alemanha', porcentagem: 6 },
        { pais: 'França', porcentagem: 5 },
        { pais: 'Itália', porcentagem: 3 },
        { pais: 'Argentina', porcentagem: 3 }
      ],
      cargos_necessarios: [
        { role: 'CEO', department: 'Executivo', specialty: 'Liderança Estratégica' },
        { role: 'CTO', department: 'Tecnologia', specialty: 'Arquitetura de Software' },
        { role: 'VP de Engenharia', department: 'Tecnologia', specialty: 'Desenvolvimento de Software' },
        { role: 'VP de Produto', department: 'Produto', specialty: 'Gestão de Produto' },
        { role: 'VP de Vendas', department: 'Vendas', specialty: 'Estratégia de Vendas' },
        { role: 'VP de Marketing', department: 'Marketing', specialty: 'Marketing Digital' },
        { role: 'Diretor de TI', department: 'Tecnologia', specialty: 'Infraestrutura' },
        { role: 'Diretor de Segurança', department: 'Segurança', specialty: 'Cybersecurity' },
        { role: 'Gerente de Desenvolvimento', department: 'Tecnologia', specialty: 'Desenvolvimento Ágil' },
        { role: 'Gerente de QA', department: 'Qualidade', specialty: 'Testes e Qualidade' },
        { role: 'Gerente de DevOps', department: 'Tecnologia', specialty: 'DevOps' },
        { role: 'Arquiteto de Software', department: 'Tecnologia', specialty: 'Arquitetura' },
        { role: 'Desenvolvedor Senior', department: 'Tecnologia', specialty: 'Full Stack' },
        { role: 'Analista de Dados', department: 'Dados', specialty: 'Business Intelligence' },
        { role: 'Especialista em UX/UI', department: 'Design', specialty: 'Experiência do Usuário' }
      ],
      scripts_status: {
        '00_create_personas_from_structure': 'pending',
        '01.5_generate_atribuicoes_contextualizadas': 'pending',
        '02A_generate_dados_basicos': 'pending',
        '02B_generate_biografias_llm': 'pending',
        '04_generate_competencias_grok': 'pending',
        '05_generate_avatares': 'pending',
        '06_analyze_tasks_for_automation': 'pending',
        '07_generate_n8n_workflows': 'pending',
        '08_generate_machine_learning': 'pending',
        '09_generate_auditoria': 'pending'
      }
    };

    const { data, error } = await supabase
      .from('empresas')
      .upsert(empresaData, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ Erro ao criar empresa:', error.message);
      return;
    }

    console.log('✅ Empresa criada com sucesso!');
    console.log(`   Nome: ${data[0].nome}`);
    console.log(`   ID: ${data[0].id}`);
    console.log(`   Domínio: ${data[0].dominio}`);
    console.log(`   Cargos necessários: ${data[0].cargos_necessarios.length}`);
    console.log(`   Nacionalidades: ${data[0].nacionalidades.length}`);

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

createArvaCompany();