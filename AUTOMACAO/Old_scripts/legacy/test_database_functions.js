// Teste das funções do database e verificação de problemas

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseFunctions() {
  console.log('🧪 Testando funções do database...\n');

  try {
    // 1. Testar carregamento de empresas
    console.log('1️⃣ Testando getEmpresas()...');
    const empresas = await supabase
      .from('empresas')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`✅ Empresas encontradas: ${empresas.data?.length || 0}`);
    if (empresas.data?.length > 0) {
      empresas.data.forEach(emp => {
        console.log(`   - ${emp.nome} (${emp.status}) - Personas: ${emp.total_personas}`);
      });
    }
    console.log('');

    // 2. Testar carregamento de personas
    console.log('2️⃣ Testando getPersonas()...');
    const personas = await supabase
      .from('personas')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log(`✅ Personas encontradas: ${personas.data?.length || 0}`);
    if (personas.data?.length > 0) {
      personas.data.forEach(persona => {
        console.log(`   - ${persona.nome} (${persona.cargo}) - Empresa: ${persona.empresa_id}`);
      });
    }
    console.log('');

    // 3. Testar estrutura das tabelas
    console.log('3️⃣ Verificando estrutura das tabelas...');
    
    // Verificar colunas da tabela empresas
    const { data: empresasInfo } = await supabase
      .from('empresas')
      .select('*')
      .limit(1);
    
    if (empresasInfo && empresasInfo.length > 0) {
      console.log('✅ Colunas disponíveis em empresas:', Object.keys(empresasInfo[0]));
    }

    // Verificar colunas da tabela personas
    const { data: personasInfo } = await supabase
      .from('personas')
      .select('*')
      .limit(1);
    
    if (personasInfo && personasInfo.length > 0) {
      console.log('✅ Colunas disponíveis em personas:', Object.keys(personasInfo[0]));
    }
    console.log('');

    // 4. Testar funcionalidades específicas
    console.log('4️⃣ Testando funcionalidades específicas...');
    
    if (empresas.data && empresas.data.length > 0) {
      const primeiraEmpresa = empresas.data[0];
      console.log(`📊 Testando com empresa: ${primeiraEmpresa.nome}`);
      
      // Testar get empresa por ID
      const empresaPorId = await supabase
        .from('empresas')
        .select('*')
        .eq('id', primeiraEmpresa.id)
        .single();
      
      console.log(`✅ getEmpresaById funcionando: ${empresaPorId.data ? 'SIM' : 'NÃO'}`);
      
      // Testar personas por empresa
      const personasPorEmpresa = await supabase
        .from('personas')
        .select('*')
        .eq('empresa_id', primeiraEmpresa.id);
      
      console.log(`✅ Personas para esta empresa: ${personasPorEmpresa.data?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// 5. Testar exclusão (simulação)
async function testDeleteFunction() {
  console.log('\n5️⃣ Testando função de exclusão (simulação)...');
  
  try {
    // Criar uma empresa temporária para teste
    const empresaTeste = {
      nome: 'TESTE_EXCLUSAO_' + Date.now(),
      codigo: 'TEST',
      industria: 'Teste',
      pais: 'Brasil',
      idiomas: ['pt'],
      status: 'inativa',
      descricao: 'Empresa de teste para exclusão',
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

    const { data: empresaCriada, error: errorCreate } = await supabase
      .from('empresas')
      .insert(empresaTeste)
      .select()
      .single();

    if (errorCreate) throw errorCreate;

    console.log(`✅ Empresa de teste criada: ${empresaCriada.nome}`);

    // Agora testar exclusão
    const { data: empresaExcluida, error: errorDelete } = await supabase
      .from('empresas')
      .delete()
      .eq('id', empresaCriada.id)
      .select()
      .single();

    if (errorDelete) throw errorDelete;

    console.log(`✅ Empresa de teste excluída: ${empresaExcluida.nome}`);
    console.log('✅ Função de exclusão funcionando corretamente');

  } catch (error) {
    console.error('❌ Erro no teste de exclusão:', error);
  }
}

async function main() {
  await testDatabaseFunctions();
  await testDeleteFunction();
  
  console.log('\n🏁 Testes concluídos!');
  console.log('📋 RESUMO:');
  console.log('- Se empresas aparecem mas não exibem corretamente no dashboard, há problema na interface');
  console.log('- Se exclusão funciona aqui mas não no dashboard, há problema na implementação da página');
  console.log('- Se estrutura das tabelas está diferente do esperado, há problema no schema');
  console.log('\n🔧 Para execução: node test_database_functions.js');
}

main().catch(console.error);