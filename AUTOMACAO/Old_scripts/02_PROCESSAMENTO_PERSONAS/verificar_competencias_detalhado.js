const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarCompetenciasDetalhado() {
    try {
        console.log('🔍 Verificação DETALHADA das competências...\n');
        
        // 1. Verificar todas as competências (sem filtro de empresa)
        const { data: todasCompetencias, error: errorTodas } = await supabase
            .from('competencias')
            .select('*');
        
        if (errorTodas) {
            console.error('❌ Erro ao buscar competências:', errorTodas);
            return;
        }
        
        console.log(`📊 TODAS as competências no banco: ${todasCompetencias?.length || 0}`);
        
        if (todasCompetencias && todasCompetencias.length > 0) {
            // Agrupar por empresa_id
            const porEmpresa = todasCompetencias.reduce((acc, comp) => {
                const empresaId = comp.empresa_id || 'sem_empresa';
                acc[empresaId] = (acc[empresaId] || 0) + 1;
                return acc;
            }, {});
            
            console.log('\n📋 Competências por empresa:');
            Object.entries(porEmpresa).forEach(([empresaId, count]) => {
                console.log(`   ${empresaId}: ${count} competências`);
            });
            
            // Mostrar algumas competências de exemplo
            console.log('\n📝 Exemplos de competências:');
            todasCompetencias.slice(0, 3).forEach((comp, i) => {
                console.log(`${i+1}. ${comp.nome} (${comp.tipo}) - Persona: ${comp.persona_id}`);
                console.log(`   Empresa: ${comp.empresa_id}`);
                console.log(`   Nível: ${comp.nivel}`);
            });
        }
        
        // 2. Verificar personas da ARVA
        const empresaId = '0e1b6a82-ac72-43f2-974a-f3806e1ec4ce';
        const { data: personas, error: personasError } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', empresaId);
            
        if (personasError) {
            console.error('❌ Erro ao buscar personas:', personasError);
            return;
        }
        
        console.log(`\n👥 Personas da ARVA: ${personas?.length || 0}`);
        
        if (personas && personas.length > 0) {
            // Verificar competências para cada persona
            for (let i = 0; i < Math.min(3, personas.length); i++) {
                const persona = personas[i];
                
                const { data: compPersona, error: compError } = await supabase
                    .from('competencias')
                    .select('*')
                    .eq('persona_id', persona.id);
                
                console.log(`   ${persona.full_name} (ID: ${persona.id}): ${compPersona?.length || 0} competências`);
                
                if (compError) {
                    console.log(`     ❌ Erro: ${compError.message}`);
                }
            }
        }
        
        // 3. Tentar buscar competências por empresa_id diretamente
        console.log(`\n🎯 Buscando competências para empresa específica: ${empresaId}`);
        
        const { data: compEmpresa, error: compEmpresaError } = await supabase
            .from('competencias')
            .select('*')
            .eq('empresa_id', empresaId);
            
        if (compEmpresaError) {
            console.log(`❌ Erro: ${compEmpresaError.message}`);
        } else {
            console.log(`✅ Encontradas: ${compEmpresa?.length || 0} competências para ARVA`);
            
            if (compEmpresa && compEmpresa.length > 0) {
                const porTipo = compEmpresa.reduce((acc, comp) => {
                    acc[comp.tipo] = (acc[comp.tipo] || 0) + 1;
                    return acc;
                }, {});
                
                console.log('   Por tipo:');
                Object.entries(porTipo).forEach(([tipo, count]) => {
                    console.log(`     ${tipo}: ${count}`);
                });
            }
        }

    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

verificarCompetenciasDetalhado();