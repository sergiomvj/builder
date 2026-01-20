const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function listarEmpresas() {
    const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);
    
    const { data, error } = await supabase
        .from('empresas')
        .select('*');
    
    if (error) {
        console.error('Erro:', error.message);
        return;
    }
    
    console.log('📋 Empresas disponíveis:');
    data?.forEach(e => {
        console.log(`- ${e.nome} (${e.codigo}) - ID: ${e.id}`);
        console.log(`  Status: ${e.status} | Personas: ${e.total_personas || 0}`);
    });
}

listarEmpresas();