import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('❌ Missing environment variables!');
    console.error('URL:', url);
    console.error('Key present:', !!key);
    process.exit(1);
}

console.log('🔌 Connecting to Supabase:', url);
const supabase = createClient(url, key);

async function runDebug() {
    console.log('\n--- DIAGNOSTIC START ---');

    // 1. Check if table exists (by selecting)
    console.log('1. Testing READ access...');
    const { data: startData, error: readError } = await supabase
        .from('llm_logs')
        .select('count', { count: 'exact', head: true });

    if (readError) {
        console.error('❌ READ FAILED:', readError.message);
        if (readError.code === '42P01') {
            console.error('💡 HINT: Table "llm_logs" does not exist. Did you run the SQL?');
        }
    } else {
        console.log('✅ READ SUCCESS. Row count:', startData); // count is in count property usually, but head:true returns null data
    }

    // 2. Try INSERT
    console.log('\n2. Testing WRITE access...');
    const testLog = {
        prompt_type: 'debug_probe',
        full_prompt_sent: 'Debug Probe ' + new Date().toISOString(),
        llm_response: { status: 'ok' },
        expected_deliverables: ['debug'],
        missing_deliverables: [],
        status: 'success'
    };

    const { data: insertData, error: insertError } = await supabase
        .from('llm_logs')
        .insert(testLog)
        .select();

    if (insertError) {
        console.error('❌ WRITE FAILED:', insertError.message);
        console.error('Details:', insertError);
    } else {
        console.log('✅ WRITE SUCCESS:', insertData);
    }

    console.log('--- DIAGNOSTIC END ---\n');
}

runDebug();
