const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);

async function forceCleanAll() {
  console.log('💥 LIMPEZA FORÇADA DE TODOS OS DADOS...\n');
  
  try {
    // Verificar dados existentes
    console.log('🔍 Verificando dados existentes...');
    
    const { data: empresas, error: empresasError } = await supabase
      .from('empresas')
      .select('*');
    
    if (empresasError) {
      console.log('❌ Erro ao verificar empresas:', empresasError.message);
    } else {
      console.log(`📊 Encontradas ${empresas?.length || 0} empresas:`);
      empresas?.forEach(emp => console.log(`  - ${emp.nome} (${emp.id})`));
    }
    
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('*');
    
    if (personasError) {
      console.log('❌ Erro ao verificar personas:', personasError.message);
    } else {
      console.log(`👤 Encontradas ${personas?.length || 0} personas`);
    }
    
    // Limpeza forçada usando truncate se possível
    console.log('\n💣 Executando limpeza forçada...');
    
    const tablesToClean = [
      'audit_logs',
      'sync_logs', 
      'metas_personas',
      'metas_globais',
      'workflows',
      'rag_knowledge',
      'avatares_personas',
      'personas_tech_specs',
      'competencias',
      'personas_biografias',
      'auditorias_compatibilidade',
      'personas',
      'empresas'
    ];
    
    for (const table of tablesToClean) {
      try {
        // Tentar DELETE simples primeiro
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
          console.log(`⚠️ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Limpo`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
    // Verificação final
    console.log('\n🔍 Verificação final...');
    
    const { data: finalEmpresas } = await supabase.from('empresas').select('*');
    const { data: finalPersonas } = await supabase.from('personas').select('*');
    
    console.log(`📊 Empresas restantes: ${finalEmpresas?.length || 0}`);
    console.log(`👤 Personas restantes: ${finalPersonas?.length || 0}`);
    
    if ((finalEmpresas?.length || 0) === 0 && (finalPersonas?.length || 0) === 0) {
      console.log('\n🎉 LIMPEZA COMPLETA REALIZADA COM SUCESSO!');
    } else {
      console.log('\n⚠️ Ainda existem dados residuais. Pode ser necessária limpeza manual.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error);
  }
}

forceCleanAll();