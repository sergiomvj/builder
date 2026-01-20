// DEBUG: Verificar EXATAMENTE como o status está sendo calculado
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugStatus() {
  const empresaId = '58234085-d661-4171-8664-4149b5559a3c';
  
  console.log('🔍 DEBUG: Detecção de Status do Script 01.3');
  console.log('===========================================\n');

  // Simular exatamente o que o frontend faz
  const { data: personas, error } = await supabase
    .from('personas')
    .select(`
      *,
      empresas!inner(id, nome, codigo, status),
      personas_avatares(*)
    `)
    .eq('empresa_id', empresaId);

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log(`📊 Total de personas: ${personas.length}\n`);

  // Replicar EXATAMENTE a lógica do frontend
  const hasGeneratedImages = personas.some(p => {
    console.log(`\n🔍 Verificando: ${p.full_name}`);
    console.log(`   - personas_avatares existe? ${!!p.personas_avatares}`);
    console.log(`   - personas_avatares.length: ${p.personas_avatares?.length || 0}`);
    
    if (!p.personas_avatares || p.personas_avatares.length === 0) {
      console.log('   ❌ Sem avatares');
      return false;
    }
    
    const avatar = p.personas_avatares[0];
    console.log(`   - avatar.servico_usado: "${avatar.servico_usado}"`);
    console.log(`   - É fal.ai? ${avatar.servico_usado === 'fal_ai_flux_schnell'}`);
    
    return avatar.servico_usado === 'fal_ai_flux_schnell';
  });

  console.log('\n' + '='.repeat(50));
  console.log(`\n🎯 RESULTADO FINAL: hasGeneratedImages = ${hasGeneratedImages}`);
  console.log(`\n📋 Status que deveria aparecer:`);
  console.log(`   avatar_images: ${hasGeneratedImages ? '✅ EXECUTADO' : '⏸️  PENDENTE'}`);
  
  // Verificar o que está no banco da empresa
  const { data: empresa } = await supabase
    .from('empresas')
    .select('scripts_status')
    .eq('id', empresaId)
    .single();
  
  console.log(`\n💾 Status SALVO no banco (empresas.scripts_status):`);
  console.log(JSON.stringify(empresa?.scripts_status, null, 2));
  
  console.log(`\n⚠️  NOTA: O frontend SOBRESCREVE o status do banco com cálculo em tempo real!`);
  console.log(`   Portanto, o que importa é hasGeneratedImages = ${hasGeneratedImages}`);
}

debugStatus();
