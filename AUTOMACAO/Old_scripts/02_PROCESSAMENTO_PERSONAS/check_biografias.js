const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);

async function checkBiografias() {
    console.log('📖 Verificando biografias no banco de dados...');
    
    const { data, error } = await supabase
        .from('personas')
        .select('full_name, biografia_completa, personalidade')
        .eq('empresa_id', 'bae6cb49-9b53-4600-9b58-084a69b66c21')
        .limit(5);
    
    if (error) {
        console.error('❌ Erro:', error);
        return;
    }
    
    console.log(`\n🔍 Analisando ${data.length} personas:\n`);
    
    data.forEach((persona, i) => {
        console.log(`${i+1}. ${persona.full_name}`);
        
        if (persona.biografia_completa) {
            console.log(`   ✅ Biografia: ${persona.biografia_completa.length} caracteres`);
            console.log(`   📝 Preview: "${persona.biografia_completa.substring(0, 120)}..."`);
        } else {
            console.log(`   ❌ Biografia: AUSENTE`);
        }
        
        if (persona.personalidade) {
            const pers = persona.personalidade;
            console.log(`   👤 Personalidade: ${pers.genero || 'N/A'}`);
            if (pers.caracteristicas_fisicas) {
                const fis = pers.caracteristicas_fisicas;
                console.log(`   🧑 Físicas: ${fis.idade}a, ${fis.altura}, ${fis.cabelo}, ${fis.olhos}`);
            }
        }
        console.log('');
    });
}

checkBiografias();