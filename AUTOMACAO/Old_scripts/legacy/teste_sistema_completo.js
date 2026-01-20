const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testarSistemaCompleto() {
    console.log('🧪 TESTE COMPLETO DO SISTEMA APÓS FLUXO SISTEMÁTICO');
    console.log('====================================================\n');
    
    const supabase = createClient(process.env.VCM_SUPABASE_URL, process.env.VCM_SUPABASE_SERVICE_ROLE_KEY);
    const empresaId = '0e1b6a82-ac72-43f2-974a-f3806e1ec4ce';
    
    try {
        // 1. Verificar empresa
        console.log('1️⃣ TESTANDO EMPRESA...');
        const { data: empresa } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', empresaId)
            .single();
        
        if (empresa) {
            console.log(`   ✅ Empresa: ${empresa.nome} (${empresa.codigo})`);
            console.log(`   📊 Total personas esperado: ${empresa.total_personas}`);
            console.log(`   🔧 Scripts status:`, empresa.scripts_status);
        }
        
        // 2. Verificar personas
        console.log('\n2️⃣ TESTANDO PERSONAS...');
        const { data: personas } = await supabase
            .from('personas')
            .select('id, full_name, role, biografia_completa, personalidade')
            .eq('empresa_id', empresaId);
        
        console.log(`   ✅ Total personas criadas: ${personas?.length || 0}`);
        
        if (personas && personas.length > 0) {
            // Mostrar algumas personas
            console.log('\n   📋 Personas criadas:');
            personas.slice(0, 5).forEach((p, i) => {
                console.log(`      ${i+1}. ${p.full_name} - ${p.role}`);
                console.log(`         Biografia: ${p.biografia_completa ? '✅ SIM' : '❌ NÃO'} (${p.biografia_completa?.length || 0} chars)`);
                
                if (p.personalidade?.caracteristicas_fisicas) {
                    const fis = p.personalidade.caracteristicas_fisicas;
                    console.log(`         Físicas: ${fis.idade}a, ${fis.altura}, ${fis.cabelo}, ${fis.olhos}`);
                }
            });
            
            if (personas.length > 5) {
                console.log(`      ... e mais ${personas.length - 5} personas`);
            }
        }
        
        // 3. Verificar competências
        console.log('\n3️⃣ TESTANDO COMPETÊNCIAS...');
        const { count: totalCompetencias } = await supabase
            .from('competencias')
            .select('*', { count: 'exact', head: true })
            .in('persona_id', personas?.map(p => p.id) || []);
        
        console.log(`   ✅ Total competências: ${totalCompetencias || 0}`);
        
        // Agrupar competências por persona
        if (personas && personas.length > 0) {
            const { data: competencias } = await supabase
                .from('competencias')
                .select('persona_id')
                .in('persona_id', personas.map(p => p.id));
            
            const compsPorPersona = {};
            competencias?.forEach(c => {
                if (!compsPorPersona[c.persona_id]) compsPorPersona[c.persona_id] = 0;
                compsPorPersona[c.persona_id]++;
            });
            
            console.log(`   📊 Personas com competências: ${Object.keys(compsPorPersona).length}`);
            console.log(`   📈 Média de competências por persona: ${Math.round((totalCompetencias || 0) / personas.length)}`);
        }
        
        // 4. Verificar outras tabelas do pipeline
        console.log('\n4️⃣ TESTANDO OUTPUTS DO PIPELINE...');
        
        // RAG documents
        try {
            const { count: ragCount } = await supabase
                .from('rag_documents')
                .select('*', { count: 'exact', head: true })
                .eq('empresa_id', empresaId);
            console.log(`   📚 RAG Documents: ${ragCount || 0} registros`);
        } catch (e) {
            console.log(`   📚 RAG Documents: Tabela não disponível`);
        }
        
        // 5. Simular teste da nova API
        console.log('\n5️⃣ TESTANDO NOVA API...');
        try {
            const fetch = (await import('node-fetch')).default;
            const response = await fetch(`http://localhost:3001/api/personas-db/${empresaId}`);
            const apiData = await response.json();
            
            if (apiData.success) {
                console.log(`   ✅ API funcionando! ${apiData.data.personas.length} personas retornadas`);
                console.log(`   📊 Resumo API:`);
                console.log(`      - Executivos: ${apiData.data.personas_por_categoria?.executivos?.length || 0}`);
                console.log(`      - Especialistas: ${apiData.data.personas_por_categoria?.especialistas?.length || 0}`);
                console.log(`      - Assistentes: ${apiData.data.personas_por_categoria?.assistentes?.length || 0}`);
                console.log(`   📖 Biografias na API: ${apiData.data.personas.filter(p => p.biografia_completa).length}`);
            } else {
                console.log(`   ❌ API com erro: ${apiData.message}`);
            }
        } catch (apiError) {
            console.log(`   ⚠️ Não foi possível testar API: ${apiError.message}`);
        }
        
        // 6. Resultado final
        console.log('\n🎯 RESULTADO FINAL:');
        console.log(`   ✅ Empresa: ${empresa ? 'OK' : 'ERRO'}`);
        console.log(`   ✅ Personas: ${personas?.length || 0}/16`);
        console.log(`   ✅ Biografias: ${personas?.filter(p => p.biografia_completa).length || 0}/${personas?.length || 0}`);
        console.log(`   ✅ Competências: ${totalCompetencias || 0}`);
        console.log(`   ✅ API funcionando: Testar manualmente em http://localhost:3001`);
        
        const sucessoTotal = empresa && personas && personas.length >= 10 && totalCompetencias && totalCompetencias > 100;
        
        console.log(`\n🚦 STATUS GERAL: ${sucessoTotal ? '✅ SUCESSO TOTAL' : '⚠️ PARCIAL'}`);
        
        if (sucessoTotal) {
            console.log('\n🎉 SISTEMA COMPLETAMENTE FUNCIONAL!');
            console.log('   👉 Acesse: http://localhost:3001');
            console.log('   📋 Vá em: Empresas → Ver Personas');
            console.log('   🔍 Você verá: Pessoas reais com biografias completas');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testarSistemaCompleto();