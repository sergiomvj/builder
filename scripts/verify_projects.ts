import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function checkProjects() {
    console.log('🔍 Verificando projetos no banco de dados...\n');

    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Erro:', error);
        return;
    }

    console.log(`📊 Total de projetos: ${projects?.length || 0}\n`);

    if (projects && projects.length > 0) {
        console.log('📋 Projetos encontrados:');
        projects.forEach((p, i) => {
            console.log(`${i + 1}. ${p.name}`);
            console.log(`   ID: ${p.id}`);
            console.log(`   Criado: ${new Date(p.created_at).toLocaleString()}\n`);
        });
    } else {
        console.log('✅ Nenhum projeto encontrado no banco de dados!');
    }
}

checkProjects();
