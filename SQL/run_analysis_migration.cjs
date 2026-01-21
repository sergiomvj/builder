require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Executando migração saved_analyses...\n');

    const sqlPath = path.join(__dirname, 'create_saved_analyses.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Divide o SQL em statements individuais
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s !== '');

    for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        // Note: This relies on the exec_sql RPC being present in the database.
        // If not, it will fail, which is expected if I don't have direct DB access.
        const { error } = await supabase.rpc('exec_sql', {
            sql_query: statement + ';'
        });

        if (error) {
            console.error(`❌ Error: ${error.message}`);
        } else {
            console.log(`✅ Success`);
        }
    }
}

runMigration();
