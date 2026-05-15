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

async function listTables() {
  const { data, error } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public');

  if (error) {
    // If pg_tables is not accessible via RPC/Rest, we might need another way or just check common names
    console.error('Error fetching tables:', error);
    
    // Try a simple query to a known table like 'ideas' or 'projects'
    const { error: ideasError } = await supabase.from('ideas').select('count', { count: 'exact', head: true });
    console.log('Ideas table exists:', !ideasError);
    
    const { error: projectsError } = await supabase.from('projects').select('count', { count: 'exact', head: true });
    console.log('Projects table exists:', !projectsError);

    const { error: configError } = await supabase.from('system_configs').select('count', { count: 'exact', head: true });
    console.log('system_configs table exists:', !configError);

    return;
  }

  console.log('Tables:');
  console.table(data);
}

listTables();
