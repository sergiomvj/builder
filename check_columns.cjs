const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('personas')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting personas:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns in personas table:', Object.keys(data[0]));
    } else {
        console.log('No data in personas table, trying to insert dummy to see error or using RPC if available seems hard. Using information_schema approach via RPC if possible, otherwise guessing.');
        // Try getting info from PostgREST resource options? Not easily available in JS client without specific call.
        // Let's rely on user or assume standard columns if empty.
        // Actually, if empty, I can't see columns easily with just SELECT *.
        console.log('Table is empty, cannot infer columns from data.');
    }
}

checkColumns();
