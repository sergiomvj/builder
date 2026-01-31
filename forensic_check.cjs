const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load the .env file
const envPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('❌ Failed to load .env file:', result.error);
} else {
    console.log('✅ Loaded .env file');
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n--- ENVIRONMENT DIAGNOSTIC ---');
console.log(`URL: ${url}`);
console.log(`Anon Key (First 10): ${anonKey ? anonKey.substring(0, 10) : 'MISSING'}...`);
console.log(`Service Key (First 10): ${serviceKey ? serviceKey.substring(0, 10) : 'MISSING'}...`);

async function check() {
    console.log('\n--- CONNECTION TEST ---');

    // 1. CLIENT (ANON) VIEW
    if (url && anonKey) {
        const clientSupabase = createClient(url, anonKey);
        const { data: clientData, error: clientError } = await clientSupabase.from('projects').select('id');
        if (clientError) console.error('❌ Client (Anon) Error:', clientError.message);
        else console.log(`👤 Client (Anon) sees: ${clientData.length} projects`);
    }

    // 2. ADMIN (SERVICE) VIEW
    if (url && serviceKey) {
        const adminSupabase = createClient(url, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false }
        });
        const { data: adminData, error: adminError } = await adminSupabase.from('projects').select('id, name');

        if (adminError) {
            console.error('❌ Admin Error:', adminError.message);
        } else {
            console.log(`🛡️  Admin (Service) sees: ${adminData.length} projects`);

            console.log('\n--- ID DUMP (ADMIN) ---');
            adminData.forEach(p => console.log(`${p.id} : ${p.name}`));

            // Check specifically for the ghost ID
            const ghostId = 'a2668193-c12a-4766-a627-e450bfbd6f51'; // From logs
            const found = adminData.find(p => p.id === ghostId);
            if (found) console.log(`\n👻 GHOST ID ${ghostId} FOUND in Admin View!`);
            else console.log(`\n👻 GHOST ID ${ghostId} NOT FOUND in Admin View.`);
        }
    }
}

check();
