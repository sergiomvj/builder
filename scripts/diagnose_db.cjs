const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read .env file directly to verify what's actually on disk
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvValue = (key) => {
    const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return match ? match[1].trim() : null;
};

const url = getEnvValue('NEXT_PUBLIC_SUPABASE_URL');
const serviceKey = getEnvValue('SUPABASE_SERVICE_ROLE_KEY');

console.log('--- DIAGNOSTIC START ---');
console.log(`Target URL: ${url}`);
console.log(`Service Key Found: ${serviceKey ? 'YES' : 'NO'}`);
if (serviceKey) console.log(`Service Key Preview: ${serviceKey.substring(0, 15)}...`);

if (!url || !serviceKey) {
    console.error('CRITICAL: Missing credentials in .env');
    process.exit(1);
}

// 2. Connect
const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function check() {
    console.log('\nQuerying "projects" table...');
    const { data, error } = await supabase.from('projects').select('id, name, created_at');

    if (error) {
        console.error('QUERY ERROR:', error);
    } else {
        console.log(`FOUND: ${data.length} projects`);
        data.forEach(p => {
            console.log(` - [${p.id}] ${p.name} (${p.created_at})`);
        });
    }
    console.log('--- DIAGNOSTIC END ---');
}

check();
