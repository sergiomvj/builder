/**
 * SCRIPT DE CORREÇÃO: Fix Email Domains
 * =====================================
 * Corrige domínios de email das personas que foram gerados com números incorretos
 * 
 * Problema: Emails como "nome@lifewayusa7647.com" (código inclui número)
 * Solução: Mudar para "nome@lifewayusa.com" (baseado no nome da empresa)
 */

require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

async function main() {
  console.log('\n🔧 CORREÇÃO DE DOMÍNIOS DE EMAIL');
  console.log('=================================\n');

  // 1. Buscar empresas
  const { data: empresas, error: empresasError } = await supabase
    .from('empresas')
    .select('id, nome, codigo, dominio');

  if (empresasError) {
    console.error('❌ Erro ao buscar empresas:', empresasError.message);
    process.exit(1);
  }

  console.log(`📊 ${empresas.length} empresas encontradas\n`);

  let totalCorrigidos = 0;

  for (const empresa of empresas) {
    console.log(`\n🏢 Processando: ${empresa.nome}`);
    console.log(`   Código: ${empresa.codigo}`);

    // Determinar domínio correto
    let dominioCorreto = empresa.dominio;
    if (!dominioCorreto) {
      const empresaSlug = slugify(empresa.nome).replace(/[0-9]/g, '');
      dominioCorreto = `${empresaSlug}.com`;
    }
    dominioCorreto = dominioCorreto.replace('https://', '').replace('http://', '').replace(/\/+$/, '');

    console.log(`   Domínio correto: ${dominioCorreto}`);

    // Buscar personas desta empresa
    const { data: personas, error: personasError } = await supabase
      .from('personas')
      .select('id, full_name, email')
      .eq('empresa_id', empresa.id);

    if (personasError) {
      console.error(`   ❌ Erro ao buscar personas: ${personasError.message}`);
      continue;
    }

    console.log(`   📋 ${personas.length} personas encontradas`);

    let corrigidos = 0;

    for (const persona of personas) {
      if (!persona.email || !persona.email.includes('@')) continue;

      const [localPart, currentDomain] = persona.email.split('@');

      // Verificar se domínio está incorreto
      if (currentDomain !== dominioCorreto) {
        const novoEmail = `${localPart}@${dominioCorreto}`;

        // Verificar se novo email já existe
        const { data: existing } = await supabase
          .from('personas')
          .select('id')
          .eq('email', novoEmail)
          .neq('id', persona.id)
          .maybeSingle();

        if (existing) {
          console.log(`   ⚠️  Conflito: ${novoEmail} já existe, pulando...`);
          continue;
        }

        // Atualizar
        const { error: updateError } = await supabase
          .from('personas')
          .update({ email: novoEmail })
          .eq('id', persona.id);

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar ${persona.full_name}: ${updateError.message}`);
        } else {
          console.log(`   ✅ ${persona.full_name}: ${persona.email} → ${novoEmail}`);
          corrigidos++;
          totalCorrigidos++;
        }
      }
    }

    console.log(`   📊 ${corrigidos} emails corrigidos nesta empresa`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ CORREÇÃO CONCLUÍDA`);
  console.log(`   Total de emails corrigidos: ${totalCorrigidos}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
