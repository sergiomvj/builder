const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

async function nuke() {
    console.log('☢️ STARTING GLOBAL WIPE (ALL PROJECTS) ☢️');
    console.log(`Target: ${supabaseUrl}`);

    // 1. Get IDs
    const { data: projects, error: listError } = await supabase
        .from('projects')
        .select('id');

    if (listError) {
        console.error('❌ Error listing:', listError);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log('✅ Database is ALREADY EMPTY.');
        return;
    }

    console.log(`⚠️ Found ${projects.length} projects to delete.`);

    // 2. Delete each loop (safer for cascades)
    for (const p of projects) {
        console.log(`Deleting ${p.id}...`);

        // Manual cleanup of deps just in case cascades fail
        await supabase.from('chat_logs').delete().eq('project_id', p.id);
        await supabase.from('saved_analyses').delete().eq('project_id', p.id); // If exists

        const { error: delError } = await supabase
            .from('projects')
            .delete()
            .eq('id', p.id);

        if (delError) console.error(`❌ Failed to delete ${p.id}:`, delError);
        else console.log(`✅ Deleted ${p.id}`);
    }

    console.log('🏁 GLOBAL WIPE COMPLETE.');
}

nuke();
