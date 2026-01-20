const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);

async function checkPersonas() {
    const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('empresa_id', 'bae6cb49-9b53-4600-9b58-084a69b66c21')
        .limit(5);
    
    if (error) {
        console.error('Erro:', error);
        return;
    }
    
    console.log(`🔍 Total encontrado: ${data?.length || 0}`);
    console.log('\n📋 Primeiras personas:');
    
    data?.forEach((p, i) => {
        console.log(`\n${i+1}. ${p.full_name} - ${p.role}`);
        console.log(`   Email: ${p.email}`);
        console.log(`   Departamento: ${p.department}`);
        console.log(`   Especialidade: ${p.specialty}`);
        console.log(`   Gênero: ${p.personalidade?.genero || 'N/A'}`);
        console.log(`   SDR: ${p.personalidade?.personalidade_sdr?.sdr_type || 'N/A'}`);
        if (p.personalidade?.caracteristicas_fisicas) {
            const fisicas = p.personalidade.caracteristicas_fisicas;
            console.log(`   Idade: ${fisicas.idade || 'N/A'} anos`);
            console.log(`   Altura: ${fisicas.altura || 'N/A'}`);
            console.log(`   Cabelo: ${fisicas.cabelo || 'N/A'}`);
            console.log(`   Olhos: ${fisicas.olhos || 'N/A'}`);
        }
    });
}

checkPersonas();