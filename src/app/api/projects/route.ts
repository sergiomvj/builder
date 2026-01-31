import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[API] Fetching projects...');
        console.log('[API] Connected to Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        // Fix: Use direct client instantiation to ensure Service Role Key is used correctly on Vercel/Next.js
        // attempting to use the singleton helper often fails to bypass RLS in the edge/server runtime
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                }
            }
        );

        if (!supabase) {
            console.error('[API] Supabase client is null. Check environment variables.');
            return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
        }

        // Buscar projetos (Simplificado para evitar bloqueios de JOIN/RLS)
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*');

        if (error) {
            console.error('[API] Error fetching projects:', error);
            // Fallback for RLS or other errors
            if (error.code === '42501') { // RLS Policy violation
                console.warn('[API] RLS Policy violation detected. Returning empty list.');
                return NextResponse.json({ projects: [] }); // Don't error out, just show empty
            }
            return NextResponse.json({ error: `database_error: ${error.message}` }, { status: 500 });
        }

        console.log(`[API] Found ${projects?.length || 0} projects.`);
        if (projects?.length) {
            console.log('[API] Project IDs:', projects.map((p: any) => `${p.id} (${p.name})`).join(', '));
        }

        return NextResponse.json({
            success: true,
            projects: projects || []
        });

    } catch (error: any) {
        console.error('[API] Internal Error (GET /api/projects):', error);
        return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
    }
}
