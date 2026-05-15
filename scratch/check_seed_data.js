import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('subsistemas').select('count', { count: 'exact', head: true });
  if (error) {
    console.error('❌ Erro ao consultar subsistemas:', error.message);
  } else {
    console.log('✅ Subsistemas encontrados:', data);
  }
}

test();
