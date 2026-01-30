
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const promptKey = searchParams.get('key');

    if (!promptKey) {
        return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const promptFiles: Record<string, string> = {
        'genesis_prompt': 'genesis-analysis.md',
        'team_prompt': 'team-generation.md',
        'workflow_prompt': 'workflow-generation.md'
    };

    const filename = promptFiles[promptKey];
    if (!filename) {
        return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'prompts', filename);
        const content = await fs.readFile(filePath, 'utf-8');
        return NextResponse.json({ content });
    } catch (error) {
        console.error(`Error reading file ${filename}:`, error);
        return NextResponse.json({ content: '' }, { status: 404 });
    }
}
