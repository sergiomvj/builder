// TESTE RÁPIDO - Query de Personas
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 TESTE DE QUERY DE PERSONAS');
console.log('==============================\n');

console.log('Variáveis de ambiente:');
console.log('  URL:', supabaseUrl?.substring(0, 30) + '...');
console.log('  Key:', supabaseKey ? 'Configurada (' + supabaseKey.substring(0, 20) + '...)' : 'AUSENTE');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQueries() {
  try {
    // Teste 1: Empresas
    console.log('📋 Teste 1: Buscar empresas ativas...');
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome, status')
      .eq('status', 'ativa')
      .not('nome', 'like', '[DELETED-%')
      .not('nome', 'like', '[EXCLUÍDA]%')
      .order('nome');

    if (empresasError) {
      console.error('   ❌ Erro ao buscar empresas:', empresasError);
      throw empresasError;
    }

    console.log(`   ✅ Empresas encontradas: ${empresas?.length || 0}`);
    if (empresas && empresas.length > 0) {
      empresas.forEach(emp => {
        console.log(`      • ${emp.nome} (${emp.id})`);
      });
    }
    console.log('');

    // Teste 2: Personas SEM JOIN
    console.log('📋 Teste 2: Buscar personas SEM join...');
    const { data: personasSemJoin, error: errorSemJoin } = await supabase
      .from('personas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (errorSemJoin) {
      console.error('   ❌ Erro ao buscar personas:', errorSemJoin);
      throw errorSemJoin;
    }

    console.log(`   ✅ Personas encontradas: ${personasSemJoin?.length || 0}`);
    if (personasSemJoin && personasSemJoin.length > 0) {
      personasSemJoin.forEach(p => {
        console.log(`      • ${p.full_name} (${p.role}) - Empresa: ${p.empresa_id}`);
      });
    }
    console.log('');

    // Teste 3: Personas COM INNER JOIN
    console.log('📋 Teste 3: Buscar personas COM inner join...');
    const { data: personasComJoin, error: errorComJoin } = await supabase
      .from('personas')
      .select(`
        *,
        empresas!inner(id, nome, status)
      `)
      .eq('empresas.status', 'ativa')
      .order('created_at', { ascending: false })
      .limit(5);

    if (errorComJoin) {
      console.error('   ❌ Erro ao buscar personas com join:', errorComJoin);
      console.error('   Código:', errorComJoin.code);
      console.error('   Mensagem:', errorComJoin.message);
      console.error('   Detalhes:', errorComJoin.details);
      throw errorComJoin;
    }

    console.log(`   ✅ Personas encontradas: ${personasComJoin?.length || 0}`);
    if (personasComJoin && personasComJoin.length > 0) {
      personasComJoin.forEach(p => {
        console.log(`      • ${p.full_name} (${p.role}) - Empresa: ${p.empresas?.nome || 'N/A'}`);
      });
    }
    console.log('');

    // Teste 4: Verificar relacionamento empresa_id
    if (empresas && empresas.length > 0 && personasSemJoin && personasSemJoin.length > 0) {
      console.log('📋 Teste 4: Verificar relacionamento empresa_id...');
      const empresaIds = new Set(empresas.map(e => e.id));
      const personasOrfas = personasSemJoin.filter(p => !empresaIds.has(p.empresa_id));
      
      if (personasOrfas.length > 0) {
        console.warn(`   ⚠️  Personas órfãs encontradas: ${personasOrfas.length}`);
        personasOrfas.forEach(p => {
          console.warn(`      • ${p.full_name} aponta para empresa_id: ${p.empresa_id}`);
        });
      } else {
        console.log('   ✅ Todos os relacionamentos corretos');
      }
      console.log('');
    }

    // Teste 5: Buscar por empresa específica (ARVA Tech)
    const arvaId = '7761ddfd-0ecc-4a11-95fd-5ee913a6dd17';
    console.log(`📋 Teste 5: Buscar personas da ARVA Tech (${arvaId})...`);
    const { data: personasArva, error: errorArva } = await supabase
      .from('personas')
      .select(`
        *,
        empresas!inner(id, nome)
      `)
      .eq('empresa_id', arvaId);

    if (errorArva) {
      console.error('   ❌ Erro ao buscar personas da ARVA:', errorArva);
    } else {
      console.log(`   ✅ Personas da ARVA: ${personasArva?.length || 0}`);
      if (personasArva && personasArva.length > 0) {
        personasArva.forEach(p => {
          console.log(`      • ${p.full_name} (${p.role})`);
        });
      }
    }
    console.log('');

    console.log('✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');

  } catch (error) {
    console.error('\n❌ ERRO DURANTE OS TESTES:', error);
    process.exit(1);
  }
}

testQueries();
