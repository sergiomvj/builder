// Teste direto para verificar as personas no banco
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://fzyokrvdyeczhfqlwxzb.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPersonas() {
  console.log('🔍 Testando consulta de personas...\n');

  try {
    // Teste 1: Consulta básica
    console.log('1. Consultando todas as personas:');
    const { data: allPersonas, error: errorAll } = await supabase
      .from('personas')
      .select('*');

    if (errorAll) {
      console.error('❌ Erro na consulta básica:', errorAll);
    } else {
      console.log(`✅ Encontradas ${allPersonas?.length || 0} personas`);
      if (allPersonas?.length > 0) {
        console.log('Primeiras 3 personas:');
        allPersonas.slice(0, 3).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.full_name} - ${p.role} (${p.empresa_id})`);
        });
      }
    }

    // Teste 2: Consulta com join
    console.log('\n2. Consultando com dados de empresa:');
    const { data: personasWithCompany, error: errorJoin } = await supabase
      .from('personas')
      .select(`
        *,
        empresas!inner(id, nome, codigo)
      `);

    if (errorJoin) {
      console.error('❌ Erro na consulta com join:', errorJoin);
    } else {
      console.log(`✅ Encontradas ${personasWithCompany?.length || 0} personas com empresa`);
      if (personasWithCompany?.length > 0) {
        personasWithCompany.slice(0, 3).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.full_name} - Empresa: ${p.empresas?.nome}`);
        });
      }
    }

    // Teste 3: Verificar empresas
    console.log('\n3. Verificando empresas existentes:');
    const { data: empresas, error: errorEmpresas } = await supabase
      .from('empresas')
      .select('id, nome, codigo');

    if (errorEmpresas) {
      console.error('❌ Erro ao buscar empresas:', errorEmpresas);
    } else {
      console.log(`✅ Encontradas ${empresas?.length || 0} empresas`);
      empresas?.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.nome} (${e.codigo}) - ID: ${e.id}`);
      });
    }

  } catch (err) {
    console.error('❌ Erro na execução:', err);
  }
}

testPersonas();