const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to manually parse env file
function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    console.log(`Loading config from: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value && value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                value = value.substring(1, value.length - 1);
            }
            env[key] = value.trim();
        }
    });
    return env;
}

// Load .env first, then override with .env.local
let config = parseEnv(path.resolve(process.cwd(), '.env'));
const localConfig = parseEnv(path.resolve(process.cwd(), '.env.local'));
config = { ...config, ...localConfig };

const url = config.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = config.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- GHOST BUSTERS ---');
console.log(`URL: ${url}`);
console.log(`Service Key: ${serviceKey ? (serviceKey.substring(0, 10) + '...') : 'MISSING'}`);

if (!url || !serviceKey) {
    console.error('MISSING CREDENTIALS. Aborting.');
    process.exit(1);
}

const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const TARGET_IDS = [
    'a59be11a-5a61-415e-a45d-d0ee7ffcb979',
    'a4dc836f-ec6c-4942-bc88-f9e9978cf9c4'
];

async function hunt() {
    console.log(`Hunting for ${TARGET_IDS.length} ghosts...`);

    // 1. SELECT
    const { data: found, error: findError } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .in('id', TARGET_IDS);

    if (findError) {
        console.error('SEARCH ERROR:', findError);
    } else {
        console.log(`FOUND: ${found ? found.length : 0} records.`);
        if (found) found.forEach(p => console.log(` - FOUND: ${p.id} (${p.name})`));
    }

    if (found && found.length > 0) {
        console.log('--- PURGING DEPENDENCIES ---');
        // Chat Logs
        const { error: chatErr } = await supabase.from('chat_logs').delete().in('project_id', TARGET_IDS);
        if (chatErr) console.error('Chat Delete Error:', chatErr); else console.log('Chat logs purged.');

        // Empresas
        const { data: empresas } = await supabase.from('empresas').select('id').in('project_id', TARGET_IDS);
        if (empresas && empresas.length > 0) {
            const empIds = empresas.map(e => e.id);
            await supabase.from('personas').delete().in('empresa_id', empIds);
            await supabase.from('empresas').delete().in('id', empIds);
            console.log(`Purged ${empIds.length} companies and their personas.`);
        }

        console.log('--- DESTROYING TARGETS ---');
        const { error: delError, count } = await supabase
            .from('projects')
            .delete()
            .in('id', TARGET_IDS)
            .select();

        if (delError) {
            console.error('DELETE ERROR:', delError);
        } else {
            console.log(`DESTROYED: ${count} records.`);
        }
    } else {
        console.log('Ghosts not found in DB. Frontend is likely caching or using wrong env.');
    }
    console.log('--- END ---');
    process.exit(0);
}

hunt();
