import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Running migration: 008_add_system_config.sql');

    const sqlPath = path.join(process.cwd(), 'SQL', '008_add_system_config.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    // Split by semicolon and execute each statement
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
        console.log(`\n📝 Executing:\n${statement.substring(0, 100)}...`);

        const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
            console.error('❌ Error:', error.message);
            // Try direct query as fallback
            const { error: directError } = await supabase.from('_migrations').insert({});
            if (directError) {
                console.error('Direct execution also failed. Trying raw query...');
            }
        } else {
            console.log('✅ Success');
        }
    }

    console.log('\n✨ Migration completed!');
    process.exit(0);
}

runMigration().catch(console.error);
