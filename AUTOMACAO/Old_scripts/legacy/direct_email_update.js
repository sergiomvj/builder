// CORREÇÃO DIRETA - firstname.lastname@arvabot.com
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🎯 CORREÇÃO DIRETA - firstname.lastname@arvabot.com');
console.log('==================================================');

async function directEmailUpdate() {
  try {
    // Buscar todas as personas
    const { data: personas, error } = await supabase
      .from('personas')
      .select('id, full_name, email')
      .like('email', '%@arvabot.com');

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log(`📊 ${personas.length} personas encontradas`);

    let updated = 0;

    for (const persona of personas) {
      // Debug do nome atual
      console.log(`\\n🔍 Processando: "${persona.full_name}"`);
      
      // Verificar se o nome tem pelo menos um espaço
      if (!persona.full_name.includes(' ')) {
        console.log(`⚠️ Nome sem espaço, pulando...`);
        continue;
      }

      // Dividir o nome no primeiro espaço
      const spaceIndex = persona.full_name.indexOf(' ');
      const firstName = persona.full_name.substring(0, spaceIndex).toLowerCase();
      const lastName = persona.full_name.substring(spaceIndex + 1).toLowerCase();
      
      // Limpar apenas caracteres especiais, mantendo letras
      const cleanFirstName = firstName.replace(/[^a-z]/g, '');
      const cleanLastName = lastName.replace(/[^a-z]/g, '');
      
      console.log(`   FirstName: "${cleanFirstName}"`);
      console.log(`   LastName: "${cleanLastName}"`);

      if (!cleanFirstName || !cleanLastName) {
        console.log(`⚠️ Nome inválido após limpeza`);
        continue;
      }

      // Gerar novo email
      const newEmail = `${cleanFirstName}.${cleanLastName}@arvabot.com`;
      console.log(`   Novo email: ${newEmail}`);

      // Verificar se precisa atualizar
      if (persona.email === newEmail) {
        console.log(`✅ Email já está correto`);
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
        console.error(`❌ Erro ao atualizar:`, updateError.message);
      } else {
        console.log(`✅ ATUALIZADO: ${persona.email} → ${newEmail}`);
        updated++;
      }
    }

    console.log(`\\n🎉 RESULTADO: ${updated} emails atualizados para firstname.lastname@arvabot.com`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

directEmailUpdate();