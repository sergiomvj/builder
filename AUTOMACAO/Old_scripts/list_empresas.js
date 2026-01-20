import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env do diretório raiz
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await supabase
  .from('empresas')
  .select('id, nome, codigo, cargos_necessarios, equipe_gerada')
  .order('created_at', { ascending: false })
  .limit(5);

if (error) {
  console.error('Erro:', error);
} else {
  console.log('\n📋 Empresas disponíveis:\n');
  data.forEach((emp, i) => {
    console.log(`${i + 1}. ${emp.nome} (${emp.codigo})`);
    console.log(`   ID: ${emp.id}`);
    console.log(`   Cargos definidos: ${emp.cargos_necessarios ? 'Sim' : 'Não'}`);
    console.log(`   Equipe gerada: ${emp.equipe_gerada ? 'Sim' : 'Não'}\n`);
  });
}
