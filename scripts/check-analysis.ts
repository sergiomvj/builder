
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) { process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnalyses() {
    const { data, error } = await supabase
        .from('saved_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        if (data && data.length > 0) {
            const a = data[0];
            console.log('Most recent analysis:', a.title);
            console.log('Created at:', a.created_at);

            const content = a.content;
            console.log('Has lead_generation_strategy?', !!content.lead_generation_strategy);
            if (content.lead_generation_strategy) {
                console.log('Lead Generation Keys:', Object.keys(content.lead_generation_strategy));
            }

            console.log('Has potential_improvements?', !!content.potential_improvements);
            if (content.potential_improvements) {
                console.log('Is Array?', Array.isArray(content.potential_improvements));
                if (Array.isArray(content.potential_improvements)) {
                    console.log('Length:', content.potential_improvements.length);
                    console.log('Sample:', content.potential_improvements[0]);
                } else {
                    console.log('Value:', content.potential_improvements);
                }
            }
        } else {
            console.log('No analyses found.');
        }
    }
}

checkAnalyses();
