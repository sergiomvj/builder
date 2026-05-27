import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

// Temporary route to run migrations - REMOVE IN PRODUCTION
export async function POST(req: NextRequest) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Read SQL file
        const sqlPath = path.join(process.cwd(), 'SQL', '014_create_strategic_documents.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('[MIGRATION] Running SQL:');
        console.log(sql);

        // Execute SQL via direct query using service role key
        // This requires the exec_sql function to be created in Supabase
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('[MIGRATION] Error:', error);
            return NextResponse.json({ 
                error: error.message,
                note: 'If exec_sql function does not exist, please run the SQL directly in Supabase SQL Editor',
                sql: sql
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Migration 014 executed successfully' });
    } catch (error: any) {
        console.error('[MIGRATION] Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
