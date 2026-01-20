require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verificarPersonas() {
    const { data: personas } = await supabase
        .from('personas')
        .select('full_name, role, biografia_completa')
        .eq('empresa_id', '4dcec062-2840-4667-9fe0-1ba744481110')
        .order('created_at', { ascending: true });

    console.log('=== PERSONAS DA ARVA ===');
    personas.forEach((p, i) => {
        const hasBio = p.biografia_completa && p.biografia_completa.length > 50;
        console.log(`${i+1}. ${p.full_name} (${p.role}) - Bio: ${hasBio ? 'SIM' : 'NÃO'}`);
    });
    
    console.log(`\nTotal: ${personas.length} personas`);
    
    process.exit(0);
}

verificarPersonas();