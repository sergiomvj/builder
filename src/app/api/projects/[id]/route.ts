
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

        // Use Service Key if available (admin mode), otherwise fallback to Anon Key
        if (serviceRoleKey) {
            console.log('[API-DELETE] Using Service Role Key (Admin Mode)');
            const { createClient } = require('@supabase/supabase-js');
            supabase = createClient(supabaseUrl, serviceRoleKey, {
                auth: { autoRefreshToken: false, persistSession: false }
            });
        } else {
            console.warn('[API-DELETE] ⚠️ SUPABASE_SERVICE_ROLE_KEY missing. Falling back to Anon Key.');
            const { createClient } = require('@supabase/supabase-js');
            supabase = createClient(supabaseUrl, anonKey);
        }

        // AGGRESSIVE CLEANUP STRATEGY
        // We attempt to delete everything related to the project.
        // We use try/catch blocks for each step so one failure doesn't block the rest.

        // 1. Delete Chat Logs
        try {
            await supabase.from('chat_logs').delete().eq('project_id', projectId);
        } catch (e: any) { console.error('Error cleaning chat_logs', e); }

        // 2. Delete Personas & Empresas
        try {
            // Find companies
            const { data: empresas } = await supabase.from('empresas').select('id').eq('project_id', projectId);
            const empresaIds = empresas?.map((e: any) => e.id) || [];

            if (empresaIds.length > 0) {
                console.log(`[API-DELETE] Found ${empresaIds.length} companies to clean up.`);
                // Delete personas linked to these companies
                await supabase.from('personas').delete().in('empresa_id', empresaIds);
                // Delete automation opportunities
                await supabase.from('automation_opportunities').delete().in('empresa_id', empresaIds);
                // Delete empresas
                await supabase.from('empresas').delete().in('id', empresaIds);
            }
        } catch (e: any) { console.error('Error cleaning team', e); }

        // 3. Delete Ideas
        try {
            const { data: project } = await supabase.from('projects').select('idea_id').eq('id', projectId).single();
            if (project?.idea_id) {
                console.log(`[API-DELETE] Deleting associated idea: ${project.idea_id}`);
                await supabase.from('ideas').delete().eq('id', project.idea_id);
            }
        } catch (e: any) { console.error('Error cleaning ideas', e); }

        // 4. Finally delete Project
        const { error, count } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .select();

        if (error) {
            console.error('[API-DELETE] Final Delete Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
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

