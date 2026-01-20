require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompetencias() {
    // Buscar personas da empresa ARVA para filtrar competências
    const { data: personas, error: personasError } = await supabase
        .from('personas')
        .select('id, full_name, role')
        .eq('empresa_id', '07870dfd-ca9d-4004-bbeb-e4aabd30d244');
    
    if (personasError) {
        console.error('Erro ao buscar personas:', personasError);
        return;
    }
    
    console.log(`📊 Encontradas ${personas.length} personas da ARVA Tech Solutions`);
    
    // Pegar IDs das personas para filtrar competências
    const personaIds = personas.map(p => p.id);
    
    const { data: competencias, error } = await supabase
        .from('competencias')
        .select('*')
        .in('persona_id', personaIds)
        .limit(8);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    console.log(`💼 Competências geradas para ARVA (${competencias.length}/8 mostradas):`);
    
    competencias.forEach((comp, i) => {
        const persona = personas.find(p => p.id === comp.persona_id);
        console.log(`${i+1}. ${persona?.full_name} (${persona?.role})`);
        console.log(`   🎯 ${comp.nome} - ${comp.tipo}/${comp.nivel}`);
        console.log(`   📝 ${comp.descricao}`);
        console.log(`   SDR: ${comp.escopo_sdr_hibrido ? 'Sim' : 'Não'}`);
        console.log('   ---');
    });
    
    // Contar total por persona
    console.log('\n📈 Resumo por persona:');
    for (const persona of personas) {
        const { count } = await supabase
            .from('competencias')
            .select('*', { count: 'exact', head: true })
            .eq('persona_id', persona.id);
        console.log(`   ${persona.full_name} (${persona.role}): ${count} competências`);
    }
}

checkCompetencias();