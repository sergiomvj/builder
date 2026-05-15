import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  const tables = [
    'ideas',
    'projects',
    'empresas',
    'personas',
    'tasks',
    'system_config',
    'system_configs',
    'llm_logs',
    'llm_usage_logs',
    'subsistemas'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`Table [${table}] Error: ${error.code} - ${error.message}`);
    } else {
      console.log(`Table [${table}] EXISTS`);
    }
  }
}

testTables();
