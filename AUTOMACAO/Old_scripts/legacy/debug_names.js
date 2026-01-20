// DEBUG - VERIFICAR NOMES DAS PERSONAS
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const supabaseUrl = 'https://fzyokrvdyeczhfqlwxzb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6eW9rcnZkeWVjemhmcWx3eHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MDQzMzAsImV4cCI6MjA3ODA4MDMzMH0.mf3TC1PxNd9pe9M9o-D_lgqZunUl0kPumS0tU4oKodY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugNames() {
  const { data: personas } = await supabase
    .from('personas')
    .select('full_name, email')
    .like('email', '%@arvabot.com')
    .limit(5);

  personas.forEach((persona, i) => {
    console.log(`${i + 1}. Nome: "${persona.full_name}"`);
    console.log(`   Email: ${persona.email}`);
    console.log(`   Length: ${persona.full_name.length}`);
    console.log(`   Chars: [${persona.full_name.split('').map(c => c.charCodeAt(0)).join(', ')}]`);
    
    const cleanName = persona.full_name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .replace(/[^a-z\\s]/g, '')
      .trim();
    
    console.log(`   Clean: "${cleanName}"`);
    console.log(`   Parts: [${cleanName.split(' ').join(', ')}]`);
    console.log(`   Parts count: ${cleanName.split(' ').filter(p => p.length > 0).length}`);
    console.log('---');
  });
}

debugNames();