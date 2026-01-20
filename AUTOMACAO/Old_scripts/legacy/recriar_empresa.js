const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function recriarEmpresaArva() {
    const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🏢 Recriando empresa ARVA...');
    
    const empresa = {
        id: 'bae6cb49-9b53-4600-9b58-084a69b66c21',
        codigo: 'ARVA01',
        nome: 'ARVA Tech Solutions',
        descricao: 'ARVA é um ecossistema modular que permite criar, treinar e operar robôs virtuais autônomos',
        pais: 'US',
        idiomas: ['inglês', 'espanhol', 'francês', 'português'],
        total_personas: 16,
        status: 'ativa',
        scripts_status: {
            rag: false,
            fluxos: false,
            workflows: false,
            biografias: false,
            tech_specs: false,
            competencias: false
        },
        ceo_gender: 'masculino',
        executives_male: 2,
        executives_female: 2,
        assistants_male: 2,
        assistants_female: 3,
        specialists_male: 3,
        specialists_female: 3,
        industry: 'tecnologia',
        nationalities: [],
        dominio: 'https://arvabot.com',
        industria: 'tecnologia',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    try {
        const { data, error } = await supabase
            .from('empresas')
            .insert(empresa)
            .select();
        
        if (error) {
            console.error('❌ Erro ao criar empresa:', error.message);
        } else {
            console.log('✅ Empresa ARVA recriada com sucesso!');
            console.log(`   Nome: ${data[0].nome}`);
            console.log(`   Código: ${data[0].codigo}`);
            console.log(`   ID: ${data[0].id}`);
        }
    } catch (e) {
        console.error('💥 Erro:', e.message);
    }
}

recriarEmpresaArva();