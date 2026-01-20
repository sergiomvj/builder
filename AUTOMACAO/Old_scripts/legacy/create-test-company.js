const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createTestCompany() {
  try {
    console.log('🏭 CRIANDO EMPRESA DE TESTE PARA VERIFICAR ESTATÍSTICAS');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Criar empresa de teste
    const empresaData = {
      nome: 'EmpresaTeste Analytics',
      codigo: 'TEST' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      industria: 'Tecnologia',
      pais: 'Brasil',
      idiomas: ['português'],
      descricao: 'Empresa criada para testar estatísticas',
      status: 'ativa',
      total_personas: 0,
      scripts_status: {
        biografias: false,
        competencias: false,
        tech_specs: false,
        rag: false,
        fluxos: false,
        workflows: false
      }
    };
    
    console.log('📝 Dados da empresa:', empresaData.nome, empresaData.codigo);
    
    const { data: empresa, error } = await supabase
      .from('empresas')
      .insert([empresaData])
      .select()
      .single();
      
    if (error) {
      throw new Error(`Erro ao criar empresa: ${error.message}`);
    }
    
    console.log('✅ Empresa criada com sucesso!');
    console.log('   - ID:', empresa.id);
    console.log('   - Nome:', empresa.nome);
    console.log('   - Status:', empresa.status);
    
    // Criar algumas personas de teste
    console.log('\n👥 Criando 3 personas de teste...');
    
    const personas = [
      {
        empresa_id: empresa.id,
        persona_code: 'CEO001',
        full_name: 'Ana Silva',
        role: 'CEO',
        specialty: 'Liderança Estratégica',
        department: 'Executivo',
        email: 'ana.silva@empresateste.com',
        whatsapp: '+55 11 99999-0001'
      },
      {
        empresa_id: empresa.id,
        persona_code: 'DEV001',
        full_name: 'Carlos Santos',
        role: 'Desenvolvedor Sênior',
        specialty: 'Full Stack Development',
        department: 'Tecnologia',
        email: 'carlos.santos@empresateste.com',
        whatsapp: '+55 11 99999-0002'
      },
      {
        empresa_id: empresa.id,
        persona_code: 'MKT001',
        full_name: 'Beatriz Costa',
        role: 'Marketing Manager',
        specialty: 'Marketing Digital',
        department: 'Marketing',
        email: 'beatriz.costa@empresateste.com',
        whatsapp: '+55 11 99999-0003'
      }
    ];
    
    const { data: personasCriadas, error: personasError } = await supabase
      .from('personas')
      .insert(personas)
      .select();
      
    if (personasError) {
      console.warn('⚠️ Erro ao criar personas:', personasError.message);
    } else {
      console.log(`✅ ${personasCriadas?.length || 0} personas criadas`);
      
      // Atualizar total de personas na empresa
      await supabase
        .from('empresas')
        .update({ total_personas: personasCriadas?.length || 0 })
        .eq('id', empresa.id);
    }
    
    console.log('\n🎯 EMPRESA DE TESTE CRIADA COM SUCESSO!');
    console.log('Agora verifique as estatísticas na interface:');
    console.log('- Total: deve mostrar 1 empresa');
    console.log('- Ativas: deve mostrar 1 empresa'); 
    console.log('- Total Personas: deve mostrar 3 personas');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

createTestCompany();