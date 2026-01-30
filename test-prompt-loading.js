
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { loadPrompt } from './AUTOMACAO/lib/prompt-loader.js';
import path from 'path';

dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    console.log('--- TESTANDO LOAD PROMPT ---');

    // Test Team Prompt
    console.log('\n1. Team Generation Prompt (team_prompt):');
    const teamPrompt = await loadPrompt(supabase, 'team_prompt', 'FALLBACK_DEFAULT');
    console.log('Result:', teamPrompt.substring(0, 100) + '...');

    // Test Workflow Prompt
    console.log('\n2. Workflow Generation Prompt (workflow_prompt):');
    const workflowPrompt = await loadPrompt(supabase, 'workflow_prompt', 'FALLBACK_DEFAULT');
    console.log('Result:', workflowPrompt.substring(0, 100) + '...');

    // Test Genesis Prompt (genesis_prompt)
    console.log('\n3. Genesis Analysis Prompt (genesis_prompt):');
    const genesisPrompt = await loadPrompt(supabase, 'genesis_prompt', 'FALLBACK_DEFAULT');
    console.log('Result:', genesisPrompt.substring(0, 100) + '...');
}

test();
