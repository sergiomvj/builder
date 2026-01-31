const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function debugDelete() {
    // Project ID from user log
    const projectId = 'a2668193-c12a-4766-a627-e450bfbd6f51';

    console.log(`🔍 Inspecting Project: ${projectId}`);

    // 1. List All Projects
    console.log('📋 Listing ALL projects in DB:');
    const { data: allProjects, error: listError } = await supabase
        .from('projects')
        .select('id, name');

    if (listError) console.error(listError);
    else {
        console.log(`Found ${allProjects.length} total projects.`);
        const target = allProjects.find(p => p.id === projectId);
        if (target) {
            console.log('✅ FOUND TARGET ID in list:', target);
        } else {
            console.log('❌ TARGET ID NOT FOUND in list. Dumping first 5 IDs:');
            allProjects.slice(0, 5).forEach(p => console.log(`${p.id} : ${p.name}`));
        }
    }

    // 2. Check Companies
    const { data: companies } = await supabase.from('empresas').select('id').eq('project_id', projectId);
    console.log(`🏢 Linked Companies: ${companies?.length}`);

    // 3. Check Chat Logs
    const { data: chatLogs } = await supabase.from('chat_logs').select('id').eq('project_id', projectId);
    console.log(`💬 Linked Chat Logs: ${chatLogs?.length}`);

    // 4. Attempt Direct Deletion with Error Capture
    console.log('💣 Attempting DELETE on projects...');
    const { data: delData, error: delError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .select();

    if (delError) {
        console.error('❌ DELETE FAILED:', delError);
        console.error('Code:', delError.code);
        console.error('Details:', delError.details);
        console.error('Hint:', delError.hint);
    } else {
        console.log('✅ DELETE SUCCESS (Available Data):', delData);
        if (delData && delData.length === 0) {
            console.warn('⚠️ Delete returned 0 rows! Verify RLS or Triggers.');
        }
    }
}

debugDelete();
