const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarPersonasAmericanas() {
    try {
        const { data: personas, error } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', '0e1b6a82-ac72-43f2-974a-f3806e1ec4ce')
            .order('role');

        if (error) {
            console.error('❌ Erro:', error);
            return;
        }

        if (personas && personas.length > 0) {
            console.log(`✅ ${personas.length} personas americanas encontradas:\n`);
            
            personas.forEach((persona, index) => {
                const caracteristicas = persona.personalidade?.caracteristicas_fisicas;
                const genero = persona.personalidade?.genero;
                
                console.log(`${index + 1}. ${persona.full_name} (${genero})`);
                console.log(`   Função: ${persona.role}`);
                console.log(`   Depto: ${persona.department}`);
                console.log(`   Email: ${persona.email}`);
                
                if (caracteristicas) {
                    console.log(`   Físico: ${caracteristicas.idade} anos, ${caracteristicas.altura}, ${caracteristicas.cabelo}, ${caracteristicas.olhos}, ${caracteristicas.etnia}`);
                }
                
                if (persona.biografia_completa) {
                    const bioPreview = persona.biografia_completa.substring(0, 100) + '...';
                    console.log(`   Bio: ${bioPreview}`);
                }
                
                console.log('');
            });
            
            // Resumo por categoria
            const porCategoria = personas.reduce((acc, p) => {
                if (p.role.includes('Chief Executive')) acc.ceo++;
                else if (p.role.includes('Chief')) acc.executivos++;
                else if (p.role.includes('Specialist')) acc.especialistas++;
                else if (p.role.includes('Assistant')) acc.assistentes++;
                return acc;
            }, { ceo: 0, executivos: 0, especialistas: 0, assistentes: 0 });
            
            console.log(`📊 Resumo por categoria:`);
            console.log(`   CEO: ${porCategoria.ceo}`);
            console.log(`   Executivos: ${porCategoria.executivos}`);
            console.log(`   Especialistas: ${porCategoria.especialistas}`);
            console.log(`   Assistentes: ${porCategoria.assistentes}`);
            
            // Verificar gênero dos assistentes
            const assistentes = personas.filter(p => p.role.includes('Assistant'));
            const generoAssistentes = assistentes.reduce((acc, p) => {
                const genero = p.personalidade?.genero;
                acc[genero] = (acc[genero] || 0) + 1;
                return acc;
            }, {});
            
            console.log(`👥 Gênero dos assistentes:`);
            Object.entries(generoAssistentes).forEach(([genero, count]) => {
                console.log(`   ${genero}: ${count}`);
            });
            
        } else {
            console.log('❌ Nenhuma persona encontrada');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

verificarPersonasAmericanas();