const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verificarCompetencias() {
    const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);
    
    // Buscar uma persona
    const { data: personas } = await supabase
        .from('personas')
        .select('id, full_name, role')
        .eq('empresa_id', '0e1b6a82-ac72-43f2-974a-f3806e1ec4ce')
        .limit(1);
    
    if (personas && personas[0]) {
        const persona = personas[0];
        console.log(`🔍 Analisando competências de: ${persona.full_name}`);
        
        const { data: competencias } = await supabase
            .from('competencias')
            .select('*')
            .eq('persona_id', persona.id);
        
        console.log(`📊 Total competências: ${competencias?.length || 0}`);
        
        const tipos = {};
        competencias?.forEach(c => {
            tipos[c.tipo] = (tipos[c.tipo] || 0) + 1;
        });
        
        console.log('📋 Tipos encontrados:', tipos);
        
        // Mostrar exemplos
        const hardSkills = competencias?.filter(c => c.tipo === 'hard_skill');
        const softSkills = competencias?.filter(c => c.tipo === 'soft_skill');
        const outros = competencias?.filter(c => c.tipo !== 'hard_skill' && c.tipo !== 'soft_skill');
        
        console.log(`\n💻 Hard Skills: ${hardSkills?.length || 0}`);
        if (hardSkills && hardSkills.length > 0) {
            console.log(`   Exemplo: ${hardSkills[0].nome} (${hardSkills[0].nivel})`);
        }
        
        console.log(`🤝 Soft Skills: ${softSkills?.length || 0}`);
        if (softSkills && softSkills.length > 0) {
            console.log(`   Exemplo: ${softSkills[0].nome} (${softSkills[0].nivel})`);
        }
        
        console.log(`📝 Outros tipos: ${outros?.length || 0}`);
        if (outros && outros.length > 0) {
            console.log(`   Exemplo: ${outros[0].nome} (${outros[0].tipo}) - ${outros[0].nivel}`);
        }
    }
}

verificarCompetencias();