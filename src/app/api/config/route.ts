import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Buscar todas as configurações
export async function GET() {
    try {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('system_config')
            .select('*')
            .order('key');

        if (error) {
            console.error('[API] Error fetching config:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ config: data || [] });
    } catch (error: any) {
        console.error('[API] Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT - Atualizar uma configuração
export async function PUT(req: NextRequest) {
    try {
        const supabase = getSupabase();
        const body = await req.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ error: 'Key is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('system_config')
            .update({ value })
            .eq('key', key)
            .select()
            .single();

        if (error) {
            console.error('[API] Error updating config:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, config: data });
    } catch (error: any) {
        console.error('[API] Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
