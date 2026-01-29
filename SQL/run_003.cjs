require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Prefer service key if available for migrations
const keyToUse = serviceKey || supabaseKey;

if (!supabaseUrl || !keyToUse) {
    console.error('❌ Error: Supabase URL and Key are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, keyToUse);

async function runMigration() {
    console.log('🚀 Applying migration 003...\n');

    const sqlPath = path.join(__dirname, '003_fix_personas_and_chat_memory.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split into statements roughly
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s !== '');

    console.log(`📄 Found ${statements.length} statements.`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        console.log(`\nExecuting: ${statement.substring(0, 50)}...`);

        // Try via RPC exec_sql (common pattern in this project it seems)
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
            console.error(`❌ Error in RPC: ${error.message}`);
            // Fallback: This project might not have exec_sql or it might be restricted.
            console.log("   (If exec_sql is missing, you must run this SQL manually in Supabase Dashboard SQL Editor)");
            errorCount++;
        } else {
            console.log('✅ Success via RPC');
            successCount++;
        }
    }

    console.log('\n-----------------------------------');
    console.log(`Summary: ${successCount} Success, ${errorCount} Errors`);

    // Check if table exists now
    const { error: checkError } = await supabase.from('chat_logs').select('count', { count: 'exact', head: true });
    if (!checkError) {
        console.log('✅ chat_logs table is accessible.');
    } else {
        console.log('⚠️ Could not verify chat_logs table: ' + checkError.message);
    }
}

runMigration().catch(console.error);
