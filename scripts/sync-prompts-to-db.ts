
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncPrompt(key: string, filePath: string) {
    try {
        const fullPath = path.resolve(process.cwd(), filePath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️ File not found: ${filePath}`);
            return;
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        console.log(`📄 Read ${content.length} chars from ${filePath}`);

        const { error } = await supabase
            .from('system_config')
            .upsert({
                key: key,
                value: content,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) {
            console.error(`❌ Failed to sync ${key}:`, error.message);
        } else {
            console.log(`✅ Synced ${key} to system_config`);
        }
    } catch (err: any) {
        console.error(`❌ Error syncing ${key}:`, err.message);
    }
}

async function main() {
    console.log('🔄 Syncing Prompts to Database...');

    await syncPrompt('genesis_prompt', 'prompts/genesis-analysis.md');
    await syncPrompt('team_prompt', 'prompts/team-generation.md');
    await syncPrompt('workflow_prompt', 'prompts/workflow-generation.md');

    console.log('🏁 Sync complete.');
}

main();
