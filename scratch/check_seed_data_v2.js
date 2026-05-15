import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error, count } = await supabase.from('subsistemas').select('*', { count: 'exact' });
  if (error) {
    console.error('❌ Erro:', error.message);
  } else {
    console.log('✅ Subsistemas encontrados:', count);
    if (data && data.length > 0) {
      console.log('Primeiro subsistema:', data[0].nome);
    }
  }
}

test();
