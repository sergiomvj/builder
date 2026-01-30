
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

async function checkSystemPrompt() {
    const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .eq('key', 'genesis_prompt')
        .single();

    if (error) {
        console.error('Error fetching system config:', error);
        return;
    }

    if (!data) {
        console.log('No custom genesis_prompt found in system_config. Using file prompt.');
        return;
    }

    console.log('--- Custom Genesis Prompt Found ---');
    console.log('Length:', data.value.length);

    // Check for presence of missing keys
    const promptValue = data.value;
    const missingKeys = ['why_not_100', 'potential_improvements', 'lead_generation_strategy'];

    missingKeys.forEach(key => {
        if (promptValue.includes(key)) {
            console.log(`✅ Contains "${key}"`);
        } else {
            console.error(`❌ MISSING "${key}"`);
        }
    });

    // Print snippet?
    console.log('\n--- Snippet (Msg Structure) ---');
    const index = promptValue.indexOf('ESTRUTURA OBRIGATÓRIA DO JSON');
    if (index !== -1) {
        console.log(promptValue.substring(index, index + 1500));
    }
}

checkSystemPrompt();
