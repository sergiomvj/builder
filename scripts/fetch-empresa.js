
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Missing Supabase credentials');
    console.log('URL:', url);
    console.log('Key:', key ? '***' : 'undefined');
    process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
    const { data, error } = await supabase.from('empresas').select('id, nome').limit(1).single();
    if (error) {
        console.error(error);
    } else {
        console.log(`ID: ${data.id}`);
        console.log(`Nome: ${data.nome}`);
    }
}

main();
