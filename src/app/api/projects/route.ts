import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = getSupabase();

        // Buscar todos os projetos, trazendo os dados das ideias relacionadas
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*, ideas(description, status, analysis_result)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar projetos:', error);
            return NextResponse.json({ error: 'Erro ao buscar projetos do banco de dados' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            projects: projects || []
        });

    } catch (error: any) {
        console.error('API Error (GET /api/projects):', error);
        return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
    }
}
