import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

// Temporary route to run migrations - REMOVE IN PRODUCTION
export async function POST(req: NextRequest) {
    try {
        const supabase = getSupabase();

        // Read SQL file
        const sqlPath = path.join(process.cwd(), 'SQL', '008_add_system_config.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Execute SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('[MIGRATION] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Migration executed successfully' });
    } catch (error: any) {
        console.error('[MIGRATION] Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
