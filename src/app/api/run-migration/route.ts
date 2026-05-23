import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

// Temporary route to run migrations - REMOVE IN PRODUCTION
export async function POST(req: NextRequest) {
    try {
        // Read SQL file
        const sqlPath = path.join(process.cwd(), 'SQL', '014_create_strategic_documents.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        console.log('[MIGRATION] Running SQL:');
        console.log(sql);

        // Execute SQL via direct query (this requires service role key)
        // Note: Supabase JS client doesn't support executing arbitrary SQL directly
        // We need to use a different approach

        return NextResponse.json({ 
            success: true, 
            message: 'Please execute the migration SQL directly in Supabase SQL Editor',
            sql: sql
        });
    } catch (error: any) {
        console.error('[MIGRATION] Internal Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
