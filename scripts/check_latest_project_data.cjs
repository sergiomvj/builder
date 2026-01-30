
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestProject() {
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching project:', error);
        return;
    }

    console.log('--- Project Info ---');
    console.log('ID:', project.id);
    console.log('Name:', project.name);
    console.log('\n--- Metadata Keys ---');
    if (project.metadata) {
        console.log(Object.keys(project.metadata));
        console.log('\n--- Key Metrics ---');
        console.log(JSON.stringify(project.metadata.key_metrics, null, 2));
        console.log('\n--- Risks (risks_and_gaps) ---');
        console.log(JSON.stringify(project.metadata.risks_and_gaps, null, 2));
        console.log('\n--- Risks (risks) ---');
        console.log(JSON.stringify(project.metadata.risks, null, 2));
    } else {
        console.log('Metadata is null');
    }
}

checkLatestProject();
