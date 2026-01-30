
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    console.log('Available keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConfig() {
    console.log('Checking prompts in DB...');
    const keys = ['team_prompt', 'workflow_prompt'];

    const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .in('key', keys);

    if (error) {
        console.error('Error fetching config:', error);
    } else {
        data.forEach(item => {
            console.log(`\nKey: ${item.key}`);
            console.log(`Length: ${String(item.value).length}`);
            console.log(`Snippet: ${String(item.value).substring(0, 100)}...`);
        });

        if (data.length === 0) {
            console.log('No prompts found for keys:', keys);
        }
    }
}

checkConfig();
