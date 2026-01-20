// FORÇA ATUALIZAÇÃO PARA FORMATO firstname.lastname@arvabot.com
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔄 FORÇA FORMATO firstname.lastname@arvabot.com');
console.log('==============================================');

async function forceCorrectEmailFormat() {
  try {
    // Buscar todas as personas da ARVA Tech
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, full_name, email')
      .like('email', '%@arvabot.com');

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log(`📊 ${personas.length} personas encontradas`);

    const usedEmails = new Set();
    let updated = 0;

    for (const persona of personas) {
      const cleanName = persona.full_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '') // Remove acentos
        .replace(/[^a-z\\s]/g, '') // Remove caracteres especiais
        .trim();

      const nameParts = cleanName.split(' ').filter(part => part.length > 0);
      
      if (nameParts.length < 2) {
        console.log(`⚠️ ${persona.full_name}: nome insuficiente para formato firstname.lastname`);
        continue;
      }

      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      
      // Formato obrigatório: firstname.lastname@arvabot.com
      let newEmail = `${firstName}.${lastName}@arvabot.com`;
      let counter = 1;

      // Resolver duplicatas
      while (usedEmails.has(newEmail)) {
        newEmail = `${firstName}.${lastName}${counter}@arvabot.com`;
        counter++;
      }

      usedEmails.add(newEmail);

      // Verificar se precisa atualizar
      if (persona.email === newEmail) {
        console.log(`✅ ${persona.full_name}: já no formato correto (${newEmail})`);
        continue;
      }

      // Atualizar
      const { error: updateError } = await supabase
        .from('personas')
        .update({
          email: newEmail,
          updated_at: new Date().toISOString()
        })
        .eq('id', persona.id);

      if (updateError) {
        console.error(`❌ ${persona.full_name}: erro -`, updateError);
      } else {
        console.log(`🔄 ${persona.full_name}: ${persona.email} → ${newEmail}`);
        updated++;
      }
    }

    console.log(`\\n✅ ${updated} emails atualizados para formato firstname.lastname@arvabot.com`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

forceCorrectEmailFormat();