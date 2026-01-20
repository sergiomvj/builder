const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function buscarEmpresa() {
    try {
        const { data: empresas, error } = await supabase
            .from('empresas')
            .select('*')
            .eq('codigo', 'LWU');

        if (error) {
            console.error('❌ Erro:', error);
            return;
        }

        if (empresas && empresas.length > 0) {
            const empresa = empresas[0];
            console.log(`✅ Empresa encontrada:`);
            console.log(`   ID: ${empresa.id}`);
            console.log(`   Nome: ${empresa.nome}`);
            console.log(`   Código: ${empresa.codigo}`);
            console.log(`   País: ${empresa.pais}`);
            console.log(`   Total personas: ${empresa.total_personas}`);
            console.log(`\n🎯 Use este comando para gerar personas internacionais:`);
            console.log(`node generate_personas_reais_internacional.js --empresaId=${empresa.id}`);
        } else {
            console.log('❌ Empresa LWU não encontrada');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

buscarEmpresa();