require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analisarProblemas() {
    console.log('=== ANÁLISE DE PROBLEMAS ===');
    
    // Buscar todas as personas com detalhes
    const { data: personas } = await supabase
        .from('personas')
        .select(`
            id,
            empresa_id, 
            full_name, 
            persona_code, 
            biografia_completa,
            created_at,
            empresas(nome, codigo)
        `)
        .order('created_at', { ascending: true });
    
    console.log(`\n📊 Total de personas: ${personas.length}`);
    
    // Agrupar por empresa
    const porEmpresa = {};
    personas.forEach(p => {
        const empresaNome = p.empresas?.nome || 'SEM EMPRESA';
        if (!porEmpresa[empresaNome]) porEmpresa[empresaNome] = [];
        porEmpresa[empresaNome].push(p);
    });
    
    Object.entries(porEmpresa).forEach(([empresaNome, personasEmpresa]) => {
        console.log(`\n🏢 ${empresaNome}: ${personasEmpresa.length} personas`);
        
        // Mostrar todas as personas desta empresa
        personasEmpresa.forEach((p, index) => {
            const temBio = p.biografia_completa && p.biografia_completa.length > 50;
            const bioStatus = temBio ? '✅' : '❌';
            const dataStr = new Date(p.created_at).toLocaleString('pt-BR');
            console.log(`  ${index + 1}. ${p.full_name || p.persona_code || 'SEM NOME'} ${bioStatus} (${dataStr})`);
        });
    });
    
    // Verificar personas duplicadas por nome
    const nomes = {};
    personas.forEach(p => {
        const nome = p.full_name || p.persona_code;
        if (nome) {
            if (!nomes[nome]) nomes[nome] = [];
            nomes[nome].push(p);
        }
    });
    
    const duplicadas = Object.entries(nomes).filter(([nome, lista]) => lista.length > 1);
    if (duplicadas.length > 0) {
        console.log(`\n⚠️ PERSONAS DUPLICADAS:`);
        duplicadas.forEach(([nome, lista]) => {
            console.log(`  📛 "${nome}": ${lista.length} ocorrências`);
            lista.forEach(p => {
                const empresa = p.empresas?.nome || 'SEM EMPRESA';
                console.log(`    - ${empresa} (${new Date(p.created_at).toLocaleString('pt-BR')})`);
            });
        });
    }
    
    process.exit(0);
}

analisarProblemas().catch(console.error);