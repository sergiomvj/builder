import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testQuery() {
  try {
    // Testar query direta
    const { data, error } = await supabase
      .from('personas_avatares')
      .select('persona_id, biometrics')
      .eq('persona_id', '76f4421e-4918-4eab-b67f-34ec44e84385');

    if (error) {
      console.error('Erro na query direta:', error);
      return;
    }

    console.log('Query direta encontrou:', data?.length || 0, 'registros');

    // Testar query com .in()
    const { data: data2, error: error2 } = await supabase
      .from('personas_avatares')
      .select('persona_id, biometrics')
      .in('persona_id', ['76f4421e-4918-4eab-b67f-34ec44e84385']);

    if (error2) {
      console.error('Erro na query .in():', error2);
      return;
    }

    console.log('Query .in() encontrou:', data2?.length || 0, 'registros');

  } catch (err) {
    console.error('Erro geral:', err);
  }
}

testQuery();