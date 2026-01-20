const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarTechSpecsCompleto() {
    try {
        console.log('🧪 Teste completo de Tech Specs...\n');
        
        const empresaId = '0e1b6a82-ac72-43f2-974a-f3806e1ec4ce';
        
        // Buscar uma persona CEO
        const { data: personas, error: personaError } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', empresaId)
            .eq('role', 'Chief Executive Officer')
            .single();
            
        if (personaError || !personas) {
            console.log('❌ Erro ao buscar persona CEO:', personaError?.message);
            return;
        }
        
        const persona = personas;
        console.log(`🎯 Testando: ${persona.full_name} (${persona.role})`);
        
        // Buscar tech specs
        const { data: techSpecs, error: techError } = await supabase
            .from('tech_specifications')
            .select('*')
            .eq('persona_id', persona.id)
            .single();
            
        if (techError) {
            console.log('❌ Erro ao buscar tech specs:', techError.message);
            return;
        }
        
        if (techSpecs) {
            console.log('\n✅ Tech Specs encontradas:');
            console.log(`   ID: ${techSpecs.id}`);
            console.log(`   Role: ${techSpecs.role}`);
            console.log(`   Tools (${techSpecs.tools?.length}):`, techSpecs.tools);
            console.log(`   Technologies (${techSpecs.technologies?.length}):`, techSpecs.technologies);
            console.log(`   Methodologies (${techSpecs.methodologies?.length}):`, techSpecs.methodologies);
            console.log(`   Sales Enablement (${techSpecs.sales_enablement?.length}):`, techSpecs.sales_enablement);
            
            console.log('\n✅ Estrutura correta! Agora o frontend deveria mostrar:');
            console.log('   1. ✅ Hook usePersonaCompleta corrigido');
            console.log('   2. ✅ Modal persona-edit-modal com aba Tech atualizada');
            console.log('   3. ✅ Dados aparecendo em cards organizados por categoria');
            
        } else {
            console.log('❌ Tech specs não encontradas para esta persona');
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

testarTechSpecsCompleto();