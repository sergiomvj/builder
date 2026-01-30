import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupConfig() {
    console.log('🚀 Setting up system_config table...\n');

    // Create table
    console.log('1️⃣ Creating table...');
    const { error: createError } = await supabase.rpc('exec_sql', {
        sql_query: `
      CREATE TABLE IF NOT EXISTS system_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key TEXT UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    });

    if (createError) {
        console.error('❌ Error creating table:', createError.message);
    } else {
        console.log('✅ Table created');
    }

    // Insert default values
    console.log('\n2️⃣ Inserting default values...');
    const { error: insertError } = await supabase
        .from('system_config')
        .upsert([
            { key: 'llm_provider', value: 'openai', description: 'Provedor de LLM: openai ou openrouter' },
            { key: 'llm_model', value: 'gpt-4o', description: 'Modelo de LLM a ser usado' },
            { key: 'genesis_prompt', value: '', description: 'Prompt personalizado para análise Genesis (vazio = usar padrão)' }
        ], { onConflict: 'key' });

    if (insertError) {
        console.error('❌ Error inserting values:', insertError.message);
    } else {
        console.log('✅ Default values inserted');
    }

    // Enable RLS
    console.log('\n3️⃣ Enabling RLS...');
    const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql_query: `
      ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow all access to system_config" ON system_config;
      CREATE POLICY "Allow all access to system_config" ON system_config
        FOR ALL USING (true) WITH CHECK (true);
    `
    });

    if (rlsError) {
        console.error('❌ Error setting up RLS:', rlsError.message);
    } else {
        console.log('✅ RLS configured');
    }

    console.log('\n✨ Setup completed!');
    process.exit(0);
}

setupConfig().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
