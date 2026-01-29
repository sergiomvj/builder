require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Supabase URL and Key are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyWorkflowsPersistence() {
    console.log('🚀 Verifying Workflows Persistence...\n');

    // 1. Create a dummy project
    const { data: project, error: projError } = await supabase.from('projects').insert({
        name: 'Workflow Test Project',
        description: 'Testing metadata workflows'
    }).select().single();

    if (projError) {
        console.error('❌ Could not create test project:', projError.message);
        return;
    }

    const projectId = project.id;
    console.log(`✅ Created test project: ${projectId}`);

    // 2. Simulate "update_workflows" logic from route.ts
    const newWorkflows = [
        {
            id: 'wf-1',
            task_title: 'Test Workflow Task',
            task_description: 'Description of test task',
            status: 'identified',
            steps: ['Step 1', 'Step 2']
        }
    ];

    // Fetch existing
    const { data: fetch1 } = await supabase.from('projects').select('metadata').eq('id', projectId).single();
    console.log('Current metadata:', fetch1.metadata);

    // Update
    const updatedMetadata = { ...fetch1.metadata, workflows: newWorkflows };
    const { error: updateError } = await supabase.from('projects').update({ metadata: updatedMetadata }).eq('id', projectId);

    if (updateError) {
        console.error('❌ Update Failed:', updateError.message);
    } else {
        console.log('✅ Update executed.');
    }

    // 3. Read it back
    const { data: readData, error: readError } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .single();

    if (readError) {
        console.error('❌ Read Failed:', readError.message);
    } else {
        const savedWorkflows = readData.metadata?.workflows;
        if (savedWorkflows && savedWorkflows.length === 1 && savedWorkflows[0].id === 'wf-1') {
            console.log('✅ Success: Workflows persisted in metadata.');
        } else {
            console.error('❌ Failure: Workflows not found in metadata.', readData.metadata);
        }
    }

    // 4. Cleanup
    await supabase.from('projects').delete().eq('id', projectId);
    console.log('✅ Cleanup Done.');
}

verifyWorkflowsPersistence().catch(console.error);
