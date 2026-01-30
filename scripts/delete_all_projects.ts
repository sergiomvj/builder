import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey);

async function deleteAllProjects() {
    console.log('🗑️  Deletando TODOS os projetos...\n');

    // 1. Buscar todos os projetos
    const { data: projects, error: fetchError } = await supabase
        .from('projects')
        .select('id, name, idea_id');

    if (fetchError) {
        console.error('❌ Erro ao buscar projetos:', fetchError);
        return;
    }

    console.log(`📊 Encontrados ${projects?.length || 0} projetos\n`);

    if (!projects || projects.length === 0) {
        console.log('✅ Nenhum projeto para deletar!');
        return;
    }

    // 2. Deletar cada projeto
    for (const project of projects) {
        console.log(`\n🗑️  Deletando: ${project.name} (${project.id})`);

        // Deletar idea associada
        if (project.idea_id) {
            const { error: ideaError } = await supabase
                .from('ideas')
                .delete()
                .eq('id', project.idea_id);

            if (ideaError) {
                console.error('  ⚠️  Erro ao deletar idea:', ideaError.message);
            } else {
                console.log('  ✅ Idea deletada');
            }
        }

        // Deletar projeto
        const { error: projectError } = await supabase
            .from('projects')
            .delete()
            .eq('id', project.id);

        if (projectError) {
            console.error('  ❌ Erro ao deletar projeto:', projectError.message);
        } else {
            console.log('  ✅ Projeto deletado');
        }
    }

    console.log('\n✅ Processo concluído!');
}

deleteAllProjects();
