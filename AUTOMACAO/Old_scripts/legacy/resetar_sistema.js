require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetarSistema() {
    console.log('🧹 LIMPEZA TOTAL DO SISTEMA');
    console.log('⚠️  Esta operação vai EXCLUIR TUDO!');
    
    try {
        // 1. Excluir todas as personas
        console.log('\n1️⃣ Excluindo todas as personas...');
        const { error: personasError } = await supabase
            .from('personas')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (personasError) {
            console.error('❌ Erro ao excluir personas:', personasError);
        } else {
            console.log('✅ Todas as personas excluídas');
        }
        
        // 2. Excluir todas as empresas
        console.log('\n2️⃣ Excluindo todas as empresas...');
        const { error: empresasError } = await supabase
            .from('empresas')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        
        if (empresasError) {
            console.error('❌ Erro ao excluir empresas:', empresasError);
        } else {
            console.log('✅ Todas as empresas excluídas');
        }
        
        // 3. Verificar limpeza
        console.log('\n3️⃣ Verificando limpeza...');
        const { data: empresasRestantes } = await supabase
            .from('empresas')
            .select('count', { count: 'exact' });
            
        const { data: personasRestantes } = await supabase
            .from('personas')
            .select('count', { count: 'exact' });
        
        console.log(`📊 Empresas restantes: ${empresasRestantes.length || 0}`);
        console.log(`📊 Personas restantes: ${personasRestantes.length || 0}`);
        
        console.log('\n🎉 SISTEMA LIMPO! Pronto para recomeçar.');
        
    } catch (error) {
        console.error('💥 Erro durante a limpeza:', error);
    }
    
    process.exit(0);
}

resetarSistema();