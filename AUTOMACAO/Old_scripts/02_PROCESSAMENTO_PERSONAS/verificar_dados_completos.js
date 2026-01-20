const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarDadosCompletos() {
    try {
        console.log('🔍 Verificando dados no banco VCM...\n');
        
        // 1. Verificar empresas
        const { data: empresas, error: empresaError } = await supabase
            .from('empresas')
            .select('*');
            
        if (empresaError) {
            console.error('❌ Erro ao buscar empresas:', empresaError);
            return;
        }
        
        console.log(`📊 EMPRESAS (${empresas?.length || 0}):`);
        empresas?.forEach((empresa, i) => {
            console.log(`${i+1}. ${empresa.nome} (${empresa.codigo}) - ${empresa.pais}`);
        });
        
        if (!empresas || empresas.length === 0) {
            console.log('❌ PROBLEMA: Nenhuma empresa encontrada!');
            return;
        }
        
        const empresaId = empresas[0].id;
        console.log(`\n🎯 Verificando dados para empresa: ${empresas[0].nome} (ID: ${empresaId})\n`);
        
        // 2. Verificar personas
        const { data: personas, error: personaError } = await supabase
            .from('personas')
            .select('*')
            .eq('empresa_id', empresaId);
            
        console.log(`👥 PERSONAS (${personas?.length || 0}):`);
        if (personas && personas.length > 0) {
            personas.slice(0, 3).forEach((persona, i) => {
                console.log(`${i+1}. ${persona.full_name} - ${persona.role}`);
                console.log(`   Bio existe: ${persona.biografia_completa ? 'SIM' : 'NÃO'}`);
                console.log(`   Personalidade: ${persona.personalidade ? 'SIM' : 'NÃO'}`);
            });
            console.log(`   ... e mais ${personas.length - 3} personas`);
        } else {
            console.log('❌ PROBLEMA: Nenhuma persona encontrada!');
        }
        
        // 3. Verificar competências (usando JOIN com personas)
        const { data: competencias, error: compError } = await supabase
            .from('competencias')
            .select(`
                *,
                personas!inner(empresa_id)
            `)
            .eq('personas.empresa_id', empresaId);
            
        console.log(`\n🧠 COMPETÊNCIAS (${competencias?.length || 0}):`);
        if (competencias && competencias.length > 0) {
            const porTipo = competencias.reduce((acc, comp) => {
                acc[comp.tipo] = (acc[comp.tipo] || 0) + 1;
                return acc;
            }, {});
            
            Object.entries(porTipo).forEach(([tipo, count]) => {
                console.log(`   ${tipo}: ${count}`);
            });
        } else {
            console.log('❌ PROBLEMA: Nenhuma competência encontrada!');
        }
        
        // 4. Verificar outras tabelas
        const tabelas = ['tech_specifications', 'rag_knowledge_base', 'n8n_workflows'];
        
        for (const tabela of tabelas) {
            try {
                const { data, error } = await supabase
                    .from(tabela)
                    .select('*')
                    .eq('empresa_id', empresaId);
                    
                console.log(`\n📋 ${tabela.toUpperCase()} (${data?.length || 0}):`);
                if (data && data.length > 0) {
                    console.log(`   ✅ ${data.length} registros encontrados`);
                } else {
                    console.log(`   ❌ Nenhum registro encontrado`);
                }
            } catch (err) {
                console.log(`   ⚠️ Tabela ${tabela} não existe ou erro: ${err.message}`);
            }
        }
        
        // 5. Testar conexão com dashboard
        console.log(`\n🔗 TESTE DE CONECTIVIDADE:`);
        console.log(`   Supabase URL: ${supabaseUrl}`);
        console.log(`   Service Key configurada: ${supabaseKey ? 'SIM' : 'NÃO'}`);
        
        // 6. Verificar última atualização
        if (personas && personas.length > 0) {
            const ultimaAtualizacao = personas.sort((a, b) => 
                new Date(b.created_at || b.updated_at) - new Date(a.created_at || a.updated_at)
            )[0];
            
            console.log(`\n⏰ ÚLTIMA ATUALIZAÇÃO:`);
            console.log(`   Persona: ${ultimaAtualizacao.full_name}`);
            console.log(`   Data: ${ultimaAtualizacao.created_at || ultimaAtualizacao.updated_at || 'Não informado'}`);
        }
        
            console.log(`🎯 RESUMO:`);
            console.log(`   Empresas: ${empresas?.length || 0}`);
            console.log(`   Personas: ${personas?.length || 0}`);
            console.log(`   Competências: ${competencias?.length || 0}`);
        
        return {
            empresas: empresas?.length || 0,
            personas: personas?.length || 0,
            competencias: competencias?.length || 0
        };
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        console.error('🔧 Stack:', error.stack);
    }
}

verificarDadosCompletos();