const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const supabaseUrl = process.env.VCM_SUPABASE_URL;
const supabaseKey = process.env.VCM_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarEstruturaBanco() {
    try {
        console.log('🔍 Verificando estrutura do banco...\n');
        
        // Buscar todas as tabelas
        const { data: tabelas, error } = await supabase
            .rpc('get_table_names');

        if (error) {
            // Método alternativo - tentar acessar cada tabela
            const tabelasEsperadas = [
                'empresas', 
                'personas', 
                'competencias', 
                'tech_specifications',
                'rag_knowledge_base', 
                'n8n_workflows',
                'objetivos',
                'auditorias'
            ];

            console.log('📋 Verificando tabelas individualmente:\n');
            
            for (const tabela of tabelasEsperadas) {
                try {
                    const { data, error: tabelaError } = await supabase
                        .from(tabela)
                        .select('*', { count: 'exact' })
                        .limit(1);
                        
                    if (tabelaError) {
                        console.log(`❌ ${tabela}: NÃO EXISTE - ${tabelaError.message}`);
                    } else {
                        console.log(`✅ ${tabela}: EXISTS`);
                    }
                } catch (err) {
                    console.log(`❌ ${tabela}: ERRO - ${err.message}`);
                }
            }
        } else {
            console.log('✅ Tabelas encontradas:', tabelas);
        }
        
        // Verificar se podemos criar tabelas
        console.log('\n🔨 Testando criação de tabela tech_specifications...');
        
        const createTableSQL = `
        CREATE TABLE IF NOT EXISTS tech_specifications (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE,
            persona_id uuid REFERENCES personas(id) ON DELETE CASCADE,
            role text NOT NULL,
            tools text[] DEFAULT '{}',
            technologies text[] DEFAULT '{}',
            methodologies text[] DEFAULT '{}',
            sales_enablement text[] DEFAULT '{}',
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );`;
        
        const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
            query: createTableSQL
        });
        
        if (createError) {
            console.log('❌ Erro ao criar tabela:', createError.message);
            
            // Tentar método alternativo
            console.log('\n🔧 Tentando criar via SQL direto...');
            
            const { error: directError } = await supabase
                .from('pg_tables')
                .select('*')
                .eq('tablename', 'tech_specifications');
                
            if (directError) {
                console.log('❌ Tabela não existe e não conseguimos criar');
            }
        } else {
            console.log('✅ Tabela tech_specifications criada/verificada');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

verificarEstruturaBanco();