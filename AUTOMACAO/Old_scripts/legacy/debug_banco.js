require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnosticar() {
    console.log('=== DIAGNÓSTICO COMPLETO DO BANCO ===');
    
    // Buscar empresas
    const { data: empresas } = await supabase
        .from('empresas')
        .select('id, nome, codigo')
        .order('created_at', { ascending: true });
    
    console.log(`\nEMPRESAS (${empresas.length}):`);
    empresas.forEach(e => console.log(`- ${e.nome} (${e.codigo}) - ID: ${e.id}`));
    
    // Buscar personas
    const { data: personas } = await supabase
        .from('personas')
        .select('empresa_id, full_name, persona_code, biografia_completa, created_at')
        .order('created_at', { ascending: true });
    
    console.log(`\nPERSONAS TOTAL: ${personas.length}`);
    
    // Analisar por empresa
    empresas.forEach(empresa => {
        const personasEmpresa = personas.filter(p => p.empresa_id === empresa.id);
        console.log(`\n📊 ${empresa.nome} (${empresa.codigo}): ${personasEmpresa.length} personas`);
        
        personasEmpresa.slice(0, 5).forEach((p, index) => {
            const temBio = p.biografia_completa && p.biografia_completa.length > 50;
            const bioStatus = temBio ? '✅ BIO OK' : '❌ SEM BIO';
            console.log(`  ${index + 1}. ${p.full_name || p.persona_code || 'SEM NOME'} - ${bioStatus}`);
        });
        
        if (personasEmpresa.length > 5) {
            console.log(`  ... e mais ${personasEmpresa.length - 5} personas`);
        }
        
        // Contar quantas têm biografias
        const comBio = personasEmpresa.filter(p => p.biografia_completa && p.biografia_completa.length > 50).length;
        console.log(`  📝 Biografias: ${comBio}/${personasEmpresa.length} completas`);
    });
    
    // Identificar duplicatas ou problemas
    const personasSemEmpresa = personas.filter(p => !empresas.find(e => e.id === p.empresa_id));
    if (personasSemEmpresa.length > 0) {
        console.log(`\n⚠️ PROBLEMA: ${personasSemEmpresa.length} personas órfãs (sem empresa válida)`);
    }
    
    process.exit(0);
}

diagnosticar().catch(console.error);