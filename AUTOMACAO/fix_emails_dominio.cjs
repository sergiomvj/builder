/**
 * Script para corrigir emails com @https:// no domínio
 * 
 * Problema: Emails como "nome@https://arvabot.com" 
 * Correção: "nome@arvabot.com"
 * 
 * Uso: node fix_emails_dominio.cjs --empresaId=UUID
 */

require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('\n🔧 CORREÇÃO DE EMAILS E DOMÍNIO\n');
  
  // Parse empresaId
  const empresaId = process.argv.find(arg => arg.startsWith('--empresaId='))?.split('=')[1];
  
  if (!empresaId) {
    console.log('❌ Erro: --empresaId obrigatório');
    console.log('💡 Uso: node fix_emails_dominio.cjs --empresaId=UUID');
    process.exit(1);
  }

  try {
    // 1. Buscar empresa
    const { data: empresa, error: empresaError } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', empresaId)
      .single();

    if (empresaError || !empresa) {
      console.error('❌ Empresa não encontrada:', empresaError);
      process.exit(1);
    }

    console.log(`📊 Empresa: ${empresa.nome}`);
    console.log(`🌐 Domínio atual: ${empresa.dominio}`);

    // 2. Corrigir domínio da empresa (remover https://)
    let dominioLimpo = empresa.dominio || '';
    if (dominioLimpo.includes('https://')) {
      dominioLimpo = dominioLimpo.replace('https://', '').replace('http://', '');
      
      const { error: updateError } = await supabase
        .from('empresas')
        .update({ dominio: dominioLimpo })
        .eq('id', empresaId);

      if (updateError) {
        console.error('❌ Erro ao atualizar domínio da empresa:', updateError);
      } else {
        console.log(`✅ Domínio corrigido: ${dominioLimpo}`);
      }
    } else {
      console.log('✅ Domínio já está correto');
    }

    // 3. Buscar personas da empresa
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, full_name, email, persona_code')
      .eq('empresa_id', empresaId)
      .order('persona_code');

    if (personasError || !personas || personas.length === 0) {
      console.log('⚠️  Nenhuma persona encontrada');
      return;
    }

    console.log(`\n👥 ${personas.length} personas encontradas\n`);

    // 4. Corrigir emails
    let corrigidos = 0;
    let erros = 0;

    for (const persona of personas) {
      if (!persona.email) continue;

      // Verificar se email tem https:// ou http://
      if (persona.email.includes('https://') || persona.email.includes('http://')) {
        const emailCorrigido = persona.email
          .replace('@https://', '@')
          .replace('@http://', '@');

        console.log(`🔧 ${persona.full_name || persona.persona_code}`);
        console.log(`   Antes: ${persona.email}`);
        console.log(`   Depois: ${emailCorrigido}`);

        const { error: updateError } = await supabase
          .from('personas')
          .update({ email: emailCorrigido })
          .eq('id', persona.id);

        if (updateError) {
          console.log(`   ❌ Erro: ${updateError.message}`);
          erros++;
        } else {
          console.log(`   ✅ Corrigido`);
          corrigidos++;
        }
      }
    }

    // 5. Resumo
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DA CORREÇÃO');
    console.log('='.repeat(50));
    console.log(`✅ Emails corrigidos: ${corrigidos}`);
    console.log(`❌ Erros: ${erros}`);
    console.log(`📧 Total de personas: ${personas.length}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

main();
