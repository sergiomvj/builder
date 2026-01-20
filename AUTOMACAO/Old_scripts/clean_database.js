import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🗑️  LIMPEZA COMPLETA DO BANCO DE DADOS');
console.log('=====================================\n');

async function limparBanco() {
  try {
    // 1. Deletar audit_logs primeiro (tem FK para empresas)
    console.log('1️⃣  Deletando audit_logs...');
    const { error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (auditError) console.warn('   ⚠️  ', auditError.message);
    else console.log('   ✅ Deletado\n');

    // 2. Deletar todos os avatares multimedia
    console.log('2️⃣  Deletando avatares_multimedia...');
    const { error: avatarMultiError } = await supabase
      .from('avatares_multimedia')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (avatarMultiError) console.warn('   ⚠️  ', avatarMultiError.message);
    else console.log('   ✅ Deletado\n');

    // 3. Deletar todas as personas
    console.log('3️⃣  Deletando personas...');
    const { error: personasError } = await supabase
      .from('personas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (personasError) console.warn('   ⚠️  ', personasError.message);
    else console.log('   ✅ Deletado\n');

    // 4. Deletar todas as empresas
    console.log('4️⃣  Deletando empresas...');
    const { error: empresasError } = await supabase
      .from('empresas')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (empresasError) console.warn('   ⚠️  ', empresasError.message);
    else console.log('   ✅ Deletado\n');

    console.log('✅ BANCO DE DADOS LIMPO COM SUCESSO!');
    console.log('\n📝 Próximo passo:');
    console.log('   1. Acesse http://localhost:3001');
    console.log('   2. Crie uma nova empresa pela interface');
    console.log('   3. Execute: node AUTOMACAO/00_create_personas_from_structure.js --empresaId=UUID');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

limparBanco();
