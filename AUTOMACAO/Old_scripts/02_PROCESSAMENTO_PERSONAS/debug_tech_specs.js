const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTechSpecs() {
    try {
        console.log('🔍 Debug Tech Specs...\n');
        
        const empresaId = '0e1b6a82-ac72-43f2-974a-f3806e1ec4ce';
        
        // 1. Verificar se tech specs existem
        const { data: techSpecs, error: techError } = await supabase
            .from('tech_specifications')
            .select('*')
            .eq('empresa_id', empresaId);
            
        console.log(`📊 Tech Specs encontradas: ${techSpecs?.length || 0}`);
        
        if (techError) {
            console.log(`❌ Erro: ${techError.message}`);
            return;
        }
        
        if (techSpecs && techSpecs.length > 0) {
            console.log('\n📋 Exemplos de Tech Specs:');
            techSpecs.slice(0, 3).forEach((spec, i) => {
                console.log(`${i+1}. Role: ${spec.role}`);
                console.log(`   Tools: ${spec.tools?.length || 0} items`);
                console.log(`   Technologies: ${spec.technologies?.length || 0} items`);
                console.log(`   Persona ID: ${spec.persona_id}`);
            });
        }
        
        // 2. Verificar uma persona específica
        const { data: personas, error: personaError } = await supabase
            .from('personas')
            .select('id, full_name, role')
            .eq('empresa_id', empresaId)
            .limit(1);
            
        if (personas && personas.length > 0) {
            const persona = personas[0];
            console.log(`\n🎯 Testando persona: ${persona.full_name}`);
            
            const { data: specPersona, error: specError } = await supabase
                .from('tech_specifications')
                .select('*')
                .eq('persona_id', persona.id);
                
            if (specError) {
                console.log(`❌ Erro ao buscar specs da persona: ${specError.message}`);
            } else {
                console.log(`✅ Tech specs para ${persona.full_name}: ${specPersona?.length || 0}`);
                
                if (specPersona && specPersona.length > 0) {
                    const spec = specPersona[0];
                    console.log(`   Tools: ${JSON.stringify(spec.tools)}`);
                    console.log(`   Technologies: ${JSON.stringify(spec.technologies)}`);
                }
            }
        }
        
        // 3. Verificar se hook está funcionando
        console.log('\n🔧 Para verificar no frontend, certifique-se de que:');
        console.log('   1. usePersonaCompleta.ts está buscando tech_specifications');
        console.log('   2. persona-edit-modal.tsx está mostrando os dados na aba Tech');
        console.log('   3. As tech specs estão sendo carregadas via JOIN ou query separada');

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

debugTechSpecs();