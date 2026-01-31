
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';


export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const projectId = params.id;
    if (!projectId) {
        return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    console.log(`[API-DELETE] Starting deletion for project: ${projectId}`);

    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        let supabase: any;

        // Use Service Key if available (admin mode) with direct instantiation for reliability
        if (serviceRoleKey) {
            console.log('[API-DELETE] Using Service Role Key (Admin Mode)');
            const { createClient } = require('@supabase/supabase-js');
            supabase = createClient(supabaseUrl, serviceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                    detectSessionInUrl: false
                }
            });
        } else {
            console.warn('[API-DELETE] ⚠️ SUPABASE_SERVICE_ROLE_KEY missing. Falling back to Anon Key.');
            const { createClient } = require('@supabase/supabase-js');
            supabase = createClient(supabaseUrl, anonKey);
        }

        // HELPER FOR PARANOID DELETION
        const deleteTable = async (table: string, column: string, ids: string[]) => {
            if (ids.length === 0) return;
            console.log(`[API-DELETE] Cleaning ${table} (where ${column} in ${ids.length} ids)...`);
            const { error, count } = await supabase.from(table).delete().in(column, ids);
            if (error) {
                console.error(`[API-DELETE] ❌ Failed to delete ${table}:`, error.message);
                throw new Error(`Failed to delete dependencies in ${table}: ${error.message}`);
            }
            console.log(`[API-DELETE] ✅ Deleted ${count} rows from ${table}`);
        };

        // 1. Identify Scope (Empresas)
        const { data: empresas, error: errEmp } = await supabase.from('empresas').select('id').eq('project_id', projectId);
        if (errEmp) throw new Error(`Failed to fetch companies: ${errEmp.message}`);

        const empresaIds = empresas?.map((e: any) => e.id) || [];

        if (empresaIds.length > 0) {
            console.log(`[API-DELETE] Found ${empresaIds.length} companies.`);

            // 2. Identify Personas
            const { data: personas, error: errPer } = await supabase.from('personas').select('id').in('empresa_id', empresaIds);
            if (errPer) throw new Error(`Failed to fetch personas: ${errPer.message}`);

            const personaIds = personas?.map((p: any) => p.id) || [];

            if (personaIds.length > 0) {
                console.log(`[API-DELETE] Found ${personaIds.length} personas.`);

                // 3. Clean Persona Dependencies
                await deleteTable('user_interventions', 'target_persona_id', personaIds);
                await deleteTable('task_supervision_logs', 'executor_persona_id', personaIds);
                await deleteTable('task_supervision_logs', 'supervisor_persona_id', personaIds);
                await deleteTable('task_supervision_logs', 'escalated_to_persona_id', personaIds); // Check this too
                await deleteTable('personas_communications', 'sender_persona_id', personaIds);
                await deleteTable('personas_communications', 'receiver_persona_id', personaIds);
                await deleteTable('saved_analyses', 'author_persona_id', personaIds); // Just in case
                await deleteTable('tasks', 'assigned_to', personaIds);
                await deleteTable('tasks', 'created_by', personaIds);
                await deleteTable('automation_opportunities', 'persona_id', personaIds);
                await deleteTable('competencias', 'persona_id', personaIds); // Usually cascades but safety first

                // 4. Delete Personas
                await deleteTable('personas', 'id', personaIds);
            }

            // 5. Clean Empresa Dependencies
            await deleteTable('automation_opportunities', 'empresa_id', empresaIds);
            await deleteTable('saved_analyses', 'empresa_id', empresaIds);
            await deleteTable('llm_usage_logs', 'empresa_id', empresaIds);
            await deleteTable('tasks', 'empresa_id', empresaIds);
            await deleteTable('auditorias', 'empresa_id', empresaIds);

            // 6. Delete Empresas
            await deleteTable('empresas', 'id', empresaIds);
        }

        // 7. Clean Project Dependencies
        await deleteTable('chat_logs', 'project_id', [projectId]);

        // 8. Get Idea ID before deleting project
        const { data: project } = await supabase.from('projects').select('idea_id').eq('id', projectId).single();
        const ideaId = project?.idea_id;

        // 9. Finally delete Project
        console.log(`[API-DELETE] Deleting Project ${projectId}...`);
        const { error, count } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .select();

        if (error) {
            console.error('[API-DELETE] Final Delete Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // 10. Delete Orphaned Idea (if exists)
        if (ideaId) {
            console.log(`[API-DELETE] Deleting associated idea: ${ideaId}`);
            await supabase.from('ideas').delete().eq('id', ideaId);
        }

        if (count === 0) {
            console.warn('[API-DELETE] Delete returned 0. Project ID might be invalid or RLS hidden.');
        } else {
            console.log(`[API-DELETE] Successfully deleted project ${projectId}`);
        }

        return NextResponse.json({ success: true, count });
    } catch (error: any) {
        console.error('[API-DELETE] Unexpected Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

