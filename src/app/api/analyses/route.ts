import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const empresaId = searchParams.get('empresa_id');

        const data = await DatabaseService.getSavedAnalyses(empresaId || undefined);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.title || !body.content) {
            return NextResponse.json({ error: 'Missing required fields: title and content are mandatory' }, { status: 400 });
        }

        const data = await DatabaseService.saveAnalysis(body);
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        await DatabaseService.deleteAnalysis(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
