const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function mostrarBiografiaCompleta() {
    try {
        const { data: personas, error } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', '0e1b6a82-ac72-43f2-974a-f3806e1ec4ce')
            .eq('role', 'Chief Executive Officer')
            .single();

        if (error) {
            console.error('❌ Erro:', error);
            return;
        }

        if (personas) {
            console.log(`✅ CEO Encontrado: ${personas.full_name}\n`);
            console.log(`📋 BIOGRAFIA COMPLETA:\n`);
            console.log(personas.biografia_completa);
            console.log(`\n📊 PERSONALIDADE:`);
            console.log(JSON.stringify(personas.personalidade, null, 2));
        } else {
            console.log('❌ CEO não encontrado');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

mostrarBiografiaCompleta();