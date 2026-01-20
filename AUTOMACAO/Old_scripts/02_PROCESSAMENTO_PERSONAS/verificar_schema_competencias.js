const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarSchemaCompetencias() {
    try {
        console.log('🔍 Verificando schema da tabela competencias...\n');
        
        // Buscar uma competência para ver a estrutura
        const { data: competencias, error } = await supabase
            .from('competencias')
            .select('*')
            .limit(1);
            
        if (error) {
            console.error('❌ Erro:', error);
            return;
        }
        
        if (competencias && competencias.length > 0) {
            const competencia = competencias[0];
            console.log('📋 Estrutura da tabela competencias:');
            Object.keys(competencia).forEach(campo => {
                console.log(`   ${campo}: ${typeof competencia[campo]} = ${competencia[campo]}`);
            });
            
            console.log('\n🎯 Campos da tabela:');
            console.log(Object.keys(competencia).join(', '));
        }
        
        // Buscar competências por persona_id com join
        console.log('\n🔗 Testando JOIN personas + competencias:');
        
        const { data: dadosCompletos, error: joinError } = await supabase
            .from('competencias')
            .select(`
                *,
                personas!inner(
                    empresa_id,
                    full_name,
                    role
                )
            `)
            .eq('personas.empresa_id', '0e1b6a82-ac72-43f2-974a-f3806e1ec4ce')
            .limit(5);
            
        if (joinError) {
            console.log(`❌ Erro no JOIN: ${joinError.message}`);
        } else {
            console.log(`✅ JOIN funcionou! ${dadosCompletos?.length || 0} competências encontradas`);
            
            if (dadosCompletos && dadosCompletos.length > 0) {
                console.log('\n📝 Exemplo de competência com pessoa:');
                const exemplo = dadosCompletos[0];
                console.log(`   Competência: ${exemplo.nome} (${exemplo.tipo})`);
                console.log(`   Persona: ${exemplo.personas.full_name}`);
                console.log(`   Empresa: ${exemplo.personas.empresa_id}`);
            }
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

verificarSchemaCompetencias();