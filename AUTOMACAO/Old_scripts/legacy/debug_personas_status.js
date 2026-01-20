/**
 * Debug: Verificar personas no banco de dados
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Verificando variáveis de ambiente...');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltando');
console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ Faltando');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  console.log('Verifique se .env.local existe e está configurado');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugPersonas() {
  console.log('🔍 Verificando status das personas...\n');

  try {
    // 1. Verificar empresas
    console.log('1️⃣ Verificando empresas ativas:');
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('id, nome, status')
      .eq('status', 'ativa')
      .not('nome', 'like', '[DELETED-%')
      .not('nome', 'like', '[EXCLUÍDA]%');
    
    if (empresasError) {
      console.error('❌ Erro ao buscar empresas:', empresasError);
      return;
    }

    console.log(`   📊 Empresas ativas encontradas: ${empresas?.length || 0}`);
    if (empresas?.length > 0) {
      console.log('   🏢 Primeiras 3 empresas:');
      empresas.slice(0, 3).forEach((emp, idx) => {
        console.log(`   ${idx + 1}. ${emp.nome} (ID: ${emp.id})`);
      });
    }

    // 2. Verificar personas totais
    console.log('\n2️⃣ Verificando personas totais:');
    const { data: allPersonas, error: allPersonasError } = await supabase
      .from('personas')
      .select('id, full_name, role, empresa_id')
      .order('created_at', { ascending: false });
    
    if (allPersonasError) {
      console.error('❌ Erro ao buscar todas personas:', allPersonasError);
      return;
    }

    console.log(`   👤 Total de personas: ${allPersonas?.length || 0}`);
    
    // 3. Verificar personas de empresas ativas
    if (empresas?.length > 0) {
      console.log('\n3️⃣ Verificando personas de empresas ativas:');
      const empresaIds = empresas.map(e => e.id);
      
      const { data: activePersonas, error: activePersonasError } = await supabase
        .from('personas')
        .select(`
          id, full_name, role, empresa_id,
          empresas!inner(id, nome, status)
        `)
        .eq('empresas.status', 'ativa')
        .not('empresas.nome', 'like', '[DELETED-%')
        .not('empresas.nome', 'like', '[EXCLUÍDA]%')
        .order('created_at', { ascending: false });
      
      if (activePersonasError) {
        console.error('❌ Erro ao buscar personas ativas:', activePersonasError);
        return;
      }

      console.log(`   👥 Personas de empresas ativas: ${activePersonas?.length || 0}`);
      
      if (activePersonas?.length > 0) {
        console.log('   🎭 Primeiras 5 personas:');
        activePersonas.slice(0, 5).forEach((persona, idx) => {
          console.log(`   ${idx + 1}. ${persona.full_name} - ${persona.role}`);
          console.log(`      Empresa: ${persona.empresas.nome}`);
        });
      } else {
        console.log('   ⚠️ Nenhuma persona encontrada para empresas ativas!');
        
        // Verificar se há personas em empresas inativas/deletadas
        console.log('\n4️⃣ Verificando personas em empresas deletadas:');
        const { data: deletedPersonas } = await supabase
          .from('personas')
          .select(`
            id, full_name, empresa_id,
            empresas(id, nome, status)
          `)
          .order('created_at', { ascending: false });
        
        if (deletedPersonas?.length > 0) {
          console.log(`   🗑️ Total personas (incluindo deletadas): ${deletedPersonas.length}`);
          
          const byStatus = deletedPersonas.reduce((acc, p) => {
            const status = p.empresas?.status || 'sem empresa';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});
          
          console.log('   📊 Por status de empresa:');
          Object.entries(byStatus).forEach(([status, count]) => {
            console.log(`      ${status}: ${count} personas`);
          });
        }
      }
    }

    // 4. Verificar estrutura da tabela personas
    console.log('\n5️⃣ Verificando estrutura da tabela personas:');
    const { data: samplePersona } = await supabase
      .from('personas')
      .select('*')
      .limit(1);
    
    if (samplePersona?.[0]) {
      console.log('   📋 Campos disponíveis:');
      Object.keys(samplePersona[0]).forEach(key => {
        console.log(`   - ${key}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  console.log('\n✅ Debug concluído!');
}

debugPersonas();