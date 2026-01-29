require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Supabase URL and Key are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPersistence() {
    console.log('🚀 Verifying Chat Persistence...\n');


    // Actually, project_id REFERENCES projects(id). So I must use an EXISTING project ID or create a mock one if constraint allows.
    // The migration said "project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE". 
    // So I cannot insert a random string or even a random UUID if that project doesn't exist.

    // Let's first create a dummy project or use one if possible. 
    // For this test script, let's create a temporary project.

    const { data: project, error: projError } = await supabase.from('projects').insert({
        name: 'Temp Test Project',
        description: 'For persistence test'
    }).select().single();

    if (projError) {
        console.error('❌ Could not create test project:', projError.message);
        return;
    }

    const testProjectId = project.id;


    // 1. Insert a test log
    const { data: insertData, error: insertError } = await supabase
        .from('chat_logs')
        .insert({
            project_id: testProjectId,
            mode: 'team',
            role: 'system',
            content: 'Verification test message',
            confirmed: true
        })
        .select()
        .single();

    if (insertError) {
        console.error('❌ Insert Failed:', insertError.message);
        return;
    }

    console.log('✅ Insert Successful:', insertData.id);

    // 2. Read it back
    const { data: readData, error: readError } = await supabase
        .from('chat_logs')
        .select('*')
        .eq('id', insertData.id)
        .single();

    if (readError) {
        console.error('❌ Read Failed:', readError.message);
        return;
    }

    if (readData.content === 'Verification test message') {
        console.log('✅ Read Successful: Content matches.');
    } else {
        console.error('❌ Read Mismatch:', readData);
    }

    // 3. Cleanup
    await supabase.from('chat_logs').delete().eq('id', insertData.id);
    console.log('✅ Cleanup Done.');
}

verifyPersistence().catch(console.error);
