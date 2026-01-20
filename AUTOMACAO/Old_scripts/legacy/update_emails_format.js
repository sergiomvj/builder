// SCRIPT PARA ATUALIZAR EMAILS EXISTENTES PARA FORMATO firstname.lastname@arvabot.com
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📧 ATUALIZAÇÃO EMAILS - FORMATO firstname.lastname@arvabot.com');
console.log('==========================================================');

/**
 * Gera email no formato firstname.lastname@arvabot.com
 */
function generateCorrectEmail(fullName, usedEmails = new Set()) {
  const cleanName = fullName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '') // Remove acentos
    .replace(/[^a-z\\s]/g, '') // Remove caracteres especiais
    .trim();

  const nameParts = cleanName.split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 0) {
    return null;
  }

  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  
  // Formato: firstname.lastname@arvabot.com
  let baseEmail;
  if (lastName) {
    baseEmail = `${firstName}.${lastName}@arvabot.com`;
  } else {
    baseEmail = `${firstName}@arvabot.com`;
  }

  // Verificar duplicatas e adicionar número se necessário
  let finalEmail = baseEmail;
  let counter = 1;

  while (usedEmails.has(finalEmail)) {
    if (lastName) {
      finalEmail = `${firstName}.${lastName}${counter}@arvabot.com`;
    } else {
      finalEmail = `${firstName}${counter}@arvabot.com`;
    }
    counter++;
    
    if (counter > 100) {
      return null; // Evitar loop infinito
    }
  }

  usedEmails.add(finalEmail);
  return finalEmail;
}

async function updateEmailsToCorrectFormat() {
  try {
    // 1. Buscar todas as personas da ARVA Tech
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, full_name, email, empresas!inner(codigo, nome)')
      .eq('empresas.codigo', 'ARVATE49');

    if (error) {
      console.error('❌ Erro ao buscar personas:', error);
      return;
    }

    if (!personas || personas.length === 0) {
      console.log('⚠️ Nenhuma persona encontrada');
      return;
    }

    console.log(`📊 ${personas.length} personas encontradas para atualizar`);

    const usedEmails = new Set();
    let updated = 0;
    let skipped = 0;

    // 2. Atualizar cada persona
    for (const persona of personas) {
      const novoEmail = generateCorrectEmail(persona.full_name, usedEmails);
      
      if (!novoEmail) {
        console.log(`⚠️ ${persona.full_name}: não foi possível gerar email válido`);
        skipped++;
        continue;
      }

      // Verificar se precisa atualizar
      if (persona.email === novoEmail) {
        console.log(`⏭️ ${persona.full_name}: email já está no formato correto (${novoEmail})`);
        skipped++;
        continue;
      }

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('personas')
        .update({
          email: novoEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (updateError) {
        console.error(`❌ ${persona.full_name}: erro ao atualizar -`, updateError);
        skipped++;
      } else {
        console.log(`✅ ${persona.full_name}: ${persona.email} → ${novoEmail}`);
        updated++;
      }
    }

    console.log(`\\n📊 RESULTADO:`);
    console.log(`   ✅ Atualizadas: ${updated}`);
    console.log(`   ⏭️ Ignoradas: ${skipped}`);
    console.log(`   📧 Formato: firstname.lastname@arvabot.com`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

updateEmailsToCorrectFormat();