
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestAnalysis() {
    const { data, error } = await supabase
        .from('saved_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching analysis:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No analyses found.');
        return;
    }

    const analysis = data[0];
    console.log('Latest Analysis ID:', analysis.id);
    console.log('--- Content Keys ---');
    console.log(Object.keys(analysis.content));

    console.log('\n--- Why Not 100? ---');
    console.log(JSON.stringify(analysis.content.why_not_100, null, 2));

    console.log('\n--- Potential Improvements ---');
    console.log(JSON.stringify(analysis.content.potential_improvements || analysis.content.improvements, null, 2));

    console.log('\n--- Lead Generation ---');
    console.log(JSON.stringify(analysis.content.lead_generation_strategy || analysis.content.lead_strategy, null, 2));
}

checkLatestAnalysis();
